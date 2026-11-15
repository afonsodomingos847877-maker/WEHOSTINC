'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Send, Users, FileText, History, RefreshCw, Sparkles, CheckCircle2, XCircle, Search, Filter, Plus, Edit2, Trash2, Mail, Info, Clock, AlertCircle
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager } from '@/lib/data';
import PageLoader from '@/components/PageLoader';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import AdminNotificationCenter from '@/components/AdminNotificationCenter';
import { 
  getCommunicationTemplates, 
  saveCommunicationTemplate, 
  deleteCommunicationTemplate,
  getCommunicationLogs, 
  replaceTemplateVariables,
  CommunicationTemplate, 
  CommunicationLog 
} from '@/lib/notifications';

export default function AdminCommunicationPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Dados Principais
  const [clients, setClients] = useState<User[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // Abas do Painel ('manual' | 'bulk' | 'templates' | 'history')
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk' | 'templates' | 'history'>('manual');

  // Estado do Toast Alert
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // -------------------------------------------------------------
  // ABA 1: ESTADO DO ENVIO MANUAL (DIRETO)
  // -------------------------------------------------------------
  const [manualClientEmail, setManualClientEmail] = useState('');
  const [manualTemplateId, setManualTemplateId] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualBody, setManualBody] = useState('');
  const [selectedBlogPost, setSelectedBlogPost] = useState('');
  const [isSendingManual, setIsSendingManual] = useState(false);

  // -------------------------------------------------------------
  // ABA 2: ESTADO DO ENVIO EM MASSA
  // -------------------------------------------------------------
  const [bulkFilter, setBulkFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'pending_payment' | 'newsletter' | 'custom'>('all');
  const [bulkSelectedEmails, setBulkSelectedEmails] = useState<string[]>([]);
  const [bulkTemplateId, setBulkTemplateId] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkBody, setBulkBody] = useState('');
  const [bulkSelectedBlogPost, setBulkSelectedBlogPost] = useState('');
  const [isConfirmingBulk, setIsConfirmingBulk] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // -------------------------------------------------------------
  // ABA 3: ESTADO DA GESTÃO DE TEMPLATES
  // -------------------------------------------------------------
  const [editingTemplate, setEditingTemplate] = useState<Partial<CommunicationTemplate> | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // -------------------------------------------------------------
  // ABA 4: ESTADO DO HISTÓRICO DE MENSAGENS
  // -------------------------------------------------------------
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'sent' | 'failed' | 'auto' | 'manual'>('all');
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    loadData();
    setLoading(false);
  }, []);

  const loadData = async () => {
    try {
      const allUsers = await auth.fetchUsersAsync();
      setClients((allUsers || []).filter((u: User) => u.role !== 'admin' && u.role !== 'super_admin'));
      setTemplates(getCommunicationTemplates());
      setLogs(getCommunicationLogs());
      
      // Carregar subscritores da newsletter
      try {
        const newsletterResponse = await fetch('/api/admin/newsletter/send');
        if (newsletterResponse.ok) {
          const newsletterData = await newsletterResponse.json();
          if (newsletterData.success) {
            setNewsletterSubscribers(newsletterData.subscribers || []);
          }
        }
      } catch (e) {
        console.warn('Subscritores newsletter não disponíveis:', e);
      }

      // Carregar posts do blog publicados
      try {
        const blogResponse = await fetch('/api/admin/blog/posts');
        if (blogResponse.ok) {
          const blogData = await blogResponse.json();
          if (blogData.success) {
            setBlogPosts((blogData.posts || []).filter((post: any) => post.status === 'published'));
          }
        }
      } catch (e) {
        console.warn('Posts do blog não disponíveis:', e);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da central de comunicação:', err);
    }
  };

  // Selecionar Modelo no Envio Manual
  const handleManualTemplateSelect = (templateId: string) => {
    setManualTemplateId(templateId);
    if (!templateId) return;
    const found = templates.find(t => t.id === templateId);
    if (found) {
      setManualSubject(found.subject);
      setManualBody(found.body);
    }
  };

  // Selecionar Post de Blog no Envio Manual
  const handleBlogPostSelect = (postId: string) => {
    setSelectedBlogPost(postId);
    if (!postId) return;
    const post = blogPosts.find(p => p.id === postId);
    if (post) {
      setManualSubject(`📰 Novo Artigo: ${post.title}`);
      setManualBody(`
        ${post.coverImage ? `<img src="${post.coverImage}" alt="${post.title}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">` : ''}
        <h2 style="color: #1e40af; margin-bottom: 10px;">${post.title}</h2>
        <p><strong>Resumo:</strong> ${post.excerpt || post.content?.substring(0, 200) || 'Leia o artigo completo para saber mais.'}</p>
        <p><strong>Categoria:</strong> ${post.category || 'Geral'}</p>
        <p style="margin-top: 20px;">Para ler o artigo completo, clique no botão abaixo:</p>
        <p style="margin-top: 15px;">
          <a href="https://www.wehosthere.com/blog/${post.slug}" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ler Artigo Completo</a>
        </p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin-top: 15px;"><em>Este é um artigo do blog WEHOSTHERE. Para mais informações, visite nosso site.</em></p>
      `);
    }
  };

  // Selecionar Modelo no Envio em Massa
  const handleBulkTemplateSelect = (templateId: string) => {
    setBulkTemplateId(templateId);
    if (!templateId) return;
    const found = templates.find(t => t.id === templateId);
    if (found) {
      setBulkSubject(found.subject);
      setBulkBody(found.body);
    }
  };

  // Selecionar Post de Blog no Envio em Massa
  const handleBulkBlogPostSelect = (postId: string) => {
    setBulkSelectedBlogPost(postId);
    if (!postId) return;
    const post = blogPosts.find(p => p.id === postId);
    if (post) {
      setBulkSubject(`📰 Novo Artigo: ${post.title}`);
      setBulkBody(`
        ${post.coverImage ? `<img src="${post.coverImage}" alt="${post.title}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">` : ''}
        <h2 style="color: #1e40af; margin-bottom: 10px;">${post.title}</h2>
        <p><strong>Resumo:</strong> ${post.excerpt || post.content?.substring(0, 200) || 'Leia o artigo completo para saber mais.'}</p>
        <p><strong>Categoria:</strong> ${post.category || 'Geral'}</p>
        <p style="margin-top: 20px;">Para ler o artigo completo, clique no botão abaixo:</p>
        <p style="margin-top: 15px;">
          <a href="https://www.wehosthere.com/blog/${post.slug}" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ler Artigo Completo</a>
        </p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin-top: 15px;"><em>Este é um artigo do blog WEHOSTHERE. Para mais informações, visite nosso site.</em></p>
      `);
    }
  };

  // Obter destinatários do Envio em Massa com base nos filtros
  const getBulkRecipients = (): User[] => {
    if (bulkFilter === 'custom') {
      return clients.filter(c => bulkSelectedEmails.includes(c.email));
    }
    if (bulkFilter === 'active') return clients.filter(c => (c.status || 'active') === 'active');
    if (bulkFilter === 'pending') return clients.filter(c => c.status === 'pending');
    if (bulkFilter === 'suspended') return clients.filter(c => c.status === 'suspended');
    if (bulkFilter === 'pending_payment') {
      const allOrders = dataManager.getOrders();
      const pendingEmails = new Set(allOrders.filter(o => o.status === 'pending').map(o => o.clientEmail || o.userEmail || ''));
      return clients.filter(c => pendingEmails.has(c.email));
    }
    if (bulkFilter === 'newsletter') {
      return newsletterSubscribers
        .filter(s => s.status === 'active')
        .map(s => ({
          id: s.email,
          email: s.email,
          name: s.name || s.email.split('@')[0],
          role: 'user',
          status: 'active',
          plan: 'none',
          createdAt: s.subscribedAt
        } as User));
    }
    return clients; // 'all'
  };

  // Executar Envio Manual
  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClientEmail) {
      setToast({ message: 'Selecione um cliente destinatário.', type: 'error' });
      return;
    }
    if (!manualSubject.trim() || !manualBody.trim()) {
      setToast({ message: 'Preencha o assunto e o conteúdo da mensagem.', type: 'error' });
      return;
    }

    setIsSendingManual(true);
    const targetClient = clients.find(c => c.email === manualClientEmail);

    try {
      const response = await fetch('/api/admin/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: manualClientEmail,
          recipientName: targetClient?.name || manualClientEmail.split('@')[0],
          templateId: manualTemplateId || undefined,
          subject: manualSubject,
          body: manualBody,
          isAutomatic: false
        })
      });
      const result = await response.json();
      setIsSendingManual(false);

      if (result.success) {
        setToast({ message: `Mensagem enviada com sucesso para ${manualClientEmail}!`, type: 'success' });
        setManualSubject('');
        setManualBody('');
        setManualTemplateId('');
        loadData();
      } else {
        setToast({ message: `Erro ao enviar e-mail: ${result.error || 'Falha no servidor.'}`, type: 'error' });
      }
    } catch (err: any) {
      setIsSendingManual(false);
      setToast({ message: `Erro na ligação com o servidor: ${err?.message || 'Tente novamente.'}`, type: 'error' });
    }
  };

  // Executar Envio em Massa
  const handleSendBulk = async () => {
    setIsConfirmingBulk(false);
    const recipients = getBulkRecipients();
    if (recipients.length === 0) {
      setToast({ message: 'Nenhum cliente selecionado para o disparo em massa.', type: 'error' });
      return;
    }

    setIsSendingBulk(true);
    try {
      const response = await fetch('/api/admin/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_bulk',
          recipients,
          templateId: bulkTemplateId || undefined,
          subject: bulkSubject,
          body: bulkBody
        })
      });
      const result = await response.json();
      setIsSendingBulk(false);
      loadData();

      if (result.success) {
        setToast({ message: `Envio em massa concluído com sucesso! (${result.summary?.success || recipients.length} entregues)`, type: 'success' });
        setBulkSubject('');
        setBulkBody('');
        setBulkTemplateId('');
      } else {
        setToast({ message: `Erro no envio em massa: ${result.error || 'Falha no servidor.'}`, type: 'error' });
      }
    } catch (err: any) {
      setIsSendingBulk(false);
      setToast({ message: `Erro na ligação com o servidor: ${err?.message || 'Tente novamente.'}`, type: 'error' });
    }
  };

  // Guardar Modelo de Mensagem
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.body) {
      setToast({ message: 'Preencha todos os campos do modelo.', type: 'error' });
      return;
    }

    saveCommunicationTemplate({
      id: editingTemplate.id || `tpl_${Date.now()}`,
      name: editingTemplate.name,
      category: editingTemplate.category || 'Geral',
      subject: editingTemplate.subject,
      body: editingTemplate.body,
      channel: editingTemplate.channel || 'email',
      isSystem: editingTemplate.isSystem || false
    });

    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
    setToast({ message: 'Modelo de mensagem guardado com sucesso!', type: 'success' });
    loadData();
  };

  // Eliminar Modelo de Mensagem
  const handleDeleteTemplate = (id: string) => {
    deleteCommunicationTemplate(id);
    setToast({ message: 'Modelo eliminado com sucesso.', type: 'success' });
    loadData();
  };

  // Inserir variável rápida no cursor do textarea
  const insertVariable = (varTag: string, target: 'manual' | 'bulk' | 'template') => {
    const formattedTag = `{{${varTag}}}`;
    if (target === 'manual') {
      setManualBody(prev => prev + ' ' + formattedTag);
    } else if (target === 'bulk') {
      setBulkBody(prev => prev + ' ' + formattedTag);
    } else if (target === 'template' && editingTemplate) {
      setEditingTemplate(prev => ({ ...prev, body: (prev?.body || '') + ' ' + formattedTag }));
    }
  };

  if (loading) return <PageLoader text="A carregar Central de Comunicação..." />;

  // Selecionar cliente para visualização em tempo real das variáveis no manual
  const selectedManualClient = clients.find(c => c.email === manualClientEmail);
  const previewManualSubject = replaceTemplateVariables(manualSubject, {
    nome_cliente: selectedManualClient?.name || 'João Silva',
    email: selectedManualClient?.email || 'cliente@exemplo.com',
    numero_pedido: 'PED-9842',
    valor: '2.500,00 MT',
    estado_pedido: 'Aprovado'
  });
  const previewManualBody = replaceTemplateVariables(manualBody, {
    nome_cliente: selectedManualClient?.name || 'João Silva',
    email: selectedManualClient?.email || 'cliente@exemplo.com',
    numero_pedido: 'PED-9842',
    valor: '2.500,00 MT',
    estado_pedido: 'Aprovado'
  });

  // Filtragem de Logs do Histórico
  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.recipientEmail.toLowerCase().includes(historySearch.toLowerCase()) ||
      l.recipientName.toLowerCase().includes(historySearch.toLowerCase()) ||
      l.subject.toLowerCase().includes(historySearch.toLowerCase());

    if (!matchesSearch) return false;
    if (historyFilter === 'sent') return l.status === 'sent';
    if (historyFilter === 'failed') return l.status === 'failed';
    if (historyFilter === 'auto') return l.isAutomatic;
    if (historyFilter === 'manual') return !l.isAutomatic;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal de Confirmação para Envio em Massa */}
      {isConfirmingBulk && (
        <ConfirmModal
          isOpen={isConfirmingBulk}
          title="Confirmar Envio em Massa"
          message={`Tem a certeza de que deseja disparar esta mensagem para ${getBulkRecipients().length} clientes selecionados? Esta ação não pode ser desfeita.`}
          confirmText="Sim, Disparar Agora"
          cancelText="Cancelar"
          type="warning"
          onConfirm={handleSendBulk}
          onCancel={() => setIsConfirmingBulk(false)}
        />
      )}

      {/* Modal de Detalhes do Log do Histórico */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Detalhes da Mensagem</h3>
                <p className="text-xs text-gray-500">ID: {selectedLog.id} • {new Date(selectedLog.sentAt).toLocaleString('pt-MZ')}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">Destinatário:</span>
                  <span className="text-gray-900 font-bold">{selectedLog.recipientName}</span>
                  <span className="text-xs text-gray-500 block">{selectedLog.recipientEmail}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">Modelo Utilizado:</span>
                  <span className="text-gray-800 font-medium">{selectedLog.templateName || 'Personalizado'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">Estado:</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border mt-0.5 ${
                    selectedLog.status === 'sent' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedLog.status === 'sent' ? '✅ Enviado' : '❌ Falhou'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">Origem:</span>
                  <span className="text-gray-700 font-medium">{selectedLog.isAutomatic ? '🤖 Automático (Evento)' : '👤 Manual (Admin)'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 font-semibold block mb-1">Assunto:</span>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 font-bold text-gray-900">
                  {selectedLog.subject}
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 font-semibold block mb-1">Conteúdo da Mensagem:</span>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 font-mono text-xs whitespace-pre-line max-h-60 overflow-y-auto leading-relaxed">
                  {selectedLog.body}
                </div>
              </div>

              {selectedLog.error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Erro Registado: {selectedLog.error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Template */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {editingTemplate?.id ? 'Editar Modelo de Mensagem' : 'Novo Modelo de Mensagem'}
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Modelo</label>
                  <input
                    type="text"
                    value={editingTemplate?.name || ''}
                    onChange={e => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Aviso de Manutenção"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Categoria</label>
                  <select
                    value={editingTemplate?.category || 'Geral'}
                    onChange={e => setEditingTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Boas-Vindas">Boas-Vindas</option>
                    <option value="Pedidos">Pedidos</option>
                    <option value="Pagamentos">Pagamentos</option>
                    <option value="Segurança">Segurança</option>
                    <option value="Geral">Geral / Avisos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assunto do E-mail</label>
                <input
                  type="text"
                  value={editingTemplate?.subject || ''}
                  onChange={e => setEditingTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Ex: 📢 Comunicado Importante para {{nome_cliente}}"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">Corpo da Mensagem (Texto / HTML)</label>
                  <span className="text-[11px] text-gray-500">Clique para inserir variável:</span>
                </div>

                {/* Toolbar de Variáveis */}
                <div className="flex flex-wrap gap-1.5 mb-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  {['nome_cliente', 'email', 'numero_pedido', 'valor', 'data', 'estado_pedido', 'nome_empresa'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v, 'template')}
                      className="px-2.5 py-1 bg-white hover:bg-blue-600 text-gray-700 hover:text-white rounded-lg text-xs font-mono border border-gray-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      +{v}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={6}
                  value={editingTemplate?.body || ''}
                  onChange={e => setEditingTemplate(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Escreva aqui a mensagem pré-configurada..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }}
                  className="px-4 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-blue-200 transition-all cursor-pointer"
                >
                  Guardar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANNER / CABEÇALHO SUPERIOR */}
      <div className="bg-white border-b border-gray-200/80 shadow-2xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin"
                className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all border border-gray-200/80 cursor-pointer"
                title="Voltar ao Painel Admin"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">Central de Comunicação</h1>
                  <span className="bg-blue-50 text-blue-700 text-xs font-extrabold px-3 py-1 rounded-full border border-blue-200">
                    WEHOSTHERE
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Envio de mensagens diretas, comunicação em massa, gestão de modelos e histórico de envios.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AdminNotificationCenter onNavigate={(url) => router.push(url)} />
              <button
                onClick={loadData}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 transition-colors border border-gray-200 flex items-center gap-2 text-xs font-bold shadow-2xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
                Atualizar
              </button>
            </div>
          </div>

          {/* ABAS DE NAVEGAÇÃO */}
          <div className="flex gap-2 mt-6 border-b border-gray-100 overflow-x-auto no-scrollbar pb-px">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
                activeTab === 'manual'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Send className="w-4 h-4" />
              Envio Manual / Direto
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
                activeTab === 'bulk'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Comunicação em Massa ({clients.length})
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
                activeTab === 'templates'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Modelos de Mensagens ({templates.length})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
                activeTab === 'history'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico de Mensagens ({logs.length})
            </button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL DAS ABAS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* ABA 1: ENVIO MANUAL */}
        {activeTab === 'manual' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulário de Envio */}
            <div className="lg:col-span-7 bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5 border-b border-gray-100 pb-4">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Send className="w-5 h-5" />
                </div>
                Enviar Mensagem para Cliente Específico
              </h2>

              <form onSubmit={handleSendManual} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    1. Selecionar Cliente Destinatário
                  </label>
                  <select
                    value={manualClientEmail}
                    onChange={e => setManualClientEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  >
                    <option value="">-- Escolha um Cliente da Lista --</option>
                    {clients.map(c => (
                      <option key={c.id || c.email} value={c.email}>
                        👤 {c.name || 'Sem Nome'} - ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    2. Escolher Modelo Pré-Configurado (Opcional)
                  </label>
                  <select
                    value={manualTemplateId}
                    onChange={e => handleManualTemplateSelect(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">-- Escrever Mensagem Livre / Sem Modelo --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        📝 [{t.category}] {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    3. Selecionar Artigo de Blog (Opcional)
                  </label>
                  <select
                    value={selectedBlogPost}
                    onChange={e => handleBlogPostSelect(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">-- Selecione um Artigo de Blog (opcional) --</option>
                    {blogPosts.map(post => (
                      <option key={post.id} value={post.id}>
                        📰 {post.title} ({new Date(post.publishedAt || post.createdAt).toLocaleDateString('pt-MZ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    4. Assunto da Mensagem
                  </label>
                  <input
                    type="text"
                    value={manualSubject}
                    onChange={e => setManualSubject(e.target.value)}
                    placeholder="Ex: Atualização importante sobre o seu serviço"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      5. Conteúdo da Mensagem
                    </label>
                    <span className="text-[11px] text-gray-500">Variáveis rápidas:</span>
                  </div>

                  {/* Toolbar de Inserção de Variáveis */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
                    {['nome_cliente', 'email', 'numero_pedido', 'valor', 'data', 'estado_pedido', 'nome_empresa'].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v, 'manual')}
                        className="px-2.5 py-1 bg-white hover:bg-blue-600 text-gray-700 hover:text-white rounded-lg text-xs font-mono border border-gray-200 shadow-2xs transition-colors cursor-pointer"
                      >
                        +{v}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={8}
                    value={manualBody}
                    onChange={e => setManualBody(e.target.value)}
                    placeholder="Escreva aqui o texto da mensagem..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingManual}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingManual ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      A Enviar Mensagem...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Mensagem Agora →
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Painel de Pré-Visualização em Tempo Real */}
            <div className="lg:col-span-5 bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Pré-visualização em Tempo Real (Substituição de Variáveis)
              </h3>

              <div className="bg-gray-50 rounded-2xl border border-gray-200/80 p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="border-b border-gray-200/80 pb-3 mb-3">
                    <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Para:</span>
                    <span className="text-xs font-bold text-blue-600">
                      {selectedManualClient ? `${selectedManualClient.name} (${selectedManualClient.email})` : 'Nenhum cliente selecionado'}
                    </span>
                  </div>

                  <div className="border-b border-gray-200/80 pb-3 mb-3">
                    <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Assunto:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {previewManualSubject || '- Sem Assunto -'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider mb-1.5">Corpo Formatado:</span>
                    <div className="text-xs text-gray-700 font-mono whitespace-pre-line leading-relaxed bg-white p-4 rounded-xl border border-gray-200 max-h-72 overflow-y-auto shadow-2xs">
                      {previewManualBody || 'A pré-visualização da mensagem formatada aparecerá aqui...'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/80 text-[11px] text-gray-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>As variáveis como <code>&#123;&#123;nome_cliente&#125;&#125;</code> são substituídas automaticamente pelos dados reais do cliente.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: ENVIO EM MASSA */}
        {activeTab === 'bulk' && (
          <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              Comunicação em Massa para Segmentos de Clientes
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Envie anúncios, notificações de manutenção ou atualizações da plataforma para grupos selecionados de clientes.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Filtro de Segmentação */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/80">
                  <label className="block text-xs font-bold text-gray-800 mb-3">Filtrar Destinatários por Segmento</label>
                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'all', label: `Todos os Clientes (${clients.length})` },
                      { key: 'active', label: `Apenas Clientes Ativos (${clients.filter(c => (c.status || 'active') === 'active').length})` },
                      { key: 'pending', label: `Clientes Pendentes (${clients.filter(c => c.status === 'pending').length})` },
                      { key: 'suspended', label: `Clientes Suspensos (${clients.filter(c => c.status === 'suspended').length})` },
                      { key: 'pending_payment', label: 'Clientes com Pagamento Pendente' },
                      { key: 'newsletter', label: `Subscritores Newsletter (${newsletterSubscribers.filter(s => s.status === 'active').length})` },
                      { key: 'custom', label: `Seleção Manual por Caixas (${bulkSelectedEmails.length} selecionados)` }
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-gray-100 rounded-xl cursor-pointer border border-gray-200 transition-colors">
                        <input
                          type="radio"
                          name="bulkFilter"
                          checked={bulkFilter === opt.key}
                          onChange={() => setBulkFilter(opt.key as any)}
                          className="accent-blue-600"
                        />
                        <span className="text-gray-800 font-bold">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Seleção Manual se custom */}
                {bulkFilter === 'custom' && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 max-h-60 overflow-y-auto space-y-2">
                    <span className="text-xs font-bold text-gray-700 block mb-2">Selecione os clientes:</span>
                    {clients.map(c => (
                      <label key={c.email} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                        <input
                          type="checkbox"
                          checked={bulkSelectedEmails.includes(c.email)}
                          onChange={e => {
                            if (e.target.checked) setBulkSelectedEmails(prev => [...prev, c.email]);
                            else setBulkSelectedEmails(prev => prev.filter(em => em !== c.email));
                          }}
                          className="rounded bg-white border-gray-300 accent-blue-600"
                        />
                        <span className="truncate">{c.name || 'Cliente'} ({c.email})</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Resumo do Destino */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800">
                  <span className="font-bold block mb-1">🎯 Destinatários Confirmados:</span>
                  Esta mensagem será enviada para <strong className="text-blue-900 font-black text-sm">{getBulkRecipients().length}</strong> clientes.
                </div>
              </div>

              {/* Formulário do Disparo */}
              <div className="lg:col-span-8 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Modelo de Mensagem em Massa</label>
                  <select
                    value={bulkTemplateId}
                    onChange={e => handleBulkTemplateSelect(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">-- Selecionar Modelo de Comunicado / Aviso --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        📝 [{t.category}] {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Selecionar Artigo de Blog (Opcional)</label>
                  <select
                    value={bulkSelectedBlogPost}
                    onChange={e => handleBulkBlogPostSelect(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">-- Selecione um Artigo de Blog (opcional) --</option>
                    {blogPosts.map(post => (
                      <option key={post.id} value={post.id}>
                        📰 {post.title} ({new Date(post.publishedAt || post.createdAt).toLocaleDateString('pt-MZ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Assunto da Mensagem em Massa</label>
                  <input
                    type="text"
                    value={bulkSubject}
                    onChange={e => setBulkSubject(e.target.value)}
                    placeholder="Ex: 📢 Comunicado Importante da WEHOSTHERE"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">Conteúdo do Comunicado</label>
                    <span className="text-[11px] text-gray-500">Variáveis rápidas:</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2.5 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
                    {['nome_cliente', 'email', 'data', 'nome_empresa'].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v, 'bulk')}
                        className="px-2.5 py-1 bg-white hover:bg-blue-600 text-gray-700 hover:text-white rounded-lg text-xs font-mono border border-gray-200 shadow-2xs transition-colors cursor-pointer"
                      >
                        +{v}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={8}
                    value={bulkBody}
                    onChange={e => setBulkBody(e.target.value)}
                    placeholder="Escreva aqui o comunicado em massa..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsConfirmingBulk(true)}
                  disabled={isSendingBulk || !bulkSubject || !bulkBody}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingBulk ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      A Disparar Envio em Massa...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Disparar para {getBulkRecipients().length} Destinatários Agora →
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: GESTÃO DE MODELOS */}
        {activeTab === 'templates' && (
          <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Modelos de Mensagens Pré-Configurados
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Gerencie os modelos de e-mail utilizados nos envios automáticos e manuais.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTemplate({
                    name: '',
                    category: 'Geral',
                    subject: '',
                    body: '',
                    channel: 'email',
                    isSystem: false
                  });
                  setIsTemplateModalOpen(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Criar Novo Modelo
              </button>
            </div>

            {/* Grelha de Modelos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map(tpl => (
                <div 
                  key={tpl.id}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {tpl.category}
                      </span>
                      {tpl.isSystem && (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          Sistema
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium line-clamp-1 mb-3">
                      Assunto: {tpl.subject}
                    </p>

                    <div className="mt-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 text-gray-600 text-xs font-mono line-clamp-4 leading-relaxed">
                      {tpl.body}
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setManualTemplateId(tpl.id);
                        handleManualTemplateSelect(tpl.id);
                        setActiveTab('manual');
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Usar para Enviar
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setIsTemplateModalOpen(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar Modelo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!tpl.isSystem && (
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar Modelo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 4: HISTÓRICO DE MENSAGENS */}
        {activeTab === 'history' && (
          <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  Histórico Completo de Comunicações
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Registo de todas as mensagens disparadas automaticamente ou enviadas manualmente pelo Administrador.
                </p>
              </div>

              {/* Barra de Pesquisa e Filtros */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Pesquisar por cliente, e-mail ou assunto..."
                    className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
                  />
                </div>

                <select
                  value={historyFilter}
                  onChange={e => setHistoryFilter(e.target.value as any)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">Todas as Mensagens</option>
                  <option value="sent">Apenas Enviadas (✅)</option>
                  <option value="failed">Apenas Falhas (❌)</option>
                  <option value="auto">🤖 Disparos Automáticos</option>
                  <option value="manual">👤 Envios Manuais</option>
                </select>
              </div>
            </div>

            {/* Tabela de Logs */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3.5 px-4">Destinatário</th>
                    <th className="py-3.5 px-4">Assunto</th>
                    <th className="py-3.5 px-4">Modelo</th>
                    <th className="py-3.5 px-4">Origem</th>
                    <th className="py-3.5 px-4">Data / Hora</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400 font-medium">
                        Nenhuma mensagem encontrada no histórico.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900 block">{log.recipientName}</span>
                          <span className="text-[11px] text-gray-500">{log.recipientEmail}</span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs truncate font-medium text-gray-800">
                          {log.subject}
                        </td>

                        <td className="py-3.5 px-4 text-gray-600">
                          {log.templateName || 'Personalizado'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            log.isAutomatic 
                              ? 'bg-purple-50 text-purple-700 border-purple-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {log.isAutomatic ? '🤖 Automático' : '👤 Manual'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-gray-500">
                          {new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 font-bold ${
                            log.status === 'sent' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {log.status === 'sent' ? '✅ Enviado' : '❌ Falhou'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors font-bold text-xs cursor-pointer"
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
