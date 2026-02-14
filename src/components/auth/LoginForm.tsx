import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Loader2, Mail, Lock, Sparkles } from 'lucide-react';

interface LoginFormProps {
  onToggleForm: () => void;
  onSuccess?: () => void;
}

export function LoginForm({ onToggleForm, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onSuccess?.();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/60 backdrop-blur-2xl rounded-3xl p-10 shadow-[0_0_100px_rgba(212,175,55,0.2)] border-2 border-[#D4AF37]/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 via-transparent to-[#D4AF37]/5 animate-shimmer-slow"></div>

        <div className="relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#D4AF37] rounded-2xl mb-6 shadow-lg shadow-[#D4AF37]/50 animate-gradient-flow">
              <LogIn className="w-10 h-10 text-[#0A1628]" />
            </div>
            <h2 className="text-4xl font-black text-white mb-3">
              Welcome Back
            </h2>
            <p className="text-gray-400 text-lg">Access your elite trading signals</p>

            <div className="flex items-center justify-center space-x-2 mt-4">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm text-[#D4AF37] font-semibold">Premium Member Portal</span>
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-gray-300 mb-3">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-[#0A1628]/60 border-2 border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all duration-300 hover:border-gray-600"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-gray-300 mb-3">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-[#0A1628]/60 border-2 border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all duration-300 hover:border-gray-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border-2 border-red-500/50 rounded-xl backdrop-blur-xl animate-shake">
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] font-black py-4 px-6 rounded-xl hover:shadow-2xl hover:shadow-[#D4AF37]/60 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center overflow-hidden hover:scale-105 text-lg"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin relative" />
                  <span className="relative">Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-6 h-6 mr-3 relative group-hover:translate-x-1 transition-transform" />
                  <span className="relative">Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1E293B]/80 text-gray-400">New to Unity Traders?</span>
              </div>
            </div>

            <button
              onClick={onToggleForm}
              className="mt-6 text-[#D4AF37] hover:text-[#FFD700] font-bold transition-colors text-lg group"
            >
              Create Free Account
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer-slow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .animate-shimmer-slow {
          animation: shimmer-slow 10s infinite;
        }

        .animate-gradient-flow {
          background-size: 300% 300%;
          animation: gradient-flow 4s ease infinite;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
