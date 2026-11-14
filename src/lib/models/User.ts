import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  plan: 'none' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'pending' | 'suspended';
  role: 'super_admin' | 'admin' | 'user';
  dueDate?: number;
  avatar?: string;
  confirmationCode?: string;
  confirmationCodeExpiresAt?: string;
  referredBy?: string; // Código do afiliado indicador
  creditBalance?: number; // Crédito interno na plataforma
  birthdate?: string; // Data de nascimento 'YYYY-MM-DD'
  lastBirthdayGreetingYear?: number; // Ano do último envio de felicitações
  createdAt: string;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  plan: { type: String, enum: ['none', 'basic', 'pro', 'enterprise'], default: 'none' },
  status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active' },
  role: { type: String, enum: ['super_admin', 'admin', 'user'], default: 'user' },
  dueDate: { type: Number },
  avatar: { type: String, default: '' },
  confirmationCode: { type: String },
  confirmationCodeExpiresAt: { type: String },
  referredBy: { type: String, index: true },
  creditBalance: { type: Number, default: 0 },
  birthdate: { type: String, default: null },
  lastBirthdayGreetingYear: { type: Number, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default UserModel;
