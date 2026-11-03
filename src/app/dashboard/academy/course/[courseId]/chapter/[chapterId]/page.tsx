'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ExternalLink, BookOpen, ChevronLeft, ChevronRight, CheckCircle, Menu, X, Video, FileText, Clock, Target, Award, Lock, DollarSign, CreditCard, Sparkles, MessageSquare, Send, Reply, Trash2, ShieldCheck, GraduationCap, CornerDownRight, ThumbsUp, User as UserIcon } from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, Course, Module, Lesson, CourseProgress } from '@/lib/data';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';
import { formatVideoEmbedUrl } from '@/lib/videoEmbed';

export default function ChapterViewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const chapterId = params.chapterId as string;
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const isTeacherParam = searchParams.get('role') === 'docente';

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [currentChapterId, setCurrentChapterId] = useState(chapterId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ show: false, message: '', type: 'success' });
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);

  // Estados da Comunidade & Chat da Sala de Aula
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const currentUser = auth.getCurrentUser();

  const loadCourseData = useCallback(async (currentUser: User) => {
    try {
      if (!currentUser) {
        console.error('[ChapterView] Usuário não autenticado');
        return;
      }

      // 1. Renderização Otimista Imediata se já existir em cache
      const cachedCourse = dataManager.getCourses().find(c => c.id === courseId);
      if (cachedCourse) {
        setCourse(cachedCourse);
        setModules(dataManager.getModules(courseId).sort((a, b) => a.order - b.order));
        setLessons(dataManager.getLessons());
        setLoading(false);
      }

      // 2. Buscar dados atualizados do servidor sem apagar o cache prévio
      await Promise.all([
        dataManager.fetchCoursesAsync(),
        dataManager.fetchModulesAsync(),
        dataManager.fetchLessonsAsync()
      ]);

      const courseData = dataManager.getCourses().find(c => c.id === courseId);
      if (courseData) {
        setCourse(courseData);
        setModules(dataManager.getModules(courseId).sort((a, b) => a.order - b.order));
        setLessons(dataManager.getLessons());
      } else if (!cachedCourse) {
        console.error('[ChapterView] Curso não encontrado, redirecionando para academy');
        router.push('/dashboard/academy');
        return;
      }

      // 3. Verificar permissão de pagamento
      const isAdmin = auth.isAdminUser(currentUser);
      const isProOrEnterprise = currentUser.plan === 'pro' || currentUser.plan === 'enterprise';
      
      if (isAdmin || isProOrEnterprise || isTeacherParam) {
        setIsPaidUser(true);
      } else if (courseData && (courseData.accessType === 'paid' || courseData.accessType === 'preview')) {
        const hasPaid = await dataManager.hasPaidForCourse(currentUser.email, courseData.title);
        setIsPaidUser(hasPaid);
      } else {
        setIsPaidUser(false);
      }
      
      // Carregar progresso
      const localProgress = dataManager.getCourseProgress(currentUser.email, courseId);
      setProgress(localProgress);
      setLoading(false);

      // Sincronizar progresso em background
      dataManager.fetchCourseProgressAsync(currentUser.email, courseId)
        .then(serverProgress => {
          if (serverProgress) setProgress(serverProgress);
        })
        .catch(() => {});
    } catch (error) {
      console.error('[ChapterView] Erro em loadCourseData:', error);
      setLoading(false);
    }
  }, [courseId, chapterId, router, isTeacherParam]);

  useEffect(() => {
    let currentUser: User | null = null;
    
    // 1. Tentar NextAuth se autenticado
    if (status === 'authenticated' && session?.user) {
      currentUser = {
        id: (session.user as any)?.id || session.user.email || '',
        name: session.user.name || '',
        email: session.user.email || '',
        plan: (session.user as any)?.plan || 'none',
        status: (session.user as any)?.status || 'active',
        role: (session.user as any)?.role || 'user',
        avatar: session.user.image || undefined,
        dueDate: (session.user as any)?.dueDate,
        createdAt: (session.user as any)?.createdAt || new Date().toISOString()
      };
    } else {
      // 2. Fallback imediato para auth local (não espera o NextAuth se já tiver login local)
      currentUser = auth.getCurrentUser();
    }

    // Se não temos nenhum usuário e NextAuth ainda está a verificar na rede, aguardar
    if (!currentUser && status === 'loading') {
      return;
    }

    if (!currentUser) {
      router.push('/login');
      return;
    }

    setActiveUser(currentUser);
    loadCourseData(currentUser);
  }, [courseId, router, session, status, loadCourseData]);

  const isTeacherMode = isTeacherParam || (activeUser ? auth.isAdminUser(activeUser) : false);

  const loadComments = useCallback(async (cId: string, mId: string) => {
    try {
      setLoadingComments(true);
      const res = await fetch(`/api/academy/comments?courseId=${encodeURIComponent(cId)}&moduleId=${encodeURIComponent(mId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.comments)) {
          setComments(data.comments);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar comentários:', err);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  // Sincronizar comentários e registrar analytics ao trocar de capítulo
  useEffect(() => {
    if (courseId && currentChapterId) {
      loadComments(courseId, currentChapterId);

      // Registrar visualização nas métricas
      fetch('/api/academy/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_view',
          courseId,
          moduleId: currentChapterId,
          userId: activeUser?.id,
          userEmail: activeUser?.email,
          userName: activeUser?.name
        })
      }).catch(err => console.warn('Erro ao registrar visualização:', err));
    }
  }, [courseId, currentChapterId, activeUser, loadComments]);

  const handleSendComment = async (parentId?: string) => {
    const textToSend = parentId ? replyText.trim() : commentText.trim();
    if (!textToSend || !activeUser) return;

    try {
      if (parentId) setSubmittingReply(true);
      else setSubmittingComment(true);

      const userRole = isTeacherMode ? 'instructor' : 'student';

      const res = await fetch('/api/academy/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleId: currentChapterId,
          lessonId: currentLessonData?.id,
          userId: activeUser.id || activeUser.email,
          userName: activeUser.name || (isTeacherMode ? 'Docente / Formador' : 'Aluno'),
          userEmail: activeUser.email,
          userAvatar: activeUser.avatar,
          userRole,
          message: textToSend,
          parentId: parentId || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.comment) {
          setComments(prev => [...prev, data.comment]);
          if (parentId) {
            setReplyText('');
            setReplyToId(null);
          } else {
            setCommentText('');
          }
          setToast({ show: true, message: parentId ? 'Resposta enviada!' : 'Dúvida enviada para a turma!', type: 'success' });
        }
      }
    } catch (err) {
      setToast({ show: true, message: 'Erro ao enviar mensagem.', type: 'error' });
    } finally {
      if (parentId) setSubmittingReply(false);
      else setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/academy/comments?id=${encodeURIComponent(commentId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
        setToast({ show: true, message: 'Mensagem removida.', type: 'info' });
      }
    } catch (err) {
      setToast({ show: true, message: 'Erro ao remover mensagem.', type: 'error' });
    }
  };

  const getCurrentChapter = () => {
    const chapterIndex = modules.findIndex(m => m.id === currentChapterId);
    if (chapterIndex === -1) {
      return { chapterIndex: -1, module: null };
    }
    return { chapterIndex, module: modules[chapterIndex] };
  };

  const getCurrentLesson = () => {
    const { module: currentModuleData } = getCurrentChapter();
    if (!currentModuleData) return null;
    const moduleLessons = lessons.filter(l => l.moduleId === currentModuleData.id).sort((a, b) => a.order - b.order);
    
    // Se não houver lições, criar uma lição temporária usando o conteúdo do módulo
    if (moduleLessons.length === 0 && currentModuleData) {
      return {
        id: `TEMP-${currentModuleData.id}`,
        moduleId: currentModuleData.id,
        title: currentModuleData.title,
        content: currentModuleData.description,
        hasVideo: currentModuleData.hasVideo,
        videoUrl: currentModuleData.videoUrl,
        videoTitle: currentModuleData.videoTitle,
        videoDescription: currentModuleData.videoDescription,
        hasMaterial: currentModuleData.hasMaterial,
        materialUrl: currentModuleData.materialUrl,
        materialTitle: currentModuleData.materialTitle,
        materialType: currentModuleData.materialType,
        order: 1,
        active: true,
        createdAt: currentModuleData.createdAt,
        updatedAt: currentModuleData.updatedAt
      };
    }
    
    return moduleLessons[currentLesson] || null;
  };

  const handleCompleteLesson = async () => {
    const currentLessonData = getCurrentLesson();
    if (!currentLessonData || !course) return;

    const user = auth.getCurrentUser();
    if (!user) return;

    const { module } = getCurrentChapter();
    if (!module) return;

    console.log('[handleCompleteLesson] Marcando lição como concluída:', currentLessonData.id);
    dataManager.updateCourseProgress(user.email, course.id, currentLessonData.id, module.id);
    const updatedProgress = dataManager.getCourseProgress(user.email, course.id);
    console.log('[handleCompleteLesson] Progresso atualizado:', updatedProgress);
    setProgress(updatedProgress);

    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);

    setToast({ show: true, message: 'Excelente! Lição concluída com sucesso!', type: 'success' });

    // Check if all lessons are completed
    const allLessons = lessons.filter(l => l.moduleId && modules.some(m => m.id === l.moduleId && m.courseId === course.id));
    const completedLessons = updatedProgress?.completedLessons || [];
    console.log('[handleCompleteLesson] Total de lições:', allLessons.length, 'Concluídas:', completedLessons.length);
    
    if (allLessons.length > 0 && completedLessons.length === allLessons.length) {
      // All lessons completed - create certificate
      console.log('[handleCompleteLesson] Todas as lições concluídas! Criando certificado...');
      const certificate = await dataManager.createCertificate(
        user.email,
        user.name,
        user.email,
        course.id,
        course.title
      );
      
      if (certificate) {
        console.log('[handleCompleteLesson] Certificado criado:', certificate);
        setToast({ 
          show: true, 
          message: 'Parabéns! Você completou o curso e recebeu seu certificado!', 
          type: 'success' 
        });
      }
    }

    // Move to next lesson
    const moduleLessons = lessons.filter(l => l.moduleId === module.id).sort((a, b) => a.order - b.order);
    if (currentLesson < moduleLessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else {
      // Move to next chapter - use local state instead of navigation
      const { chapterIndex } = getCurrentChapter();
      if (chapterIndex !== -1 && chapterIndex < modules.length - 1) {
        const nextModule = modules[chapterIndex + 1];
        setCurrentChapterId(nextModule.id);
        setCurrentLesson(0);
      }
    }
  };

  const goToPrevious = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    } else {
      const { chapterIndex } = getCurrentChapter();
      if (chapterIndex > 0) {
        const prevModule = modules[chapterIndex - 1];
        const prevModuleLessons = lessons.filter(l => l.moduleId === prevModule.id).sort((a, b) => a.order - b.order);
        setCurrentChapterId(prevModule.id);
        setCurrentLesson(prevModuleLessons.length - 1);
      }
    }
  };

  const goToNext = () => {
    const currentLessonData = getCurrentLesson();
    if (!currentLessonData) return;

    const { module } = getCurrentChapter();
    if (!module) return;

    const moduleLessons = lessons.filter(l => l.moduleId === module.id).sort((a, b) => a.order - b.order);

    if (currentLesson < moduleLessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else {
      const { chapterIndex } = getCurrentChapter();
      if (chapterIndex !== -1 && chapterIndex < modules.length - 1) {
        const nextModule = modules[chapterIndex + 1];
        setCurrentChapterId(nextModule.id);
        setCurrentLesson(0);
      }
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress?.completedLessons.includes(lessonId) || false;
  };

  const getCourseProgress = () => {
    if (!progress || !course) return 0;
    
    // Contar lições reais + lições temporárias de módulos sem lições
    let totalLessons = 0;
    modules.forEach(module => {
      const moduleLessons = lessons.filter(l => l.moduleId === module.id);
      totalLessons += moduleLessons.length > 0 ? moduleLessons.length : 1;
    });
    
    if (totalLessons === 0) return 0;
    return Math.round((progress.completedLessons.length / totalLessons) * 100);
  };

  const getModuleLessons = (moduleId: string) => {
    const moduleLessons = lessons.filter(l => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
    
    // Se não houver lições para este módulo, criar uma lição temporária usando o conteúdo do módulo
    if (moduleLessons.length === 0) {
      const moduleData = modules.find(m => m.id === moduleId);
      if (moduleData && (moduleData.description || moduleData.hasVideo || moduleData.hasMaterial)) {
        return [{
          id: `TEMP-${moduleData.id}`,
          moduleId: moduleData.id,
          title: moduleData.title,
          content: moduleData.description || 'Conteúdo em breve...',
          hasVideo: moduleData.hasVideo,
          videoUrl: moduleData.videoUrl,
          videoTitle: moduleData.videoTitle,
          videoDescription: moduleData.videoDescription,
          hasMaterial: moduleData.hasMaterial,
          materialUrl: moduleData.materialUrl,
          materialTitle: moduleData.materialTitle,
          materialType: moduleData.materialType,
          order: 1,
          active: true,
          createdAt: moduleData.createdAt,
          updatedAt: moduleData.updatedAt
        }];
      }
    }
    
    return moduleLessons;
  };

  if (loading) {
    console.log('[ChapterView] Ainda carregando, loading = true');
    console.log('[ChapterView] Estado atual:', { 
      courseId, 
      chapterId, 
      course: course?.title, 
      modulesCount: modules.length, 
      lessonsCount: lessons.length 
    });
    return <PageLoader text="A carregar capítulo..." />;
  }

  if (!course) {
    console.log('[ChapterView] Curso é null, retornando null');
    return null;
  }

  console.log('[ChapterView] Curso definido, modules.length:', modules.length, 'lessons.length:', lessons.length);

  const { chapterIndex, module: currentModule } = getCurrentChapter();
  const currentLessonData = getCurrentLesson();

  console.log('[ChapterView] currentModule:', currentModule?.title, 'chapterIndex:', chapterIndex);
  console.log('[ChapterView] currentLessonData:', currentLessonData?.title);

  if (!currentModule || chapterIndex === -1) {
    console.log('[ChapterView] Capítulo não encontrado, mostrando mensagem de erro');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Capítulo não encontrado</h3>
          <p className="text-gray-600 mb-4">O capítulo solicitado não existe ou foi removido.</p>
          <button
            onClick={() => router.push('/dashboard/academy')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Voltar para Academia
          </button>
        </div>
      </div>
    );
  }

  const moduleLessons = getModuleLessons(currentModule.id);
  const completedInModule = moduleLessons.filter(l => isLessonCompleted(l.id)).length;

  // Verifica se o módulo atual está dentro do limite de aulas grátis
  const isCurrentModuleFree = course && currentModule && currentModule.order <= (course.freeLessonsCount || 1);
  
  // Permite acesso se: curso é gratuito, usuário é pago, OU módulo está dentro do limite grátis
  const hasAccess = course?.accessType === 'free' || isPaidUser || isCurrentModuleFree;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Barra de Modo Docente / Formador */}
      {isTeacherMode && (
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white px-4 py-2.5 text-xs border-b border-indigo-700/60 shadow-inner flex items-center justify-between flex-wrap gap-2 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-bold border border-blue-400/30 text-[10px] uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
              <span>Modo Docente Ativo</span>
            </span>
            <span className="text-slate-200 hidden sm:inline">
              Visão de Formador: Acesso ilimitado às aulas, vídeos e respostas destacadas na comunidade da turma.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/admin/academy')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs transition cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Voltar ao Painel Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 text-center animate-in zoom-in-95 duration-300">
            <Award className="h-16 w-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Excelente!</h3>
            <p className="text-gray-600">Lição concluída com sucesso!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard/academy')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <BrandLogo />
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">{course.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-primary-50 px-3 py-1.5 rounded-full">
                <Target className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-semibold text-primary-700">{getCourseProgress()}%</span>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Capítulo {chapterIndex + 1} de {modules.length}</span>
            </div>
            <div className="text-sm text-gray-600">
              {completedInModule}/{moduleLessons.length} lições concluídas
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(completedInModule / moduleLessons.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Chapters */}
        <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Seu Progresso</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {modules.map((module, index) => {
                const moduleLessons = getModuleLessons(module.id);
                const completedInModule = moduleLessons.filter(l => isLessonCompleted(l.id)).length;
                const isActive = module.id === currentChapterId;
                const isCompleted = completedInModule === moduleLessons.length && moduleLessons.length > 0;
                const isLocked = !hasAccess && (module.order > (course?.freeLessonsCount || 1));

                return (
                  <div key={module.id} className="mb-3">
                    <button
                      onClick={() => {
                        setCurrentChapterId(module.id);
                        setCurrentLesson(0);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        isActive ? 'bg-primary-50 border-2 border-primary-200' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isLocked 
                            ? 'bg-amber-100 text-amber-700'
                            : isCompleted 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : isActive 
                            ? 'bg-primary-100 text-primary-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isLocked ? (
                            <Lock className="h-4 w-4 text-amber-700" />
                          ) : isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : isActive ? (
                            <BookOpen className="h-4 w-4 text-primary-600" />
                          ) : (
                            <span className="text-xs font-semibold">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-xs sm:text-sm ${isActive ? 'text-primary-900' : 'text-gray-900'}`}>
                              Capítulo {index + 1}
                            </span>
                            {isLocked && (
                              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                🔒 Bloqueado
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">{module.title}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Chapter Header */}
            <div className="mb-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                  Capítulo {chapterIndex + 1}
                </span>
                <span className="text-gray-400">de</span>
                <span>{modules.length}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{currentModule.title}</h2>
              <p className="text-lg text-gray-600 mb-4">{currentModule.description}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Target className="h-4 w-4" />
                <span>Objetivo: {currentModule.objective}</span>
              </div>
            </div>

            {/* Paywall Screen se o módulo atual estiver bloqueado */}
            {!hasAccess && (currentModule.order > (course?.freeLessonsCount || 1)) ? (
              <div className="bg-white rounded-2xl border border-amber-200/90 shadow-xl p-5 sm:p-7 text-center max-w-md mx-auto animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>

                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold rounded-full mb-2 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-amber-600" />
                  <span>Conteúdo Exclusivo</span>
                </span>

                <h3 className="text-xl sm:text-2xl font-bold text-gray-950 mb-1 tracking-tight">
                  Desbloqueie o Curso Completo
                </h3>

                <p className="text-gray-500 text-xs mb-4">
                  Acesso vitalício a todos os módulos práticos, modelos e certificado.
                </p>

                {/* Box de Preço e Benefícios */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 mb-4 text-left shadow-md border border-indigo-500/20">
                  <div className="flex items-center justify-between border-b border-indigo-400/20 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">Acesso Vitalício</span>
                      <span className="text-2xl sm:text-3xl font-black text-white">{course.price || 500} MT</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold rounded-md">
                      Pagamento Único
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-gray-300">
                    <li className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Todas as lições e projetos práticos</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Modelos de código e materiais em PDF</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Certificado Oficial de Conclusão</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => router.push(`/checkout?service=course&amount=${course.price || 500}&domain=academy&name=${encodeURIComponent(course.title)}`)}
                  className="w-full inline-flex items-center justify-center space-x-2 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition transform hover:scale-[1.01] cursor-pointer text-sm"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Desbloquear por {course.price || 500} MT</span>
                </button>
              </div>
            ) : currentLessonData ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg animate-in slide-in-from-bottom-8 fade-in duration-500">
                <div className="p-6 sm:p-8">
                  {/* Lesson Header */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <span className="bg-gray-100 px-2 py-1 rounded font-medium">Lição {currentLesson + 1}</span>
                      <span className="text-gray-400">de</span>
                      <span>{moduleLessons.length}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{currentLessonData.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {currentLessonData.hasVideo && <span className="flex items-center space-x-1"><Video className="h-4 w-4" /><span>Inclui vídeo</span></span>}
                      {currentLessonData.hasMaterial && <span className="flex items-center space-x-1"><FileText className="h-4 w-4" /><span>Material de apoio</span></span>}
                    </div>
                  </div>

                  {/* Video */}
                  {currentLessonData.hasVideo && currentLessonData.videoUrl && (() => {
                    const videoEmbed = formatVideoEmbedUrl(currentLessonData.videoUrl);
                    return (
                      <div className="mb-8">
                        <div className="aspect-video bg-gray-950 rounded-2xl overflow-hidden shadow-xl border border-gray-800 relative group">
                          {videoEmbed.type === 'video' ? (
                            <video
                              controls
                              className="w-full h-full"
                              src={videoEmbed.embedUrl}
                            />
                          ) : (
                            <iframe
                              key={`${currentLessonData.id}_${videoEmbed.embedUrl}`}
                              src={videoEmbed.embedUrl}
                              className="w-full h-full border-0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              title={currentLessonData.videoTitle || 'Vídeo da aula'}
                            />
                          )}
                        </div>

                        {/* Ações e Informações do Vídeo */}
                        <div className="flex items-start justify-between mt-3 flex-wrap gap-3">
                          <div className="flex-1 min-w-[240px]">
                            {currentLessonData.videoTitle && (
                              <h4 className="font-semibold text-gray-900">{currentLessonData.videoTitle}</h4>
                            )}
                            {currentLessonData.videoDescription && (
                              <p className="text-sm text-gray-600 mt-0.5">{currentLessonData.videoDescription}</p>
                            )}
                          </div>

                          {/* Fallback direto caso o navegador ou adblocker bloqueie embeds */}
                          {videoEmbed.originalWatchUrl && (
                            <a
                              href={videoEmbed.originalWatchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
                              title="Abrir vídeo diretamente numa nova aba"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{videoEmbed.isYouTube ? 'Abrir no YouTube' : 'Abrir Vídeo'}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Content */}
                  <div className="prose prose-lg max-w-none mb-8">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{currentLessonData.content}</div>
                  </div>

                  {/* Material */}
                  {currentLessonData.hasMaterial && currentLessonData.materialUrl && (
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 mb-8 border border-primary-100">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Material de Apoio</span>
                      </h4>
                      <a
                        href={currentLessonData.materialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {currentLessonData.materialTitle || 'Baixar material'}
                      </a>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      onClick={goToPrevious}
                      disabled={chapterIndex === 0 && currentLesson === 0}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition ${
                        chapterIndex === 0 && currentLesson === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                      <span>Anterior</span>
                    </button>

                    <button
                      onClick={handleCompleteLesson}
                      className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition transform hover:scale-105 ${
                        isLessonCompleted(currentLessonData.id)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'
                          : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg shadow-primary-200'
                      }`}
                    >
                      {isLessonCompleted(currentLessonData.id) ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Concluído</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Concluir Lição</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={goToNext}
                      disabled={chapterIndex === modules.length - 1 && currentLesson === moduleLessons.length - 1}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition ${
                        chapterIndex === modules.length - 1 && currentLesson === moduleLessons.length - 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span>Próximo</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-lg">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma aula disponível</h3>
                <p className="text-gray-600">Este capítulo ainda não tem aulas disponíveis. Por favor, volte mais tarde ou entre em contato com o suporte.</p>
              </div>
            )}

            {/* 💬 CHAT & COMUNIDADE DA TURMA (Alunos + Docente) */}
            <div className="mt-8 bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in duration-300">
              <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-5 h-5 text-primary-400" />
                    <h3 className="text-base sm:text-lg font-bold">Comunidade & Dúvidas da Aula</h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    Tira dúvidas diretamente com o formador e debate os exercícios com outros alunos da turma.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20">
                  {comments.length} {comments.length === 1 ? 'mensagem' : 'mensagens'}
                </span>
              </div>

              <div className="p-5 sm:p-7 space-y-6">
                {/* Caixa de Entrada de Nova Mensagem */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activeUser?.avatar ? (
                        <img 
                          src={activeUser.avatar} 
                          alt={activeUser.name} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {activeUser?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900">{activeUser?.name || 'Tu'}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isTeacherMode ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isTeacherMode ? '👨‍🏫 Docente / Formador' : '🎓 Aluno'}
                        </span>
                      </div>
                    </div>
                    {isTeacherMode && (
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Resposta Oficial Destacada
                      </span>
                    )}
                  </div>

                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={isTeacherMode ? "Escreve uma orientação para a turma ou responde a uma dúvida..." : "Escreve a tua dúvida sobre este capítulo ou lição..."}
                    rows={3}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />

                  {/* Modelos de Mensagens Pré-definidas Rápidas */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-primary-500" />
                      <span>Modelos rápidos (Clica para usar ou editar):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(isTeacherMode ? [
                        "👋 Olá a todos! Deixem aqui as vossas dúvidas que estou a acompanhar a turma.",
                        "💡 Dica prática: Prestem especial atenção à lógica demonstrada nesta aula.",
                        "🏆 Parabéns a todos que concluíram os exercícios práticos deste capítulo!",
                        "📂 O material complementar de apoio já se encontra disponível para consulta."
                      ] : [
                        "💡 Tenho uma dúvida sobre a explicação deste conceito...",
                        "🛠️ Consegui concluir os passos desta aula com sucesso! Muito bom.",
                        "🤔 Alguém pode partilhar como resolveu o exercício prático deste capítulo?",
                        "📁 Onde posso descarregar os modelos de código desta lição?",
                        "🚀 Excelente aula! A aplicação prática ficou muito clara."
                      ]).map((template, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCommentText(template);
                          }}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 border border-slate-200 text-slate-600 transition shadow-2xs text-left cursor-pointer active:scale-95"
                          title="Clica para preencher este texto na caixa acima"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSendComment()}
                      disabled={submittingComment || !commentText.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingComment ? 'A enviar...' : 'Publicar na Turma'}</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Mensagens */}
                {loadingComments ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    A carregar dúvidas e mensagens da turma...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl p-6">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Ainda não há dúvidas publicadas neste capítulo.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sê o primeiro a colocar uma pergunta ou partilhar uma resolução!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Agrupar por comentários raiz */}
                    {comments.filter(c => !c.parentId).map((c) => {
                      const replies = comments.filter(r => r.parentId === c.id);
                      const isInstructor = c.userRole === 'instructor' || c.userRole === 'admin';

                      return (
                        <div key={c.id} className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {c.userAvatar ? (
                                <img 
                                  src={c.userAvatar} 
                                  alt={c.userName} 
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0" 
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                    (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isInstructor ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
                              } ${c.userAvatar ? 'hidden' : ''}`}>
                                {c.userName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900">{c.userName}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                    isInstructor 
                                      ? 'bg-blue-600 text-white shadow-xs' 
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {isInstructor ? '👨‍🏫 Docente / Formador' : '🎓 Aluno'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                            </div>

                            {isTeacherMode && (
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded transition cursor-pointer"
                                title="Eliminar mensagem (Modo Docente)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pl-11">
                            {c.message}
                          </p>

                          <div className="pl-11 flex items-center gap-3 pt-1">
                            <button
                              onClick={() => {
                                setReplyToId(replyToId === c.id ? null : c.id);
                                setReplyText('');
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer"
                            >
                              <Reply className="w-3.5 h-3.5" />
                              <span>{replyToId === c.id ? 'Cancelar' : 'Responder'}</span>
                            </button>
                          </div>

                          {/* Campo de Resposta Aberto */}
                          {replyToId === c.id && (
                            <div className="ml-11 mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 animate-in fade-in duration-150">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Responder a ${c.userName}...`}
                                rows={2}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                              />
                                {/* Modelos Rápidos de Resposta */}
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {[
                                    "Obrigado pela explicação!",
                                    "Também tive essa mesma dúvida, ficou claro agora.",
                                    "Excelente contribuição, ajudou bastante!",
                                    "Consegui resolver seguindo esta mesma dica."
                                  ].map((replyPreset, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setReplyText(replyPreset)}
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-primary-50 hover:text-primary-700 transition cursor-pointer"
                                      title="Clica para preencher a resposta"
                                    >
                                      {replyPreset}
                                    </button>
                                  ))}
                                </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setReplyToId(null)}
                                  className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleSendComment(c.id)}
                                  disabled={submittingReply || !replyText.trim()}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>{submittingReply ? '...' : 'Responder'}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Respostas Aninhadas */}
                          {replies.length > 0 && (
                            <div className="ml-8 sm:ml-11 space-y-2.5 pt-2 border-l-2 border-slate-100 pl-3">
                              {replies.map((reply) => {
                                const isReplyInstructor = reply.userRole === 'instructor' || reply.userRole === 'admin';
                                return (
                                  <div key={reply.id} className={`p-3 rounded-xl border ${
                                    isReplyInstructor ? 'bg-blue-50/60 border-blue-200/80' : 'bg-slate-50/80 border-slate-200/80'
                                  }`}>
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {reply.userAvatar ? (
                                            <img 
                                              src={reply.userAvatar} 
                                              alt={reply.userName} 
                                              className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0" 
                                              onError={(e) => {
                                                (e.currentTarget as HTMLElement).style.display = 'none';
                                                (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                              }}
                                            />
                                          ) : null}
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                            isReplyInstructor ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                                          } ${reply.userAvatar ? 'hidden' : ''}`}>
                                            {reply.userName?.charAt(0) || 'U'}
                                          </div>
                                        <span className="text-xs font-bold text-slate-900">{reply.userName}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                                          isReplyInstructor ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                          {isReplyInstructor ? '👨‍🏫 Docente' : '🎓 Aluno'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                      </div>

                                      {isTeacherMode && (
                                        <button
                                          onClick={() => handleDeleteComment(reply.id)}
                                          className="text-slate-300 hover:text-rose-500 p-0.5 transition cursor-pointer"
                                          title="Eliminar resposta"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-700 whitespace-pre-wrap pl-8">
                                      {reply.message}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-2">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={chapterIndex === 0 && currentLesson === 0}
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-md font-medium transition ${
              chapterIndex === 0 && currentLesson === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="text-xs">Ant</span>
          </button>

          <button
            onClick={() => {
              console.log('[Mobile Nav] Botão concluir clicado');
              console.log('[Mobile Nav] currentLessonData:', currentLessonData);
              handleCompleteLesson();
            }}
            disabled={!currentLessonData}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md font-medium transition ${
              !currentLessonData
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isLessonCompleted(currentLessonData?.id || '')
                ? 'bg-emerald-600 text-white'
                : 'bg-primary-600 text-white'
            }`}
          >
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs">
              {isLessonCompleted(currentLessonData?.id || '') ? 'Ok' : 'Concluir'}
            </span>
          </button>

          <button
            onClick={goToNext}
            disabled={chapterIndex === modules.length - 1 && currentLesson === moduleLessons.length - 1}
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-md font-medium transition ${
              chapterIndex === modules.length - 1 && currentLesson === moduleLessons.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className="text-xs">Próx</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
