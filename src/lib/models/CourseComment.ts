import mongoose, { Schema, Model } from 'mongoose';

export interface ICourseComment {
  id: string;
  courseId: string;
  moduleId: string;
  lessonId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  userRole: 'student' | 'instructor' | 'admin';
  message: string;
  parentId?: string; // Para respostas aninhadas
  likesCount?: number;
  likedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

const CourseCommentSchema = new Schema<ICourseComment>({
  id: { type: String, required: true, unique: true },
  courseId: { type: String, required: true, index: true },
  moduleId: { type: String, required: true, index: true },
  lessonId: { type: String },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userAvatar: { type: String },
  userRole: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  message: { type: String, required: true },
  parentId: { type: String, index: true },
  likesCount: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, {
  timestamps: true
});

CourseCommentSchema.index({ courseId: 1, moduleId: 1, createdAt: -1 });

export const CourseCommentModel: Model<ICourseComment> = 
  mongoose.models.CourseComment || mongoose.model<ICourseComment>('CourseComment', CourseCommentSchema);

export default CourseCommentModel;
