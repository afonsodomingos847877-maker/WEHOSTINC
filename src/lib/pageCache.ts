/**
 * useCachedFetch - hook que evita mostrar o loader de ecrã completo
 * ao navegar entre abas do dashboard.
 *
 * Comportamento:
 * - 1.º acesso à página na sessão  → fetcha os dados, mostra loader, guarda em cache
 * - Navegações seguintes na sessão → devolve cache imediatamente (sem loader),
 *   re-fetcha silenciosamente em background para manter os dados actualizados
 * - Refresh da página               → cache em memória perde-se, loader aparece normalmente
 */

// Cache em memória (vive enquanto a aba do browser não for fechada/refrescada)
const memoryCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos antes de refrescar silenciosamente

export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  return entry.data as T;
}

export function setCached<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function isCacheStale(key: string): boolean {
  const entry = memoryCache.get(key);
  if (!entry) return true;
  return Date.now() - entry.timestamp > CACHE_TTL_MS;
}

export function clearCached(key: string): void {
  memoryCache.delete(key);
}

export function clearAllCache(): void {
  memoryCache.clear();
}
