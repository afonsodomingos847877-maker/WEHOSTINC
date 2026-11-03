import mongoose, { Schema, Model } from 'mongoose';

export interface IModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  objective: string;
  hasVideo: boolean;
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
  hasMaterial: boolean;
  materialUrl?: string;
  materialTitle?: string;
  materialType?: 'pdf' | 'document' | 'link';
  order: number;
  active: boolean;
  isFree?: boolean;
  viewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

const ModuleSchema = new Schema<IModule>({
  id: { type: String, required: true, unique: true },
  courseId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  objective: { type: String, required: true },
  hasVideo: { type: Boolean, required: true, default: false },
  videoUrl: { type: String },
  videoTitle: { type: String },
  videoDescription: { type: String },
  hasMaterial: { type: Boolean, required: true, default: false },
  materialUrl: { type: String },
  materialTitle: { type: String },
  materialType: { type: String, enum: ['pdf', 'document', 'link'] },
  order: { type: Number, required: true },
  active: { type: Boolean, required: true, default: true },
  isFree: { type: Boolean, default: false },
  viewsCount: { type: Number, default: 0 },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, {
  timestamps: true,
  strict: false
});

// Índice composto para courseId + order
ModuleSchema.index({ courseId: 1, order: 1 });

export const ModuleModel: Model<IModule> = 
  mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);
