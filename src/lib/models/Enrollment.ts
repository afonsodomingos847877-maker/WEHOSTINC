import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEnrollment extends Document {
  id: string;
  courseId: string;
  courseTitle: string;
  studentEmail: string;
  studentName: string;
  studentPhone?: string;
  userId?: string;
  orderId?: string;
  paymentReference?: string;
  amountPaid: number;
  paymentMethod?: string;
  claimToken: string;
  claimed: boolean;
  claimedAt?: string;
  status: 'active' | 'suspended' | 'cancelled';
  enrolledAt: string;
  accessExpiresAt?: string;
}

const EnrollmentSchema = new Schema<IEnrollment>({
  id: { type: String, required: true, unique: true },
  courseId: { type: String, required: true, index: true },
  courseTitle: { type: String, required: true },
  studentEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  studentName: { type: String, required: true },
  studentPhone: { type: String, default: '' },
  userId: { type: String, index: true },
  orderId: { type: String, index: true },
  paymentReference: { type: String },
  amountPaid: { type: Number, default: 0 },
  paymentMethod: { type: String },
  claimToken: { type: String, unique: true, sparse: true, index: true },
  claimed: { type: Boolean, default: false },
  claimedAt: { type: String },
  status: { type: String, enum: ['active', 'suspended', 'cancelled'], default: 'active' },
  enrolledAt: { type: String, default: () => new Date().toISOString() },
  accessExpiresAt: { type: String }
}, {
  timestamps: true,
  strict: false
});

EnrollmentSchema.index({ studentEmail: 1, courseId: 1 });
EnrollmentSchema.index({ userId: 1, courseId: 1 });

const EnrollmentModel: Model<IEnrollment> = 
  mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default EnrollmentModel;

