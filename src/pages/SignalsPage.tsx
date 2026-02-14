import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Signal } from '../types/database.types';
import { Target } from 'lucide-react';
import { CandlestickChart } from '../components/CandlestickChart';
import { SignalGenerator } from '../components/SignalGenerator';
import { SignalCard } from '../components/SignalCard';
import { canAccessChartIntegration } from '../utils/subscriptionLimits';
import { PaymentWarningBanner } from '../components/PaymentWarningBanner';
import { AccountSuspendedModal } from '../components/AccountSuspendedModal';
import { checkPaymentStatus, refreshPaymentStatus, PaymentStatus } from '../utils/paymentStatus';
import { useAuth } from '../contexts/AuthContext';

interface SignalsPageProps {
  onNavigate?: (page: string) => void;
}

export function SignalsPage({ onNavigate }: SignalsPageProps = {}) {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChartAccess, setHasChartAccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [displayedSignalId, setDisplayedSignalId] = useState<string | null>(() => {
    const stored = localStorage.getItem('displayedSignalId');
    return stored || null;
  });

  useEffect(() => {
    fetchSignals();
    fetchSubscriptionInfo();
    if (user) {
      checkPayment();
    }
  }, [user]);

  const checkPayment = async () => {
    if (!user) return;
    const status = await checkPaymentStatus(user.id);
    setPaymentStatus(status);
  };

  const handleCheckPaymentStatus = async () => {
    setIsCheckingPayment(true);
    await refreshPaymentStatus();
    await checkPayment();
    setIsCheckingPayment(false);
    window.location.reload();
  };

  useEffect(() => {
    if (displayedSignalId && signals.length > 0) {
      const signalExists = signals.some(s => s.id === displayedSignalId);
      if (!signalExists) {
        setDisplayedSignalId(null);
        localStorage.removeItem('displayedSignalId');
      }
    }
  }, [signals, displayedSignalId]);

  const fetchSubscriptionInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        setHasChartAccess(canAccessChartIntegration(subData.plan_type));
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const fetchSignals = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('signals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data) {
      setSignals(data as Signal[]);
    }
    setLoading(false);
  };

  const handleToggleSignalOnChart = (signalId: string) => {
    setDisplayedSignalId(prev => {
      const newId = prev === signalId ? null : signalId;
      if (newId) {
        localStorage.setItem('displayedSignalId', newId);
      } else {
        localStorage.removeItem('displayedSignalId');
      }
      return newId;
    });
  };

  const displayedSignal = signals.find(s => s.id === displayedSignalId);
  const signalLevels = displayedSignal ? {
    signalId: displayedSignal.id,
    market: displayedSignal.market,
    entryPrice: displayedSignal.entry_price,
    stopLoss: displayedSignal.stop_loss,
    takeProfit1: displayedSignal.take_profit_1,
    takeProfit2: displayedSignal.take_profit_2,
    takeProfit3: displayedSignal.take_profit_3,
    signalType: displayedSignal.signal_type,
  } : null;

  return (
    <div className="min-h-screen bg-[#0F172A] py-8">
      {paymentStatus?.isSuspended && onNavigate && (
        <AccountSuspendedModal
          suspensionReason={paymentStatus.suspensionReason || 'Payment overdue'}
          amount={paymentStatus.amount}
          planType={paymentStatus.planType}
          walletAddress={paymentStatus.walletAddress || 'Contact support for wallet address'}
          onNavigateToPayment={() => onNavigate('payment')}
          onCheckPayment={handleCheckPaymentStatus}
          isCheckingPayment={isCheckingPayment}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trading Signals</h1>
          <p className="text-gray-400">Professional trading signals with real-time updates</p>
        </div>

        {paymentStatus?.showWarning && !paymentStatus.isSuspended && onNavigate && (
          <PaymentWarningBanner
            daysUntilDue={paymentStatus.daysUntilDue}
            amount={paymentStatus.amount}
            planType={paymentStatus.planType}
            walletAddress={paymentStatus.walletAddress || 'Contact support for wallet address'}
            onNavigateToPayment={() => onNavigate('payment')}
          />
        )}

        <div className="mb-8">
          <CandlestickChart
            symbol={displayedSignal?.market || "BTCUSDT"}
            signalLevels={signalLevels}
          />
        </div>

        <div className="mb-8">
          <SignalGenerator onSignalGenerated={fetchSignals} />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading signals...</p>
          </div>
        ) : signals.length === 0 ? (
          <div className="bg-[#1E293B] rounded-xl p-12 border border-[#D4AF37]/20 text-center">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Signals Yet</h3>
            <p className="text-gray-400">
              Use the signal generator above to create your first trading signal based on your analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {signals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                onUpdate={fetchSignals}
                onToggleChart={hasChartAccess ? handleToggleSignalOnChart : undefined}
                isDisplayedOnChart={displayedSignalId === signal.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
