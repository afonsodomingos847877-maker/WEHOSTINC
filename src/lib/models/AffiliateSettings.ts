import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAffiliateSettings extends Document {
  key: string;
  defaultCommissionRate: number; // percentagem (ex: 30 para 30%)
  minPayoutAmount: number; // valor mínimo de saque em MZN (ex: 1000)
  allowBalanceCredit: boolean; // permitir converter saldo em crédito na plataforma
  eligibleServices: string[]; // ex: ['hosting', 'domain', 'email', 'site', 'systems', 'academy', 'vps', 'loja-online']
  updatedBy?: string;
  updatedAt: string;
}

const AffiliateSettingsSchema = new Schema<IAffiliateSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    defaultCommissionRate: { type: Number, required: true, default: 30, min: 1, max: 90 },
    minPayoutAmount: { type: Number, required: true, default: 1000, min: 50 },
    allowBalanceCredit: { type: Boolean, default: true },
    eligibleServices: {
      type: [String],
      default: ['hosting', 'domain', 'email', 'site', 'systems', 'academy', 'vps', 'loja-online'],
    },
    updatedBy: { type: String, default: '' },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false }
);

const AffiliateSettings: Model<IAffiliateSettings> =
  mongoose.models.AffiliateSettings ||
  mongoose.model<IAffiliateSettings>('AffiliateSettings', AffiliateSettingsSchema);

export default AffiliateSettings;

export async function getAffiliateSettings(): Promise<IAffiliateSettings> {
  let settings = await AffiliateSettings.findOne({ key: 'global' });
  if (!settings) {
    settings = await AffiliateSettings.create({ key: 'global' });
  }
  return settings;
}
