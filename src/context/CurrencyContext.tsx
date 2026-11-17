'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Currency = 'MZN' | 'USD';

export const MZN_PER_USD = 63.9;
const STORAGE_KEY = 'wehosthere_currency';

interface FormatPriceOptions {
  /** Include currency suffix/symbol (default: true). When false, returns just the formatted number. */
  withSymbol?: boolean;
  /** Force specific decimal places for MZN (default: 0 if integer, else 2). USD always uses 2 decimals unless specified. */
  decimals?: number;
  /** Suffix in MZN mode, e.g. 'MT' or 'MZN' (default: 'MT'). */
  mznLabel?: 'MT' | 'MZN';
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
  convertMznToUsd: (amountMzn: number) => number;
  formatPrice: (amountMzn: number, opts?: FormatPriceOptions) => string;
  exchangeRate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('MZN');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'MZN' || saved === 'USD') {
        setCurrencyState(saved);
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrency(currency === 'MZN' ? 'USD' : 'MZN');
  }, [currency, setCurrency]);

  const convertMznToUsd = useCallback((amountMzn: number) => {
    if (!Number.isFinite(amountMzn)) return 0;
    return Number((amountMzn / MZN_PER_USD).toFixed(2));
  }, []);

  const formatPrice = useCallback(
    (amountMzn: number, opts?: FormatPriceOptions): string => {
      const safeAmount = Number.isFinite(amountMzn) ? amountMzn : 0;
      const withSymbol = opts?.withSymbol ?? true;
      const mznLabel = opts?.mznLabel ?? 'MT';

      if (currency === 'USD') {
        const usd = safeAmount / MZN_PER_USD;
        const decimals = opts?.decimals ?? 2;
        const formatted = usd.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        return withSymbol ? `$${formatted}` : formatted;
      }

      const isWhole = Math.abs(safeAmount - Math.round(safeAmount)) < 0.005;
      const decimals = opts?.decimals ?? (isWhole ? 0 : 2);
      const formatted = safeAmount.toLocaleString('pt-PT', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return withSymbol ? `${formatted} ${mznLabel}` : formatted;
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        convertMznToUsd,
        formatPrice,
        exchangeRate: MZN_PER_USD,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
