import { TrendingUp, Shield, Zap, Target, ArrowRight, Sparkles, BarChart3, Bell, Lock, ChevronRight, Activity, Globe, DollarSign, TrendingDown, Clock, CheckCircle, Crown, Check, Users, Award, Rocket, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/60 backdrop-blur-xl rounded-2xl border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 flex items-center justify-between text-left group"
      >
        <h3 className="text-lg font-bold text-white pr-8 group-hover:text-[#D4AF37] transition-colors">
          {question}
        </h3>
        <ChevronDown
          className={`w-6 h-6 text-[#D4AF37] flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-8 pb-6">
          <p className="text-gray-400 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1E] overflow-hidden">
      <div
        className="fixed inset-0 opacity-20 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(212, 175, 55, 0.15), transparent)`,
        }}
      ></div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#10B981]/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      <div className="relative z-10">
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8 relative inline-block">
              <div className="text-8xl md:text-9xl neon-lightning">⚡</div>
            </div>

            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                Master the Markets with
              </h1>
              <h2 className="text-7xl md:text-9xl font-black relative inline-block leading-tight animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                <span className="relative">
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-400 via-rose-400 via-orange-400 via-amber-400 via-yellow-400 via-lime-400 via-green-400 via-emerald-400 via-teal-400 via-cyan-400 via-sky-400 via-blue-400 via-indigo-400 via-violet-400 via-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent animate-gradient-shimmer blur-sm"></span>
                  <span className="relative bg-gradient-to-r from-pink-500 via-rose-500 via-orange-500 via-amber-400 via-yellow-400 via-lime-400 via-green-500 via-emerald-500 via-teal-500 via-cyan-500 via-sky-500 via-blue-500 via-indigo-500 via-violet-500 via-purple-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent animate-gradient-flow-enhanced">
                    UNITY TRADERS
                  </span>
                </span>
              </h2>
              <div className="flex items-center justify-center space-x-3 mb-4 mt-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-expand"></div>
                <Sparkles className="w-6 h-6 text-[#D4AF37] animate-spin-slow" />
                <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-expand"></div>
              </div>
            </div>

            <p className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto mb-6 animate-fade-in-up opacity-0 leading-relaxed" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              Advanced <span className="text-[#D4AF37] font-bold">ICT Analysis</span>, <span className="text-[#D4AF37] font-bold">Smart Money Concepts</span>, and <span className="text-[#D4AF37] font-bold">Elliott Wave Theory</span> delivering institutional-grade signals for Forex, Crypto, Stocks, Commodities & Indices
            </p>

            <div className="flex items-center justify-center mb-10 animate-fade-in-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#1E293B]/60 via-[#0F172A]/80 to-[#1E293B]/60 backdrop-blur-xl rounded-full border border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/20">
                <Activity className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                <span className="text-gray-300 font-semibold text-sm tracking-wide">
                  Powered with <span className="text-[#D4AF37] font-bold">Multi-Theory Quant Engine</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12 animate-fade-in-up opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              <button
                onClick={() => onNavigate('auth')}
                className="group relative px-12 py-6 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] font-bold rounded-2xl text-xl overflow-hidden transition-all duration-500 hover:scale-110 hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] shadow-lg shadow-[#D4AF37]/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                <span className="relative flex items-center space-x-3">
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
              </button>

              <button
                onClick={() => onNavigate('subscription')}
                className="group px-12 py-6 bg-[#1E293B]/40 backdrop-blur-xl text-white font-bold rounded-2xl text-xl border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#1E293B]/60 transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/10 to-[#D4AF37]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative">View Pricing</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto animate-fade-in-up opacity-0" style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}>
              {[
                { icon: Target, label: '85% Win Rate', color: 'text-[#10B981]' },
                { icon: Zap, label: 'Real-Time Alerts', color: 'text-[#D4AF37]' },
                { icon: Shield, label: '24/7 Support', color: 'text-[#3B82F6]' }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2 group">
                  <div className="w-12 h-12 rounded-full bg-[#1E293B]/60 backdrop-blur-xl border border-[#D4AF37]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="text-sm text-gray-300 font-semibold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">
                  Markets We Cover
                </span>
              </h2>
              <div className="flex items-center justify-center">
                <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { name: 'Forex', icon: DollarSign, pairs: '50+ Pairs', color: 'from-[#10B981] to-[#059669]' },
                { name: 'Crypto', icon: Activity, pairs: '100+ Coins', color: 'from-[#F59E0B] to-[#D97706]' },
                { name: 'Stocks', icon: TrendingUp, pairs: 'Top 500', color: 'from-[#3B82F6] to-[#2563EB]' },
                { name: 'Commodities', icon: Globe, pairs: 'Gold, Oil, Silver', color: 'from-[#EF4444] to-[#DC2626]' },
                { name: 'Indices', icon: BarChart3, pairs: '20+ Indices', color: 'from-[#8B5CF6] to-[#7C3AED]' }
              ].map((market, idx) => (
                <div key={idx} className="group relative bg-gradient-to-br from-[#1E293B]/60 to-[#0F172A]/40 backdrop-blur-xl rounded-2xl p-8 border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition-all duration-500 hover:scale-110 hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${market.color} p-0.5 group-hover:scale-110 transition-transform`}>
                    <div className="w-full h-full bg-[#0F172A] rounded-xl flex items-center justify-center">
                      <market.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{market.name}</h3>
                  <p className="text-sm text-gray-400">{market.pairs}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">
                  Why Elite Traders Choose Us
                </span>
              </h2>
              <div className="flex items-center justify-center">
                <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Target,
                  title: 'Precision Accuracy',
                  description: 'Multi-layer validation with 10+ indicators ensures 85%+ confidence on every signal.',
                  gradient: 'from-[#10B981] to-[#059669]',
                  iconBg: 'bg-[#10B981]/10',
                  iconColor: 'text-[#10B981]'
                },
                {
                  icon: Zap,
                  title: 'Lightning Fast',
                  description: 'Real-time notifications delivered instantly. Never miss a market opportunity again.',
                  gradient: 'from-[#F59E0B] to-[#D97706]',
                  iconBg: 'bg-[#F59E0B]/10',
                  iconColor: 'text-[#F59E0B]'
                },
                {
                  icon: Shield,
                  title: 'Risk Management',
                  description: 'Smart stop-loss and take-profit levels with automatic break-even protection.',
                  gradient: 'from-[#3B82F6] to-[#2563EB]',
                  iconBg: 'bg-[#3B82F6]/10',
                  iconColor: 'text-[#3B82F6]'
                },
                {
                  icon: BarChart3,
                  title: 'Deep Analytics',
                  description: 'ICT, SMC, Elliott Wave combined with market sentiment and news analysis.',
                  gradient: 'from-[#8B5CF6] to-[#7C3AED]',
                  iconBg: 'bg-[#8B5CF6]/10',
                  iconColor: 'text-[#8B5CF6]'
                }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative bg-gradient-to-br from-[#1E293B]/60 to-[#0F172A]/40 backdrop-blur-xl rounded-3xl p-8 border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition-all duration-700 hover:scale-105 hover:shadow-[0_0_60px_rgba(212,175,55,0.4)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 via-[#D4AF37]/5 to-[#D4AF37]/0 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-700"></div>

                  <div className="relative">
                    <div className={`w-20 h-20 rounded-2xl ${feature.iconBg} backdrop-blur-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                      <feature.icon className={`w-10 h-10 ${feature.iconColor}`} />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#D4AF37] transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-gray-400 leading-relaxed text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing-section" className="py-12 px-4 sm:px-6 lg:px-8 relative scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">
                  Choose Your Plan
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-6">
                Professional trading signals for serious traders
              </p>
              <div className="flex items-center justify-center">
                <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
              <div className="relative rounded-2xl p-6 bg-[#1E293B] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">DEMO</h3>
                  <p className="text-[#D4AF37] text-sm font-semibold">Try Free</p>
                </div>

                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">$0</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">No payment required</p>
                </div>

                <ul className="space-y-2 mb-6 min-h-[240px]">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Generate up to 3 signals total</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Access to any market (Forex, Crypto, Indices, Commodities)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Use any timeframe</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Confidence range: 0-60% (limited)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Basic signal generation engine</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">No credit card required</span>
                  </li>
                </ul>

                <p className="text-gray-400 text-xs italic mb-4 text-center border-t border-[#D4AF37]/20 pt-4">
                  Best for beginners who want to test signal accuracy first.
                </p>

                <button
                  onClick={() => onNavigate('auth')}
                  className="w-full py-3 rounded-lg font-semibold transition-all bg-[#1E293B] text-white border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#0F172A]"
                >
                  Start Free
                </button>
              </div>

              <div className="relative rounded-2xl p-6 bg-[#1E293B] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">1 MONTH</h3>
                  <p className="text-[#D4AF37] text-sm font-semibold">Starter</p>
                </div>

                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">$25</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">billing every 30 days</p>
                  <p className="text-[#10B981] text-xs mt-1">Cost per day: ~$0.83</p>
                </div>

                <ul className="space-y-2 mb-6 min-h-[240px]">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Generate 5 signals per day</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Access to ICT Method</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Timeframes: M1, M5, M15</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Multi-market access</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Confidence range: 0-100% (full control)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Standard signal dashboard</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Email support</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Risk/Reward Ratio display</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">TP / SL Auto Calculation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Signal Confidence % indicator</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Trade history tracking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Win rate statistics</span>
                  </li>
                </ul>

                <p className="text-gray-400 text-xs italic mb-4 text-center border-t border-[#D4AF37]/20 pt-4">
                  Good for scalpers and short-term traders.
                </p>

                <button
                  onClick={() => onNavigate('auth')}
                  className="w-full py-3 rounded-lg font-semibold transition-all bg-[#0F172A] text-white border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#1E293B]"
                >
                  Get Started
                </button>
              </div>

              <div className="relative rounded-2xl p-6 bg-gradient-to-br from-[#D4AF37]/10 to-[#B8941F]/5 border-2 border-[#D4AF37]/60 shadow-xl shadow-[#D4AF37]/20 transition-all">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-xs font-bold flex items-center space-x-1 bg-gradient-to-r from-[#10B981] to-[#059669] text-white">
                    <Zap className="w-3 h-3" />
                    <span>POPULAR</span>
                  </span>
                </div>

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">3 MONTHS</h3>
                  <p className="text-[#D4AF37] text-sm font-semibold">Popular</p>
                </div>

                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">$69</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">billing every 90 days</p>
                  <p className="text-[#10B981] text-xs mt-1">Cost per month: $23</p>
                  <p className="text-[#10B981] text-xs font-semibold mt-1">Save $6 compared to monthly</p>
                </div>

                <ul className="space-y-2 mb-6 min-h-[240px]">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Generate 12 signals per day</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Access to ICT + SMC Methods</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Timeframes: M1, M5, M30, H1</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Confidence range: 0-100% (full control)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Multi-market access</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Advanced signal dashboard</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Priority email support</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Risk/Reward Ratio display</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">TP / SL Auto Calculation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Signal Confidence % indicator</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Trade history tracking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Win rate statistics</span>
                  </li>
                </ul>

                <p className="text-gray-400 text-xs italic mb-4 text-center border-t border-[#D4AF37]/20 pt-4">
                  Best for consistent traders who want multi-strategy confirmations.
                </p>

                <button
                  onClick={() => onNavigate('auth')}
                  className="w-full py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:shadow-lg hover:shadow-[#10B981]/50"
                >
                  Get Started
                </button>
              </div>

              <div className="relative rounded-2xl p-6 bg-[#1E293B] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">6 MONTHS</h3>
                  <p className="text-[#D4AF37] text-sm font-semibold">Pro Traders</p>
                </div>

                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">$139</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">billing every 180 days</p>
                  <p className="text-[#10B981] text-xs mt-1">Cost per month: ~$23.16</p>
                </div>

                <ul className="space-y-2 mb-6 min-h-[240px]">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Generate 25 signals per day</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Access to: ICT, SMC, Elliott Wave</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Timeframes: M1, M5, M15, M30, H1, D1</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Confidence range: 0-100% (full control)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">View signals directly on chart</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Advanced analytics view</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Priority support</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Risk/Reward Ratio display</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">TP / SL Auto Calculation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Signal Confidence % indicator</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Trade history tracking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Win rate statistics</span>
                  </li>
                </ul>

                <p className="text-gray-400 text-xs italic mb-4 text-center border-t border-[#D4AF37]/20 pt-4">
                  Ideal for traders running multiple pairs daily.
                </p>

                <button
                  onClick={() => onNavigate('auth')}
                  className="w-full py-3 rounded-lg font-semibold transition-all bg-[#0F172A] text-white border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#1E293B]"
                >
                  Get Started
                </button>
              </div>

              <div className="relative rounded-2xl p-6 bg-gradient-to-br from-[#D4AF37]/20 to-[#B8941F]/10 border-2 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/30 scale-105 transition-all">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-xs font-bold flex items-center space-x-1 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A1628]">
                    <Crown className="w-3 h-3" />
                    <span>BEST VALUE</span>
                  </span>
                </div>

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">12 MONTHS</h3>
                  <p className="text-[#D4AF37] text-sm font-semibold">Best Value</p>
                </div>

                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">$279</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">billing every 365 days</p>
                  <p className="text-[#10B981] text-xs mt-1">Cost per month: ~$23.25</p>
                  <p className="text-[#10B981] text-xs font-semibold mt-1">Save $21 compared to 1-month renewals</p>
                </div>

                <ul className="space-y-2 mb-6 min-h-[240px]">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Unlimited daily signal generation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Access to: ICT, SMC, Elliott Wave</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">ALL timeframes: M1, M5, M15, M30, H1, H4, D1, W1</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Confidence range: 0-100% (full control)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">View signals directly inside chart</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Full Market Intelligence Section</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Market Sentiment</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Breaking News</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Economic Calendar</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Premium support</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Early access to new features</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Risk/Reward Ratio display</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">TP / SL Auto Calculation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Signal Confidence % indicator</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Trade history tracking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs leading-tight">Win rate statistics</span>
                  </li>
                </ul>

                <p className="text-gray-400 text-xs italic mb-4 text-center border-t border-[#D4AF37]/20 pt-4">
                  Best Value Plan – Made for serious traders & investors
                </p>

                <button
                  onClick={() => onNavigate('auth')}
                  className="w-full py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A1628] hover:shadow-xl hover:shadow-[#D4AF37]/60 transform hover:scale-105"
                >
                  Get Started
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/60 backdrop-blur-xl rounded-3xl p-10 border border-[#D4AF37]/30">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-xl bg-[#F7931A]/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-[#F7931A]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3">Payment Information</h3>
                  <p className="text-gray-400 mb-4 leading-relaxed">
                    We accept payments exclusively through <span className="text-[#F7931A] font-bold">Binance Pay</span>. Fast, secure, and global cryptocurrency payments for your trading subscription.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 bg-[#0F172A]/60 rounded-xl px-4 py-3">
                      <Shield className="w-5 h-5 text-[#10B981]" />
                      <span className="text-gray-300 font-medium">Secure Payments</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-[#0F172A]/60 rounded-xl px-4 py-3">
                      <Zap className="w-5 h-5 text-[#F59E0B]" />
                      <span className="text-gray-300 font-medium">Instant Activation</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-[#0F172A]/60 rounded-xl px-4 py-3">
                      <Globe className="w-5 h-5 text-[#3B82F6]" />
                      <span className="text-gray-300 font-medium">Global Access</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about-section" className="py-20 px-4 sm:px-6 lg:px-8 relative scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">
                  About Unity Traders
                </span>
              </h2>
              <div className="flex items-center justify-center mb-8">
                <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/60 backdrop-blur-xl rounded-3xl p-8 border border-[#D4AF37]/30 shadow-xl">
                  <h3 className="text-3xl font-bold text-white mb-6 flex items-center space-x-3">
                    <Rocket className="w-8 h-8 text-[#D4AF37]" />
                    <span>Our Mission</span>
                  </h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-4">
                    Unity Traders was born from a vision to democratize institutional-grade trading analysis. We believe every trader deserves access to the same powerful tools and insights that hedge funds and professional traders use to dominate the markets.
                  </p>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Our cutting-edge platform combines <span className="text-[#D4AF37] font-bold">ICT (Inner Circle Trader)</span>, <span className="text-[#D4AF37] font-bold">Smart Money Concepts</span>, and <span className="text-[#D4AF37] font-bold">Elliott Wave Theory</span> to deliver precision signals across Forex, Crypto, Stocks, Commodities, and Indices.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/60 backdrop-blur-xl rounded-3xl p-8 border border-[#10B981]/30 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#10B981]/20 flex items-center justify-center">
                      <Award className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Powered by ProfitHub Academy Analytics</h3>
                  </div>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Our signal generation engine is powered by <span className="text-[#10B981] font-bold">ProfitHub Academy Analytics</span>, a proprietary multi-theory quantitative system that analyzes thousands of data points in real-time. This ensures every signal you receive has been validated through multiple layers of technical and fundamental analysis.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/60 backdrop-blur-xl rounded-3xl p-8 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all hover:shadow-xl hover:shadow-[#D4AF37]/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981]/20 to-[#059669]/20 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-8 h-8 text-[#10B981]" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-2">Multi-Theory Analysis</h4>
                        <p className="text-gray-400 leading-relaxed">
                          We don't rely on a single methodology. Our system cross-validates signals using ICT, SMC, and Elliott Wave to maximize accuracy and minimize false signals.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/60 backdrop-blur-xl rounded-3xl p-8 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all hover:shadow-xl hover:shadow-[#D4AF37]/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/20 flex items-center justify-center flex-shrink-0">
                        <Target className="w-8 h-8 text-[#3B82F6]" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-2">Precision Engineering</h4>
                        <p className="text-gray-400 leading-relaxed">
                          Every signal includes precise entry points, take-profit levels, stop-loss placement, and risk-reward ratios calculated using institutional-grade algorithms.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/60 backdrop-blur-xl rounded-3xl p-8 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all hover:shadow-xl hover:shadow-[#D4AF37]/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#B8941F]/20 flex items-center justify-center flex-shrink-0">
                        <Users className="w-8 h-8 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-2">Trader-First Approach</h4>
                        <p className="text-gray-400 leading-relaxed">
                          Built by traders, for traders. We understand the challenges you face and have designed Unity Traders to give you the edge you need to succeed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#D4AF37]/5 via-[#D4AF37]/10 to-[#D4AF37]/5 rounded-3xl p-8 border border-[#D4AF37]/30 text-center">
              <p className="text-xl text-gray-300 leading-relaxed">
                Whether you're a scalper, day trader, or swing trader, Unity Traders provides the professional-grade signals and analytics you need to make informed trading decisions with confidence.
              </p>
            </div>
          </div>
        </section>

        <section id="faq-section" className="py-20 px-4 sm:px-6 lg:px-8 relative scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
              </h2>
              <div className="flex items-center justify-center mb-8">
                <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
              </div>
              <p className="text-xl text-gray-400">Everything you need to know about Unity Traders</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "What markets does Unity Traders support?",
                  answer: "Unity Traders provides signals for Forex (50+ pairs), Cryptocurrencies (100+ coins), Stocks (Top 500), Commodities (Gold, Oil, Silver), and Indices (20+ major indices). All signals are generated using the same institutional-grade analysis regardless of market."
                },
                {
                  question: "How are the signals generated?",
                  answer: "Our signals are generated using ProfitHub Academy Analytics, which combines ICT (Inner Circle Trader), Smart Money Concepts, and Elliott Wave Theory. The system analyzes price action, order flow, market structure, and institutional behavior across multiple timeframes to identify high-probability trade setups."
                },
                {
                  question: "What does the confidence percentage mean?",
                  answer: "The confidence percentage indicates how many validation criteria a signal has passed. Higher confidence signals have more confluences across different analysis methods. For example, a 90% confidence signal means the setup aligns strongly across ICT concepts, SMC principles, and Elliott Wave patterns."
                },
                {
                  question: "Can I try Unity Traders before subscribing?",
                  answer: "Yes! We offer a Demo plan that gives you 3 free signals to test our system. No credit card required. You can generate signals for any market and timeframe to see the quality of our analysis before committing to a paid plan."
                },
                {
                  question: "What's included in each signal?",
                  answer: "Every signal includes: Market direction (Long/Short), Entry price, Multiple take-profit levels (TP1, TP2, TP3), Stop-loss placement, Risk-reward ratio, Confidence percentage, Trading method used (ICT/SMC/Elliott Wave), Recommended timeframe, and detailed analysis of why the signal was generated."
                },
                {
                  question: "How many signals can I generate per day?",
                  answer: "It depends on your subscription tier: Demo (3 total), 1-Month (5 per day), 3-Month (12 per day), 6-Month (25 per day), and 12-Month (unlimited). Remember, quality over quantity—we focus on high-probability setups rather than flooding you with signals."
                },
                {
                  question: "What timeframes are available?",
                  answer: "Available timeframes vary by plan: Basic plans include M1, M5, M15. Mid-tier plans add M30, H1. Premium plans include all timeframes: M1, M5, M15, M30, H1, H4, D1, and W1. This allows both scalpers and swing traders to find their optimal trading style."
                },
                {
                  question: "Is Unity Traders suitable for beginners?",
                  answer: "Absolutely! While our analysis is institutional-grade, signals are presented in an easy-to-understand format. Each signal includes clear entry/exit points and risk management levels. You don't need to understand ICT or Elliott Wave theory—we've done the analysis for you."
                },
                {
                  question: "How do I receive signals?",
                  answer: "Signals are generated on-demand through our web platform. Simply select your market, timeframe, and desired confidence level, then click generate. The signal appears instantly with all relevant information. Premium users also get access to Market Intelligence with real-time news and economic calendar."
                },
                {
                  question: "What payment methods do you accept?",
                  answer: "We exclusively accept cryptocurrency payments through Binance Pay. This ensures fast, secure, and global payments. Your subscription is activated instantly upon payment confirmation."
                },
                {
                  question: "Can I cancel my subscription anytime?",
                  answer: "Yes, you can cancel anytime. Your subscription remains active until the end of your current billing period. No refunds for partial periods, but you keep full access until expiration."
                },
                {
                  question: "What's the difference between ICT, SMC, and Elliott Wave?",
                  answer: "ICT focuses on institutional order flow and market maker behavior. SMC identifies where smart money (banks, institutions) is positioned. Elliott Wave predicts market cycles using wave patterns. We combine all three for maximum accuracy, but you don't need to understand them—our system does the analysis automatically."
                }
              ].map((faq, idx) => (
                <FAQItem key={idx} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-6xl mx-auto">
            <div className="relative bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-[3rem] p-16 border-2 border-[#D4AF37]/40 overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-[#D4AF37]/10 animate-shimmer-slow"></div>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37] rounded-full blur-[150px] animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#10B981] rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
              </div>

              <div className="relative z-10 text-center">
                <div className="inline-flex items-center space-x-2 bg-[#D4AF37]/10 backdrop-blur-xl px-6 py-3 rounded-full border border-[#D4AF37]/30 mb-8">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-[#D4AF37] font-bold">Limited Time Offer</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                  Ready to Trade Like a Pro?
                </h2>

                <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                  Join 15,000+ successful traders. Start with <span className="text-[#D4AF37] font-bold">3 free premium signals</span> and experience institutional-grade trading analysis.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                  <button
                    onClick={() => onNavigate('auth')}
                    className="group relative px-14 py-6 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] font-black rounded-2xl text-xl overflow-hidden transition-all duration-500 hover:scale-110 hover:shadow-[0_0_60px_rgba(212,175,55,0.7)] shadow-2xl shadow-[#D4AF37]/40"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    <span className="relative flex items-center space-x-3">
                      <span>Get Started Free</span>
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    <span>No Credit Card Required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    <span>Cancel Anytime</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    <span>Instant Access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes glow-intense {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes fade-in-up {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @keyframes shimmer-slow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes expand {
          0% { width: 0; opacity: 0; }
          100% { width: 6rem; opacity: 1; }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-glow-intense {
          animation: glow-intense 3s ease-in-out infinite;
        }

        .animate-gradient-flow {
          background-size: 300% 300%;
          animation: gradient-flow 4s ease infinite;
        }

        .animate-gradient-flow-enhanced {
          background-size: 500% 500%;
          animation: gradient-flow 4s ease-in-out infinite;
        }

        .animate-gradient-shimmer {
          background-size: 600% 600%;
          animation: gradient-flow 2.5s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }

        .animate-shimmer-slow {
          animation: shimmer-slow 10s infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-expand {
          animation: expand 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
