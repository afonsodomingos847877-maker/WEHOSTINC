'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Toast from '@/components/Toast';
import { formatVideoEmbedUrl } from '@/lib/videoEmbed';
import { Plus, Edit, Trash2, Eye, BookOpen, DollarSign, Clock, ArrowLeft, Home, GraduationCap, Loader2, CheckCircle, XCircle, Save, X, CheckSquare, Upload, AlertTriangle, MessageCircle, Send, Check, RefreshCw, Mail, ExternalLink, Filter, Smartphone, Zap, ImageIcon } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  duration: string;
  outcome: string;
  thumbnail?: string;
  accessType: 'free' | 'paid' | 'preview';
  price?: number;
  currency?: string;
  order: number;
  active: boolean;
  freeLessonsCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Module {
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
  materialUploadType?: 'url' | 'upload';
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
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
  materialUploadType?: 'url' | 'upload';
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'course' | 'module' | 'lesson'>('course');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedCourseForModule, setSelectedCourseForModule] = useState<Course | null>(null);
  const [selectedModuleForLesson, setSelectedModuleForLesson] = useState<Module | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState({ totalRevenue: 0, lostRevenue: 0, pendingRevenue: 0, completedCount: 0, pendingCount: 0, failedCount: 0, totalLeads: 0 });
  const [salesFilter, setSalesFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [salesLoading, setSalesLoading] = useState(false);
  const [recoverySending, setRecoverySending] = useState<string | null>(null);
  const [ussdSending, setUssdSending] = useState<string | null>(null);
  const [priceModal, setPriceModal] = useState<{ show: boolean; courseId: string; courseTitle: string; price: number; originalPrice: number; accessType: 'paid' | 'free' }>({
    show: false, courseId: '', courseTitle: '', price: 199, originalPrice: 500, accessType: 'paid'
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeTab, setActiveTab] = useState<'courses' | 'modules' | 'lessons' | 'enrollments' | 'coupons'>('courses');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'percentage', discountValue: 20, maxUses: 50 });
  const [copiedClaimId, setCopiedClaimId] = useState<string | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    iconType?: 'trash' | 'phone' | 'check' | 'alert' | 'mail';
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', title?: string) => {
    setToast({ show: true, type, message, title });
  };

  // Form state
  const [formData, setFormData] = useState({
    // Course fields
    title: '',
    description: '',
    shortDescription: '',
    duration: '',
    outcome: '',
    thumbnail: '',
    accessType: 'paid' as 'free' | 'paid' | 'preview',
    price: '',
    currency: 'MZN',
    order: 1,
    active: true,
    freeLessonsCount: 1,
    // Module fields
    courseId: '',
    objective: '',
    hasVideo: false,
    videoUrl: '',
    videoTitle: '',
    videoDescription: '',
    hasMaterial: false,
    materialUrl: '',
    materialTitle: '',
    materialType: 'pdf' as 'pdf' | 'document' | 'link',
    materialUploadType: 'url' as 'url' | 'upload',
    // Lesson fields
    moduleId: '',
    content: ''
  });

  const fetchSalesData = useCallback(async () => {
    try {
      setSalesLoading(true);
      const res = await fetch('/api/academy/sales');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSalesOrders(data.orders || []);
          if (data.stats) setSalesStats(data.stats);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar vendas de cursos:', e);
    } finally {
      setSalesLoading(false);
    }
  }, []);

  const handleSavePrice = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/academy/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_price',
          courseId: priceModal.courseId,
          price: priceModal.price,
          originalPrice: priceModal.originalPrice,
          accessType: priceModal.accessType
        })
      });
      const data = await res.json();
      if (data.success) {
        setCourses(prev => prev.map(c => c.id === priceModal.courseId ? { ...c, price: priceModal.price, accessType: priceModal.accessType, originalPrice: priceModal.originalPrice } as any : c));
        setPriceModal(prev => ({ ...prev, show: false }));
        showToast('Preço do curso atualizado com sucesso!', 'success', 'Preço Salvo');
      } else {
        showToast(data.error || 'Erro ao atualizar preço.', 'error', 'Erro no Preço');
      }
    } catch (e: any) {
      showToast(e.message || 'Erro ao salvar preço.', 'error', 'Erro');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    setConfirmModal({
      show: true,
      title: 'Aprovar Pagamento Manualmente',
      message: 'Deseja aprovar manualmente este pagamento e libertar imediatamente o acesso ao curso para o aluno?',
      confirmText: '✓ Aprovar e Libertar Curso',
      cancelText: 'Voltar',
      variant: 'success',
      iconType: 'check',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch('/api/academy/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'manual_approve', orderId })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Pagamento aprovado! Matrícula ativada e instruções enviadas por e-mail.', 'success', 'Pagamento Aprovado');
            fetchSalesData();
            fetchCourses();
          } else {
            showToast(data.error || 'Erro ao aprovar pagamento.', 'error', 'Falha na Aprovação');
          }
        } catch (e: any) {
          showToast(e.message || 'Erro na aprovação do pagamento.', 'error', 'Erro');
        }
      }
    });
  };

  const handleSendRecoveryEmail = async (orderId: string) => {
    try {
      setRecoverySending(orderId);
      const res = await fetch('/api/academy/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_recovery_email', orderId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('E-mail de recuperação enviado com sucesso ao lead!', 'success', 'E-mail Enviado');
        fetchSalesData();
      } else {
        showToast(data.error || 'Erro ao enviar e-mail de recuperação.', 'error', 'Falha no Envio');
      }
    } catch (e: any) {
      showToast(e.message || 'Erro no envio do e-mail.', 'error', 'Erro');
    } finally {
      setRecoverySending(null);
    }
  };

  const handleMarkFailed = async (orderId: string) => {
    setConfirmModal({
      show: true,
      title: 'Cancelar Pedido / Lead',
      message: 'Tem certeza que deseja marcar este pedido como cancelado ou perdido?',
      confirmText: 'Marcar Cancelado',
      cancelText: 'Voltar',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          await fetch('/api/academy/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_failed', orderId })
          });
          showToast('Pedido marcado como cancelado.', 'info', 'Status Atualizado');
          fetchSalesData();
        } catch (e) {
          console.warn('Erro ao cancelar pedido:', e);
          showToast('Erro ao atualizar status do pedido.', 'error', 'Erro');
        }
      }
    });
  };

  const handleResendUssd = async (orderId: string, phone: string) => {
    if (!phone) {
      showToast('Este pedido não tem número de telefone associado.', 'warning', 'Sem Telefone');
      return;
    }
    setConfirmModal({
      show: true,
      title: 'Reenviar Cobrança M-Pesa (USSD)',
      message: `Deseja reenviar o prompt USSD (M-Pesa) para o telemóvel ${phone}? O telemóvel do cliente vai acender instantaneamente para digitar o PIN.`,
      confirmText: '📲 Reenviar USSD Agora',
      cancelText: 'Cancelar',
      variant: 'warning',
      iconType: 'phone',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          setUssdSending(orderId);
          const res = await fetch('/api/academy/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resend_ussd', orderId })
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message || 'Prompt USSD enviado! O cliente recebeu a solicitação de PIN no telemóvel.', 'success', 'Prompt USSD Enviado');
            fetchSalesData();
          } else {
            showToast(data.error || 'Erro ao disparar prompt USSD.', 'error', 'Falha no USSD');
          }
        } catch (e: any) {
          showToast(e.message || 'Erro ao comunicar com gateway de pagamento.', 'error', 'Erro de Conexão');
        } finally {
          setUssdSending(null);
        }
      }
    });
  };

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      
      // Limpar localStorage para garantir dados frescos
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wehosthere_courses');
        localStorage.removeItem('wehosthere_modules');
        localStorage.removeItem('wehosthere_lessons');
      }
      
      const [coursesRes, modulesRes, lessonsRes, enrRes, cpnRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/modules'),
        fetch('/api/lessons'),
        fetch('/api/academy/enrollments').catch(() => null),
        fetch('/api/academy/coupons').catch(() => null)
      ]);
      
      const coursesData = await coursesRes.json();
      const modulesData = await modulesRes.json();
      const lessonsData = await lessonsRes.json();
      
      console.log('[Admin Academy] Dados atualizados:');
      console.log('[Admin Academy] Cursos:', coursesData.courses?.length || 0);
      console.log('[Admin Academy] Módulos:', modulesData.modules?.length || 0);
      console.log('[Admin Academy] Lições:', lessonsData.lessons?.length || 0);
      
      if (coursesData.courses) setCourses(coursesData.courses);
      if (modulesData.modules) setModules(modulesData.modules);
      if (lessonsData.lessons) setLessons(lessonsData.lessons);
      if (enrRes && enrRes.ok) { const ed = await enrRes.json(); if (ed.enrollments) setEnrollments(ed.enrollments); }
      if (cpnRes && cpnRes.ok) { const cd = await cpnRes.json(); if (cd.coupons) setCoupons(cd.coupons); }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchSalesData();
  }, [fetchCourses, fetchSalesData]);

  // Clear selection when switching tabs or changing filters
  useEffect(() => {
    setSelectedModules(new Set());
    setSelectedLessons(new Set());
  }, [activeTab, selectedCourseFilter, selectedModuleFilter, searchTerm]);

  const handleCreate = (type: 'course' | 'module' | 'lesson', parentItem?: Course | Module) => {
    setModalType(type);
    setEditingCourse(null);
    setEditingModule(null);
    setEditingLesson(null);
    
    if (type === 'course') {
      setFormData({
        title: '',
        description: '',
        shortDescription: '',
        duration: '',
        outcome: '',
        thumbnail: '',
        accessType: 'paid',
        price: '',
        currency: 'MZN',
        order: courses.length + 1,
        active: true,
        freeLessonsCount: 1,
        courseId: '',
        objective: '',
        hasVideo: false,
        videoUrl: '',
        videoTitle: '',
        videoDescription: '',
        hasMaterial: false,
        materialUrl: '',
        materialTitle: '',
        materialType: 'pdf',
        materialUploadType: 'url',
        moduleId: '',
        content: ''
      });
    } else if (type === 'module' && parentItem) {
      setSelectedCourseForModule(parentItem as Course);
      setFormData({
        title: '',
        description: '',
        shortDescription: '',
        duration: '',
        outcome: '',
        thumbnail: '',
        accessType: 'paid',
        price: '',
        currency: 'MZN',
        order: modules.filter(m => m.courseId === parentItem.id).length + 1,
        active: true,
        freeLessonsCount: 1,
        courseId: parentItem.id,
        objective: '',
        hasVideo: false,
        videoUrl: '',
        videoTitle: '',
        videoDescription: '',
        hasMaterial: false,
        materialUrl: '',
        materialTitle: '',
        materialType: 'pdf',
        materialUploadType: 'url',
        moduleId: '',
        content: ''
      });
    } else if (type === 'lesson' && parentItem) {
      setSelectedModuleForLesson(parentItem as Module);
      setFormData({
        title: '',
        description: '',
        shortDescription: '',
        duration: '',
        outcome: '',
        thumbnail: '',
        accessType: 'paid',
        price: '',
        currency: 'MZN',
        order: lessons.filter(l => l.moduleId === parentItem.id).length + 1,
        active: true,
        freeLessonsCount: 1,
        courseId: '',
        objective: '',
        hasVideo: false,
        videoUrl: '',
        videoTitle: '',
        videoDescription: '',
        hasMaterial: false,
        materialUrl: '',
        materialTitle: '',
        materialType: 'pdf',
        materialUploadType: 'url',
        moduleId: parentItem.id,
        content: ''
      });
    }
    
    setShowModal(true);
  };

  const handleEdit = (item: Course | Module | Lesson, type: 'course' | 'module' | 'lesson') => {
    setModalType(type);
    
    if (type === 'course') {
      const course = item as Course;
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription,
        duration: course.duration,
        outcome: course.outcome,
        thumbnail: course.thumbnail || '',
        accessType: course.accessType,
        price: course.price?.toString() || '',
        currency: course.currency || 'MZN',
        order: course.order,
        active: course.active,
        freeLessonsCount: course.freeLessonsCount || 1,
        courseId: '',
        objective: '',
        hasVideo: false,
        videoUrl: '',
        videoTitle: '',
        videoDescription: '',
        hasMaterial: false,
        materialUrl: '',
        materialTitle: '',
        materialType: 'pdf',
        materialUploadType: 'url',
        moduleId: '',
        content: ''
      });
    } else if (type === 'module') {
      const moduleItem = item as Module;
      setEditingModule(moduleItem);
      setFormData({
        title: moduleItem.title,
        description: moduleItem.description,
        shortDescription: '',
        duration: '',
        outcome: '',
        thumbnail: '',
        accessType: 'paid',
        price: '',
        currency: 'MZN',
        order: moduleItem.order,
        active: moduleItem.active,
        freeLessonsCount: 1,
        courseId: moduleItem.courseId,
        objective: moduleItem.objective,
        hasVideo: moduleItem.hasVideo,
        videoUrl: moduleItem.videoUrl || '',
        videoTitle: moduleItem.videoTitle || '',
        videoDescription: moduleItem.videoDescription || '',
        hasMaterial: moduleItem.hasMaterial,
        materialUrl: moduleItem.materialUrl || '',
        materialTitle: moduleItem.materialTitle || '',
        materialType: moduleItem.materialType || 'pdf',
        materialUploadType: moduleItem.materialUploadType || 'url',
        moduleId: '',
        content: ''
      });
    } else if (type === 'lesson') {
      const lesson = item as Lesson;
      setEditingLesson(lesson);
      setFormData({
        title: lesson.title,
        description: '',
        shortDescription: '',
        duration: '',
        outcome: '',
        thumbnail: '',
        accessType: 'paid',
        price: '',
        currency: 'MZN',
        order: lesson.order,
        active: lesson.active,
        freeLessonsCount: 1,
        courseId: '',
        objective: '',
        hasVideo: lesson.hasVideo,
        videoUrl: lesson.videoUrl || '',
        videoTitle: lesson.videoTitle || '',
        videoDescription: lesson.videoDescription || '',
        hasMaterial: lesson.hasMaterial,
        materialUrl: lesson.materialUrl || '',
        materialTitle: lesson.materialTitle || '',
        materialType: lesson.materialType || 'pdf',
        materialUploadType: lesson.materialUploadType || 'url',
        moduleId: lesson.moduleId,
        content: lesson.content
      });
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id: string, type: 'course' | 'module' | 'lesson') => {
    const itemName = type === 'course' ? 'curso' : type === 'module' ? 'módulo' : 'lição';
    
    setConfirmModal({
      show: true,
      title: `Confirmar Exclusão`,
      message: `Tem certeza que deseja remover este ${itemName}? Esta ação não pode ser desfeita e todos os dados associados serão perdidos.`,
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        
        try {
          const endpoint = type === 'course' ? '/api/courses' : type === 'module' ? '/api/modules' : '/api/lessons';
          const idParam = type === 'course' ? 'courseId' : type === 'module' ? 'moduleId' : 'lessonId';

          console.log(`[Admin Academy] Deletando ${itemName}:`, id);
          console.log(`[Admin Academy] Endpoint:`, endpoint);
          console.log(`[Admin Academy] Payload:`, JSON.stringify({ action: 'delete', [idParam]: id }));

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', [idParam]: id })
          });

          console.log(`[Admin Academy] Response status:`, response.status);
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`[Admin Academy] Erro ao deletar ${itemName}:`, errorData);
            setConfirmModal({
              show: true,
              title: 'Erro na Exclusão',
              message: `Erro ao remover ${itemName}: ${errorData.error || 'Erro desconhecido'}`,
              onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
            });
            return;
          }

          const responseData = await response.json();
          console.log(`[Admin Academy] ${itemName} deletado com sucesso:`, responseData);
          
          // Pequeno delay para garantir que o servidor tenha processado
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Recarregar todos os dados
          console.log('[Admin Academy] Recarregando dados...');
          await fetchCourses();
          console.log('[Admin Academy] Dados recarregados');
        } catch (error) {
          console.error(`[Admin Academy] Erro ao remover ${itemName}:`, error);
          setConfirmModal({
            show: true,
            title: 'Erro na Exclusão',
            message: `Erro ao remover ${itemName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
          });
        }
      }
    });
  };

  const handleMaterialUpload = async (file: File) => {
    try {
      setUploadingMaterial(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      if (!response.ok) {
        throw new Error('Falha no upload');
      }

      const data = await response.json();
      if (data.success && data.url) {
        setFormData({ ...formData, materialUrl: data.url });
        return data.url;
      } else {
        throw new Error('Upload falhou');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setConfirmModal({
        show: true,
        title: 'Erro no Upload',
        message: 'Erro ao fazer upload do arquivo. Tente novamente.',
        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
      });
      return null;
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    try {
      setUploadingThumbnail(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      if (!response.ok) {
        throw new Error('Falha no upload da capa');
      }

      const data = await response.json();
      if (data.success && data.url) {
        setFormData(prev => ({ ...prev, thumbnail: data.url }));
        return data.url;
      } else {
        throw new Error(data.error || 'Upload falhou');
      }
    } catch (error: any) {
      console.error('Erro no upload da capa:', error);
      setConfirmModal({
        show: true,
        title: 'Erro no Upload da Capa',
        message: 'Não foi possível carregar a imagem selecionada: ' + (error.message || 'Tente novamente.'),
        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
      });
      return null;
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleDeleteAllModules = async () => {
    if (selectedModules.size === 0) {
      setConfirmModal({
        show: true,
        title: 'Aviso',
        message: 'Selecione pelo menos um módulo para remover',
        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
      });
      return;
    }

    setConfirmModal({
      show: true,
      title: 'Confirmar Exclusão em Massa',
      message: `Tem certeza que deseja remover ${selectedModules.size} módulo(s) selecionado(s)? Esta ação também removerá todas as lições associadas. Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        
        try {
          setIsSaving(true);
          let successCount = 0;
          let errorCount = 0;

          for (const moduleId of Array.from(selectedModules)) {
            try {
              const response = await fetch('/api/modules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', moduleId })
              });

              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
              }
            } catch (error) {
              errorCount++;
              console.error(`Erro ao remover módulo ${moduleId}:`, error);
            }
          }

          setIsSaving(false);
          setSelectedModules(new Set());
          fetchCourses();

          setConfirmModal({
            show: true,
            title: 'Exclusão Concluída',
            message: errorCount === 0 
              ? `${successCount} módulos removidos com sucesso!`
              : `${successCount} módulos removidos com sucesso, ${errorCount} falharam.`,
            onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
          });
        } catch (error) {
          setIsSaving(false);
          setConfirmModal({
            show: true,
            title: 'Erro na Exclusão',
            message: 'Erro ao remover módulos. Tente novamente.',
            onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
          });
        }
      }
    });
  };

  const handleSelectAllModules = () => {
    const filteredModules = modules.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = selectedCourseFilter === 'all' || m.courseId === selectedCourseFilter;
      return matchesSearch && matchesCourse;
    });

    if (filteredModules.every(m => selectedModules.has(m.id))) {
      // Deselect all
      setSelectedModules(new Set());
    } else {
      // Select all visible
      setSelectedModules(new Set(filteredModules.map(m => m.id)));
    }
  };

  const handleToggleModule = (moduleId: string) => {
    const newSelected = new Set(selectedModules);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModules(newSelected);
  };

  const handleDeleteAllLessons = async () => {
    if (selectedLessons.size === 0) {
      setConfirmModal({
        show: true,
        title: 'Aviso',
        message: 'Selecione pelo menos uma lição para remover',
        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
      });
      return;
    }

    setConfirmModal({
      show: true,
      title: 'Confirmar Exclusão em Massa',
      message: `Tem certeza que deseja remover ${selectedLessons.size} lição(ões) selecionada(s)? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        
        try {
          setIsSaving(true);
          let successCount = 0;
          let errorCount = 0;

          for (const lessonId of Array.from(selectedLessons)) {
            try {
              const response = await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', lessonId })
              });

              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
              }
            } catch (error) {
              errorCount++;
              console.error(`Erro ao remover lição ${lessonId}:`, error);
            }
          }

          setIsSaving(false);
          setSelectedLessons(new Set());
          fetchCourses();

          setConfirmModal({
            show: true,
            title: 'Exclusão Concluída',
            message: errorCount === 0 
              ? `${successCount} lições removidas com sucesso!`
              : `${successCount} lições removidas com sucesso, ${errorCount} falharam.`,
            onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
          });
        } catch (error) {
          setIsSaving(false);
          setConfirmModal({
            show: true,
            title: 'Erro na Exclusão',
            message: 'Erro ao remover lições. Tente novamente.',
            onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
          });
        }
      }
    });
  };

  const handleSelectAllLessons = () => {
    const filteredLessons = lessons.filter(l => {
      const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = selectedModuleFilter === 'all' || l.moduleId === selectedModuleFilter;
      return matchesSearch && matchesModule;
    });

    if (filteredLessons.every(l => selectedLessons.has(l.id))) {
      // Deselect all
      setSelectedLessons(new Set());
    } else {
      // Select all visible
      setSelectedLessons(new Set(filteredLessons.map(l => l.id)));
    }
  };

  const handleToggleLesson = (lessonId: string) => {
    const newSelected = new Set(selectedLessons);
    if (newSelected.has(lessonId)) {
      newSelected.delete(lessonId);
    } else {
      newSelected.add(lessonId);
    }
    setSelectedLessons(newSelected);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setConfirmModal({
        show: true,
        title: 'Campo Obrigatório',
        message: 'Por favor, preencha o título',
        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
      });
      return;
    }

    if (modalType === 'course' && !formData.description.trim()) {
      setConfirmModal({
        show: true,
        title: 'Campo Obrigatório',
        message: 'Por favor, preencha a descrição do curso',
        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
      });
      return;
    }

    if (modalType === 'lesson' && !formData.content.trim()) {
      setConfirmModal({
        show: true,
        title: 'Campo Obrigatório',
        message: 'Por favor, preencha o conteúdo da lição',
        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
      });
      return;
    }

    setIsSaving(true);
    try {
      let endpoint = '', action, payload;

      if (modalType === 'course') {
        endpoint = '/api/courses';
        const courseData = {
          title: formData.title,
          description: formData.description,
          shortDescription: formData.shortDescription,
          duration: formData.duration,
          outcome: formData.outcome,
          thumbnail: formData.thumbnail,
          accessType: formData.accessType,
          price: formData.accessType === 'paid' ? parseFloat(formData.price) || 0 : undefined,
          currency: formData.currency,
          order: parseInt(formData.order.toString()) || 1,
          active: formData.active,
          freeLessonsCount: parseInt(formData.freeLessonsCount.toString()) || 1
        };

        action = editingCourse ? 'update' : 'create';
        payload = editingCourse 
          ? { action, course: { ...courseData, id: editingCourse.id } }
          : { action, course: courseData };

      } else if (modalType === 'module') {
        endpoint = '/api/modules';
        const moduleData = {
          courseId: formData.courseId,
          title: formData.title,
          description: formData.description,
          objective: formData.objective,
          hasVideo: formData.hasVideo,
          videoUrl: formData.hasVideo ? formData.videoUrl : undefined,
          videoTitle: formData.hasVideo ? formData.videoTitle : undefined,
          videoDescription: formData.hasVideo ? formData.videoDescription : undefined,
          hasMaterial: formData.hasMaterial,
          materialUrl: formData.hasMaterial ? formData.materialUrl : undefined,
          materialTitle: formData.hasMaterial ? formData.materialTitle : undefined,
          materialType: formData.hasMaterial ? formData.materialType : undefined,
          order: parseInt(formData.order.toString()) || 1,
          active: formData.active
        };

        action = editingModule ? 'update' : 'create';
        payload = editingModule 
          ? { action, module: { ...moduleData, id: editingModule.id } }
          : { action, module: moduleData };

      } else if (modalType === 'lesson') {
        endpoint = '/api/lessons';
        const lessonData = {
          moduleId: formData.moduleId,
          title: formData.title,
          content: formData.content,
          hasVideo: formData.hasVideo,
          videoUrl: formData.hasVideo ? formData.videoUrl : undefined,
          videoTitle: formData.hasVideo ? formData.videoTitle : undefined,
          videoDescription: formData.hasVideo ? formData.videoDescription : undefined,
          hasMaterial: formData.hasMaterial,
          materialUrl: formData.hasMaterial ? formData.materialUrl : undefined,
          materialTitle: formData.hasMaterial ? formData.materialTitle : undefined,
          materialType: formData.hasMaterial ? formData.materialType : undefined,
          order: parseInt(formData.order.toString()) || 1,
          active: formData.active
        };

        action = editingLesson ? 'update' : 'create';
        payload = editingLesson 
          ? { action, lesson: { ...lessonData, id: editingLesson.id } }
          : { action, lesson: lessonData };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowModal(false);
        // Recarregar todos os dados
        fetchCourses();
      } else {
        const error = await response.json();
        setConfirmModal({
          show: true,
          title: 'Erro ao Salvar',
          message: error.error || 'Erro ao salvar',
          onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
        });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setConfirmModal({
        show: true,
        title: 'Erro ao Salvar',
        message: 'Erro ao salvar',
        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getAccessTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      free: 'Gratuito',
      paid: 'Pago',
      preview: 'Preview'
    };
    return labels[type] || type;
  };

  const getAccessTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      free: 'bg-green-100 text-green-800',
      paid: 'bg-blue-100 text-blue-800',
      preview: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && course.active) ||
                         (filter === 'inactive' && !course.active);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">A carregar cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Voltar</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-bold text-gray-900">Gestão de Cursos</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/academy"
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition"
              >
                <span>Ver Academia Pública ↗</span>
              </Link>
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition text-sm font-medium"
              >
                <Home className="h-4 w-4" />
                <span>Ver Site</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Total de Cursos</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{courses.length}</p>
              </div>
              <BookOpen className="h-7 w-7 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Cursos Pagos</p>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {courses.filter(c => c.accessType === 'paid' || (Number(c.price || 0) > 0)).length}
                </p>
              </div>
              <DollarSign className="h-7 w-7 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Faturamento Vendas</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {(salesStats.totalRevenue || 0).toLocaleString('pt-MZ')} <span className="text-xs font-bold">MT</span>
                </p>
              </div>
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Vendas a Recuperar</p>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {salesStats.failedCount + salesStats.pendingCount}
                </p>
              </div>
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-6 py-4 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'courses'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Cursos</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">{courses.length}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`px-6 py-4 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'modules'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Módulos</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">{modules.length}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-6 py-4 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'lessons'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Lições</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">{lessons.length}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`px-6 py-4 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'enrollments'
                  ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/70'
                  : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>Vendas, Pagamentos & Leads</span>
                <span className="bg-emerald-200 text-emerald-950 font-black px-2 py-0.5 rounded-full text-xs">
                  {salesOrders.length || 0}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-6 py-4 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'coupons'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <CheckSquare className="h-4 w-4" />
                <span>Cupões</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">{coupons.length}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder={`Buscar ${activeTab === 'courses' ? 'cursos' : activeTab === 'modules' ? 'módulos' : 'lições'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full"
                />
                <Eye className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              {activeTab === 'courses' && (
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              )}
              {activeTab === 'modules' && (
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto"
                >
                  <option value="all">Todos os Cursos</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              )}
              {activeTab === 'lessons' && (
                <select
                  value={selectedModuleFilter}
                  onChange={(e) => setSelectedModuleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto"
                >
                  <option value="all">Todos os Módulos</option>
                  {modules.map(module => {
                    const course = courses.find(c => c.id === module.courseId);
                    return (
                      <option key={module.id} value={module.id}>
                        {course?.title ? `${course.title} - ` : ''}{module.title}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full">
              {activeTab === 'modules' && modules.length > 0 && (
                <>
                  <button
                    onClick={handleSelectAllModules}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium text-xs sm:text-sm"
                  >
                    <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Selecionar Todos</span>
                  </button>
                  <button
                    onClick={handleDeleteAllModules}
                    disabled={isSaving || selectedModules.size === 0}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">{isSaving ? 'Removendo...' : `Remover (${selectedModules.size})`}</span>
                  </button>
                </>
              )}
              {activeTab === 'lessons' && lessons.length > 0 && (
                <>
                  <button
                    onClick={handleSelectAllLessons}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium text-xs sm:text-sm"
                  >
                    <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Selecionar Todos</span>
                  </button>
                  <button
                    onClick={handleDeleteAllLessons}
                    disabled={isSaving || selectedLessons.size === 0}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">{isSaving ? 'Removendo...' : `Remover (${selectedLessons.size})`}</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  if (activeTab === 'courses') {
                    handleCreate('course');
                  } else if (activeTab === 'modules') {
                    if (courses.length === 0) {
                      setConfirmModal({
                        show: true,
                        title: 'Aviso',
                        message: 'Crie um curso primeiro antes de adicionar módulos',
                        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
                      });
                      return;
                    }
                    // Simple implementation - prompt to select course
                    const course = courses[0]; // Default to first course
                    handleCreate('module', course);
                  } else if (activeTab === 'lessons') {
                    if (modules.length === 0) {
                      setConfirmModal({
                        show: true,
                        title: 'Aviso',
                        message: 'Crie um módulo primeiro antes de adicionar lições',
                        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
                      });
                      return;
                    }
                    // Simple implementation - prompt to select module
                    const selectedModule = modules[0]; // Default to first module
                    handleCreate('lesson', selectedModule);
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Novo {activeTab === 'courses' ? 'Curso' : activeTab === 'modules' ? 'Módulo' : 'Lição'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {activeTab === 'courses' && (
            <>
              {filteredCourses.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Nenhum curso encontrado</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm ? 'Tente uma busca diferente' : 'Comece criando seu primeiro curso'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aulas Grátis</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordem</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-start space-x-2">
                              {course.thumbnail && (
                                <img
                                  src={course.thumbnail}
                                  alt={course.title}
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{course.title}</p>
                                <p className="text-sm text-gray-500 truncate">{course.shortDescription}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccessTypeColor(course.accessType)}`}>
                              {getAccessTypeLabel(course.accessType)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {course.accessType === 'paid' ? (
                              <span className="font-medium">{course.price?.toLocaleString('pt-MZ')} {course.currency}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{course.duration}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              course.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {course.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {course.accessType === 'free' ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <span className="font-medium text-emerald-600">{course.freeLessonsCount || 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{course.order}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => {
                                  setPriceModal({
                                    show: true,
                                    courseId: course.id,
                                    courseTitle: course.title,
                                    price: course.price || 199,
                                    originalPrice: (course as any).originalPrice || 500,
                                    accessType: course.accessType === 'free' ? 'free' : 'paid'
                                  });
                                }}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Alterar Preço e Promoção"
                              >
                                <DollarSign className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleEdit(course, 'course')}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Editar"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(course.id, 'course')}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Excluir"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'modules' && (
            <>
              {modules.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Nenhum módulo encontrado</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm ? 'Tente uma busca diferente' : 'Comece criando seu primeiro módulo'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={modules.length > 0 && modules.filter(m => {
                              const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    m.description.toLowerCase().includes(searchTerm.toLowerCase());
                              const matchesCourse = selectedCourseFilter === 'all' || m.courseId === selectedCourseFilter;
                              return matchesSearch && matchesCourse;
                            }).every(m => selectedModules.has(m.id))}
                            onChange={handleSelectAllModules}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[30%] min-w-[220px]">Módulo</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[25%] min-w-[200px]">Curso</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[25%] min-w-[200px]">Objetivo</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-28 min-w-[100px]">Conteúdo</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-24 min-w-[90px]">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider w-24 min-w-[90px]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {modules.filter(m => {
                        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                              m.description.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesCourse = selectedCourseFilter === 'all' || m.courseId === selectedCourseFilter;
                        return matchesSearch && matchesCourse;
                      }).map((module) => {
                        const course = courses.find(c => c.id === module.courseId);
                        return (
                          <tr key={module.id} className="hover:bg-gray-50/80 transition">
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={selectedModules.has(module.id)}
                                onChange={() => handleToggleModule(module.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-gray-900 text-sm">{module.title}</p>
                              {module.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed" title={module.description}>
                                  {module.description}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="min-w-[180px]">
                                <span className="font-semibold text-gray-800 text-xs line-clamp-2 leading-relaxed" title={course?.title}>
                                  {course?.title || '—'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="min-w-[180px]">
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed" title={module.objective}>
                                  {module.objective || '—'}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {module.hasVideo ? (
                                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                                    🎥 Vídeo
                                  </span>
                                ) : null}
                                {module.hasMaterial ? (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                                    📄 Material
                                  </span>
                                ) : null}
                                {!module.hasVideo && !module.hasMaterial && (
                                  <span className="text-gray-400 text-xs">Texto</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                module.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {module.active ? '✓ Ativo' : '✕ Inativo'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => handleEdit(module, 'module')}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Editar Módulo"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(module.id, 'module')}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Excluir Módulo"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'lessons' && (
            <>
              {lessons.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Nenhuma lição encontrada</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm ? 'Tente uma busca diferente' : 'Comece criando sua primeira lição'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={lessons.length > 0 && lessons.filter(l => {
                              const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    l.content.toLowerCase().includes(searchTerm.toLowerCase());
                              const matchesModule = selectedModuleFilter === 'all' || l.moduleId === selectedModuleFilter;
                              return matchesSearch && matchesModule;
                            }).every(l => selectedLessons.has(l.id))}
                            onChange={handleSelectAllLessons}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[35%] min-w-[220px]">Lição</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[28%] min-w-[200px]">Módulo & Curso</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-28 min-w-[100px]">Conteúdo</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-24 min-w-[90px]">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider w-24 min-w-[90px]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {lessons.filter(l => {
                        const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                              l.content.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesModule = selectedModuleFilter === 'all' || l.moduleId === selectedModuleFilter;
                        return matchesSearch && matchesModule;
                      }).map((lesson) => {
                        const parentModule = modules.find(m => m.id === lesson.moduleId);
                        const course = parentModule ? courses.find(c => c.id === parentModule.courseId) : null;
                        return (
                          <tr key={lesson.id} className="hover:bg-gray-50/80 transition">
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={selectedLessons.has(lesson.id)}
                                onChange={() => handleToggleLesson(lesson.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-gray-900 text-sm">{lesson.title}</p>
                              {lesson.content && (
                                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed" title={lesson.content}>
                                  {lesson.content}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="min-w-[180px]">
                                <span className="font-semibold text-gray-800 text-xs block">{parentModule?.title || '—'}</span>
                                {course && (
                                  <span className="text-[11px] text-indigo-600 font-medium line-clamp-1 block mt-0.5" title={course.title}>
                                    {course.title}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {lesson.hasVideo ? (
                                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                                    🎥 Vídeo
                                  </span>
                                ) : null}
                                {lesson.hasMaterial ? (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                                    📄 Material
                                  </span>
                                ) : null}
                                {!lesson.hasVideo && !lesson.hasMaterial && (
                                  <span className="text-gray-400 text-xs">Texto</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                lesson.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {lesson.active ? '✓ Ativo' : '✕ Inativo'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => handleEdit(lesson, 'lesson')}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Editar Lição"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(lesson.id, 'lesson')}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Excluir Lição"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}


          {/* TAB: VENDAS, PAGAMENTOS & LEADS (RECUPERAÇÃO) */}
          {activeTab === 'enrollments' && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Gestão de Vendas & Leads da Academia</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Recupere vendas pendentes/canceladas diretamente por WhatsApp ou E-mail.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSalesFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${salesFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Todos ({salesOrders.length})
                  </button>
                  <button
                    onClick={() => setSalesFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${salesFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    Pagos ({salesStats.completedCount})
                  </button>
                  <button
                    onClick={() => setSalesFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${salesFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                  >
                    Pendentes ({salesStats.pendingCount})
                  </button>
                  <button
                    onClick={() => setSalesFilter('failed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${salesFilter === 'failed' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                  >
                    Falhados / Cancelados ({salesStats.failedCount})
                  </button>
                  <button
                    onClick={fetchSalesData}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    title="Atualizar Vendas"
                  >
                    <RefreshCw className={`h-4 w-4 ${salesLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {salesOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Nenhuma tentativa de compra ou lead registada ainda.</p>
                  <p className="text-gray-400 text-xs mt-1">Quando os alunos visitarem o checkout público, aparecerão aqui automaticamente.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">ID / Data</th>
                        <th className="px-4 py-3">Lead / Aluno</th>
                        <th className="px-4 py-3">Curso & Valor</th>
                        <th className="px-4 py-3">Método & Status</th>
                        <th className="px-4 py-3 text-right">Ações de Recuperação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salesOrders
                        .filter(order => {
                          if (salesFilter === 'completed') return order.status === 'completed';
                          if (salesFilter === 'pending') return order.status === 'pending' || order.status === 'in_progress';
                          if (salesFilter === 'failed') return order.status === 'cancelled' || order.status === 'suspended' || order.status === 'failed';
                          return true;
                        })
                        .map(order => {
                          const isPaid = order.status === 'completed';
                          const isPending = order.status === 'pending' || order.status === 'in_progress';
                          const phoneClean = (order.clientPhone || '').replace(/\D/g, '');
                          const waText = encodeURIComponent(`Olá ${order.clientName || ''}, tudo bem? Sou da equipa WeHostHere. Notámos que iniciou o pedido para o ${order.serviceName || 'Curso'}, mas não chegou a concluir. Teve alguma dúvida ou gostaria de finalizar com M-Pesa / e-Mola?`);
                          const waLink = phoneClean ? `https://wa.me/${phoneClean.startsWith('258') ? phoneClean : '258' + phoneClean}?text=${waText}` : null;

                          return (
                            <tr key={order.id || order._id} className="hover:bg-gray-50/80 transition">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="font-mono text-xs font-bold text-gray-800 block">{order.id}</span>
                                <span className="text-[11px] text-gray-400">
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-MZ') : 'Hoje'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-gray-900">{order.clientName || 'Lead Visitante'}</p>
                                <p className="text-xs text-gray-500 font-mono">{order.clientEmail}</p>
                                {order.clientPhone && (
                                  <p className="text-xs text-emerald-600 font-semibold">{order.clientPhone}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900 truncate max-w-[220px]">{order.serviceName}</p>
                                <p className="text-xs font-bold text-indigo-700">{order.amount || 0} MT</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-bold uppercase text-gray-500 block mb-1">{order.paymentMethod || 'mpesa'}</span>
                                {isPaid && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                    ✓ Pago
                                  </span>
                                )}
                                {isPending && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                    ⏳ Pendente
                                  </span>
                                )}
                                {!isPaid && !isPending && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                    ✕ Cancelado
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* WhatsApp Recovery Button */}
                                  {waLink && (
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-xs"
                                      title="Recuperar pelo WhatsApp"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                      <span className="hidden md:inline">WhatsApp</span>
                                    </a>
                                  )}

                                  {/* Re-send USSD Push Button (M-Pesa) */}
                                  {!isPaid && order.clientPhone && (
                                    <button
                                      onClick={() => handleResendUssd(order.id, order.clientPhone)}
                                      disabled={ussdSending === order.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow-xs"
                                      title="Reenviar USSD Push para o telemóvel do cliente digitar o PIN do M-Pesa"
                                    >
                                      <Smartphone className={`h-3.5 w-3.5 ${ussdSending === order.id ? 'animate-pulse' : ''}`} />
                                      <span className="hidden md:inline">
                                        {ussdSending === order.id ? 'A enviar...' : 'Reenviar PIN'}
                                      </span>
                                    </button>
                                  )}

                                  {/* Email Recovery Button */}
                                  {!isPaid && (
                                    <button
                                      onClick={() => handleSendRecoveryEmail(order.id)}
                                      disabled={recoverySending === order.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                                      title="Enviar E-mail de Recuperação"
                                    >
                                      <Mail className="h-3.5 w-3.5" />
                                      <span className="hidden md:inline">
                                        {recoverySending === order.id ? 'A enviar...' : 'E-mail'}
                                      </span>
                                    </button>
                                  )}

                                  {/* Manual Approval Button */}
                                  {!isPaid && (
                                    <button
                                      onClick={() => handleApproveOrder(order.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition"
                                      title="Aprovar Pagamento Manualmente"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      <span className="hidden md:inline">Aprovar</span>
                                    </button>
                                  )}

                                  {/* Mark Failed Button */}
                                  {isPending && (
                                    <button
                                      onClick={() => handleMarkFailed(order.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                      title="Marcar como Perdido / Cancelado"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: CUPÕES */}
          {activeTab === 'coupons' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Cupões de Desconto</h3>
                  <p className="text-xs text-gray-500">Crie códigos promocionais para campanhas de marketing dos cursos.</p>
                </div>
                <button
                  onClick={() => setShowCouponModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                >
                  + Novo Cupom
                </button>
              </div>

              {coupons.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                  <CheckSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-semibold">Nenhum cupom ativo no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {coupons.map((cp, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                      <p className="font-mono font-black text-indigo-700 text-base">{cp.code}</p>
                      <p className="text-xs text-gray-600 mt-1 font-semibold">
                        Desconto: {cp.discountValue}{cp.discountType === 'percentage' ? '%' : ' MT'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Usos: {cp.usedCount || 0} / {cp.maxUses || 'Ilimitado'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Price & Access Management Modal */}
      {priceModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Alterar Preço do Curso</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[260px]">{priceModal.courseTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setPriceModal(prev => ({ ...prev, show: false }))}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceModal(prev => ({ ...prev, accessType: 'paid' }))}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${priceModal.accessType === 'paid' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    💰 Curso Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceModal(prev => ({ ...prev, accessType: 'free' }))}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${priceModal.accessType === 'free' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    🎁 100% Gratuito
                  </button>
                </div>
              </div>

              {priceModal.accessType === 'paid' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Preço de Venda Atual (MT) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={priceModal.price}
                        onChange={(e) => setPriceModal(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl font-black text-gray-900 text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Ex: 199"
                      />
                      <span className="absolute right-3 top-3 text-xs font-black text-gray-400">MZN / MT</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Preço Original Riscado (Promoção)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={priceModal.originalPrice}
                        onChange={(e) => setPriceModal(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-500 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Ex: 500"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-gray-400">MZN / MT</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Aparece riscado na página do curso para dar sensação de desconto aos alunos.</p>
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPriceModal(prev => ({ ...prev, show: false }))}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSavePrice}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Salvar Preço</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === 'course' 
                    ? (editingCourse ? 'Editar Curso' : 'Novo Curso')
                    : modalType === 'module'
                    ? (editingModule ? 'Editar Módulo' : 'Novo Módulo')
                    : (editingLesson ? 'Editar Lição' : 'Nova Lição')
                  }
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Common fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={modalType === 'course' ? 'Nome do curso' : modalType === 'module' ? 'Nome do módulo' : 'Nome da lição'}
                />
              </div>

              {/* Course-specific fields */}
              {modalType === 'course' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta *</label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Breve descrição para lista"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Completa *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Descrição detalhada do curso"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duração *</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Ex: 4 horas, 2 dias"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ordem *</label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resultado Esperado *</label>
                    <textarea
                      value={formData.outcome}
                      onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="O que o aluno vai aprender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Acesso *</label>
                    <select
                      value={formData.accessType}
                      onChange={(e) => setFormData({ ...formData, accessType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="free">Gratuito</option>
                      <option value="paid">Pago</option>
                      <option value="preview">Preview</option>
                    </select>
                  </div>

                  {formData.accessType === 'paid' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço *</label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Moeda</label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="MZN">MZN</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Capa do Curso (Thumbnail / Imagem de Destaque)
                    </label>

                    {/* Preview da Capa Selecionada */}
                    {formData.thumbnail && (
                      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-900 group shadow-inner">
                        <img
                          src={formData.thumbnail}
                          alt="Pré-visualização da Capa"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                            className="px-3.5 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition flex items-center gap-1.5 shadow-md"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remover Capa</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Opções de Upload ou URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Botão de Upload Local */}
                      <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition text-xs font-bold shadow-xs ${uploadingThumbnail ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : 'border-indigo-300 hover:border-indigo-500 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-700'}`}>
                        {uploadingThumbnail ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            <span>A carregar imagem...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-indigo-600" />
                            <span>📁 Fazer Upload do Computador</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingThumbnail}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleThumbnailUpload(file);
                          }}
                          className="hidden"
                        />
                      </label>

                      {/* Campo de URL alternativo */}
                      <div className="relative flex items-center">
                        <input
                          type="url"
                          value={formData.thumbnail}
                          onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                          placeholder="Ou cole link direto (https://...)"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Suporta JPG, PNG, WEBP. A imagem é guardada de forma segura na nuvem (Cloudinary CDN).
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aulas Grátis (Freemium)</label>
                    <input
                      type="number"
                      value={formData.freeLessonsCount}
                      onChange={(e) => setFormData({ ...formData, freeLessonsCount: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                      max="99"
                    />
                    <p className="text-xs text-gray-500 mt-1">Número de aulas/módulos gratuitos que os alunos podem acessar sem pagar (padrão: 1)</p>
                  </div>
                </>
              )}

              {/* Module-specific fields */}
              {modalType === 'module' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Descrição do módulo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                    <textarea
                      value={formData.objective}
                      onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Objetivo de aprendizagem do módulo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordem *</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasVideo"
                      checked={formData.hasVideo}
                      onChange={(e) => setFormData({ ...formData, hasVideo: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasVideo" className="text-sm font-medium text-gray-700">
                      Incluir vídeo
                    </label>
                  </div>

                  {formData.hasVideo && (
                    <div className="space-y-3 pl-6 border-l-2 border-indigo-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título do Vídeo</label>
                        <input
                          type="text"
                          value={formData.videoTitle}
                          onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Título do vídeo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo (YouTube, Vimeo, MP4)</label>
                        <input
                          type="url"
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="Ex: https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                        />
                        {formData.videoUrl && (() => {
                          const embed = formatVideoEmbedUrl(formData.videoUrl);
                          return (
                            <div className="mt-2.5 p-3 bg-gray-900 rounded-xl border border-gray-700">
                              <span className="text-[11px] font-bold text-emerald-400 block mb-1.5 flex items-center gap-1">
                                ✓ Pré-visualização do Vídeo (YouTube Embed Seguro)
                              </span>
                              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                                <iframe
                                  src={embed.embedUrl}
                                  className="w-full h-full border-0"
                                  title="Pré-visualização do Vídeo"
                                  allowFullScreen
                                  referrerPolicy="strict-origin-when-cross-origin"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Vídeo</label>
                        <textarea
                          value={formData.videoDescription}
                          onChange={(e) => setFormData({ ...formData, videoDescription: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Descrição do vídeo"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasMaterial"
                      checked={formData.hasMaterial}
                      onChange={(e) => setFormData({ ...formData, hasMaterial: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasMaterial" className="text-sm font-medium text-gray-700">
                      Incluir material de apoio
                    </label>
                  </div>

                  {formData.hasMaterial && (
                    <div className="space-y-3 pl-6 border-l-2 border-green-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título do Material</label>
                        <input
                          type="text"
                          value={formData.materialTitle}
                          onChange={(e) => setFormData({ ...formData, materialTitle: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Título do material"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Upload</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="materialUploadType"
                              value="url"
                              checked={formData.materialUploadType === 'url'}
                              onChange={(e) => setFormData({ ...formData, materialUploadType: e.target.value as 'url' | 'upload' })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="text-sm text-gray-700">URL</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="materialUploadType"
                              value="upload"
                              checked={formData.materialUploadType === 'upload'}
                              onChange={(e) => setFormData({ ...formData, materialUploadType: e.target.value as 'url' | 'upload' })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="text-sm text-gray-700">Upload de Arquivo</span>
                          </label>
                        </div>
                      </div>
                      {formData.materialUploadType === 'url' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">URL do Material</label>
                          <input
                            type="url"
                            value={formData.materialUrl}
                            onChange={(e) => setFormData({ ...formData, materialUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://..."
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upload de Arquivo (PDF, Vídeo, Imagem)</label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const uploadedUrl = await handleMaterialUpload(file);
                                if (uploadedUrl) {
                                  // Auto-detect type based on file
                                  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                                    setFormData({ ...formData, materialType: 'pdf' });
                                  } else if (file.type.startsWith('video/')) {
                                    setFormData({ ...formData, materialType: 'document' });
                                  } else if (file.type.startsWith('image/')) {
                                    setFormData({ ...formData, materialType: 'document' });
                                  }
                                }
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={uploadingMaterial}
                          />
                          {uploadingMaterial && (
                            <p className="text-sm text-gray-500 mt-1">Carregando arquivo...</p>
                          )}
                          {formData.materialUrl && (
                            <p className="text-sm text-green-600 mt-1">Arquivo carregado com sucesso!</p>
                          )}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Material</label>
                        <select
                          value={formData.materialType}
                          onChange={(e) => setFormData({ ...formData, materialType: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="pdf">PDF</option>
                          <option value="document">Documento/Vídeo/Imagem</option>
                          <option value="link">Link</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Lesson-specific fields */}
              {modalType === 'lesson' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Conteúdo da lição"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordem *</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasVideo"
                      checked={formData.hasVideo}
                      onChange={(e) => setFormData({ ...formData, hasVideo: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasVideo" className="text-sm font-medium text-gray-700">
                      Incluir vídeo
                </label>
                  </div>

                  {formData.hasVideo && (
                    <div className="space-y-3 pl-6 border-l-2 border-indigo-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título do Vídeo</label>
                        <input
                          type="text"
                          value={formData.videoTitle}
                          onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Título do vídeo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo (YouTube, Vimeo, MP4)</label>
                        <input
                          type="url"
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="Ex: https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                        />
                        {formData.videoUrl && (() => {
                          const embed = formatVideoEmbedUrl(formData.videoUrl);
                          return (
                            <div className="mt-2.5 p-3 bg-gray-900 rounded-xl border border-gray-700">
                              <span className="text-[11px] font-bold text-emerald-400 block mb-1.5 flex items-center gap-1">
                                ✓ Pré-visualização do Vídeo (YouTube Embed Seguro)
                              </span>
                              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                                <iframe
                                  src={embed.embedUrl}
                                  className="w-full h-full border-0"
                                  title="Pré-visualização do Vídeo"
                                  allowFullScreen
                                  referrerPolicy="strict-origin-when-cross-origin"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Vídeo</label>
                        <textarea
                          value={formData.videoDescription}
                          onChange={(e) => setFormData({ ...formData, videoDescription: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Descrição do vídeo"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasMaterial"
                      checked={formData.hasMaterial}
                      onChange={(e) => setFormData({ ...formData, hasMaterial: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasMaterial" className="text-sm font-medium text-gray-700">
                      Incluir material de apoio
                    </label>
                  </div>

                  {formData.hasMaterial && (
                    <div className="space-y-3 pl-6 border-l-2 border-green-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título do Material</label>
                        <input
                          type="text"
                          value={formData.materialTitle}
                          onChange={(e) => setFormData({ ...formData, materialTitle: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Título do material"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Upload</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="materialUploadType"
                              value="url"
                              checked={formData.materialUploadType === 'url'}
                              onChange={(e) => setFormData({ ...formData, materialUploadType: e.target.value as 'url' | 'upload' })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="text-sm text-gray-700">URL</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="materialUploadType"
                              value="upload"
                              checked={formData.materialUploadType === 'upload'}
                              onChange={(e) => setFormData({ ...formData, materialUploadType: e.target.value as 'url' | 'upload' })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="text-sm text-gray-700">Upload de Arquivo</span>
                          </label>
                        </div>
                      </div>
                      {formData.materialUploadType === 'url' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">URL do Material</label>
                          <input
                            type="url"
                            value={formData.materialUrl}
                            onChange={(e) => setFormData({ ...formData, materialUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://..."
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upload de Arquivo (PDF, Vídeo, Imagem)</label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const uploadedUrl = await handleMaterialUpload(file);
                                if (uploadedUrl) {
                                  // Auto-detect type based on file
                                  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                                    setFormData({ ...formData, materialType: 'pdf' });
                                  } else if (file.type.startsWith('video/')) {
                                    setFormData({ ...formData, materialType: 'document' });
                                  } else if (file.type.startsWith('image/')) {
                                    setFormData({ ...formData, materialType: 'document' });
                                  }
                                }
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={uploadingMaterial}
                          />
                          {uploadingMaterial && (
                            <p className="text-sm text-gray-500 mt-1">Carregando arquivo...</p>
                          )}
                          {formData.materialUrl && (
                            <p className="text-sm text-green-600 mt-1">Arquivo carregado com sucesso!</p>
                          )}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Material</label>
                        <select
                          value={formData.materialType}
                          onChange={(e) => setFormData({ ...formData, materialType: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="pdf">PDF</option>
                          <option value="document">Documento/Vídeo/Imagem</option>
                          <option value="link">Link</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Common active field */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  {modalType === 'course' ? 'Curso' : modalType === 'module' ? 'Módulo' : 'Lição'} ativo (visível para alunos)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center space-x-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>A salvar...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Salvar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Modern Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <button
              type="button"
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start space-x-4 mb-4">
              <div className={`p-3.5 rounded-2xl border shrink-0 ${
                confirmModal.variant === 'danger' || confirmModal.title.includes('Exclusão') || confirmModal.title.includes('Cancelar')
                  ? 'bg-red-100 text-red-600 border-red-200'
                  : confirmModal.variant === 'success' || confirmModal.title.includes('Aprovar')
                  ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                  : confirmModal.iconType === 'phone' || confirmModal.title.includes('USSD') || confirmModal.title.includes('M-Pesa')
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-amber-100 text-amber-600 border-amber-200'
              }`}>
                {confirmModal.iconType === 'phone' || confirmModal.title.includes('USSD') || confirmModal.title.includes('M-Pesa') ? (
                  <Smartphone className="h-6 w-6" />
                ) : confirmModal.variant === 'danger' || confirmModal.title.includes('Exclusão') || confirmModal.title.includes('remover') ? (
                  <Trash2 className="h-6 w-6" />
                ) : confirmModal.variant === 'success' || confirmModal.title.includes('Aprovar') ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-lg font-bold text-gray-900 leading-snug">{confirmModal.title}</h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
              >
                {confirmModal.cancelText || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-5 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-md ${
                  confirmModal.variant === 'danger' || confirmModal.title.includes('Exclusão') || confirmModal.title.includes('Cancelar')
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                    : confirmModal.variant === 'success' || confirmModal.title.includes('Aprovar')
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                    : confirmModal.iconType === 'phone' || confirmModal.title.includes('USSD') || confirmModal.title.includes('M-Pesa')
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                }`}
              >
                {confirmModal.confirmText || (confirmModal.title.includes('Exclusão') ? 'Confirmar Exclusão' : 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
