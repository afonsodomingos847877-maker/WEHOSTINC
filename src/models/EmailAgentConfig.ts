import mongoose, { Schema, Document, Model } from 'mongoose';

export type AgentReplyTone = 'professional' | 'friendly' | 'formal';

export interface EmailAgentConfigDocument extends Document {
  email: string;
  enabled: boolean;
  encryptedPassword?: string;
  scheduleEnabled: boolean;
  /** 0 = Domingo, 1 = Segunda, ..., 5 = Sexta, 6 = Sábado */
  scheduleDays: number[];
  scheduleStartHour: string;
  scheduleEndHour: string;
  replyTone: AgentReplyTone;
  customInstructions: string;
  cooldownHours: number;
  maxAgeHours: number;
  saveCopyToSent: boolean;
  lastRunAt?: Date;
  lastRunStatus: 'idle' | 'ok' | 'error';
  lastRunSummary: string;
  totalRepliesSent: number;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailAgentConfigSchema = new Schema<EmailAgentConfigDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    enabled: { type: Boolean, default: false },
    encryptedPassword: { type: String, default: '' },
    scheduleEnabled: { type: Boolean, default: false },
    scheduleDays: { type: [Number], default: [5, 6, 0] },
    scheduleStartHour: { type: String, default: '00:00' },
    scheduleEndHour: { type: String, default: '23:59' },
    replyTone: {
      type: String,
      enum: ['professional', 'friendly', 'formal'],
      default: 'professional',
    },
    customInstructions: { type: String, default: '', maxlength: 1000 },
    cooldownHours: { type: Number, default: 12, min: 1, max: 168 },
    maxAgeHours: { type: Number, default: 24, min: 1, max: 168 },
    saveCopyToSent: { type: Boolean, default: true },
    lastRunAt: { type: Date },
    lastRunStatus: {
      type: String,
      enum: ['idle', 'ok', 'error'],
      default: 'idle',
    },
    lastRunSummary: { type: String, default: '' },
    totalRepliesSent: { type: Number, default: 0 },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export interface EmailAgentLogDocument extends Document {
  agentEmail: string;
  incomingMessageId: string;
  incomingUid?: number;
  fromEmail: string;
  fromName?: string;
  subject: string;
  replySubject?: string;
  replyBody?: string;
  status: 'replied' | 'skipped' | 'error';
  reason: string;
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailAgentLogSchema = new Schema<EmailAgentLogDocument>(
  {
    agentEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    incomingMessageId: { type: String, required: true, trim: true },
    incomingUid: { type: Number },
    fromEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    fromName: { type: String, default: '' },
    subject: { type: String, default: '(Sem assunto)' },
    replySubject: { type: String, default: '' },
    replyBody: { type: String, default: '' },
    status: {
      type: String,
      enum: ['replied', 'skipped', 'error'],
      required: true,
      index: true,
    },
    reason: { type: String, default: '' },
    provider: { type: String, default: '' },
  },
  { timestamps: true }
);

EmailAgentLogSchema.index({ agentEmail: 1, incomingMessageId: 1 }, { unique: true });
EmailAgentLogSchema.index({ agentEmail: 1, createdAt: -1 });
EmailAgentLogSchema.index({ agentEmail: 1, fromEmail: 1, status: 1, createdAt: -1 });

export const EmailAgentConfig: Model<EmailAgentConfigDocument> =
  mongoose.models.EmailAgentConfig ||
  mongoose.model<EmailAgentConfigDocument>('EmailAgentConfig', EmailAgentConfigSchema);

export const EmailAgentLog: Model<EmailAgentLogDocument> =
  mongoose.models.EmailAgentLog ||
  mongoose.model<EmailAgentLogDocument>('EmailAgentLog', EmailAgentLogSchema);

