import { AlertTriangle, Lock, CreditCard, RefreshCw } from 'lucide-react';

interface AccountSuspendedModalProps {
  suspensionReason: string;
  amount: number;
  planType: string;
  walletAddress: string;
  onNavigateToPayment: () => void;
  onCheckPayment: () => void;
  isCheckingPayment?: boolean;
}

export function AccountSuspendedModal({
  suspensionReason,
  amount,
  planType,
  walletAddress,
  onNavigateToPayment,
  onCheckPayment,
  isCheckingPayment = false,
}: AccountSuspendedModalProps) {
  const planName = planType.replace('_', ' ').toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl border-2 border-red-500 max-w-2xl w-full shadow-2xl shadow-red-500/20">
        <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 p-6 rounded-t-2xl border-b border-red-500/30">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Account Suspended</h2>
              <p className="text-red-300 text-sm mt-1">{suspensionReason}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-2">Your subscription payment is overdue</h3>
                <p className="text-gray-300 text-sm">
                  Your access to the dashboard, signals, and market intelligence has been temporarily suspended
                  due to non-payment.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-3">Payment Required</h4>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-gray-400">Plan:</span>
                <span className="text-white font-semibold">{planName}</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-gray-400">Amount Due:</span>
                <span className="text-[#D4AF37] font-bold text-xl">${amount}</span>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-white font-semibold mb-2">Payment Wallet Address</h4>
              <div className="bg-black/40 rounded-lg p-3">
                <code className="text-xs text-[#D4AF37] break-all">{walletAddress}</code>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Send USDT (BEP20, TRC20) or BNB to this address to reactivate your account
              </p>
            </div>
          </div>

          <div className="bg-green-950/20 border border-green-500/30 rounded-xl p-4">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Auto-Detection Enabled</span>
            </h4>
            <p className="text-sm text-gray-300">
              We continuously monitor the wallet for incoming payments. Once your payment is detected and
              confirmed, your account will be automatically reactivated instantly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateToPayment}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0F172A] font-bold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all"
            >
              <CreditCard className="w-5 h-5" />
              <span>Go to Payment Page</span>
            </button>
            <button
              onClick={onCheckPayment}
              disabled={isCheckingPayment}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-[#0F172A] text-white font-semibold rounded-lg border-2 border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingPayment ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Check Payment Status</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
