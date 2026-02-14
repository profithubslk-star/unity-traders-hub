import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { useState } from 'react';

interface PaymentWarningBannerProps {
  daysUntilDue: number;
  amount: number;
  planType: string;
  walletAddress: string;
  onNavigateToPayment: () => void;
}

export function PaymentWarningBanner({
  daysUntilDue,
  amount,
  planType,
  walletAddress,
  onNavigateToPayment,
}: PaymentWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isUrgent = daysUntilDue <= 1;
  const planName = planType.replace('_', ' ').toUpperCase();

  return (
    <div
      className={`${
        isUrgent
          ? 'bg-red-900/30 border-red-500'
          : 'bg-yellow-900/30 border-yellow-500'
      } border-2 rounded-xl p-4 mb-6 animate-pulse`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <AlertTriangle
            className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
              isUrgent ? 'text-red-400' : 'text-yellow-400'
            }`}
          />
          <div className="flex-1">
            <h3
              className={`font-bold text-lg mb-2 ${
                isUrgent ? 'text-red-300' : 'text-yellow-300'
              }`}
            >
              {isUrgent ? 'URGENT: Payment Due Soon!' : 'Payment Reminder'}
            </h3>
            <p className="text-white mb-3">
              Your <span className="font-semibold">{planName}</span> subscription payment of{' '}
              <span className="font-bold text-[#D4AF37]">${amount}</span> is due in{' '}
              <span className="font-bold">
                {daysUntilDue === 0 ? 'less than 24 hours' : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}
              </span>
              .
            </p>
            <div className="bg-black/30 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold">Please top up your wallet to ensure automatic payment:</span>
              </p>
              <div className="flex items-center space-x-2 bg-black/40 rounded px-3 py-2">
                <code className="text-xs text-[#D4AF37] break-all">{walletAddress}</code>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              We will automatically charge your wallet when funds are available. If payment is not received,
              your access will be suspended.
            </p>
            <button
              onClick={onNavigateToPayment}
              className="mt-4 flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0F172A] font-bold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Make Payment Now</span>
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white transition-colors ml-4"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
