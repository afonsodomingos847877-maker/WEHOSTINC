import mongoose, { Schema, Document } from 'mongoose';

export interface IWebmailChatMessage extends Document {
  domain: string;
  channel: string; // 'general' ou 'dm:email1:email2'
  fromEmail: string;
  fromName: string;
  toEmail: string; // 'all' ou email do colega
  text: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  readBy: string[];
  createdAt: Date;
}

const WebmailChatMessageSchema = new Schema<IWebmailChatMessage>({
  domain: { type: String, required: true, lowercase: true, trim: true, index: true },
  channel: { type: String, required: true, index: true },
  fromEmail: { type: String, required: true, lowercase: true, trim: true },
  fromName: { type: String, required: true, trim: true },
  toEmail: { type: String, required: true, lowercase: true, trim: true },
  text: { type: String, default: '' },
  attachmentUrl: { type: String },
  attachmentName: { type: String },
  attachmentType: { type: String },
  readBy: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now, index: true },
});

WebmailChatMessageSchema.index({ domain: 1, channel: 1, createdAt: 1 });

export interface IWebmailPresence extends Document {
  email: string;
  domain: string;
  name: string;
  status: 'online' | 'busy' | 'away';
  lastSeenAt: Date;
}

const WebmailPresenceSchema = new Schema<IWebmailPresence>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  domain: { type: String, required: true, lowercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  status: { type: String, enum: ['online', 'busy', 'away'], default: 'online' },
  lastSeenAt: { type: Date, default: Date.now },
});

export const WebmailChatMessage =
  mongoose.models.WebmailChatMessage ||
  mongoose.model<IWebmailChatMessage>('WebmailChatMessage', WebmailChatMessageSchema);

export const WebmailPresence =
  mongoose.models.WebmailPresence ||
  mongoose.model<IWebmailPresence>('WebmailPresence', WebmailPresenceSchema);
