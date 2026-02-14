import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { SignalsPage } from './pages/SignalsPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { PaymentPage } from './pages/PaymentPage';
import { MarketIntelligencePage } from './pages/MarketIntelligencePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingScreen } from './components/LoadingScreen';
import { DevPlanSwitcher } from './components/DevPlanSwitcher';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const { user } = useAuth();

  const renderPage = () => {
    if (currentPage === 'home' && user) {
      setCurrentPage('dashboard');
    }

    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'auth':
        return <AuthPage onNavigate={setCurrentPage} />;
      case 'dashboard':
        return (
          <ProtectedRoute>
            <DashboardPage onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );
      case 'signals':
        return (
          <ProtectedRoute>
            <SignalsPage onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );
      case 'subscription':
        return <SubscriptionPage onNavigate={setCurrentPage} onSelectPlan={(plan) => {
          setSelectedPlan(plan);
          setCurrentPage('payment');
        }} />;
      case 'payment':
        return (
          <ProtectedRoute>
            <PaymentPage onNavigate={setCurrentPage} selectedPlan={selectedPlan} />
          </ProtectedRoute>
        );
      case 'market':
        return (
          <ProtectedRoute>
            <MarketIntelligencePage onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <div className="flex flex-col min-h-screen">
        <Header onNavigate={setCurrentPage} currentPage={currentPage} />
        <main className="flex-1">{renderPage()}</main>
        <Footer />
      </div>
      <DevPlanSwitcher />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
