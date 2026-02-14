import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentVerificationRequest {
  payment_id: string;
  transaction_hash: string;
}

interface PaymentRecord {
  id: string;
  user_id: string;
  plan_type: string;
  amount_usd: number;
  crypto_currency: string;
  crypto_amount: number;
  wallet_address: string;
  status: string;
  expires_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { payment_id, transaction_hash }: PaymentVerificationRequest = await req.json();

    if (!payment_id || !transaction_hash) {
      return new Response(
        JSON.stringify({ error: "Missing payment_id or transaction_hash" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from("crypto_payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const typedPayment = payment as PaymentRecord;

    if (new Date(typedPayment.expires_at) < new Date()) {
      await supabase
        .from("crypto_payments")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", payment_id);

      return new Response(
        JSON.stringify({ error: "Payment expired" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let verified = false;
    let verificationError = "";

    if (typedPayment.crypto_currency === "BNB" || typedPayment.crypto_currency === "USDT_BEP20") {
      const result = await verifyBSCTransaction(
        transaction_hash,
        typedPayment.wallet_address,
        typedPayment.crypto_amount,
        typedPayment.crypto_currency
      );
      verified = result.verified;
      verificationError = result.error || "";
    } else if (typedPayment.crypto_currency === "USDT_TRC20") {
      const result = await verifyTRONTransaction(
        transaction_hash,
        typedPayment.wallet_address,
        typedPayment.crypto_amount
      );
      verified = result.verified;
      verificationError = result.error || "";
    }

    if (verified) {
      const { error: activateError } = await supabase.rpc(
        "activate_subscription_from_payment",
        {
          p_payment_id: payment_id,
          p_transaction_hash: transaction_hash,
        }
      );

      if (activateError) {
        console.error("Activation error:", activateError);
        return new Response(
          JSON.stringify({ error: "Failed to activate subscription" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment verified and subscription activated",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      await supabase
        .from("crypto_payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment_id);

      return new Response(
        JSON.stringify({
          error: verificationError || "Transaction verification failed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function verifyBSCTransaction(
  txHash: string,
  expectedRecipient: string,
  expectedAmount: number,
  currency: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    const apiUrl = `https://api.bscscan.com/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=YourApiKeyToken`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.result) {
      return { verified: false, error: "Transaction not found on BSC" };
    }

    const tx = data.result;

    if (!tx.blockNumber) {
      return { verified: false, error: "Transaction not confirmed yet" };
    }

    const receiptUrl = `https://api.bscscan.com/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=YourApiKeyToken`;
    const receiptResponse = await fetch(receiptUrl);
    const receiptData = await receiptResponse.json();

    if (!receiptData.result || receiptData.result.status !== "0x1") {
      return { verified: false, error: "Transaction failed or pending" };
    }

    if (currency === "BNB") {
      const recipient = tx.to?.toLowerCase();
      const amount = parseInt(tx.value, 16) / 1e18;

      if (recipient !== expectedRecipient.toLowerCase()) {
        return { verified: false, error: "Recipient address mismatch" };
      }

      const tolerance = expectedAmount * 0.02;
      if (Math.abs(amount - expectedAmount) > tolerance) {
        return { verified: false, error: `Amount mismatch. Expected: ${expectedAmount}, Got: ${amount}` };
      }

      return { verified: true };
    } else if (currency === "USDT_BEP20") {
      const usdtContractBSC = "0x55d398326f99059ff775485246999027b3197955";

      if (tx.to?.toLowerCase() !== usdtContractBSC.toLowerCase()) {
        return { verified: false, error: "Not a USDT transaction" };
      }

      const logs = receiptData.result.logs || [];
      const transferLog = logs.find(
        (log: any) =>
          log.topics[0] ===
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
          log.topics[2]?.toLowerCase().includes(expectedRecipient.toLowerCase().substring(2))
      );

      if (!transferLog) {
        return { verified: false, error: "Transfer to recipient not found in logs" };
      }

      const amountHex = transferLog.data;
      const amount = parseInt(amountHex, 16) / 1e18;

      const tolerance = expectedAmount * 0.02;
      if (Math.abs(amount - expectedAmount) > tolerance) {
        return { verified: false, error: `Amount mismatch. Expected: ${expectedAmount}, Got: ${amount}` };
      }

      return { verified: true };
    }

    return { verified: false, error: "Unknown currency" };
  } catch (error: any) {
    console.error("BSC verification error:", error);
    return { verified: false, error: error.message || "BSC API error" };
  }
}

async function verifyTRONTransaction(
  txHash: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<{ verified: boolean; error?: string }> {
  try {
    const apiUrl = `https://api.trongrid.io/v1/transactions/${txHash}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.txID) {
      return { verified: false, error: "Transaction not found on TRON" };
    }

    if (!data.ret || data.ret[0]?.contractRet !== "SUCCESS") {
      return { verified: false, error: "Transaction failed or pending" };
    }

    const contract = data.raw_data?.contract?.[0];
    if (!contract) {
      return { verified: false, error: "Invalid transaction structure" };
    }

    if (contract.type === "TransferContract") {
      const toAddress = contract.parameter?.value?.to_address;
      const amount = contract.parameter?.value?.amount / 1e6;

      if (!toAddress || toAddress !== expectedRecipient) {
        return { verified: false, error: "Recipient address mismatch" };
      }

      const tolerance = expectedAmount * 0.02;
      if (Math.abs(amount - expectedAmount) > tolerance) {
        return { verified: false, error: `Amount mismatch. Expected: ${expectedAmount}, Got: ${amount}` };
      }

      return { verified: true };
    } else if (contract.type === "TriggerSmartContract") {
      const usdtContractTron = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
      const contractAddress = contract.parameter?.value?.contract_address;

      if (contractAddress !== usdtContractTron) {
        return { verified: false, error: "Not a USDT-TRC20 transaction" };
      }

      const infoUrl = `https://api.trongrid.io/v1/transactions/${txHash}/events`;
      const infoResponse = await fetch(infoUrl);
      const infoData = await infoResponse.json();

      const transferEvent = infoData.data?.find(
        (event: any) =>
          event.event_name === "Transfer" &&
          event.result?.to === expectedRecipient
      );

      if (!transferEvent) {
        return { verified: false, error: "Transfer to recipient not found" };
      }

      const amount = parseInt(transferEvent.result.value) / 1e6;

      const tolerance = expectedAmount * 0.02;
      if (Math.abs(amount - expectedAmount) > tolerance) {
        return { verified: false, error: `Amount mismatch. Expected: ${expectedAmount}, Got: ${amount}` };
      }

      return { verified: true };
    }

    return { verified: false, error: "Unsupported transaction type" };
  } catch (error: any) {
    console.error("TRON verification error:", error);
    return { verified: false, error: error.message || "TRON API error" };
  }
}
