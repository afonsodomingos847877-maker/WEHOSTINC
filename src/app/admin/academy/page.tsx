'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, BookOpen, DollarSign, Clock, ArrowLeft, Home, GraduationCap, Loader2, CheckCircle, XCircle, Save, X, CheckSquare, Upload, AlertTriangle } from 'lucide-react';

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
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

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
  }, [fetchCourses]);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Cursos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cursos Ativos</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{courses.filter(c => c.active).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cursos Pagos</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{courses.filter(c => c.accessType === 'paid').length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cursos Gratuitos</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{courses.filter(c => c.accessType === 'free').length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex-1 px-6 py-4 font-medium text-sm transition ${
                activeTab === 'courses'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Cursos</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{courses.length}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex-1 px-6 py-4 font-medium text-sm transition ${
                activeTab === 'modules'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Módulos</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{modules.length}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`flex-1 px-6 py-4 font-medium text-sm transition ${
                activeTab === 'lessons'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Liçãoões</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{lessons.length}</span>
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                          <input
                            type="checkbox"
                            checked={modules.filter(m => {
                              const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    m.description.toLowerCase().includes(searchTerm.toLowerCase());
                              const matchesCourse = selectedCourseFilter === 'all' || m.courseId === selectedCourseFilter;
                              return matchesSearch && matchesCourse;
                            }).every(m => selectedModules.has(m.id))}
                            onChange={handleSelectAllModules}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objetivo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conteúdo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
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
                          <tr key={module.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedModules.has(module.id)}
                                onChange={() => handleToggleModule(module.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 text-sm">{module.title}</p>
                              <p className="text-xs text-gray-500 truncate">{module.description}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {course?.title || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 truncate max-w-xs">
                              {module.objective}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {module.hasVideo && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Vídeo</span>
                                )}
                                {module.hasMaterial && (
                                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Material</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                module.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {module.active ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => handleEdit(module, 'module')}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Editar"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(module.id, 'module')}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Excluir"
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                          <input
                            type="checkbox"
                            checked={lessons.filter(l => {
                              const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    l.content.toLowerCase().includes(searchTerm.toLowerCase());
                              const matchesModule = selectedModuleFilter === 'all' || l.moduleId === selectedModuleFilter;
                              return matchesSearch && matchesModule;
                            }).every(l => selectedLessons.has(l.id))}
                            onChange={handleSelectAllLessons}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lição</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conteúdo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
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
                          <tr key={lesson.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedLessons.has(lesson.id)}
                                onChange={() => handleToggleLesson(lesson.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 text-sm">{lesson.title}</p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">{lesson.content}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {parentModule?.title || 'N/A'}
                              {course && <span className="text-xs text-gray-400 block">{course.title}</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {lesson.hasVideo && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Vídeo</span>
                                )}
                                {lesson.hasMaterial && (
                                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Material</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                lesson.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {lesson.active ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => handleEdit(lesson, 'lesson')}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Editar"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(lesson.id, 'lesson')}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Excluir"
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
        </div>
      </div>

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem (Thumbnail)</label>
                    <input
                      type="url"
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://..."
                    />
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo</label>
                        <input
                          type="url"
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://youtube.com/..."
                        />
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo</label>
                        <input
                          type="url"
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://youtube.com/..."
                        />
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

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  confirmModal.title.includes('Erro') || confirmModal.title.includes('Aviso')
                    ? 'bg-amber-100'
                    : confirmModal.title.includes('Exclusão')
                    ? 'bg-red-100'
                    : 'bg-blue-100'
                }`}>
                  <AlertTriangle className={`h-8 w-8 ${
                    confirmModal.title.includes('Erro') || confirmModal.title.includes('Aviso')
                      ? 'text-amber-600'
                      : confirmModal.title.includes('Exclusão')
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`} />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                {confirmModal.title}
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                {confirmModal.message}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition ${
                    confirmModal.title.includes('Exclusão')
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {confirmModal.title.includes('Exclusão') ? 'Confirmar Exclusão' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
