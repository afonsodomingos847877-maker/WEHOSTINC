import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CourseModel } from '@/lib/models/CourseModel';
import { ModuleModel } from '@/lib/models/ModuleModel';
import { LessonModel } from '@/lib/models/LessonModel';
import EnrollmentModel from '@/lib/models/Enrollment';
import { CourseProgress } from '@/lib/models/CourseProgress';
import UserModel from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      // Retornar visão geral de todos os cursos
      const courses = await CourseModel.find({}).sort({ order: 1 }).lean();
      const allModules = await ModuleModel.find({}).lean();
      const allEnrollments = await EnrollmentModel.find({ status: 'active' }).lean();

      const summary = courses.map((c: any) => {
        const cModules = allModules.filter((m: any) => m.courseId === c.id);
        const cEnrollments = allEnrollments.filter((e: any) => e.courseId === c.id);
        const totalModuleViews = cModules.reduce((acc: number, m: any) => acc + (m.viewsCount || 0), 0);

        return {
          courseId: c.id,
          title: c.title,
          viewsCount: c.viewsCount || 0,
          modulesCount: cModules.length,
          totalModuleViews,
          studentsCount: cEnrollments.length
        };
      });

      return NextResponse.json({ success: true, summary });
    }

    // Detalhes aprofundados de um curso específico
    const [course, modules, lessons, enrollments, progresses] = await Promise.all([
      CourseModel.findOne({ id: courseId }).lean(),
      ModuleModel.find({ courseId }).sort({ order: 1 }).lean(),
      LessonModel.find({}).lean(),
      EnrollmentModel.find({ courseId }).sort({ enrolledAt: -1 }).lean(),
      CourseProgress.find({ courseId }).lean()
    ]);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Curso não encontrado' }, { status: 404 });
    }

    // Buscar fotos de perfil dos alunos na base de utilizadores
    const studentEmails = enrollments.map((enr: any) => (enr.studentEmail || '').toLowerCase().trim()).filter(Boolean);
    const users = await UserModel.find({ email: { $in: studentEmails } }).select('email avatar name').lean();

    const totalLessonsCount = lessons.filter((l: any) => 
      modules.some((m: any) => m.id === l.moduleId)
    ).length || modules.length; // Fallback se módulos forem capítulos diretos

    // Mapear cada estudante com o seu progresso detalhado
    const students = enrollments.map((enr: any) => {
      const studentEmail = (enr.studentEmail || '').toLowerCase().trim();
      const progress = progresses.find((p: any) => 
        (enr.userId && p.userId === enr.userId) || 
        (p.userId && p.userId.toLowerCase() === studentEmail)
      );
      const userDoc = users.find((u: any) => u.email?.toLowerCase() === studentEmail);
      const avatar = userDoc?.avatar || (enr as any).studentAvatar || null;

      const completedCount = progress?.completedLessons?.length || 0;
      const progressPercent = totalLessonsCount > 0 
        ? Math.min(100, Math.round((completedCount / totalLessonsCount) * 100))
        : 0;

      return {
        enrollmentId: enr.id,
        userId: enr.userId,
        name: enr.studentName || 'Aluno',
        email: studentEmail,
        phone: enr.studentPhone || '',
        avatar: avatar,
        enrolledAt: enr.enrolledAt,
        status: enr.status,
        paymentPlan: enr.paymentPlan || 'full',
        installmentsPaid: enr.installmentsPaid || 1,
        installmentsTotal: enr.installmentsTotal || 1,
        amountPaid: enr.amountPaid || 0,
        completedLessonsCount: completedCount,
        totalLessonsCount: totalLessonsCount,
        progressPercent,
        lastAccessedAt: progress?.lastAccessedAt || enr.enrolledAt,
        currentModuleId: progress?.currentModuleId || null
      };
    });

    const totalModuleViews = modules.reduce((acc: number, m: any) => acc + (m.viewsCount || 0), 0);

    return NextResponse.json({
      success: true,
      course: {
        id: (course as any).id,
        title: (course as any).title,
        viewsCount: (course as any).viewsCount || 0,
        totalModuleViews,
        enrolledStudentsCount: enrollments.length
      },
      modules: modules.map((m: any) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        viewsCount: m.viewsCount || 0,
        hasVideo: !!m.videoUrl,
        hasMaterial: !!m.hasMaterial
      })),
      students
    });
  } catch (error: any) {
    console.error('[API Course Analytics GET Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao carregar métricas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, courseId, moduleId, userId, userEmail, userName } = body;

    if (action === 'track_view' && courseId) {
      // 1. Incrementa visualizações do curso
      await CourseModel.findOneAndUpdate(
        { id: courseId },
        { $inc: { viewsCount: 1 } }
      );

      // 2. Incrementa visualizações do módulo se especificado
      if (moduleId) {
        await ModuleModel.findOneAndUpdate(
          { id: moduleId },
          { $inc: { viewsCount: 1 } }
        );
      }

      // 3. Atualiza timestamp de acesso do aluno no CourseProgress
      const studentIdentifier = userId || userEmail;
      if (studentIdentifier) {
        const now = new Date().toISOString();
        await CourseProgress.findOneAndUpdate(
          { 
            courseId,
            $or: [{ userId: studentIdentifier }, { userId: userEmail }]
          },
          {
            $set: {
              lastAccessedAt: now,
              ...(moduleId ? { currentModuleId: moduleId } : {})
            },
            $setOnInsert: {
              id: `PROG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              userId: studentIdentifier,
              courseId,
              completedLessons: [],
              createdAt: now,
              updatedAt: now
            }
          },
          { upsert: true, new: true }
        );
      }

      return NextResponse.json({ success: true, message: 'Visualização registrada' });
    }

    return NextResponse.json({ success: false, error: 'Ação desconhecida' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Course Analytics POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao registrar métrica' }, { status: 500 });
  }
}

