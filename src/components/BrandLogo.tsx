/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { Server } from 'lucide-react';

interface BrandLogoProps {
  href?: string;
  onClick?: () => void;
  iconBgClass?: string;
  iconColorClass?: string;
  logoHeightClass?: string;
  className?: string;
  dark?: boolean;
}

export default function BrandLogo({
  href = '/',
  onClick,
  iconBgClass = 'bg-primary-50 dark:bg-primary-600/20 border border-primary-100 dark:border-primary-500/30',
  iconColorClass = 'text-primary-600 dark:text-primary-400',
  logoHeightClass = 'h-5 sm:h-6 md:h-7 lg:h-8',
  className = '',
  dark = false
}: BrandLogoProps) {
  try {
    const isDarkStyle = dark;
    const logoContent = (
      <div className={`inline-flex items-center space-x-1 sm:space-x-2 md:space-x-2.5 group cursor-pointer ${className}`}>
        <div
          className={`p-1 sm:p-1.5 md:p-2 rounded-lg sm:rounded-xl transition shrink-0 ${
            isDarkStyle ? 'bg-primary-600/20 border border-primary-500/40' : iconBgClass
          }`}
        >
          <Server
            className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${
              isDarkStyle ? 'text-primary-400' : iconColorClass
            }`}
          />
        </div>
        <img
          src="/logo.png"
          alt="WEHOSTHERE"
          className={`${logoHeightClass} w-auto object-contain shrink-0`}
          onError={(e) => {
            console.error('Erro ao carregar logo:', e);
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );

    if (href) {
      return (
        <Link href={href} onClick={onClick}>
          {logoContent}
        </Link>
      );
    }

    return logoContent;
  } catch (err) {
    console.error('Erro no BrandLogo:', err);
    return null;
  }
}
