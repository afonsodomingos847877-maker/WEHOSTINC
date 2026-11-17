import mongoose, { Schema, Document, Model } from 'mongoose';

export type MarketingMaterialType =
  | 'logo'
  | 'banner'
  | 'social_media'
  | 'story_status'
  | 'whatsapp_script'
  | 'email_template'
  | 'landing_page'
  | 'video'
  | 'text_ad'
  | 'brand_kit';

export interface IMarketingMaterial extends Document {
  title: string;
  description: string;
  type: MarketingMaterialType | string;
  content: string;
  imageUrl?: string;
  imageUrlDark?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  platform?: string;
  category: string;
  isActive: boolean;
  language: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const MarketingMaterialSchema = new Schema<IMarketingMaterial>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: String,
    imageUrlDark: String,
    dimensions: {
      width: Number,
      height: Number,
    },
    platform: { type: String },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    language: { type: String, default: 'pt' },
    createdBy: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false }
);

if (mongoose.models.MarketingMaterial) {
  delete mongoose.models.MarketingMaterial;
}

const MarketingMaterialModel: Model<IMarketingMaterial> =
  mongoose.model<IMarketingMaterial>('MarketingMaterial', MarketingMaterialSchema);

export default MarketingMaterialModel;
