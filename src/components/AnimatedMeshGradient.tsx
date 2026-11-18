import React from 'react';

/**
 * Fundo oficial em ondas azuis e branco (WeHosThere) usado na página inicial,
 * afiliados, academia e webmail.
 */
export default function AnimatedMeshGradient() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none bg-white">
      <img
        src="/hero-bg-blue.png"
        alt=""
        className="w-full h-full object-cover object-center select-none"
        draggable={false}
      />
    </div>
  );
}
