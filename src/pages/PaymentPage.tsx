import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PaymentPageProps {
  onNavigate: (page: string) => void;
  selectedPlan?: {
    name: string;
    price: number;
    planType: string;
    upgradeInfo?: {
      originalPrice: number;
      upgradePrice: number;
      remainingValue: number;
      message: string;
    };
  };
}

interface PaymentConfig {
  currency: string;
  wallet_address: string;
  blockchain_network: string;
}

export function PaymentPage({ onNavigate, selectedPlan }: PaymentPageProps) {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentConfig[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('USDT_TRC20');
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const [transactionHash, setTransactionHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes in seconds
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('PaymentPage mounted with selectedPlan:', selectedPlan);
    console.log('User:', user);
    loadPaymentMethods();
    if (selectedPlan) {
      // For simplicity, assuming 1 USDT = 1 USD, 1 BNB = $600
      calculateCryptoAmount(selectedCrypto, selectedPlan.price);
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (paymentId) {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [paymentId]);

  useEffect(() => {
    if (timeRemaining > 0 && paymentId && paymentStatus === 'pending') {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, paymentId, paymentStatus]);

  const loadPaymentMethods = async () => {
    const { data, error } = await supabase
      .from('payment_wallet_config')
      .select('*')
      .eq('is_active', true);

    if (!error && data) {
      setPaymentMethods(data);
    }
  };

  const calculateCryptoAmount = (crypto: string, usdAmount: number) => {
    let amount = usdAmount;

    if (crypto === 'BNB') {
      // Assume BNB = $600 (in production, fetch real-time price)
      amount = usdAmount / 600;
    } else if (crypto.includes('USDT')) {
      amount = usdAmount; // 1:1 for stablecoins
    }

    setCryptoAmount(Number(amount.toFixed(8)));
  };

  const handleCryptoChange = (crypto: string) => {
    setSelectedCrypto(crypto);
    if (selectedPlan) {
      calculateCryptoAmount(crypto, selectedPlan.price);
    }
  };

  const createPayment = async () => {
    console.log('createPayment called');
    console.log('user:', user);
    console.log('selectedPlan:', selectedPlan);

    if (!user) {
      setError('You must be logged in to make a payment. Please sign in and try again.');
      return;
    }

    if (!selectedPlan) {
      setError('No plan selected. Please go back and select a plan.');
      return;
    }

    setLoading(true);
    setError('');
    console.log('Creating payment request with:', {
      planType: selectedPlan.planType,
      amountUsd: selectedPlan.price,
      crypto: selectedCrypto,
      cryptoAmount: cryptoAmount
    });

    try {
      const { data, error } = await supabase.rpc('create_payment_request', {
        p_plan_type: selectedPlan.planType,
        p_amount_usd: selectedPlan.price,
        p_crypto_currency: selectedCrypto,
        p_crypto_amount: cryptoAmount
      });

      if (error) throw error;

      if (!data) {
        throw new Error('Failed to create payment request. Please try again.');
      }

      setPaymentId(data);
      setPaymentStatus('pending');
      setTimeRemaining(1800);
    } catch (err: any) {
      setError(err.message || 'Failed to create payment. Please try again.');
      console.error('Payment creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitTransaction = async () => {
    if (!transactionHash.trim() || !paymentId) return;

    setLoading(true);
    setError('');

    try {
      // Update payment with transaction hash and set to verifying
      const { error: updateError } = await supabase
        .from('crypto_payments')
        .update({
          transaction_hash: transactionHash,
          status: 'verifying',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      setPaymentStatus('verifying');

      // Trigger verification edge function
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-crypto-payment`;

      await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
          transaction_hash: transactionHash
        })
      });

      // Status will be updated by the edge function
      setTimeout(() => checkPaymentStatus(), 5000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentId) return;

    const { data, error } = await supabase
      .from('crypto_payments')
      .select('status, verified_at')
      .eq('id', paymentId)
      .single();

    if (!error && data) {
      setPaymentStatus(data.status);

      if (data.status === 'confirmed') {
        setLoading(false);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => onNavigate('dashboard'), 3000);
      } else if (data.status === 'failed' || data.status === 'expired') {
        setLoading(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedWallet = paymentMethods.find(m => m.currency === selectedCrypto);

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No plan selected</p>
          <button
            onClick={() => onNavigate('subscription')}
            className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A1628] font-semibold rounded-lg"
          >
            Choose a Plan
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('subscription')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Plans</span>
        </button>

        <div className="bg-[#1E293B] rounded-2xl p-8 border border-[#D4AF37]/20">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Payment</h1>
          <p className="text-gray-400 mb-8">
            Secure cryptocurrency payment via Binance
          </p>

          {/* Plan Summary */}
          <div className="bg-[#0F172A] rounded-lg p-6 mb-8 border border-[#D4AF37]/30">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedPlan.name}</h3>
                <p className="text-gray-400 text-sm">Subscription Plan</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#D4AF37]">${selectedPlan.price}</div>
                <p className="text-gray-400 text-sm">USD</p>
              </div>
            </div>

            {selectedPlan.upgradeInfo && (
              <div className="border-t border-[#D4AF37]/30 pt-4 space-y-2">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-400 font-semibold mb-2">Upgrade Pricing Breakdown</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Full Plan Price:</span>
                      <span className="text-white">${selectedPlan.upgradeInfo.originalPrice.toFixed(2)}</span>
                    </div>
                    {selectedPlan.upgradeInfo.remainingValue > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Current Subscription Credit:</span>
                        <span className="text-green-500">-${selectedPlan.upgradeInfo.remainingValue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-[#D4AF37]/20 pt-2">
                  <span className="text-white">Pay Now (Prorated):</span>
                  <span className="text-[#D4AF37] text-lg">${selectedPlan.price.toFixed(2)}</span>
                </div>
                <div className="bg-[#1E293B]/50 border border-[#D4AF37]/20 rounded-lg p-3 mt-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Next Billing Cycle</p>
                      <p className="text-xs text-gray-500">After current period ends</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">${selectedPlan.upgradeInfo.originalPrice.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Full amount</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 italic mt-2">{selectedPlan.upgradeInfo.message}</p>
              </div>
            )}
          </div>

          {paymentStatus === 'confirmed' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3">
                <Check className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-xl font-semibold text-green-500">Payment Confirmed!</h3>
                  <p className="text-gray-300">Your subscription has been activated. Redirecting...</p>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div>
                  <h3 className="text-xl font-semibold text-red-500">Payment Failed</h3>
                  <p className="text-gray-300">Transaction could not be verified. Please try again.</p>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'expired' && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <h3 className="text-xl font-semibold text-orange-500">Payment Expired</h3>
                  <p className="text-gray-300">The payment window has closed. Please create a new payment.</p>
                </div>
              </div>
            </div>
          )}

          {!paymentId ? (
            <>
              {/* Select Cryptocurrency */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Select Cryptocurrency</label>
                <div className="grid grid-cols-3 gap-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.currency}
                      onClick={() => handleCryptoChange(method.currency)}
                      className={`p-4 rounded-lg border-2 transition ${
                        selectedCrypto === method.currency
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-gray-600 hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <div className="text-white font-semibold text-sm">
                        {method.currency.replace('_', ' ')}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">{method.blockchain_network}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="bg-[#0F172A] rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">You will pay</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {cryptoAmount} {selectedCrypto.replace('_', ' ')}
                    </div>
                    <div className="text-gray-400 text-sm">≈ ${selectedPlan.price} USD</div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={createPayment}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A1628] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/50 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Payment...</span>
                  </>
                ) : (
                  <span>Continue to Payment</span>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Payment Instructions */}
              {paymentStatus === 'pending' && (
                <>
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-6 h-6 text-orange-500" />
                      <div>
                        <p className="text-white font-semibold">Time Remaining: {formatTime(timeRemaining)}</p>
                        <p className="text-gray-400 text-sm">Complete payment within 30 minutes</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Wallet Address */}
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        Send {cryptoAmount} {selectedCrypto.replace('_', ' ')} to:
                      </label>
                      <div className="bg-[#0F172A] rounded-lg p-4 border border-[#D4AF37]/30">
                        <div className="flex items-center justify-between">
                          <code className="text-[#D4AF37] text-sm break-all">{selectedWallet?.wallet_address}</code>
                          <button
                            onClick={() => copyToClipboard(selectedWallet?.wallet_address || '')}
                            className="ml-4 p-2 hover:bg-[#D4AF37]/10 rounded transition flex-shrink-0"
                          >
                            {copied ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <p className="text-gray-400 text-xs mt-2">Network: {selectedWallet?.blockchain_network}</p>
                      </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">Important:</h4>
                      <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                        <li>Send EXACTLY {cryptoAmount} {selectedCrypto.replace('_', ' ')}</li>
                        <li>Use the correct network: {selectedWallet?.blockchain_network}</li>
                        <li>Transaction fees are paid by you</li>
                        <li>Payment will be verified automatically</li>
                      </ul>
                    </div>

                    {/* Transaction Hash Input */}
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        After sending, paste your Transaction Hash:
                      </label>
                      <input
                        type="text"
                        value={transactionHash}
                        onChange={(e) => setTransactionHash(e.target.value)}
                        placeholder="Enter transaction hash (TxID)"
                        className="w-full px-4 py-3 bg-[#0F172A] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <p className="text-red-500 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={submitTransaction}
                      disabled={!transactionHash.trim() || loading}
                      className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A1628] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/50 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify Payment</span>
                      )}
                    </button>
                  </div>
                </>
              )}

              {paymentStatus === 'verifying' && (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 text-[#D4AF37] animate-spin mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">Verifying Transaction</h3>
                  <p className="text-gray-400">Please wait while we confirm your payment on the blockchain...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
