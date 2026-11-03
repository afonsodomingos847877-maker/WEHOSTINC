import mongoose, { Schema, Model } from 'mongoose';

export interface ICourse {
  id: string;
  title: string;
  slug?: string;
  description: string;
  shortDescription: string;
  category?: string;
  level?: 'Iniciante' | 'Intermédio' | 'Avançado' | 'Todos os Níveis';
  duration: string;
  outcome: string;
  thumbnail?: string;
  videoPreviewUrl?: string;
  accessType: 'free' | 'paid' | 'preview';
  price?: number;
  originalPrice?: number;
  currency?: string;
  order: number;
  active: boolean;
  freeLessonsCount?: number;
  instructorName?: string;
  instructorTitle?: string;
  instructorBio?: string;
  instructorAvatar?: string;
  instructorGallery?: string[];
  skills?: string[];
  requirements?: string[];
  targetAudience?: string[];
  rating?: number;
  studentsCount?: number;
  certificateIncluded?: boolean;
  createdAt: string;
  updatedAt: string;
}

const CourseSchema = new Schema<ICourse>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  slug: { type: String, index: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true },
  category: { type: String, default: 'Tecnologia' },
  level: { type: String, default: 'Todos os Níveis' },
  duration: { type: String, required: true },
  outcome: { type: String, required: true },
  thumbnail: { type: String },
  videoPreviewUrl: { type: String },
  accessType: { type: String, required: true, enum: ['free', 'paid', 'preview'] },
  price: { type: Number },
  originalPrice: { type: Number },
  currency: { type: String, default: 'MZN' },
  order: { type: Number, required: true },
  active: { type: Boolean, required: true, default: true },
  freeLessonsCount: { type: Number, default: 1 },
  instructorName: { type: String, default: 'Equipa WEHOSTHERE' },
  instructorTitle: { type: String, default: 'Especialista em Engenharia & Cloud' },
  instructorBio: { type: String, default: 'Profissional com vasta experiência em infraestrutura, desenvolvimento web e sistemas de alta performance.' },
  instructorAvatar: { type: String },
  instructorGallery: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  requirements: { type: [String], default: [] },
  targetAudience: { type: [String], default: [] },
  rating: { type: Number, default: 4.9 },
  studentsCount: { type: Number, default: 140 },
  certificateIncluded: { type: Boolean, default: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, {
  timestamps: true,
  strict: false
});

export const CourseModel: Model<ICourse> = 
  mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
