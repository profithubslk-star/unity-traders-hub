import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MarketNews } from '../types/database.types';
import { Newspaper, TrendingUp, Clock, AlertCircle, ChevronDown, Calendar, Crown, Lock } from 'lucide-react';
import { LiveMarketTicker } from '../components/LiveMarketTicker';
import { EconomicCalendar } from '../components/EconomicCalendar';
import { getSubscriptionLimits } from '../utils/subscriptionLimits';
import { PaymentWarningBanner } from '../components/PaymentWarningBanner';
import { AccountSuspendedModal } from '../components/AccountSuspendedModal';
import { checkPaymentStatus, refreshPaymentStatus, PaymentStatus } from '../utils/paymentStatus';

interface SentimentData {
  sentiment: string;
  sentimentPercentage: number;
  volatility: string;
  volume: string;
}

const marketCategories = {
  crypto: {
    name: 'Cryptocurrencies',
    pairs: [
      { symbol: 'BTCUSDT', name: 'BTC/USD' },
      { symbol: 'ETHUSDT', name: 'ETH/USD' },
      { symbol: 'SOLUSDT', name: 'SOL/USD' },
      { symbol: 'BNBUSDT', name: 'BNB/USD' },
      { symbol: 'XRPUSDT', name: 'XRP/USD' },
    ],
  },
  forex: {
    name: 'Forex',
    pairs: [
      { symbol: 'EURUSDT', name: 'EUR/USD' },
      { symbol: 'GBPUSDT', name: 'GBP/USD' },
      { symbol: 'AUDUSDT', name: 'AUD/USD' },
      { symbol: 'USDCUSDT', name: 'USD/JPY' },
      { symbol: 'TUSDUSDT', name: 'USD/CHF' },
    ],
  },
  stocks: {
    name: 'Stocks',
    pairs: [
      { symbol: 'AAVEUSDT', name: 'AAPL' },
      { symbol: 'SOLUSDT', name: 'TSLA' },
      { symbol: 'MATICUSDT', name: 'MSFT' },
      { symbol: 'AVAXUSDT', name: 'NVDA' },
      { symbol: 'UNIUSDT', name: 'AMZN' },
    ],
  },
  commodities: {
    name: 'Commodities',
    pairs: [
      { symbol: 'PAXGUSDT', name: 'XAU/USD (Gold)' },
      { symbol: 'ETHUSDT', name: 'WTI (Crude Oil)' },
      { symbol: 'LTCUSDT', name: 'XAG/USD (Silver)' },
      { symbol: 'BNBUSDT', name: 'Natural Gas' },
      { symbol: 'ADAUSDT', name: 'Brent Oil' },
    ],
  },
};

interface MarketIntelligencePageProps {
  onNavigate: (page: string) => void;
}

export function MarketIntelligencePage({ onNavigate }: MarketIntelligencePageProps) {
  const [news, setNews] = useState<MarketNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('crypto');
  const [selectedPair, setSelectedPair] = useState<string>('BTCUSDT');
  const [activeTab, setActiveTab] = useState<'calendar' | 'news'>('calendar');
  const [subscription, setSubscription] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [sentimentData, setSentimentData] = useState<SentimentData>({
    sentiment: 'Loading...',
    sentimentPercentage: 0,
    volatility: 'Loading...',
    volume: 'Loading...',
  });

  useEffect(() => {
    checkSubscriptionAccess();
  }, []);

  const checkPayment = async (userId: string) => {
    const status = await checkPaymentStatus(userId);
    setPaymentStatus(status);
  };

  const handleCheckPaymentStatus = async () => {
    setIsCheckingPayment(true);
    await refreshPaymentStatus();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await checkPayment(user.id);
    }
    setIsCheckingPayment(false);
    window.location.reload();
  };

  useEffect(() => {
    if (hasAccess) {
      fetchNews();
    }
  }, [hasAccess]);

  useEffect(() => {
    if (hasAccess) {
      fetchMarketSentiment();
    }
  }, [selectedPair, hasAccess]);

  const checkSubscriptionAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCheckingAccess(false);
        return;
      }

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        setSubscription(subData);
        const limits = getSubscriptionLimits(subData.plan_type);
        setHasAccess(limits.canAccessMarketIntelligence);
      }

      await checkPayment(user.id);
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-market-news`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setNews(result.news);
      } else {
        console.error('Failed to fetch news from edge function');
      }
    } catch (error) {
      console.error('Error fetching market news:', error);
    }
    setLoading(false);
  };

  const fetchMarketSentiment = async () => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${selectedPair}`);
      const data = await response.json();

      const priceChangePercent = parseFloat(data.priceChangePercent);
      const volume = parseFloat(data.volume);
      const priceChange = parseFloat(data.priceChange);
      const highPrice = parseFloat(data.highPrice);
      const lowPrice = parseFloat(data.lowPrice);

      let sentiment = 'Neutral';
      let sentimentPercentage = 50;

      if (priceChangePercent > 3) {
        sentiment = 'Strongly Bullish';
        sentimentPercentage = Math.min(50 + priceChangePercent * 5, 85);
      } else if (priceChangePercent > 1) {
        sentiment = 'Bullish';
        sentimentPercentage = 50 + priceChangePercent * 8;
      } else if (priceChangePercent < -3) {
        sentiment = 'Strongly Bearish';
        sentimentPercentage = Math.max(50 + priceChangePercent * 5, 15);
      } else if (priceChangePercent < -1) {
        sentiment = 'Bearish';
        sentimentPercentage = 50 + priceChangePercent * 8;
      } else {
        sentimentPercentage = 50 + priceChangePercent * 10;
      }

      const volatilityPercent = ((highPrice - lowPrice) / lowPrice) * 100;
      let volatility = 'Low';
      if (volatilityPercent > 5) volatility = 'High';
      else if (volatilityPercent > 2) volatility = 'Medium';

      let volumeLevel = 'Low';
      if (volume > 100000) volumeLevel = 'High';
      else if (volume > 50000) volumeLevel = 'Medium';

      setSentimentData({
        sentiment,
        sentimentPercentage: Math.round(sentimentPercentage),
        volatility,
        volume: volumeLevel,
      });
    } catch (error) {
      console.error('Error fetching market sentiment:', error);
      setSentimentData({
        sentiment: 'Error',
        sentimentPercentage: 0,
        volatility: 'Unknown',
        volume: 'Unknown',
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const firstPair = marketCategories[category as keyof typeof marketCategories].pairs[0];
    setSelectedPair(firstPair.symbol);
  };

  const getImpactColor = (impact: string | null) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getActiveSessions = () => {
    const now = new Date();
    const utcHours = now.getUTCHours();

    return [
      {
        name: 'Asian Session',
        time: '00:00 - 09:00 UTC',
        active: utcHours >= 0 && utcHours < 9
      },
      {
        name: 'London Session',
        time: '08:00 - 17:00 UTC',
        active: utcHours >= 8 && utcHours < 17
      },
      {
        name: 'New York Session',
        time: '13:00 - 22:00 UTC',
        active: utcHours >= 13 && utcHours < 22
      },
    ];
  };

  const [sessions, setSessions] = useState(getActiveSessions());

  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(getActiveSessions());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-[#0F172A] py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0F172A] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#0F172A]" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Market Intelligence</h1>
            <p className="text-xl text-gray-400 mb-2">Premium Feature</p>
          </div>

          <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#B8941F]/10 border-2 border-[#D4AF37] rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Crown className="w-8 h-8 text-[#D4AF37]" />
              <h2 className="text-2xl font-bold text-white">Unlock Full Market Intelligence</h2>
            </div>

            <div className="bg-[#0F172A]/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Get access to:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Live Market Sentiment</div>
                    <div className="text-sm text-gray-400">Real-time bullish/bearish analysis</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Breaking News</div>
                    <div className="text-sm text-gray-400">Market-moving events instantly</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Economic Calendar</div>
                    <div className="text-sm text-gray-400">High-impact events & releases</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Session Tracking</div>
                    <div className="text-sm text-gray-400">Asian, London, NY sessions</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-[#0F172A] rounded-2xl p-8 mb-4">
                <div className="mb-6">
                  <div className="text-gray-400 text-sm mb-3">Exclusive Access Available With</div>
                  <div className="text-4xl font-bold text-white mb-3">12 MONTHS PLAN</div>
                  <div className="flex items-baseline justify-center space-x-2 mb-4">
                    <span className="text-3xl font-bold text-[#D4AF37]">$279</span>
                    <span className="text-gray-400 text-lg">/year</span>
                  </div>
                  <div className="bg-[#D4AF37]/10 rounded-lg px-4 py-2 inline-block">
                    <div className="text-[#D4AF37] text-sm font-semibold">Unlimited signals + Full market intelligence</div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('subscription')}
                  className="inline-block px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0F172A] font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/60 transform hover:scale-105 transition-all cursor-pointer"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>

          {subscription && (
            <div className="bg-[#1E293B] rounded-xl p-6 border border-[#D4AF37]/20 text-center">
              <p className="text-gray-400">
                Current Plan: <span className="text-white font-semibold">{subscription.plan_type.toUpperCase().replace('_', ' ')}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Market Intelligence is only available on the 12-Month Plan
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Market Intelligence</h1>
              <p className="text-gray-400">Real-time market news and session tracking</p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#D4AF37]/20 to-[#B8941F]/10 border border-[#D4AF37] rounded-lg">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-white font-semibold text-sm">Premium Access</span>
            </div>
          </div>
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

        <div className="mb-8">
          <LiveMarketTicker />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {sessions.map((session, index) => (
            <div
              key={index}
              className={`rounded-xl p-6 border ${
                session.active
                  ? 'bg-[#10B981]/10 border-[#10B981]/50'
                  : 'bg-[#1E293B] border-[#D4AF37]/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{session.name}</h3>
                <div
                  className={`w-3 h-3 rounded-full ${
                    session.active ? 'bg-[#10B981] animate-pulse' : 'bg-gray-600'
                  }`}
                ></div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{session.time}</span>
              </div>
              <div className="mt-2">
                <span
                  className={`text-xs font-semibold ${
                    session.active ? 'text-[#10B981]' : 'text-gray-500'
                  }`}
                >
                  {session.active ? 'ACTIVE' : 'CLOSED'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#1E293B] rounded-xl p-6 border border-[#D4AF37]/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
              <h2 className="text-xl font-bold text-white">Market Sentiment</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-medium">Category:</span>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="appearance-none bg-[#0F172A] text-white text-sm px-4 py-2 pr-10 rounded-lg border border-slate-600/40 hover:border-slate-500/60 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-all duration-200"
                  >
                    {Object.entries(marketCategories).map(([key, category]) => (
                      <option key={key} value={key}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-medium">Pair:</span>
                <div className="relative">
                  <select
                    value={selectedPair}
                    onChange={(e) => setSelectedPair(e.target.value)}
                    className="appearance-none bg-[#0F172A] text-white text-sm px-4 py-2 pr-10 rounded-lg border border-slate-600/40 hover:border-slate-500/60 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-all duration-200"
                  >
                    {marketCategories[selectedCategory as keyof typeof marketCategories].pairs.map((pair) => (
                      <option key={pair.symbol} value={pair.symbol}>
                        {pair.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0F172A] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Market Sentiment</div>
              <div className={`text-2xl font-bold ${
                sentimentData.sentiment.includes('Bullish') ? 'text-[#10B981]' :
                sentimentData.sentiment.includes('Bearish') ? 'text-[#EF4444]' :
                'text-gray-400'
              }`}>
                {sentimentData.sentiment}
              </div>
              <div className="text-xs text-gray-500 mt-1">{sentimentData.sentimentPercentage}% confidence</div>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Volatility Level</div>
              <div className={`text-2xl font-bold ${
                sentimentData.volatility === 'High' ? 'text-[#EF4444]' :
                sentimentData.volatility === 'Medium' ? 'text-[#D4AF37]' :
                'text-[#10B981]'
              }`}>
                {sentimentData.volatility}
              </div>
              <div className="text-xs text-gray-500 mt-1">Based on 24h price range</div>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Trading Volume</div>
              <div className={`text-2xl font-bold ${
                sentimentData.volume === 'High' ? 'text-[#10B981]' :
                sentimentData.volume === 'Medium' ? 'text-[#D4AF37]' :
                'text-gray-400'
              }`}>
                {sentimentData.volume}
              </div>
              <div className="text-xs text-gray-500 mt-1">24h trading activity</div>
            </div>
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[#D4AF37]/20 overflow-hidden">
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all duration-200 ${
                activeTab === 'calendar'
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-gray-400 hover:text-white hover:bg-[#0F172A]/50'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Economic Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all duration-200 ${
                activeTab === 'news'
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-gray-400 hover:text-white hover:bg-[#0F172A]/50'
              }`}
            >
              <Newspaper className="w-5 h-5" />
              <span>Latest Market News</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'calendar' ? (
              <EconomicCalendar />
            ) : (
              <div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 mt-4">Loading news...</p>
                  </div>
                ) : news.length === 0 ? (
                  <div className="text-center py-12">
                    <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No news available at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {news.map((item: any) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-[#0F172A] rounded-lg p-4 border border-gray-800 hover:border-[#D4AF37]/30 transition cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-semibold flex-1 hover:text-[#D4AF37] transition">{item.title}</h3>
                          {item.impact_level && (
                            <span
                              className={`ml-4 px-2 py-1 rounded text-xs font-semibold border ${getImpactColor(
                                item.impact_level
                              )}`}
                            >
                              {item.impact_level.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium">{item.source}</span>
                          <span>{new Date(item.published_at).toLocaleString()}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">Trading Tips</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Best liquidity during London and New York session overlap (13:00-17:00 UTC)</li>
                <li>• High-impact news can cause significant price volatility</li>
                <li>• Always use proper risk management and stop losses</li>
                <li>• Monitor multiple timeframes for better trade confirmation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
