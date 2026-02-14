import { useState, useEffect } from 'react';
import { Settings, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SUBSCRIPTION_LIMITS } from '../utils/subscriptionLimits';

export function DevPlanSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (isDev) {
      fetchCurrentPlan();
    }
  }, [isDev]);

  const fetchCurrentPlan = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      setUser(authUser);

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        setCurrentPlan(subData.plan_type);
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
    }
  };

  const switchPlan = async (planType: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const limits = SUBSCRIPTION_LIMITS[planType];

      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_type: planType,
          price: limits.price,
          max_signals_per_day: limits.maxSignalsPerDay,
          max_signals_total: limits.maxSignalsTotal,
          allowed_methods: limits.allowedMethods,
          allowed_timeframes: limits.allowedTimeframes,
          can_access_market_intelligence: limits.canAccessMarketIntelligence,
          has_chart_integration: limits.hasChartIntegration,
          signals_viewed_count: 0,
          last_signal_viewed_at: null,
        })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      setCurrentPlan(planType);
      window.location.reload();
    } catch (err) {
      console.error('Error switching plan:', err);
      alert('Failed to switch plan. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const resetSignalCount = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('user_signals')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          signals_viewed_count: 0,
          last_signal_viewed_at: null,
        })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (updateError) throw updateError;

      alert('Signal count reset successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Error resetting count:', err);
      alert('Failed to reset signal count. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isDev || !user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-110"
        title="Dev Tools"
      >
        <Settings className="w-6 h-6 animate-spin-slow" />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-[#1E293B] border-2 border-purple-500 rounded-xl p-6 w-96 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Dev Plan Switcher</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-xs text-purple-300 font-semibold">
              Current Plan: <span className="text-white">{currentPlan.toUpperCase().replace('_', ' ')}</span>
            </p>
          </div>

          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
            {Object.keys(SUBSCRIPTION_LIMITS).map((planType) => {
              const limits = SUBSCRIPTION_LIMITS[planType];
              const isActive = currentPlan === planType;

              return (
                <button
                  key={planType}
                  onClick={() => !isActive && switchPlan(planType)}
                  disabled={loading || isActive}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-purple-500/20 border-2 border-purple-500 cursor-default'
                      : 'bg-[#0F172A] border border-gray-700 hover:border-purple-500 hover:bg-purple-500/10'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-sm ${isActive ? 'text-purple-300' : 'text-white'}`}>
                      {planType.toUpperCase().replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">${limits.price}</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    <div>
                      Signals: {limits.maxSignalsTotal !== null
                        ? `${limits.maxSignalsTotal} total`
                        : limits.maxSignalsPerDay !== null
                        ? `${limits.maxSignalsPerDay}/day`
                        : 'Unlimited'}
                    </div>
                    <div>Methods: {limits.allowedMethods.join(', ')}</div>
                    <div>
                      Market Intelligence: {limits.canAccessMarketIntelligence ? '✓' : '✗'}
                    </div>
                  </div>
                  {isActive && (
                    <div className="mt-2 text-xs text-purple-400 font-semibold">
                      ✓ Active
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={resetSignalCount}
            disabled={loading}
            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
          >
            Reset Signal Count
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Dev mode only - Not visible in production
          </p>
        </div>
      )}
    </div>
  );
}
