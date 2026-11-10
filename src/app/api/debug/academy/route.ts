import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CourseModel } from '@/lib/models/CourseModel';
import { ModuleModel } from '@/lib/models/ModuleModel';
import { LessonModel } from '@/lib/models/LessonModel';
import { blockInProduction } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    
    console.log('[Debug Academy] courseId solicitado:', courseId);
    
    // Buscar todos os cursos
    const allCourses = await CourseModel.find({}).sort({ order: 1 });
    console.log('[Debug Academy] Total de cursos:', allCourses.length);
    console.log('[Debug Academy] IDs dos cursos:', allCourses.map(c => c.id));
    
    // Buscar todos os módulos
    const allModules = await ModuleModel.find({}).sort({ order: 1 });
    console.log('[Debug Academy] Total de módulos:', allModules.length);
    console.log('[Debug Academy] Módulos por courseId:');
    allModules.forEach(m => {
      console.log(`  - ${m.id}: courseId=${m.courseId}, title=${m.title}`);
    });
    
    // Buscar todas as lições
    const allLessons = await LessonModel.find({}).sort({ order: 1 });
    console.log('[Debug Academy] Total de lições:', allLessons.length);
    console.log('[Debug Academy] Lições por moduleId:');
    allLessons.forEach(l => {
      console.log(`  - ${l.id}: moduleId=${l.moduleId}, title=${l.title}`);
    });
    
    // Se courseId for especificado, buscar detalhes específicos
    let specificData = null;
    if (courseId) {
      const course = await CourseModel.findOne({ id: courseId });
      if (course) {
        const modules = await ModuleModel.find({ courseId }).sort({ order: 1 });
        const moduleIds = modules.map(m => m.id);
        const lessons = await LessonModel.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 });
        
        specificData = {
          course,
          modules,
          lessons,
          modulesCount: modules.length,
          lessonsCount: lessons.length
        };
      } else {
        specificData = { error: 'Curso não encontrado' };
      }
    }
    
    return NextResponse.json({
      allCourses: allCourses.map(c => ({ id: c.id, title: c.title, active: c.active })),
      allModules: allModules.map(m => ({ id: m.id, courseId: m.courseId, title: m.title, active: m.active })),
      allLessons: allLessons.map(l => ({ id: l.id, moduleId: l.moduleId, title: l.title, active: l.active })),
      specificData
    });
  } catch (error) {
    console.error('[Debug Academy] Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
