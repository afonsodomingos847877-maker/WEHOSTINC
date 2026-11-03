import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import CourseCommentModel from '@/lib/models/CourseComment';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const moduleId = searchParams.get('moduleId');

    if (!courseId) {
      return NextResponse.json({ success: false, error: 'courseId é obrigatório' }, { status: 400 });
    }

    const filter: any = { courseId };
    if (moduleId) {
      filter.moduleId = moduleId;
    }

    const comments = await CourseCommentModel.find(filter).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    console.error('[API Course Comments GET Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao carregar mensagens' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { 
      courseId, 
      moduleId, 
      lessonId, 
      userId, 
      userName, 
      userEmail, 
      userAvatar, 
      userRole, 
      message, 
      parentId 
    } = body;

    if (!courseId || !moduleId || !message?.trim() || !userId) {
      return NextResponse.json({ success: false, error: 'Dados incompletos para envio da mensagem' }, { status: 400 });
    }

    const commentId = `CMT_${Date.now().toString().slice(-6)}_${crypto.randomBytes(3).toString('hex')}`;
    const newComment = new CourseCommentModel({
      id: commentId,
      courseId,
      moduleId,
      lessonId: lessonId || undefined,
      userId,
      userName: userName || 'Aluno',
      userEmail: userEmail?.toLowerCase() || '',
      userAvatar: userAvatar || undefined,
      userRole: userRole || 'student',
      message: message.trim(),
      parentId: parentId || undefined,
      likesCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await newComment.save();
    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    console.error('[API Course Comments POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao enviar mensagem' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ success: false, error: 'id é obrigatório' }, { status: 400 });
    }

    // Deleta o comentário e quaisquer respostas a ele
    await CourseCommentModel.deleteMany({
      $or: [{ id: commentId }, { parentId: commentId }]
    });

    return NextResponse.json({ success: true, message: 'Mensagem removida' });
  } catch (error: any) {
    console.error('[API Course Comments DELETE Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao remover mensagem' }, { status: 500 });
  }
}
