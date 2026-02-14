import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Signal } from '../types/database.types';
import { TrendingUp, Activity, Target, Award, AlertCircle } from 'lucide-react';
import { RiskCalculator } from '../components/RiskCalculator';
import { PaymentWarningBanner } from '../components/PaymentWarningBanner';
import { AccountSuspendedModal } from '../components/AccountSuspendedModal';
import { checkPaymentStatus, refreshPaymentStatus, PaymentStatus } from '../utils/paymentStatus';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, subscription } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
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

  const fetchData = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('signals')
      .select('*')
      .eq('user_id', user!.id)
      .eq('user_action', 'taken')
      .order('created_at', { ascending: false });

    if (data) {
      setSignals(data as Signal[]);
    }

    setLoading(false);
  };

  const isDemo = subscription?.plan_type === 'demo';

  const takenSignals = signals;
  const totalSignals = takenSignals.length;

  const activeSignals = takenSignals.filter(s => s.status === 'active').length;

  const completedSignals = takenSignals.filter(s => s.status === 'completed').length;

  const winningSignals = takenSignals.filter(s => {
    if (s.status === 'completed' && s.sl_hit_at) return false;
    if (s.tp1_hit_at || s.tp2_hit_at || s.tp3_hit_at) return true;
    return false;
  }).length;

  const winRate = totalSignals > 0
    ? Math.round((winningSignals / totalSignals) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0F172A] py-8">
      {paymentStatus?.isSuspended && (
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
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.email}</p>
        </div>

        {paymentStatus?.showWarning && !paymentStatus.isSuspended && (
          <PaymentWarningBanner
            daysUntilDue={paymentStatus.daysUntilDue}
            amount={paymentStatus.amount}
            planType={paymentStatus.planType}
            walletAddress={paymentStatus.walletAddress || 'Contact support for wallet address'}
            onNavigateToPayment={() => onNavigate('payment')}
          />
        )}

        {isDemo && (
          <div className="mb-8 bg-gradient-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Demo Account Active</h3>
                <p className="text-gray-300 mb-3">
                  Upgrade to VIP to unlock unlimited signals and advanced features.
                </p>
                <button
                  onClick={() => onNavigate('subscription')}
                  className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A1628] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/50 transition"
                >
                  Upgrade to VIP
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1E293B] rounded-xl p-6 border border-[#D4AF37]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#10B981]/20 p-3 rounded-lg">
                <Award className="w-6 h-6 text-[#10B981]" />
              </div>
              <span className="text-2xl font-bold text-white">{winRate}%</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Win Rate</h3>
          </div>

          <div className="bg-[#1E293B] rounded-xl p-6 border border-[#D4AF37]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#3B82F6]/20 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <span className="text-2xl font-bold text-white">{totalSignals}</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Total Signals</h3>
          </div>

          <div className="bg-[#1E293B] rounded-xl p-6 border border-[#D4AF37]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#D4AF37]/20 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <span className="text-2xl font-bold text-white">{activeSignals}</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Active Signals</h3>
          </div>

          <div className="bg-[#1E293B] rounded-xl p-6 border border-[#D4AF37]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#8B5CF6]/20 p-3 rounded-lg">
                <Target className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <span className="text-2xl font-bold text-white">{completedSignals}</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Completed</h3>
          </div>
        </div>

        <div className="mb-8">
          <RiskCalculator />
        </div>

        <div className="bg-[#1E293B] rounded-xl p-8 border border-[#D4AF37]/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Taken Signals</h2>
            <button
              onClick={() => onNavigate('signals')}
              className="text-[#D4AF37] hover:text-[#B8941F] font-medium transition"
            >
              View All
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Loading signals...</p>
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No taken signals yet</p>
              <p className="text-gray-500 text-sm">Generate signals and mark them as "Taken" to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {signals.slice(0, 5).map((signal) => (
                <div
                  key={signal.id}
                  className="bg-[#0F172A] rounded-lg p-4 border border-gray-800 hover:border-[#D4AF37]/30 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        signal.signal_type === 'buy'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : 'bg-[#EF4444]/20 text-[#EF4444]'
                      }`}>
                        {signal.signal_type.toUpperCase()}
                      </span>
                      <span className="text-white font-semibold">{signal.market}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm font-bold ${
                        signal.pnl_percentage >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                      }`}>
                        {signal.pnl_percentage >= 0 ? '+' : ''}{signal.pnl_percentage.toFixed(2)}%
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(signal.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">Entry:</span>
                      <div className="text-white font-medium">{signal.entry_price.toFixed(5)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Current:</span>
                      <div className="text-white font-medium">{signal.current_price?.toFixed(5) || '-'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">TPs Hit:</span>
                      <div className="text-[#10B981] font-medium">
                        {[signal.tp1_hit_at, signal.tp2_hit_at, signal.tp3_hit_at].filter(Boolean).length}/3
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Confidence:</span>
                      <div className="text-[#D4AF37] font-medium">{signal.confidence_score}%</div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold inline-block ${
                        signal.status === 'active' && !signal.tp1_hit_at && !signal.sl_hit_at ? 'bg-blue-500/20 text-blue-400' :
                        signal.status === 'completed' && signal.tp3_hit_at ? 'bg-green-500/20 text-green-400' :
                        signal.status === 'completed' && signal.sl_hit_at ? 'bg-red-500/20 text-red-400' :
                        signal.tp2_hit_at && !signal.tp3_hit_at ? 'bg-green-500/15 text-green-300' :
                        signal.tp1_hit_at && !signal.tp2_hit_at ? 'bg-green-500/10 text-green-200' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {signal.status === 'completed' && signal.tp3_hit_at ? 'ALL TPS HIT' :
                         signal.status === 'completed' && signal.sl_hit_at ? 'SL HIT' :
                         signal.tp2_hit_at && !signal.tp3_hit_at ? 'TP2 HIT' :
                         signal.tp1_hit_at && !signal.tp2_hit_at ? 'TP1 HIT' :
                         'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
