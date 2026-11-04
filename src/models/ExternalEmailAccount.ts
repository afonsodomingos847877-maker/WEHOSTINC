import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExternalSecurityMode = 'ssl' | 'starttls' | 'none';
export type ConnectionStatus = 'connected' | 'error' | 'syncing';

export interface IExternalEmailAccount {
  ownerEmail: string; // The primary user/mailbox that added this external account
  email: string; // The external email address (e.g., info@othercompany.com)
  displayName?: string;
  providerName: string; // e.g. "Servidor Empresarial IMAP/SMTP", "cPanel", "Zoho Mail", "Google Workspace", etc.
  imapHost: string;
  imapPort: number;
  imapSecure: ExternalSecurityMode;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: ExternalSecurityMode;
  encryptedPassword: string;
  connectionStatus: ConnectionStatus;
  lastError?: string;
  lastSyncedAt?: Date;
  unreadCount?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExternalEmailAccountDocument extends IExternalEmailAccount, Document {}

const ExternalEmailAccountSchema = new Schema<ExternalEmailAccountDocument>(
  {
    ownerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    displayName: { type: String, trim: true },
    providerName: { type: String, required: true, default: 'Servidor Empresarial IMAP/SMTP' },
    imapHost: { type: String, required: true, trim: true },
    imapPort: { type: Number, required: true, default: 993 },
    imapSecure: { type: String, enum: ['ssl', 'starttls', 'none'], default: 'ssl' },
    smtpHost: { type: String, required: true, trim: true },
    smtpPort: { type: Number, required: true, default: 465 },
    smtpSecure: { type: String, enum: ['ssl', 'starttls', 'none'], default: 'ssl' },
    encryptedPassword: { type: String, required: true },
    connectionStatus: {
      type: String,
      enum: ['connected', 'error', 'syncing'],
      default: 'connected',
    },
    lastError: { type: String },
    lastSyncedAt: { type: Date, default: Date.now },
    unreadCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Compound index so a user cannot duplicate the same external email twice
ExternalEmailAccountSchema.index({ ownerEmail: 1, email: 1 }, { unique: true });

export const ExternalEmailAccount: Model<ExternalEmailAccountDocument> =
  mongoose.models.ExternalEmailAccount ||
  mongoose.model<ExternalEmailAccountDocument>('ExternalEmailAccount', ExternalEmailAccountSchema);
