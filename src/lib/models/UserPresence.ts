import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserPresence extends Document {
  userEmail: string;
  userName: string;
  userAvatar?: string;
  role?: string;
  lastSeen: string;
  currentPage: string;
  sessionId: string;
  isOnline: boolean;
  isGuest?: boolean;
}

const UserPresenceSchema = new Schema<IUserPresence>({
  userEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  userName: { type: String, default: '' },
  userAvatar: { type: String, default: '' },
  role: { type: String, default: 'user' },
  lastSeen: { type: String, default: () => new Date().toISOString() },
  currentPage: { type: String, default: '/' },
  sessionId: { type: String, default: '' },
  isOnline: { type: Boolean, default: true },
  isGuest: { type: Boolean, default: false },
}, { timestamps: false, versionKey: false });

UserPresenceSchema.index({ lastSeen: -1 });

const UserPresenceModel: Model<IUserPresence> =
  mongoose.models.UserPresence ||
  mongoose.model<IUserPresence>('UserPresence', UserPresenceSchema);

export default UserPresenceModel;
