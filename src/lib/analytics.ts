// Sistema de Analytics e Monitoramento para o Checkout
export interface AnalyticsEvent {
  eventName: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class AnalyticsManager {
  private sessionId: string;
  private userId: string | null = null;
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('analytics_session');
      if (savedSession) {
        try {
          const data = JSON.parse(savedSession);
          this.sessionId = data.sessionId || this.sessionId;
          this.userId = data.userId || null;
        } catch (e) {
          console.error('[Analytics] Error loading session:', e);
        }
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_session', JSON.stringify({
        sessionId: this.sessionId,
        userId: this.userId
      }));
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
    this.saveToStorage();
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  // Eventos específicos do checkout
  trackCheckoutView(serviceType: string, amount?: number): void {
    this.trackEvent('checkout_view', 'checkout', 'view', serviceType, amount);
  }

  trackPaymentMethodSelected(method: string): void {
    this.trackEvent('payment_method_selected', 'checkout', 'select', method);
  }

  trackPaymentInitiated(method: string, amount: number): void {
    this.trackEvent('payment_initiated', 'checkout', 'initiate', method, amount);
  }

  trackPaymentCompleted(method: string, amount: number, reference: string): void {
    this.trackEvent('payment_completed', 'checkout', 'complete', method, amount, {
      reference,
      success: true
    });
  }

  trackPaymentFailed(method: string, amount: number, reason: string): void {
    this.trackEvent('payment_failed', 'checkout', 'fail', method, amount, {
      reason,
      success: false
    });
  }

  trackPaymentRetry(attemptNumber: number, method: string): void {
    this.trackEvent('payment_retry', 'checkout', 'retry', method, attemptNumber, {
      attemptNumber
    });
  }

  trackFormError(field: string, error: string): void {
    this.trackEvent('form_error', 'checkout', 'error', field, undefined, {
      error
    });
  }

  trackUserInteraction(action: string, element: string): void {
    this.trackEvent('user_interaction', 'ui', action, element);
  }

  trackPageView(page: string): void {
    this.trackEvent('page_view', 'navigation', 'view', page);
  }

  trackConversion(serviceType: string, amount: number): void {
    this.trackEvent('conversion', 'revenue', 'purchase', serviceType, amount, {
      currency: 'MZN'
    });
  }

  // Método genérico de tracking
  private trackEvent(
    eventName: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      eventName,
      category,
      action,
      label,
      value,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metadata
    };

    this.events.push(event);
    console.log('[ANALYTICS]', event);

    // Enviar para backend ou serviço de analytics
    this.sendToBackend(event);

    // Integração com Google Analytics se disponível
    this.sendToGoogleAnalytics(event);
  }

  private async sendToBackend(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (e) {
      console.error('[Analytics] Error sending to backend:', e);
    }
  }

  private sendToGoogleAnalytics(event: AnalyticsEvent): void {
    if (typeof window === 'undefined') return;
    const w = window as any;

    // Push para dataLayer (GTM)
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({
        event: event.eventName,
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        session_id: event.sessionId,
        ...event.metadata
      });
    }

    // Enviar também via gtag direto (GA4)
    if (w.gtag) {
      try {
        w.gtag('event', event.eventName, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          custom_map: { ...event.metadata }
        });
      } catch (e) {
        console.error('[Analytics] Error sending to GA:', e);
      }
    }
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// Singleton instance
export const analytics = new AnalyticsManager();

// Referência estável para evitar re-execução infinita de useEffect em componentes React
const stableAnalyticsApi = {
  trackCheckoutView: analytics.trackCheckoutView.bind(analytics),
  trackPaymentMethodSelected: analytics.trackPaymentMethodSelected.bind(analytics),
  trackPaymentInitiated: analytics.trackPaymentInitiated.bind(analytics),
  trackPaymentCompleted: analytics.trackPaymentCompleted.bind(analytics),
  trackPaymentFailed: analytics.trackPaymentFailed.bind(analytics),
  trackPaymentRetry: analytics.trackPaymentRetry.bind(analytics),
  trackFormError: analytics.trackFormError.bind(analytics),
  trackUserInteraction: analytics.trackUserInteraction.bind(analytics),
  trackPageView: analytics.trackPageView.bind(analytics),
  trackConversion: analytics.trackConversion.bind(analytics),
  setUserId: analytics.setUserId.bind(analytics),
  getSessionId: analytics.getSessionId.bind(analytics),
};

// Hook React para usar analytics (referência estável)
export const useAnalytics = () => stableAnalyticsApi;
