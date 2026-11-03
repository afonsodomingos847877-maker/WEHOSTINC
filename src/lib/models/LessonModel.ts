import mongoose, { Schema, Model } from 'mongoose';

export interface ILesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
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
  createdAt: string;
  updatedAt: string;
}

const LessonSchema = new Schema<ILesson>({
  id: { type: String, required: true, unique: true },
  moduleId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
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
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, {
  timestamps: true
});

// Índice composto para moduleId + order
LessonSchema.index({ moduleId: 1, order: 1 });

export const LessonModel: Model<ILesson> = 
  mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);
