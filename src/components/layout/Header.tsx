import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const { user, subscription, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = user
    ? [
        { name: 'Dashboard', page: 'dashboard' },
        { name: 'Signals', page: 'signals' },
        { name: 'Market Intelligence', page: 'market' },
        { name: 'Subscription', page: 'subscription' },
      ]
    : [];

  return (
    <header className="bg-[#0A0F1E]/95 border-b border-[#D4AF37]/20 sticky top-0 z-50 backdrop-blur-2xl shadow-lg shadow-[#D4AF37]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('home')}>
            <div className="relative">
              <div className="text-4xl neon-lightning-no-glow">⚡</div>
            </div>
            <div className="ml-3">
              <span className="text-2xl font-black bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent tracking-tight">
                UNITY TRADERS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  if (item.isScroll) {
                    if (currentPage !== 'home') {
                      onNavigate('home');
                      setTimeout(() => {
                        const section = document.getElementById(item.scrollTo || 'pricing-section');
                        if (section) {
                          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      const section = document.getElementById(item.scrollTo || 'pricing-section');
                      if (section) {
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  } else {
                    onNavigate(item.page);
                  }
                }}
                className={`relative px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 group ${
                  currentPage === item.page && !item.isScroll
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] shadow-lg shadow-[#D4AF37]/30'
                    : 'text-gray-300 hover:text-white hover:bg-[#1E293B]/60'
                }`}
              >
                {currentPage === item.page && !item.isScroll && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] opacity-0 group-hover:opacity-100 rounded-xl transition-opacity blur-sm"></div>
                )}
                <span className="relative">{item.name}</span>
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="text-right bg-[#1E293B]/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-[#D4AF37]/20">
                  <div className="text-sm text-gray-400 truncate max-w-[150px]">{user.email}</div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${subscription?.plan_type === 'demo' || !subscription ? 'bg-gray-400' : 'bg-[#D4AF37] animate-pulse'}`}></div>
                    <div className="text-xs font-bold uppercase" style={{
                      color: subscription?.plan_type === 'demo' || !subscription ? '#9CA3AF' : '#D4AF37'
                    }}>
                      {subscription?.plan_type === 'demo' || !subscription ? 'Demo' : 'VIP'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="group flex items-center space-x-2 px-5 py-2.5 bg-[#1E293B]/60 backdrop-blur-xl text-gray-300 rounded-xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 border border-transparent transition-all duration-300"
                >
                  <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span className="font-semibold">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (currentPage !== 'home') {
                      onNavigate('home');
                      setTimeout(() => {
                        const pricingSection = document.getElementById('pricing-section');
                        if (pricingSection) {
                          pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      const pricingSection = document.getElementById('pricing-section');
                      if (pricingSection) {
                        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className="group relative flex items-center space-x-2 px-7 py-3 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] font-bold rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all duration-300 hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <span className="relative">Pricing Plans</span>
                </button>
                <button
                  onClick={() => {
                    if (currentPage !== 'home') {
                      onNavigate('home');
                      setTimeout(() => {
                        const aboutSection = document.getElementById('about-section');
                        if (aboutSection) {
                          aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      const aboutSection = document.getElementById('about-section');
                      if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className="group relative flex items-center space-x-2 px-7 py-3 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] font-bold rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all duration-300 hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <span className="relative">About Us</span>
                </button>
                <button
                  onClick={() => {
                    if (currentPage !== 'home') {
                      onNavigate('home');
                      setTimeout(() => {
                        const faqSection = document.getElementById('faq-section');
                        if (faqSection) {
                          faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      const faqSection = document.getElementById('faq-section');
                      if (faqSection) {
                        faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className="group relative flex items-center space-x-2 px-7 py-3 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] font-bold rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all duration-300 hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <span className="relative">FAQ</span>
                </button>
                <button
                  onClick={() => onNavigate('auth')}
                  className="group relative flex items-center space-x-2 px-7 py-3 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] via-[#FF6B35] to-[#D4AF37] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF6B35]/50 transition-all duration-300 hover:scale-105 overflow-hidden animate-gradient-flow-signin"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <User className="w-5 h-5 relative" />
                  <span className="relative">Sign In</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-[#D4AF37] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D4AF37]/20 bg-[#0A0F1E]/98 backdrop-blur-2xl">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  if (item.isScroll) {
                    if (currentPage !== 'home') {
                      onNavigate('home');
                      setTimeout(() => {
                        const section = document.getElementById(item.scrollTo || 'pricing-section');
                        if (section) {
                          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      const section = document.getElementById(item.scrollTo || 'pricing-section');
                      if (section) {
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  } else {
                    onNavigate(item.page);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-5 py-3 rounded-xl font-semibold transition-all ${
                  currentPage === item.page && !item.isScroll
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628]'
                    : 'text-gray-300 hover:bg-[#1E293B]/60 hover:text-white'
                }`}
              >
                {item.name}
              </button>
            ))}
            {user ? (
              <>
                <div className="px-5 py-3 bg-[#1E293B]/40 backdrop-blur-xl rounded-xl border border-[#D4AF37]/20 mt-4">
                  <div className="text-sm text-gray-400">{user.email}</div>
                  <div className="text-xs text-[#D4AF37] font-bold mt-1 uppercase">
                    {subscription?.plan_type === 'demo' || !subscription ? 'Demo Account' : 'VIP Member'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-5 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition font-semibold"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (currentPage !== 'home') {
                      onNavigate('home');
                      setTimeout(() => {
                        const pricingSection = document.getElementById('pricing-section');
                        if (pricingSection) {
                          pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      const pricingSection = document.getElementById('pricing-section');
                      if (pricingSection) {
                        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className="w-full px-5 py-3 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] font-bold rounded-xl"
                >
                  Pricing Plans
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (currentPage !== 'home') {
                      onNavigate('home');
                      setTimeout(() => {
                        const aboutSection = document.getElementById('about-section');
                        if (aboutSection) {
                          aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      const aboutSection = document.getElementById('about-section');
                      if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className="w-full px-5 py-3 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] font-bold rounded-xl"
                >
                  About Us
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (currentPage !== 'home') {
                      onNavigate('home');
                      setTimeout(() => {
                        const faqSection = document.getElementById('faq-section');
                        if (faqSection) {
                          faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      const faqSection = document.getElementById('faq-section');
                      if (faqSection) {
                        faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className="w-full px-5 py-3 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-[#0A1628] font-bold rounded-xl"
                >
                  FAQ
                </button>
                <button
                  onClick={() => {
                    onNavigate('auth');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-5 py-3 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] via-[#FF6B35] to-[#D4AF37] text-white font-bold rounded-xl animate-gradient-flow-signin"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes float-subtle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
        }

        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes gradient-flow-signin {
          0% { background-position: 0% 50%; }
          25% { background-position: 50% 75%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 25%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        .animate-float-subtle {
          animation: float-subtle 3s ease-in-out infinite;
        }

        .animate-gradient-flow {
          background-size: 300% 300%;
          animation: gradient-flow 4s ease infinite;
        }

        .animate-gradient-flow-signin {
          background-size: 400% 400%;
          animation: gradient-flow-signin 3s ease infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </header>
  );
}
