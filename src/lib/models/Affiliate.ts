import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAffiliate extends Document {
  userId: string;
  affiliateCode: string;
  affiliateLink: string;
  status: 'pending' | 'active' | 'suspended';
  totalEarnings: number;
  availableBalance: number;
  totalClicks: number;
  totalConversions: number;
  totalReferredUsers?: number; // Contas criadas pelo link do afiliado
  conversionRate: number;
  payoutMethod?: 'bank_transfer' | 'paypal' | 'mpesa';
  payoutDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    paypalEmail?: string;
    mpesaPhone?: string;
  };
  payoutStatus?: 'pending' | 'approved' | 'rejected' | 'processed';
  payoutNotes?: string;
  payoutProcessedAt?: string;
  addedByAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

const AffiliateSchema = new Schema<IAffiliate>(
  {
    userId: { type: String, required: true, unique: true },
    affiliateCode: { type: String, required: true, unique: true },
    affiliateLink: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
    totalEarnings: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalConversions: { type: Number, default: 0 },
    totalReferredUsers: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    payoutMethod: { type: String, enum: ['bank_transfer', 'paypal', 'mpesa'] },
    payoutDetails: {
      bankName: String,
      accountNumber: String,
      accountHolder: String,
      paypalEmail: String,
      mpesaPhone: String,
    },
    payoutStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'processed'] },
    payoutNotes: String,
    payoutProcessedAt: String,
    addedByAdmin: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false }
);

const AffiliateModel: Model<IAffiliate> =
  mongoose.models.Affiliate || mongoose.model<IAffiliate>('Affiliate', AffiliateSchema);
export default AffiliateModel;
