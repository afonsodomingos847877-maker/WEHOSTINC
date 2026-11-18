import React from 'react';

/**
 * Animated CSS mesh gradient background inspired by the WeHosThere cloud blue & pure white palette.
 * Uses GPU-accelerated transforms and opacity without image network overhead.
 */
export default function AnimatedMeshGradient() {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none bg-white">
        {/* Camada orbital que muda o ângulo do gradiente suavemente */}
        <div
          className="absolute -inset-[25%] rounded-full blur-[95px] opacity-35 will-change-transform"
          style={{
            background:
              'conic-gradient(from 135deg at 55% 45%, rgba(0, 102, 255, 0.55) 0deg, rgba(56, 189, 248, 0.45) 105deg, rgba(255, 255, 255, 0.25) 205deg, rgba(37, 99, 235, 0.5) 300deg, rgba(0, 102, 255, 0.55) 360deg)',
            animation: 'meshAngleOrbit 20s linear infinite',
          }}
        />
        {/* Onda Azul Royal Elétrico (superior direita — foco principal) */}
        <div
          className="absolute -top-28 -right-24 w-[86%] sm:w-[72%] h-[88%] rounded-[42%_58%_46%_54%] blur-[65px] sm:blur-[90px] opacity-90 will-change-transform"
          style={{
            background:
              'radial-gradient(ellipse at 65% 32%, #0066ff 0%, #2563eb 38%, #60a5fa 68%, transparent 100%)',
            animation: 'meshWaveTeal 10.5s ease-in-out infinite',
          }}
        />
        {/* Onda Azul Celeste Luminoso (inferior esquerda) */}
        <div
          className="absolute -bottom-36 -left-24 w-[80%] sm:w-[64%] h-[82%] rounded-[48%_52%_60%_40%] blur-[65px] sm:blur-[90px] opacity-85 will-change-transform"
          style={{
            background:
              'radial-gradient(ellipse at 36% 64%, #0284c7 0%, #3b82f6 40%, #93c5fd 72%, transparent 100%)',
            animation: 'meshWaveViolet 9s ease-in-out infinite',
          }}
        />
        {/* Pulso luminoso Azul Céu (direita/centro) */}
        <div
          className="absolute top-[10%] right-[14%] w-[46%] h-[50%] rounded-full blur-[72px] opacity-75 will-change-transform"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.72) 0%, rgba(96, 165, 250, 0.35) 55%, transparent 80%)',
            animation: 'meshGlowDrift 8s ease-in-out infinite',
          }}
        />
        {/* Ponte suave central azul gelo */}
        <div
          className="absolute top-[22%] left-[22%] w-[58%] h-[60%] rounded-full blur-[85px] opacity-65 will-change-transform"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(147, 197, 253, 0.55) 0%, rgba(186, 230, 253, 0.38) 52%, transparent 80%)',
            animation: 'meshBridge 11s ease-in-out infinite',
          }}
        />
        {/* Curva inferior direita azul suave */}
        <div
          className="absolute -bottom-24 right-[18%] w-[56%] h-[56%] rounded-full blur-[78px] opacity-70 will-change-transform"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.55) 0%, rgba(147, 197, 253, 0.32) 58%, transparent 82%)',
            animation: 'meshWaveViolet 10s ease-in-out infinite reverse',
          }}
        />
        {/* Halo branco limpo no topo esquerdo para máxima legibilidade do título */}
        <div
          className="absolute -top-20 -left-20 w-[62%] h-[68%] rounded-full blur-[70px] opacity-90"
          style={{
            background:
              'radial-gradient(ellipse at 25% 25%, rgba(255, 255, 255, 0.96) 0%, rgba(240, 249, 255, 0.65) 55%, transparent 85%)',
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/60 pointer-events-none"
      />
    </>
  );
}
