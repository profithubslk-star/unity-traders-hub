import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Loader2, Mail, Lock, Sparkles, CheckCircle } from 'lucide-react';

interface RegisterFormProps {
  onToggleForm: () => void;
  onSuccess?: () => void;
}

export function RegisterForm({ onToggleForm, onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        console.error('Signup error:', error);
        setError(error.message || 'Failed to create account. Please try again.');
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="relative bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/60 backdrop-blur-2xl rounded-3xl p-12 shadow-[0_0_100px_rgba(16,185,129,0.3)] border-2 border-[#10B981]/50 overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/10 via-transparent to-[#10B981]/10"></div>

          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#10B981] via-[#34D399] to-[#10B981] rounded-full mb-6 shadow-xl shadow-[#10B981]/50 animate-scale-in">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Welcome Aboard!</h2>
            <p className="text-gray-300 text-lg mb-6">Your account has been created successfully</p>

            <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#10B981]" />
                <span className="text-[#10B981] font-bold text-lg">Demo Account Active</span>
                <Sparkles className="w-5 h-5 text-[#10B981]" />
              </div>
              <p className="text-gray-400">You now have access to 3 premium demo signals</p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
              <span>Redirecting to dashboard...</span>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }

          @keyframes scale-in {
            0% { transform: scale(0); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }

          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }

          .animate-scale-in {
            animation: scale-in 0.6s ease-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/60 backdrop-blur-2xl rounded-3xl p-10 shadow-[0_0_100px_rgba(212,175,55,0.2)] border-2 border-[#D4AF37]/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 via-transparent to-[#D4AF37]/5 animate-shimmer-slow"></div>

        <div className="relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#D4AF37] rounded-2xl mb-6 shadow-lg shadow-[#D4AF37]/50 animate-gradient-flow">
              <UserPlus className="w-10 h-10 text-[#0A1628]" />
            </div>
            <h2 className="text-4xl font-black text-white mb-3">
              Join Elite Traders
            </h2>
            <p className="text-gray-400 text-lg">Start with 3 free premium signals</p>

            <div className="flex items-center justify-center space-x-2 mt-4">
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              <span className="text-sm text-[#10B981] font-semibold">No Credit Card Required</span>
              <Sparkles className="w-4 h-4 text-[#10B981]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <p className="text-xs text-gray-500 mt-2">Minimum 6 characters</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-300 mb-3">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              className="group relative w-full bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] font-black py-4 px-6 rounded-xl hover:shadow-2xl hover:shadow-[#D4AF37]/60 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center overflow-hidden hover:scale-105 text-lg mt-6"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin relative" />
                  <span className="relative">Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-6 h-6 mr-3 relative group-hover:scale-110 transition-transform" />
                  <span className="relative">Create Free Account</span>
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
                <span className="px-4 bg-[#1E293B]/80 text-gray-400">Already a member?</span>
              </div>
            </div>

            <button
              onClick={onToggleForm}
              className="mt-6 text-[#D4AF37] hover:text-[#FFD700] font-bold transition-colors text-lg group"
            >
              Sign In to Your Account
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
