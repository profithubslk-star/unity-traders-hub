import { useState } from 'react';
import { X, FileText } from 'lucide-react';

type PolicyType = 'privacy' | 'terms' | 'refund' | null;

export function Footer() {
  const [openPolicy, setOpenPolicy] = useState<PolicyType>(null);

  const getPolicyContent = (type: PolicyType) => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    switch (type) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          content: (
            <>
              <p className="text-sm text-gray-400 mb-6">Last Updated: {today}</p>

              <h3 className="text-xl font-bold text-white mb-3">Information We Collect</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                We collect information you provide directly to us, including your email address, account credentials, and payment information. We also collect information about your usage of our platform, including trading signals generated, subscription preferences, and interaction with our services.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Use of Your Information</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, process your transactions, send you technical notices and support messages, communicate with you about products and services, and monitor and analyze trends and usage patterns.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Disclosure of Your Information</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information with service providers who assist us in operating our platform, conducting our business, or servicing you, as long as those parties agree to keep this information confidential.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Security of Your Information</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Contact Us</h3>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-2">If you have any questions about this Privacy Policy, please contact us:</p>
                <p className="mb-2">WhatsApp: <a href="https://wa.me/94777843270" className="text-[#D4AF37] hover:text-[#FFD700] font-semibold">+94 777 843 270</a></p>
                <p>Email: <a href="mailto:profithubslk@gmail.com" className="text-[#D4AF37] hover:text-[#FFD700] font-semibold">profithubslk@gmail.com</a></p>
              </div>
            </>
          )
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          content: (
            <>
              <p className="text-sm text-gray-400 mb-6">Last Updated: {today}</p>

              <h3 className="text-xl font-bold text-white mb-3">Agreement to Terms</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                By accessing or using Unity Traders, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use our services. We reserve the right to modify these terms at any time, and your continued use of the platform constitutes acceptance of any changes.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Intellectual Property Rights</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                All content, features, and functionality of Unity Traders, including but not limited to trading signals, analysis methods, text, graphics, logos, and software, are the exclusive property of Unity Traders and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">User Representations</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                By using our platform, you represent and warrant that: (1) you have the legal capacity to enter into these Terms; (2) you are not a minor in your jurisdiction; (3) you will not use the platform for any illegal or unauthorized purpose; and (4) your use of the platform will not violate any applicable law or regulation.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Financial Disclaimer</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Trading signals provided by Unity Traders are for informational purposes only and do not constitute financial advice. Trading in financial markets involves substantial risk and may result in the loss of your entire investment. Past performance is not indicative of future results. You should conduct your own research and consult with a licensed financial advisor before making any investment decisions.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Limitation of Liability</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                To the fullest extent permitted by law, Unity Traders shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or trading losses, arising out of or in connection with your use of our platform. Our total liability shall not exceed the amount you paid for your subscription.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Contact Us</h3>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-2">For questions about these Terms of Service, please contact us:</p>
                <p className="mb-2">WhatsApp: <a href="https://wa.me/94777843270" className="text-[#D4AF37] hover:text-[#FFD700] font-semibold">+94 777 843 270</a></p>
                <p>Email: <a href="mailto:profithubslk@gmail.com" className="text-[#D4AF37] hover:text-[#FFD700] font-semibold">profithubslk@gmail.com</a></p>
              </div>
            </>
          )
        };
      case 'refund':
        return {
          title: 'Refund Policy',
          content: (
            <>
              <p className="text-sm text-gray-400 mb-6">Last Updated: {today}</p>

              <h3 className="text-xl font-bold text-white mb-3">Returns (Subscription Cancellations)</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Users can cancel their subscription at any time from their dashboard. However, please note that no refunds will be issued for the remaining period. You will continue to have full access to all features until the end of your current subscription period.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Refunds</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Once a subscription fee has been paid, it is non-refundable. All sales are final. We encourage you to carefully review your subscription choice before completing your purchase. You may start with our Demo plan to test our services before committing to a paid subscription.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Exchanges</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Exchanges are not applicable to our digital subscription services. However, you may upgrade your subscription tier at any time by contacting our support team.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Non-Returnable Items</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Due to the nature of our digital service, all subscriptions are non-returnable and non-refundable once purchased. Upon payment confirmation, you receive immediate access to our platform and trading signals, which cannot be "returned."
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Damaged or Defective Items (Service Failures)</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                If you experience technical issues or service failures that prevent you from accessing our platform, please contact our support team immediately. We will work to resolve any technical problems promptly. In cases of extended service outages caused by our platform, we may consider extending your subscription period at our discretion.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Return Shipping</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Because Unity Traders is a digital service, return shipping is not applicable to our subscriptions.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Processing Time</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                In exceptional circumstances where a refund is approved, it will be processed within 7-14 business days. Refunds will be issued to the original payment method used for the purchase. Please note that approved refunds are rare and handled on a case-by-case basis.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Contact Us</h3>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-2">For questions about our Refund Policy, please contact us:</p>
                <p className="mb-2">WhatsApp: <a href="https://wa.me/94777843270" className="text-[#D4AF37] hover:text-[#FFD700] font-semibold">+94 777 843 270</a></p>
                <p>Email: <a href="mailto:profithubslk@gmail.com" className="text-[#D4AF37] hover:text-[#FFD700] font-semibold">profithubslk@gmail.com</a></p>
              </div>
            </>
          )
        };
      default:
        return { title: '', content: null };
    }
  };

  const policy = getPolicyContent(openPolicy);

  return (
    <>
      <footer className="bg-[#0A1628] border-t border-[#D4AF37]/20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="text-3xl neon-lightning-static">⚡</div>
              <div className="ml-3">
                <span className="text-lg font-bold bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent block">
                  UNITY TRADERS
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Professional VIP Trading Signals Platform
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Powered by Profithub Academy
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-xs text-gray-500">
                &copy; {new Date().getFullYear()} Unity Traders. All rights reserved.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-gray-800 relative z-10">
            <button
              type="button"
              onClick={() => setOpenPolicy('privacy')}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-[#1E293B]/40 cursor-pointer relative z-10 pointer-events-auto"
            >
              <FileText className="w-4 h-4 pointer-events-none" />
              <span className="pointer-events-none">Privacy Policy</span>
            </button>
            <button
              type="button"
              onClick={() => setOpenPolicy('terms')}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-[#1E293B]/40 cursor-pointer relative z-10 pointer-events-auto"
            >
              <FileText className="w-4 h-4 pointer-events-none" />
              <span className="pointer-events-none">Terms of Service</span>
            </button>
            <button
              type="button"
              onClick={() => setOpenPolicy('refund')}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-[#1E293B]/40 cursor-pointer relative z-10 pointer-events-auto"
            >
              <FileText className="w-4 h-4 pointer-events-none" />
              <span className="pointer-events-none">Refund Policy</span>
            </button>
          </div>
        </div>
      </footer>

      {openPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-3xl border-2 border-[#D4AF37]/40 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-[#D4AF37]/20 animate-scale-in">
            <div className="sticky top-0 bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-b border-[#D4AF37]/30 px-8 py-6 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-[#D4AF37]" />
                <h2 className="text-2xl font-bold text-white">{policy.title}</h2>
              </div>
              <button
                onClick={() => setOpenPolicy(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#D4AF37]/20 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-8 py-6">
              {policy.content}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
