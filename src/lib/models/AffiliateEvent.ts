import mongoose, { Schema, Document, Model } from 'mongoose';

export type AffiliateEventType =
  | 'link_click'
  | 'page_view'
  | 'product_view'
  | 'signup'
  | 'add_to_cart'
  | 'checkout_start'
  | 'purchase_completed'
  | 'other';

export interface IAffiliateEvent extends Document {
  affiliateId: string;
  affiliateCode: string;
  sessionId: string;
  visitorLabel: string; // Ex: "Visitante #A4F2" (anonimizado)
  eventType: AffiliateEventType;
  page: string;
  productName?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const AffiliateEventSchema = new Schema<IAffiliateEvent>(
  {
    affiliateId: { type: String, required: true, index: true },
    affiliateCode: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    visitorLabel: { type: String, required: true },
    eventType: {
      type: String,
      enum: [
        'link_click',
        'page_view',
        'product_view',
        'signup',
        'add_to_cart',
        'checkout_start',
        'purchase_completed',
        'other',
      ],
      required: true,
      index: true,
    },
    page: { type: String, default: '/' },
    productName: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: String, default: () => new Date().toISOString(), index: true },
  },
  { timestamps: false, versionKey: false }
);

AffiliateEventSchema.index({ affiliateId: 1, createdAt: -1 });
AffiliateEventSchema.index({ affiliateId: 1, sessionId: 1, createdAt: 1 });

const AffiliateEvent: Model<IAffiliateEvent> =
  mongoose.models.AffiliateEvent ||
  mongoose.model<IAffiliateEvent>('AffiliateEvent', AffiliateEventSchema);

export default AffiliateEvent;

export function buildAnonymizedVisitorLabel(sessionId: string): string {
  const clean = (sessionId || 'anon').replace(/[^a-zA-Z0-9]/g, '');
  const suffix = (clean.slice(-4) || '0000').toUpperCase();
  return `Visitante #${suffix}`;
}

export function sanitizeEventMetadata(raw: unknown): Record<string, any> {
  if (!raw || typeof raw !== 'object') return {};
  const blockedKeys = new Set([
    'email',
    'useremail',
    'customeremail',
    'phone',
    'mpesaphone',
    'password',
    'ip',
    'ipaddress',
    'name',
    'customername',
  ]);
  const safe: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (blockedKeys.has(k.toLowerCase())) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      safe[k] = v;
    }
  }
  return safe;
}
