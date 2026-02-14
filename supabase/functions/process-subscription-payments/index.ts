import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const now = new Date();
    const warningThreshold = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("*, crypto_payments(*)")
      .eq("status", "active")
      .not("payment_due_date", "is", null)
      .lte("payment_due_date", warningThreshold.toISOString());

    if (subError) {
      throw subError;
    }

    const results = {
      processed: 0,
      warnings: 0,
      suspended: 0,
      reactivated: 0,
      errors: [] as string[],
    };

    for (const subscription of subscriptions || []) {
      try {
        results.processed++;

        const paymentDueDate = new Date(subscription.payment_due_date);
        const daysUntilDue = Math.floor((paymentDueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        if (daysUntilDue < 0) {
          const { data: payment, error: paymentError } = await supabase
            .from("crypto_payments")
            .select("*")
            .eq("user_id", subscription.user_id)
            .eq("status", "completed")
            .gte("created_at", paymentDueDate.toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (payment) {
            const planPrices: Record<string, number> = {
              one_month: 39,
              three_months: 99,
              twelve_months: 279,
            };

            const expectedAmount = planPrices[subscription.plan_type] || 0;

            if (payment.amount_usd >= expectedAmount) {
              const nextPaymentDue = calculateNextPaymentDue(subscription.plan_type, now);

              await supabase
                .from("subscriptions")
                .update({
                  last_payment_date: now.toISOString(),
                  payment_due_date: nextPaymentDue.toISOString(),
                  payment_warning_sent: false,
                  warning_sent_at: null,
                  suspension_reason: null,
                  suspended_at: null,
                  payment_attempts: 0,
                  updated_at: now.toISOString(),
                })
                .eq("id", subscription.id);

              await supabase
                .from("payment_transactions")
                .insert({
                  subscription_id: subscription.id,
                  user_id: subscription.user_id,
                  transaction_hash: payment.transaction_hash,
                  amount: payment.amount_usd,
                  currency: payment.crypto_currency,
                  status: "completed",
                  confirmed: true,
                  confirmed_at: now.toISOString(),
                  from_address: payment.wallet_address,
                  to_address: payment.wallet_address,
                });

              results.reactivated++;
              continue;
            }
          }

          await supabase
            .from("subscriptions")
            .update({
              status: "suspended",
              suspension_reason: "Payment overdue",
              suspended_at: now.toISOString(),
              payment_attempts: (subscription.payment_attempts || 0) + 1,
              last_payment_check: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", subscription.id);

          results.suspended++;
        } else if (daysUntilDue <= 2 && !subscription.payment_warning_sent) {
          await supabase
            .from("subscriptions")
            .update({
              payment_warning_sent: true,
              warning_sent_at: now.toISOString(),
              payment_attempts: (subscription.payment_attempts || 0) + 1,
              last_payment_check: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", subscription.id);

          results.warnings++;
        }
      } catch (error: any) {
        results.errors.push(`Subscription ${subscription.id}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Processed ${results.processed} subscriptions`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing subscriptions:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function calculateNextPaymentDue(planType: string, fromDate: Date): Date {
  const nextDate = new Date(fromDate);

  switch (planType) {
    case "one_month":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "three_months":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "twelve_months":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}
