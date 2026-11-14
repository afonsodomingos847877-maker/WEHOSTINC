export type ClientAffiliateEventType =
  | 'link_click'
  | 'page_view'
  | 'product_view'
  | 'signup'
  | 'add_to_cart'
  | 'checkout_start'
  | 'purchase_completed'
  | 'other';

export function hasAffiliateReferralCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('wh_has_ref=1');
}

export function getClientSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('_whsid');
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('_whsid', sid);
  }
  return sid;
}

export function trackAffiliateEvent(
  eventType: ClientAffiliateEventType,
  options?: {
    page?: string;
    productName?: string;
    metadata?: Record<string, string | number | boolean>;
  }
): void {
  if (typeof window === 'undefined') return;
  if (!hasAffiliateReferralCookie()) return;

  const sessionId = getClientSessionId();
  if (!sessionId) return;

  fetch('/api/affiliates/track-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      sessionId,
      eventType,
      page: options?.page || window.location.pathname,
      productName: options?.productName || '',
      metadata: options?.metadata || {},
    }),
  }).catch(() => {});
}
