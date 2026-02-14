import { useState, useEffect } from 'react';
import { Check, Crown, Zap, TrendingUp, TrendingDown, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SubscriptionPageProps {
  onNavigate: (page: string) => void;
  onSelectPlan?: (plan: { name: string; price: number; planType: string; upgradeInfo?: any }) => void;
}

interface PlanPricing {
  [key: string]: {
    originalPrice: number;
    upgradePrice?: number;
    isUpgrade?: boolean;
    isDowngrade?: boolean;
    isCurrent?: boolean;
    upgradeMessage?: string;
    remainingValue?: number;
  };
}

export function SubscriptionPage({ onNavigate, onSelectPlan }: SubscriptionPageProps) {
  const { user, subscription } = useAuth();
  const [planPricing, setPlanPricing] = useState<PlanPricing>({});
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: 'DEMO',
      subtitle: 'Try Free',
      price: 0,
      period: 'forever',
      planType: 'demo',
      features: [
        'Generate up to 3 signals total',
        'Access to any market (Forex, Crypto, Indices, Commodities)',
        'Use any timeframe',
        'Confidence range: 0-60% (limited)',
        'Basic signal generation engine',
        'No credit card required',
      ],
      badge: null,
      highlighted: false,
      bestFor: 'Best for beginners who want to test signal accuracy first.',
    },
    {
      name: '1 MONTH',
      subtitle: 'Starter',
      price: 25,
      period: 'month',
      planType: '1_month',
      costPerDay: '$0.83',
      features: [
        'Generate 5 signals per day',
        'Access to ICT Method',
        'Timeframes: M1, M5, M15',
        'Confidence range: 0-100% (full control)',
        'Multi-market access',
        'Risk/Reward Ratio display',
        'TP / SL Auto Calculation',
        'Signal Confidence % indicator',
        'Trade history tracking',
        'Win rate statistics',
        'Email support',
      ],
      badge: null,
      highlighted: false,
      bestFor: 'Good for scalpers and short-term traders.',
    },
    {
      name: '3 MONTHS',
      subtitle: 'Popular',
      price: 69,
      period: '3 months',
      planType: '3_months',
      costPerMonth: '$23',
      savings: 'Save $6 vs monthly',
      features: [
        'Generate 12 signals per day',
        'Access to ICT + SMC Methods',
        'Timeframes: M1, M5, M30, H1',
        'Confidence range: 0-100% (full control)',
        'Multi-market access',
        'Advanced signal dashboard',
        'Risk/Reward Ratio display',
        'TP / SL Auto Calculation',
        'Signal Confidence % indicator',
        'Trade history tracking',
        'Win rate statistics',
        'Priority email support',
      ],
      badge: 'POPULAR',
      highlighted: true,
      bestFor: 'Best for consistent traders who want multi-strategy confirmations.',
    },
    {
      name: '6 MONTHS',
      subtitle: 'Pro Traders',
      price: 139,
      period: '6 months',
      planType: '6_months',
      costPerMonth: '$23.16',
      features: [
        'Generate 25 signals per day',
        'Access to: ICT, SMC, Elliott Wave',
        'Timeframes: M1, M5, M15, M30, H1, D1',
        'Confidence range: 0-100% (full control)',
        'View signals directly on chart',
        'Advanced analytics view',
        'Risk/Reward Ratio display',
        'TP / SL Auto Calculation',
        'Signal Confidence % indicator',
        'Trade history tracking',
        'Win rate statistics',
        'Priority support',
      ],
      badge: null,
      highlighted: false,
      bestFor: 'Ideal for traders running multiple pairs daily.',
    },
    {
      name: '12 MONTHS',
      subtitle: 'Best Value',
      price: 279,
      period: '12 months',
      planType: '12_months',
      costPerMonth: '$23.25',
      savings: 'Save $21 vs 1-month renewals',
      features: [
        'Unlimited daily signal generation',
        'Access to: ICT, SMC, Elliott Wave',
        'ALL timeframes: M1, M5, M15, M30, H1, H4, D1, W1',
        'Confidence range: 0-100% (full control)',
        'View signals directly inside chart',
        'Full Market Intelligence Section',
        'Market Sentiment',
        'Breaking News',
        'Economic Calendar',
        'Risk/Reward Ratio display',
        'TP / SL Auto Calculation',
        'Signal Confidence % indicator',
        'Trade history tracking',
        'Win rate statistics',
        'Premium support',
        'Early access to new features',
      ],
      badge: 'BEST VALUE',
      highlighted: false,
      recommended: true,
      bestFor: 'Made for serious traders & investors.',
    },
  ];

  const planHierarchy = ['demo', '1_month', '3_months', '6_months', '12_months'];

  useEffect(() => {
    if (user && subscription) {
      calculatePlanPricing();
    }
  }, [user, subscription]);

  const calculatePlanPricing = async () => {
    if (!user || !subscription) return;

    const currentPlanIndex = planHierarchy.indexOf(subscription.plan_type);
    const pricing: PlanPricing = {};

    for (const plan of plans) {
      const planIndex = planHierarchy.indexOf(plan.planType);

      if (plan.planType === subscription.plan_type) {
        pricing[plan.planType] = {
          originalPrice: plan.price,
          isCurrent: true,
        };
      } else if (planIndex > currentPlanIndex) {
        const { data, error } = await supabase.rpc('calculate_upgrade_cost', {
          p_user_id: user.id,
          p_new_plan_type: plan.planType
        });

        if (!error && data && data.length > 0) {
          const upgradeInfo = data[0];

          // Check if the function rejected this as a downgrade
          if (upgradeInfo.message?.includes('downgrade')) {
            pricing[plan.planType] = {
              originalPrice: plan.price,
              isDowngrade: true,
              upgradeMessage: 'Downgrade takes effect at next billing cycle',
            };
          } else {
            pricing[plan.planType] = {
              originalPrice: upgradeInfo.new_plan_price || plan.price,
              upgradePrice: upgradeInfo.upgrade_cost,
              isUpgrade: true,
              upgradeMessage: upgradeInfo.message,
              remainingValue: upgradeInfo.remaining_value,
            };
          }
        }
      } else if (planIndex < currentPlanIndex && plan.planType !== 'demo') {
        pricing[plan.planType] = {
          originalPrice: plan.price,
          isDowngrade: true,
          upgradeMessage: 'Downgrade takes effect at next billing cycle',
        };
      }
    }

    setPlanPricing(pricing);
  };

  const handlePlanSelect = async (plan: any) => {
    if (plan.price === 0) {
      if (!user) {
        onNavigate('auth');
      }
      return;
    }

    if (!user) {
      onNavigate('auth');
      return;
    }

    const pricing = planPricing[plan.planType];

    if (pricing?.isDowngrade) {
      setLoading(true);
      const { data, error } = await supabase.rpc('schedule_downgrade', {
        p_user_id: user.id,
        p_new_plan_type: plan.planType
      });

      setLoading(false);

      if (!error && data && data.length > 0) {
        const result = data[0];
        alert(result.message);
        window.location.reload();
      } else {
        alert('Failed to schedule downgrade. Please try again.');
      }
    } else if (pricing?.isUpgrade) {
      onSelectPlan?.({
        name: plan.name,
        price: pricing.upgradePrice || plan.price,
        planType: plan.planType,
        upgradeInfo: {
          originalPrice: pricing.originalPrice,
          upgradePrice: pricing.upgradePrice,
          remainingValue: pricing.remainingValue,
          message: pricing.upgradeMessage,
        }
      });
    } else {
      onSelectPlan?.({
        name: plan.name,
        price: plan.price,
        planType: plan.planType
      });
    }
  };

  const getButtonText = (plan: any) => {
    const pricing = planPricing[plan.planType];

    if (plan.price === 0) {
      return user ? 'Current Plan' : 'Start Free';
    }

    if (!user) {
      return 'Get Started';
    }

    if (pricing?.isCurrent) {
      return 'Current Plan';
    }

    if (pricing?.isUpgrade) {
      return `Pay $${pricing.upgradePrice?.toFixed(2)} Now`;
    }

    if (pricing?.isDowngrade) {
      return 'Downgrade';
    }

    return 'Upgrade Now';
  };

  const getButtonDisabled = (plan: any) => {
    if (loading) return true;
    const pricing = planPricing[plan.planType];
    return pricing?.isCurrent && plan.price === 0 && user;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 mb-6">
            Professional trading signals for serious traders
          </p>

          {subscription && (
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-[#1E293B] rounded-full border border-[#D4AF37]/30">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-white font-medium">
                Current Plan: <span className="text-[#D4AF37]">{subscription.plan_type.replace('_', ' ').toUpperCase()}</span>
              </span>
            </div>
          )}
        </div>

        {!user && (
          <div className="mb-8 bg-[#1E293B] border border-[#D4AF37]/20 rounded-xl p-6 text-center">
            <p className="text-gray-300 mb-4">
              Start with 3 free demo signals to experience our accuracy
            </p>
            <button
              onClick={() => onNavigate('auth')}
              className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A1628] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/50 transition"
            >
              Start Free Trial
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-6 transition-all ${
                plan.recommended
                  ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#B8941F]/10 border-2 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/30 scale-105'
                  : plan.highlighted
                  ? 'bg-gradient-to-br from-[#D4AF37]/10 to-[#B8941F]/5 border-2 border-[#D4AF37]/60 shadow-xl shadow-[#D4AF37]/20'
                  : 'bg-[#1E293B] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className={`px-4 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A1628]'
                      : 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white'
                  }`}>
                    {plan.recommended && <Crown className="w-3 h-3" />}
                    {plan.highlighted && !plan.recommended && <Zap className="w-3 h-3" />}
                    <span>{plan.badge}</span>
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-[#D4AF37] text-sm font-semibold">{plan.subtitle}</p>
              </div>

              <div className="text-center mb-4">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  {plan.period === 'forever' ? 'No payment required' : `per ${plan.period}`}
                </p>
                {plan.costPerDay && (
                  <p className="text-[#10B981] text-xs mt-1">Cost per day: {plan.costPerDay}</p>
                )}
                {plan.costPerMonth && (
                  <p className="text-[#10B981] text-xs mt-1">Cost per month: {plan.costPerMonth}</p>
                )}
                {plan.savings && (
                  <p className="text-[#10B981] text-xs font-semibold mt-1">{plan.savings}</p>
                )}
              </div>

              <ul className="space-y-2 mb-6 min-h-[320px]">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.bestFor && (
                <p className="text-gray-400 text-xs italic mb-4 text-center border-t border-[#D4AF37]/20 pt-4">
                  {plan.bestFor}
                </p>
              )}

              {planPricing[plan.planType]?.isUpgrade && planPricing[plan.planType]?.upgradeMessage && (
                <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-xs font-semibold">Upgrade Available</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Pay now:</span>
                      <span className="text-green-500 font-semibold">${planPricing[plan.planType]?.upgradePrice?.toFixed(2)}</span>
                    </div>
                    {planPricing[plan.planType]?.remainingValue > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Credit applied:</span>
                        <span className="text-green-400">${planPricing[plan.planType]?.remainingValue?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs border-t border-green-500/20 pt-1 mt-1">
                      <span className="text-gray-400">Next billing cycle:</span>
                      <span className="text-white font-semibold">${planPricing[plan.planType]?.originalPrice?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {planPricing[plan.planType]?.isDowngrade && (
                <div className="mb-3 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-500 text-xs font-semibold">Downgrade Option</span>
                  </div>
                  <p className="text-gray-300 text-xs text-center">
                    Takes effect next billing cycle
                  </p>
                </div>
              )}

              <button
                onClick={() => handlePlanSelect(plan)}
                disabled={getButtonDisabled(plan)}
                className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                  planPricing[plan.planType]?.isCurrent
                    ? 'bg-[#1E293B] text-gray-400 border border-[#D4AF37]/30 cursor-not-allowed'
                    : plan.recommended
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A1628] hover:shadow-xl hover:shadow-[#D4AF37]/60 transform hover:scale-105'
                    : plan.highlighted
                    ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:shadow-lg hover:shadow-[#10B981]/50'
                    : planPricing[plan.planType]?.isDowngrade
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : plan.price === 0
                    ? 'bg-[#1E293B] text-white border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#0F172A]'
                    : 'bg-[#0F172A] text-white border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#1E293B]'
                }`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{getButtonText(plan)}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="bg-[#1E293B] rounded-2xl p-8 border border-[#D4AF37]/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Payment Options</h2>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#F3BA2F] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-xl">B</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Binance Pay</h3>
                <p className="text-gray-400 text-sm">Secure cryptocurrency payments</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm text-center max-w-2xl">
              All subscriptions are processed securely through Binance Pay. You can pay with USDT, BTC, ETH, and other supported cryptocurrencies.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            All plans include a 30-day satisfaction guarantee. Cancel anytime, no questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
