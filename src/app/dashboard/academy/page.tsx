'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  BookOpen, Play, Lock, CheckCircle, Clock, DollarSign, Eye, Unlock, 
  ChevronRight, ArrowRight, ArrowLeft, Award, Download, ShieldCheck, Sparkles, ExternalLink
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, Course, Module, Lesson, CourseProgress, CourseEnrollment, Certificate } from '@/lib/data';
import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';
import CertificateModal from '@/components/CertificateModal';
import { getCached, setCached } from '@/lib/pageCache';
import { soundEffects } from '@/lib/soundEffects';

export default function DashboardAcademyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>(() => getCached<Course[]>('academy:courses') || []);
  const [modules, setModules] = useState<Module[]>(() => getCached<Module[]>('academy:modules') || []);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>(() => getCached<Certificate[]>('academy:certificates') || []);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [progressList, setProgressList] = useState<CourseProgress[]>([]);
  
  // Se ja ha dados em cache, nao mostra loader — evita spinner ao navegar entre abas
  const [loading, setLoading] = useState(() => !getCached('academy:courses'));
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    // Aguardar NextAuth carregar
    if (status === 'loading') return;
    
    let currentUser: User | null = null;
    
    // Tentar NextAuth primeiro
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
    }
    
    // Fallback para sistema customizado (se NextAuth falhar ou não estiver autenticado)
    if (!currentUser) {
      currentUser = auth.getCurrentUser();
    }
    
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData(currentUser);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router]);

  const loadData = async (currentUser: User) => {
    if (!currentUser) return;

    try {
      // Limpar dados mockados do localStorage para garantir dados frescos do servidor
      dataManager.clearAcademyData();
      console.log('[Academy Dashboard] Dados do localStorage limpos');

      // Sincronizar compras pendentes de visitante para este aluno
      try {
        await fetch('/api/auth/sync-enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, userId: currentUser.id })
        });
      } catch (_) {}

      // Carregar dados sequencialmente para evitar sobrecarga
      await Promise.all([
        dataManager.fetchCoursesAsync(),
        dataManager.fetchModulesAsync(),
        dataManager.fetchLessonsAsync(),
        dataManager.fetchCertificatesAsync(currentUser.email)
      ]);
    } catch (e) {
      console.error('Erro ao buscar dados do servidor, usando dados locais:', e);
    }

    const fetchedCourses = dataManager.getCourses().filter(c => c.active);
    const fetchedModules = dataManager.getModules();
    const fetchedCerts = dataManager.getCertificates(currentUser.email);

    // Guardar em cache para navegacoes futuras sem loader
    setCached('academy:courses', fetchedCourses);
    setCached('academy:modules', fetchedModules);
    setCached('academy:certificates', fetchedCerts);

    setCourses(fetchedCourses);
    setModules(fetchedModules);
    setCertificates(fetchedCerts);
    setEnrollments(dataManager.getEnrollments(currentUser.email));
    setLoading(false);
  };

  const getCourseProgress = (courseId: string) => {
    const activeUser = user || auth.getCurrentUser();
    if (!activeUser) return null;
    return progressList.find(p => p.userId === activeUser.email && p.courseId === courseId);
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.courseId === courseId && e.status === 'active');
  };

  const handleEnroll = async (course: Course) => {
    const activeUser = user || auth.getCurrentUser() || (session?.user ? {
      id: (session.user as any)?.id || session.user.email || '',
      name: session.user.name || '',
      email: session.user.email || '',
      plan: (session.user as any)?.plan || 'none',
      status: 'active' as const,
      role: (session.user as any)?.role || 'user',
      createdAt: new Date().toISOString()
    } : null);

    if (!activeUser) {
      router.push('/login');
      return;
    }

    soundEffects.playEnrollCourseSound();

    // Inscrever no curso sem cobrar - pagamento será solicitado dentro do curso quando tentar acessar além das aulas grátis
    const enrollment = dataManager.enrollInCourse(activeUser.email, course.id);
    setEnrollments(prev => [...prev.filter(e => e.courseId !== course.id), enrollment]);
    
    // Disparar e-mail de boas-vindas ao curso
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'course_enrollment',
        to: activeUser.email,
        userName: activeUser.name,
        courseTitle: course.title
      })
    }).catch(err => console.error('Erro ao disparar email de curso:', err));

    // Redirecionar imediatamente para o curso
    router.push(`/dashboard/academy/course/${course.id}`);
  };

  const handleStartCourse = (courseId: string) => {
    router.push(`/dashboard/academy/course/${courseId}`);
  };

  if (loading) return <PageLoader text="A carregar cursos..." />;

  if (isLoggingOut) return <PageLoader text="A encerrar a sua sessão com segurança..." />;

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      auth.logout();
      signOut({ callbackUrl: '/' });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        userName={user?.name}
        userAvatar={user?.avatar}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {/* Botão Voltar ao Dashboard */}
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 shadow-sm transition font-medium text-xs sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <main>
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden mb-6">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none"></div>
                <div className="relative z-10 max-w-xl">
                  <div className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-primary-100 mb-2 border border-white/10">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    <span>Academia Web</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
                    Crie e Escale Sites Profissionais
                  </h2>
                  <p className="text-primary-100/90 text-xs sm:text-sm">
                    Cursos práticos de desenvolvimento web e hospedagem.
                  </p>
                </div>
              </div>

              {/* Meus Certificados Obtidos */}
              {certificates.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                      <Award className="h-5 w-5 text-amber-500" />
                      <span>Meus Certificados de Conclusão</span>
                    </h3>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {certificates.length} {certificates.length === 1 ? 'Certificado' : 'Certificados'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.map((cert) => (
                      <div
                        key={cert.id || cert.certificateNumber}
                        className="bg-white border-2 border-amber-300/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm">
                            <Award className="h-5 w-5" />
                          </div>
                          <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                            {cert.certificateNumber}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-900 text-base mb-1">{cert.courseTitle}</h4>
                          <p className="text-xs text-gray-500 mb-4">
                            Emitido em: {new Date(cert.completionDate || cert.createdAt).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>

                        <button
                          onClick={() => setSelectedCertificate(cert)}
                          className="w-full flex items-center justify-center space-x-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 py-2.5 rounded-xl font-bold text-xs transition"
                        >
                          <Award className="h-4 w-4 text-amber-600" />
                          <span>Visualizar / Imprimir Certificado</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Enrolled Courses */}
              {enrollments.length > 0 && (
                <section className="mb-10">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    <span>Meus Cursos em Andamento</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment) => {
                      const course = courses.find(c => c.id === enrollment.courseId);
                      if (!course) return null;

                      const progress = getCourseProgress(course.id);
                      const totalLessons = getTotalLessons(course.id);
                      const progressPercent = progress 
                        ? Math.round((progress.completedLessons.length / totalLessons) * 100)
                        : 0;
                      const moduleCount = modules.filter(m => m.courseId === course.id).length;

                      return (
                        <div 
                          key={enrollment.id} 
                          className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition cursor-pointer flex flex-col justify-between" 
                          onClick={() => handleStartCourse(course.id)}
                        >
                          {course.thumbnail ? (
                            <div className="h-40 bg-gray-100 overflow-hidden">
                              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                            </div>
                          ) : (
                            <div className="h-32 bg-gradient-to-br from-primary-600 to-indigo-700 flex items-center justify-center text-white">
                              <BookOpen className="h-10 w-10 opacity-60" />
                            </div>
                          )}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900 mb-2">{course.title}</h4>
                              <p className="text-xs text-gray-600 mb-4 line-clamp-2">{course.shortDescription}</p>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                                <span className="flex items-center space-x-1">
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span>{moduleCount} módulos</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{course.duration}</span>
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <div className="mb-4">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1 font-medium">
                                  <span>Progresso</span>
                                  <span className="font-bold text-primary-600">{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                                  <div 
                                    className="bg-primary-600 h-2 rounded-full transition-all" 
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartCourse(course.id);
                                }}
                                className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-bold text-xs transition shadow-sm"
                              >
                                <Play className="h-3.5 w-3.5" />
                                <span>Continuar Curso</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Available Courses */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-gray-700" />
                  <span>Todos os Cursos Disponíveis</span>
                </h3>
                
                {courses.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <BookOpen className="h-14 w-14 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-900 mb-1">Nenhum curso disponível</h3>
                    <p className="text-xs text-gray-500">No momento não há cursos disponíveis na academia. Por favor, volte mais tarde.</p>
                  </div>
                ) : courses.filter(c => !isEnrolled(c.id)).length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-900 mb-1">Inscrição Ativa em Todos os Cursos</h3>
                    <p className="text-xs text-gray-500">Você já está inscrito em todos os cursos disponíveis na Academia Web.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.filter(c => !isEnrolled(c.id)).map((course) => {
                      const moduleCount = modules.filter(m => m.courseId === course.id).length;
                      
                      return (
                        <div key={course.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col justify-between">
                          {course.thumbnail ? (
                            <div className="h-40 bg-gray-100 overflow-hidden">
                              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                            </div>
                          ) : (
                            <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white">
                              <BookOpen className="h-10 w-10 opacity-50" />
                            </div>
                          )}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between space-x-2 mb-2">
                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{course.title}</h4>
                                {course.accessType === 'paid' && (
                                  <span className="flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] font-extrabold shrink-0">
                                    <DollarSign className="h-3 w-3" />
                                    <span>Pago ({course.price || 500} MT)</span>
                                  </span>
                                )}
                                {course.accessType === 'free' && (
                                  <span className="flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0">
                                    <Unlock className="h-3 w-3" />
                                    <span>Gratuito</span>
                                  </span>
                                )}
                                {course.accessType === 'preview' && (
                                  <span className="flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                                    <span>🎁 {course.freeLessonsCount || 1} {course.freeLessonsCount === 1 ? 'Aula' : 'Aulas'} Grátis</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">{course.shortDescription}</p>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{course.duration}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span>{moduleCount || 13} módulos</span>
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleEnroll(course)}
                              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg font-semibold text-xs transition shadow-sm cursor-pointer bg-primary-600 hover:bg-primary-700 text-white"
                            >
                              {course.accessType === 'preview' ? (
                                <>
                                  <Play className="h-3.5 w-3.5 fill-current" />
                                  <span>Assistir {course.freeLessonsCount || 1} {course.freeLessonsCount === 1 ? 'Aula' : 'Aulas'} Grátis</span>
                                </>
                              ) : course.accessType === 'paid' ? (
                                <>
                                  <Play className="h-3.5 w-3.5 fill-current" />
                                  <span>Acessar o Curso</span>
                                </>
                              ) : (
                                <>
                                  <Play className="h-3.5 w-3.5 fill-current" />
                                  <span>Começar Grátis</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          isOpen={Boolean(selectedCertificate)}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

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

// Helper functions
function getTotalLessons(courseId: string): number {
  const modules = dataManager.getModules(courseId);
  let total = 0;
  modules.forEach(m => {
    total += dataManager.getLessons(m.id).length;
  });
  return total;
}
