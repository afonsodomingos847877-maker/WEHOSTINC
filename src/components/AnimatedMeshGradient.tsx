import React from 'react';

/**
 * Animated CSS mesh gradient background inspired by the bannergrad palette.
 * Uses GPU-accelerated transforms and opacity without image network overhead.
 */
export default function AnimatedMeshGradient() {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none bg-[#fcfdf9]">
        {/* Camada orbital que muda o ângulo do gradiente suavemente */}
        <div
          className="absolute -inset-[25%] rounded-full blur-[90px] opacity-35 will-change-transform"
          style={{
            background:
              'conic-gradient(from 140deg at 50% 50%, rgba(79, 70, 229, 0.55) 0deg, rgba(45, 212, 191, 0.5) 110deg, rgba(252, 253, 249, 0.2) 200deg, rgba(109, 93, 252, 0.55) 290deg, rgba(79, 70, 229, 0.55) 360deg)',
            animation: 'meshAngleOrbit 20s linear infinite',
          }}
        />
        {/* Onda Violeta / Índigo (inferior esquerda) */}
        <div
          className="absolute -bottom-32 -left-24 w-[80%] sm:w-[64%] h-[80%] rounded-[48%_52%_60%_40%] blur-[65px] sm:blur-[90px] opacity-90 will-change-transform"
          style={{
            background:
              'radial-gradient(ellipse at 38% 58%, #4f46e5 0%, #6d5dfc 42%, #a594ff 72%, transparent 100%)',
            animation: 'meshWaveViolet 9s ease-in-out infinite',
          }}
        />
        {/* Onda Esmeralda / Teal (superior direita) */}
        <div
          className="absolute -top-24 -right-24 w-[84%] sm:w-[70%] h-[84%] rounded-[40%_60%_45%_55%] blur-[65px] sm:blur-[90px] opacity-90 will-change-transform"
          style={{
            background:
              'radial-gradient(ellipse at 58% 44%, #009e7f 0%, #00bfa5 45%, #2dd4bf 74%, transparent 100%)',
            animation: 'meshWaveTeal 10.5s ease-in-out infinite',
          }}
        />
        {/* Pulso luminoso Ciano / Menta */}
        <div
          className="absolute top-[6%] right-[12%] w-[44%] h-[48%] rounded-full blur-[70px] opacity-70 will-change-transform"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(45, 212, 191, 0.75) 0%, rgba(56, 189, 248, 0.35) 55%, transparent 80%)',
            animation: 'meshGlowDrift 8s ease-in-out infinite',
          }}
        />
        {/* Ponte suave central */}
        <div
          className="absolute top-[20%] left-[20%] w-[58%] h-[60%] rounded-full blur-[80px] opacity-65 will-change-transform"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.5) 0%, rgba(129, 140, 248, 0.35) 48%, transparent 78%)',
            animation: 'meshBridge 11s ease-in-out infinite',
          }}
        />
        {/* Curva inferior suave */}
        <div
          className="absolute -bottom-24 left-[24%] w-[54%] h-[54%] rounded-full blur-[75px] opacity-70 will-change-transform"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(109, 93, 252, 0.6) 0%, rgba(45, 212, 191, 0.3) 60%, transparent 82%)',
            animation: 'meshWaveViolet 10s ease-in-out infinite reverse',
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/65 pointer-events-none"
      />
    </>
  );
}
