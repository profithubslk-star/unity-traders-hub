import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { BarChart3, Target, Activity, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

export function AuthPage({ onNavigate }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);

  const handleSuccess = () => {
    setTimeout(() => {
      onNavigate('dashboard');
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#10B981]/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      <button
        onClick={() => onNavigate('home')}
        className="absolute top-6 left-6 z-50 flex items-center space-x-2 text-gray-400 hover:text-[#D4AF37] transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </button>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="hidden lg:block">
            <div className="text-white space-y-8">
              <div className="mb-12">
                <div className="text-6xl mb-6 neon-lightning">⚡</div>
                <h1 className="text-5xl font-black mb-4">
                  <span className="relative">
                    <span className="absolute inset-0 bg-gradient-to-r from-pink-400 via-rose-400 via-orange-400 via-amber-400 via-yellow-400 via-lime-400 via-green-400 via-emerald-400 via-teal-400 via-cyan-400 via-sky-400 via-blue-400 via-indigo-400 via-violet-400 via-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent animate-gradient-shimmer blur-sm"></span>
                    <span className="relative bg-gradient-to-r from-pink-500 via-rose-500 via-orange-500 via-amber-400 via-yellow-400 via-lime-400 via-green-500 via-emerald-500 via-teal-500 via-cyan-500 via-sky-500 via-blue-500 via-indigo-500 via-violet-500 via-purple-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent animate-gradient-flow-enhanced">
                      UNITY TRADERS
                    </span>
                  </span>
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Join elite traders using institutional-grade signals powered by advanced ICT, Smart Money Concepts, and Elliott Wave analysis.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#7C3AED]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Multi-Theory Analysis</h3>
                    <p className="text-gray-400">ICT, SMC, and Elliott Wave combined for maximum accuracy</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#059669]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">TP/SL Auto Calculation</h3>
                    <p className="text-gray-400">Precise take-profit and stop-loss levels on every signal</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#B8941F]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Signal Confidence Indicator</h3>
                    <p className="text-gray-400">Know exactly how strong each trade setup is before entering</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-700/50">
                <div className="flex items-center space-x-8">
                  <div>
                    <div className="text-3xl font-black text-[#D4AF37] mb-1">5+</div>
                    <div className="text-sm text-gray-400">Markets</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-[#10B981] mb-1">3</div>
                    <div className="text-sm text-gray-400">Analysis Methods</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-[#8B5CF6] mb-1">8+</div>
                    <div className="text-sm text-gray-400">Timeframes</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-[#3B82F6] mb-1">24/7</div>
                    <div className="text-sm text-gray-400">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            {isLogin ? (
              <LoginForm onToggleForm={() => setIsLogin(false)} onSuccess={handleSuccess} />
            ) : (
              <RegisterForm onToggleForm={() => setIsLogin(true)} onSuccess={handleSuccess} />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes gradient-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        .animate-gradient-flow-enhanced {
          background-size: 500% 500%;
          animation: gradient-flow 4s ease-in-out infinite;
        }

        .animate-gradient-shimmer {
          background-size: 600% 600%;
          animation: gradient-shimmer 2.5s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .neon-lightning {
          filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.8));
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
