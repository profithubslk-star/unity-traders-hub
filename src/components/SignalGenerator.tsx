import { useState, useEffect } from 'react';
import { Zap, Settings, Activity, BarChart3, TrendingUp, Target, CheckCircle2, Crown, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateSignal } from '../utils/signalGenerator';
import {
  getSubscriptionLimits,
  canAccessTimeframe,
  canUseMethod,
  checkSignalLimitStatus,
  getMethodDisplayName
} from '../utils/subscriptionLimits';

interface SignalConfig {
  timeframe: string;
  marketCategory: string;
  currencyPair: string;
  orderType: 'market' | 'limit';
  methods: string[];
}

interface SignalGeneratorProps {
  onSignalGenerated?: () => void;
}

interface ScanStage {
  id: string;
  label: string;
  icon: any;
  completed: boolean;
  current: boolean;
}

export function SignalGenerator({ onSignalGenerated }: SignalGeneratorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanStages, setScanStages] = useState<ScanStage[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [signalsRemaining, setSignalsRemaining] = useState<number | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [config, setConfig] = useState<SignalConfig>({
    timeframe: 'M15',
    marketCategory: 'crypto',
    currencyPair: 'BTCUSDT',
    orderType: 'market',
    methods: ['ict'],
  });
  const [minConfidence, setMinConfidence] = useState<number>(35);
  const [maxAllowedConfidence, setMaxAllowedConfidence] = useState<number>(100);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoadingSubscription(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingSubscription(false);
        return;
      }

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
      }

      if (subData) {
        setSubscription(subData);

        const limits = getSubscriptionLimits(subData.plan_type);
        setMaxAllowedConfidence(limits.maxConfidenceLevel);

        if (minConfidence > limits.maxConfidenceLevel) {
          setMinConfidence(limits.maxConfidenceLevel);
        }

        const { count } = await supabase
          .from('user_signals')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const totalSignals = count || 0;

        const limitStatus = checkSignalLimitStatus(
          subData.plan_type,
          subData.signals_viewed_count || 0,
          totalSignals
        );

        setSignalsRemaining(limitStatus.signalsRemaining);
        setIsUnlimited(limitStatus.isUnlimited);
      } else {
        const demoSub = {
          plan_type: 'demo',
          status: 'active',
          signals_viewed_count: 0,
          user_id: user.id
        };
        setSubscription(demoSub);

        const limits = getSubscriptionLimits('demo');
        setMaxAllowedConfidence(limits.maxConfidenceLevel);

        const { count } = await supabase
          .from('user_signals')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const totalSignals = count || 0;
        const limitStatus = checkSignalLimitStatus('demo', 0, totalSignals);

        setSignalsRemaining(limitStatus.signalsRemaining);
        setIsUnlimited(limitStatus.isUnlimited);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      const demoSub = {
        plan_type: 'demo',
        status: 'active',
        signals_viewed_count: 0,
        user_id: user?.id || ''
      };
      setSubscription(demoSub);
      setMaxAllowedConfidence(60);
      setSignalsRemaining(3);
      setIsUnlimited(false);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];
  const marketCategories = [
    {
      value: 'crypto',
      label: 'Cryptocurrencies',
      pairs: [
        { symbol: 'BTCUSDT', name: 'BTC/USD' },
        { symbol: 'ETHUSDT', name: 'ETH/USD' },
        { symbol: 'SOLUSDT', name: 'SOL/USD' },
        { symbol: 'BNBUSDT', name: 'BNB/USD' },
        { symbol: 'XRPUSDT', name: 'XRP/USD' },
      ]
    },
    {
      value: 'forex',
      label: 'Forex',
      pairs: [
        { symbol: 'EURUSDT', name: 'EUR/USD' },
        { symbol: 'GBPUSDT', name: 'GBP/USD' },
        { symbol: 'AUDUSDT', name: 'AUD/USD' },
        { symbol: 'USDCUSDT', name: 'USD/JPY' },
        { symbol: 'TUSDUSDT', name: 'USD/CHF' },
      ]
    },
    {
      value: 'stocks',
      label: 'Stocks',
      pairs: [
        { symbol: 'AAVEUSDT', name: 'AAPL' },
        { symbol: 'SOLUSDT', name: 'TSLA' },
        { symbol: 'MATICUSDT', name: 'MSFT' },
        { symbol: 'AVAXUSDT', name: 'NVDA' },
        { symbol: 'UNIUSDT', name: 'AMZN' },
      ]
    },
    {
      value: 'commodities',
      label: 'Commodities',
      pairs: [
        { symbol: 'PAXGUSDT', name: 'XAU/USD (Gold)' },
        { symbol: 'ETHUSDT', name: 'WTI (Crude Oil)' },
        { symbol: 'LTCUSDT', name: 'XAG/USD (Silver)' },
        { symbol: 'BNBUSDT', name: 'Natural Gas' },
        { symbol: 'ADAUSDT', name: 'Brent Oil' },
      ]
    },
  ];
  const methods = [
    { value: 'ict', label: 'ICT Concepts', description: 'Order blocks, FVG, liquidity' },
    { value: 'smc', label: 'Smart Money Concepts', description: 'Market structure, CHoCH, BOS' },
    { value: 'elliott_wave', label: 'Elliott Wave', description: 'Wave patterns and cycles' },
  ];

  const getCurrentPairs = () => {
    return marketCategories.find(cat => cat.value === config.marketCategory)?.pairs || [];
  };

  const getCurrentCategoryFirstSymbol = (categoryValue: string) => {
    const category = marketCategories.find(cat => cat.value === categoryValue);
    return category?.pairs[0]?.symbol || 'BTCUSDT';
  };

  const toggleMethod = (method: string) => {
    setConfig(prev => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter(m => m !== method)
        : [...prev.methods, method]
    }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to generate signals');
        return;
      }

      if (!subscription) {
        setError('Unable to verify subscription. Please refresh the page and try again. If the problem persists, contact support.');
        return;
      }

      const { count } = await supabase
        .from('user_signals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const totalSignals = count || 0;

      const limitStatus = checkSignalLimitStatus(
        subscription.plan_type,
        subscription.signals_viewed_count || 0,
        totalSignals
      );

      if (!limitStatus.canGenerate) {
        setError(limitStatus.reason + '\n\nUpgrade your plan to continue generating signals.');
        return;
      }

      const stages: ScanStage[] = [
        { id: 'connect', label: `Connecting to ${config.currencyPair} market data...`, icon: Activity, completed: false, current: true },
      ];

      if (config.methods.includes('ict')) {
        stages.push({ id: 'ict', label: 'Analyzing ICT concepts (Order Blocks, FVG, Liquidity)', icon: BarChart3, completed: false, current: false });
      }
      if (config.methods.includes('smc')) {
        stages.push({ id: 'smc', label: 'Analyzing Smart Money Concepts (CHoCH, BOS)', icon: TrendingUp, completed: false, current: false });
      }
      if (config.methods.includes('elliott_wave')) {
        stages.push({ id: 'elliott', label: 'Scanning Elliott Wave patterns', icon: Activity, completed: false, current: false });
      }

      stages.push(
        { id: 'calculate', label: 'Calculating Risk/Reward ratios', icon: Target, completed: false, current: false },
        { id: 'generate', label: 'Generating trading signal...', icon: Zap, completed: false, current: false }
      );

      setScanStages(stages);

      const updateStage = (stageId: string) => {
        setScanStages(prev => prev.map(stage => {
          if (stage.id === stageId) {
            return { ...stage, current: false, completed: true };
          }
          const currentIndex = prev.findIndex(s => s.id === stageId);
          const nextIndex = currentIndex + 1;
          if (prev[nextIndex] && stage.id === prev[nextIndex].id) {
            return { ...stage, current: true };
          }
          return stage;
        }));
      };

      for (let i = 0; i < stages.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
        updateStage(stages[i].id);
      }

      const signalData = await generateSignal(
        config.currencyPair,
        config.timeframe,
        config.orderType,
        config.methods,
        minConfidence
      );

      await new Promise(resolve => setTimeout(resolve, 600));
      updateStage('generate');

      const { error: insertError } = await supabase.from('signals').insert({
        user_id: user.id,
        market: config.currencyPair,
        timeframe: config.timeframe,
        methods: config.methods,
        signal_type: signalData.signal_type,
        entry_type: config.orderType,
        entry_price: signalData.entry_price,
        stop_loss: signalData.stop_loss,
        take_profit_1: signalData.take_profit_1,
        take_profit_2: signalData.take_profit_2,
        take_profit_3: signalData.take_profit_3,
        tp1_percentage: signalData.tp1_percentage,
        tp2_percentage: signalData.tp2_percentage,
        tp3_percentage: signalData.tp3_percentage,
        confidence_score: signalData.confidence_score,
        risk_reward_ratio: signalData.risk_reward_ratio,
        analysis_data: signalData.analysis_data,
        methodology: signalData.methodology,
        status: 'active',
        is_demo: false,
        user_action: 'pending',
        pnl_percentage: 0,
        break_even_moved: false,
        current_price: signalData.current_price,
      });

      if (insertError) throw insertError;

      const { data: newSignal } = await supabase
        .from('signals')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (newSignal) {
        await supabase.from('user_signals').insert({
          user_id: user.id,
          signal_id: newSignal.id,
        });

        await supabase.rpc('increment_signal_view_count', { user_uuid: user.id });
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      setIsExpanded(false);
      await fetchSubscriptionInfo();
      onSignalGenerated?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate signal';
      if (errorMessage.includes('SIGNAL_BLOCKED:')) {
        const reason = errorMessage.replace('SIGNAL_BLOCKED: ', '');
        setError(`⚠️ No Valid Setup Found\n\n${reason}\n\nThis is normal - professional trading requires strict criteria. Most market conditions don't meet institutional-grade setup requirements. Try different markets, timeframes, or wait for better conditions.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setGenerating(false);
      setScanStages([]);
    }
  };

  return (
    <div className="bg-[#1E293B] rounded-xl border border-[#D4AF37]/20 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1E293B]/80 transition"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#0F172A]" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-lg font-bold text-white">Generate Trading Signal</h3>
            <p className="text-sm text-gray-400">Configure parameters and create professional trading signals</p>
          </div>
          {loadingSubscription ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-[#0F172A] rounded-lg border border-[#D4AF37]/30">
              <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
              <span className="text-sm font-semibold text-white">Loading...</span>
            </div>
          ) : subscription && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-[#0F172A] rounded-lg border border-[#D4AF37]/30">
              {isUnlimited ? (
                <>
                  <Crown className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm font-semibold text-white">Unlimited</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm font-semibold text-white">
                    {signalsRemaining} {subscription.plan_type === 'demo' ? 'total' : 'today'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-[#D4AF37]/10">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Settings className="w-4 h-4 inline mr-2" />
                  Timeframe
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeframes.map(tf => {
                    const isLocked = subscription && !canAccessTimeframe(subscription.plan_type, tf);
                    return (
                      <button
                        key={tf}
                        onClick={() => !isLocked && setConfig({ ...config, timeframe: tf })}
                        disabled={generating || isLocked}
                        className={`relative px-3 py-2 rounded-lg text-sm font-medium transition ${
                          config.timeframe === tf
                            ? 'bg-[#D4AF37] text-[#0F172A]'
                            : isLocked
                            ? 'bg-[#0F172A]/50 text-gray-600 cursor-not-allowed'
                            : 'bg-[#0F172A] text-gray-400 hover:text-white hover:bg-[#0F172A]/70'
                        } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {tf}
                        {isLocked && (
                          <Lock className="w-3 h-3 absolute top-1 right-1 text-gray-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">Market Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {marketCategories.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setConfig({
                        ...config,
                        marketCategory: cat.value,
                        currencyPair: cat.pairs[0].symbol
                      })}
                      disabled={generating}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition ${
                        config.marketCategory === cat.value
                          ? 'bg-[#D4AF37] text-[#0F172A]'
                          : 'bg-[#0F172A] text-gray-400 hover:text-white hover:bg-[#0F172A]/70'
                      } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">Currency Pair / Asset</label>
                <select
                  value={config.currencyPair}
                  onChange={(e) => setConfig({ ...config, currencyPair: e.target.value })}
                  disabled={generating}
                  className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition disabled:opacity-50"
                >
                  {getCurrentPairs().map(pair => (
                    <option key={pair.symbol} value={pair.symbol}>{pair.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">Order Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConfig({ ...config, orderType: 'market' })}
                    disabled={generating}
                    className={`px-6 py-3 rounded-lg text-sm font-semibold transition ${
                      config.orderType === 'market'
                        ? 'bg-[#D4AF37] text-[#0F172A]'
                        : 'bg-[#0F172A] text-gray-400 hover:text-white'
                    } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Market Order
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, orderType: 'limit' })}
                    disabled={generating}
                    className={`px-6 py-3 rounded-lg text-sm font-semibold transition ${
                      config.orderType === 'limit'
                        ? 'bg-[#D4AF37] text-[#0F172A]'
                        : 'bg-[#0F172A] text-gray-400 hover:text-white'
                    } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Limit Order
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">Analysis Methods</label>
                <div className="space-y-2">
                  {methods.map(method => {
                    const isLocked = subscription && !canUseMethod(subscription.plan_type, method.value);
                    return (
                      <button
                        key={method.value}
                        onClick={() => !isLocked && toggleMethod(method.value)}
                        disabled={generating || isLocked}
                        className={`relative w-full text-left px-4 py-3 rounded-lg transition ${
                          config.methods.includes(method.value)
                            ? 'bg-[#D4AF37]/20 border-2 border-[#D4AF37]'
                            : isLocked
                            ? 'bg-[#0F172A]/50 border-2 border-transparent opacity-50 cursor-not-allowed'
                            : 'bg-[#0F172A] border-2 border-transparent hover:border-gray-700'
                        } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <div className={`text-sm font-semibold ${isLocked ? 'text-gray-600' : 'text-white'}`}>
                                {method.label}
                              </div>
                              {isLocked && (
                                <Lock className="w-3 h-3 text-gray-600" />
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{method.description}</div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                            config.methods.includes(method.value)
                              ? 'bg-[#D4AF37] border-[#D4AF37]'
                              : 'border-gray-600'
                          }`}>
                            {config.methods.includes(method.value) && (
                              <svg className="w-3 h-3 text-[#0F172A]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-[#0F172A] rounded-xl p-6 border border-[#D4AF37]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-[#D4AF37]" />
                <label className="text-sm font-semibold text-white">
                  Minimum Confidence Level
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-[#D4AF37]">{minConfidence}%</span>
                {subscription && maxAllowedConfidence < 100 && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                    <Lock className="w-3 h-3" />
                    <span>Max {maxAllowedConfidence}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type="range"
                min="0"
                max={maxAllowedConfidence}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                disabled={generating}
                className="w-full h-2 bg-[#1E293B] rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed slider-thumb"
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${(minConfidence / maxAllowedConfidence) * 100}%, #1E293B ${(minConfidence / maxAllowedConfidence) * 100}%, #1E293B 100%)`
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>0%</span>
                <span className="text-gray-400">Lower confidence = More signals (less quality)</span>
                <span>{maxAllowedConfidence}%</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-[#1E293B]/50 rounded-lg border border-[#D4AF37]/10">
              <p className="text-xs text-gray-400 leading-relaxed">
                {minConfidence < 40 && (
                  <span className="text-yellow-400">⚠️ Low threshold: More signals will be generated, but quality may be lower. Use with caution.</span>
                )}
                {minConfidence >= 40 && minConfidence < 70 && (
                  <span className="text-blue-400">ℹ️ Moderate threshold: Balanced approach between signal quantity and quality.</span>
                )}
                {minConfidence >= 70 && (
                  <span className="text-green-400">✓ High threshold: Only high-quality signals will be generated. Fewer signals, better setups.</span>
                )}
              </p>
            </div>
          </div>

          {generating && scanStages.length > 0 && (
            <div className="mt-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-[#0F172A]/50 to-[#1E293B]/50 backdrop-blur-xl"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>

              <div className="relative p-8 rounded-xl border border-[#D4AF37]/30 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Market Analysis in Progress</h4>
                    <p className="text-sm text-gray-400">Scanning {config.currencyPair} across multiple timeframes</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#0F172A] px-4 py-2 rounded-lg border border-[#D4AF37]/30">
                    <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-[#D4AF37]">
                      {scanStages.filter(s => s.completed).length}/{scanStages.length}
                    </span>
                  </div>
                </div>

                <div className="mb-6 h-1.5 bg-[#0F172A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] transition-all duration-500 ease-out rounded-full shadow-lg shadow-[#D4AF37]/50"
                    style={{ width: `${(scanStages.filter(s => s.completed).length / scanStages.length) * 100}%` }}
                  ></div>
                </div>

                <div className="space-y-3">
                  {scanStages.map((stage, index) => {
                    const Icon = stage.icon;
                    return (
                      <div
                        key={stage.id}
                        className={`group relative transition-all duration-500 ${
                          stage.completed ? 'opacity-70' : stage.current ? 'opacity-100 scale-[1.02]' : 'opacity-40'
                        }`}
                      >
                        <div className={`absolute inset-0 rounded-xl transition-all duration-500 ${
                          stage.current ? 'bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent blur-sm' : ''
                        }`}></div>

                        <div className="relative flex items-center space-x-4 p-4 rounded-xl bg-[#0F172A]/40 backdrop-blur-sm border border-transparent hover:border-[#D4AF37]/20 transition-all duration-300">
                          <div className="relative">
                            <div className={`absolute inset-0 rounded-xl transition-all duration-500 ${
                              stage.current ? 'bg-[#D4AF37] blur-md opacity-40 animate-pulse' : ''
                            }`}></div>

                            <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                              stage.completed
                                ? 'bg-gradient-to-br from-[#10B981] to-[#059669] shadow-lg shadow-[#10B981]/30'
                                : stage.current
                                ? 'bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] shadow-lg shadow-[#D4AF37]/50 animate-pulse'
                                : 'bg-gradient-to-br from-gray-800 to-gray-900'
                            }`}>
                              {stage.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-white" />
                              ) : (
                                <Icon className={`w-6 h-6 transition-all duration-300 ${
                                  stage.current ? 'text-[#0F172A]' : 'text-gray-600'
                                }`} />
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold transition-all duration-300 ${
                              stage.completed
                                ? 'text-[#10B981]'
                                : stage.current
                                ? 'text-white'
                                : 'text-gray-600'
                            }`}>
                              {stage.label}
                            </p>
                            {stage.current && (
                              <div className="mt-1 flex items-center space-x-2">
                                <div className="flex space-x-1">
                                  <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-xs text-[#D4AF37] font-medium">Processing...</span>
                              </div>
                            )}
                          </div>

                          {stage.current && (
                            <div className="flex-shrink-0">
                              <div className="relative w-8 h-8">
                                <div className="absolute inset-0 border-2 border-[#D4AF37]/20 rounded-full"></div>
                                <div className="absolute inset-0 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            </div>
                          )}

                          {stage.completed && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 flex items-center justify-center">
                                <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-[#D4AF37]/10">
            <button
              onClick={handleGenerate}
              disabled={generating || config.methods.length === 0}
              className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition ${
                generating || config.methods.length === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0F172A] hover:shadow-lg hover:shadow-[#D4AF37]/20'
              }`}
            >
              {generating ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-3 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
                  <span>Scanning {config.currencyPair}...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Generate Signal</span>
                </div>
              )}
            </button>
            {config.methods.length === 0 && (
              <p className="text-center text-sm text-red-400 mt-2">
                Please select at least one analysis method
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
