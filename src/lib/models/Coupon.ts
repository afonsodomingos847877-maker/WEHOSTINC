import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  courseIds?: string[]; // Empty means applies to all courses
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

const CouponSchema = new Schema<ICoupon>({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  minPurchaseAmount: { type: Number, default: 0 },
  courseIds: { type: [String], default: [] },
  maxUses: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: String },
  active: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true,
  strict: false
});

const CouponModel: Model<ICoupon> = 
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default CouponModel;

