interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  return (
    <div
      className="fixed inset-0 bg-[#0A1628] z-[100] flex items-center justify-center animate-fade-out"
      onAnimationEnd={onComplete}
      style={{
        animationDelay: '2.5s',
        animationFillMode: 'forwards'
      }}
    >
      <div className="text-center animate-fade-in">
        <div className="mb-8 relative inline-block">
          <div className="text-9xl neon-lightning-static">⚡</div>
        </div>
        <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent tracking-tight">
          UNITY TRADERS
        </h1>
      </div>
    </div>
  );
}
