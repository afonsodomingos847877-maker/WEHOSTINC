'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, X, Code2, Image as ImageIcon, Trash2, Upload } from 'lucide-react';

const CATEGORIES = [
  { value: 'codigo',    label: 'Código' },
  { value: 'startups',  label: 'Startups' },
  { value: 'ia',        label: 'IA & Machine Learning' },
  { value: 'design',    label: 'Design' },
  { value: 'carreira',  label: 'Carreira' },
  { value: 'tutoriais', label: 'Tutoriais' },
  { value: 'noticias',  label: 'Notícias' },
];

export default function EditarHistoriaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [submissionInfo, setSubmissionInfo] = useState<{
    isCommunity?: boolean;
    submitterEmail?: string;
    submitterName?: string;
    submittedAt?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    highlightText: '',
    excerpt: '',
    content: '',
    coverImage: '',
    category: 'codigo',
    tags: '',
    status: 'draft' as 'draft' | 'pending' | 'published' | 'archived',
    featured: false,
    views: 0,
    publishedAt: '',
    author: {
      name: 'WEHOSTHERE',
      email: 'info@wehosthere.com',
      bio: '',
      avatar: '',
      website: '',
      socials: {
        twitter: '',
        linkedin: '',
        github: '',
        instagram: '',
      },
    },
    seo: { metaTitle: '', metaDescription: '', keywords: '' },
  });

  useEffect(() => {
    if (id) fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      const res = await fetch(`/api/admin/revista/historias/${id}`);
      const data = await res.json();
      if (data.success && data.story) {
        const s = data.story;
        setFormData({
          title: s.title || '',
          slug: s.slug || '',
          highlightText: s.highlightText || '',
          excerpt: s.excerpt || '',
          content: s.content || '',
          coverImage: s.coverImage || '',
          category: s.category || 'codigo',
          tags: (s.tags || []).join(', '),
          status: s.status || 'draft',
          featured: s.featured || false,
          views: s.views || 0,
          publishedAt: s.publishedAt ? new Date(s.publishedAt).toISOString().slice(0, 16) : '',
          author: {
            name: s.author?.name || 'WEHOSTHERE',
            email: s.author?.email || '',
            bio: s.author?.bio || '',
            avatar: s.author?.avatar || '',
            website: s.author?.website || '',
            socials: {
              twitter: s.author?.socials?.twitter || '',
              linkedin: s.author?.socials?.linkedin || '',
              github: s.author?.socials?.github || '',
              instagram: s.author?.socials?.instagram || '',
            },
          },
          seo: {
            metaTitle: s.seo?.metaTitle || '',
            metaDescription: s.seo?.metaDescription || '',
            keywords: s.seo?.keywords || '',
          },
        });
        if (s.submission) {
          setSubmissionInfo(s.submission);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setFetching(false);
    }
  };

  const set = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));
  const setAuthor = (key: string, value: string) =>
    setFormData(prev => ({ ...prev, author: { ...prev.author, [key]: value } }));
  const setAuthorSocial = (key: string, value: string) =>
    setFormData(prev => ({
      ...prev,
      author: {
        ...prev.author,
        socials: { ...prev.author.socials, [key]: value },
      },
    }));
  const setSeo = (key: string, value: string) =>
    setFormData(prev => ({ ...prev, seo: { ...prev.seo, [key]: value } }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) set('coverImage', data.url);
    } catch { alert('Erro ao fazer upload da imagem.'); }
    finally { setUploadingImage(false); e.target.value = ''; }
  };

  const handleAuthorAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setAuthor('avatar', data.url);
    } catch { alert('Erro ao fazer upload do avatar do autor.'); }
    finally { setUploadingAvatar(false); e.target.value = ''; }
  };

  const handleSave = async (status?: string) => {
    if (!formData.title || !formData.excerpt || !formData.content) {
      alert('Título, resumo e conteúdo são obrigatórios.');
      return;
    }
    if (formData.title.length > 100) {
      alert('O título não pode exceder 100 caracteres.');
      return;
    }
    if (formData.excerpt.length > 500) {
      alert('O resumo não pode exceder 500 caracteres.');
      return;
    }
    if (formData.content.length > 5000) {
      alert('O conteúdo não pode exceder 5.000 caracteres.');
      return;
    }
    if (formData.author.bio && formData.author.bio.length > 500) {
      alert('A bio curta do autor não pode exceder 500 caracteres.');
      return;
    }
    setLoading(true);
    try {
      // Remover views do payload para não sobrescrever visualizações acumuladas em tempo real
      const { views: _views, ...dataToSave } = formData;
      const payload = {
        ...dataToSave,
        slug: formData.slug.trim(),
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : (formData.status === 'published' ? new Date().toISOString() : undefined),
        tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        status: status || formData.status,
        author: formData.author,
        seo: formData.seo,
      };
      const res = await fetch(`/api/admin/revista/historias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(data.error || 'Erro ao guardar.');
      }
    } catch { alert('Erro de rede.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Tem a certeza que deseja eliminar esta história permanentemente?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/revista/historias/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/revista');
      } else {
        alert(data.error || 'Erro ao eliminar história.');
      }
    } catch {
      alert('Erro de conexão ao eliminar.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="edit-spinner" />
    </div>
  );

  if (notFound) return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem', fontFamily: 'Poppins, sans-serif' }}>
      <Code2 size={48} color="#7B2CBF" style={{ margin: '0 auto 1rem' }} />
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>História não encontrada</h1>
      <Link href="/admin/revista" style={{ color: '#7B2CBF', fontWeight: 600 }}>← Voltar à Revista</Link>
    </div>
  );

  return (
    <>
      <style>{`
        .edit-page { font-family: 'Poppins', sans-serif; background: #f8fafc; min-height: 100vh; }
        .edit-header {
          background: #fff; border-bottom: 1px solid #e2e8f0;
          padding: 1rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 40;
        }
        .edit-header-left { display: flex; align-items: center; gap: 1rem; }
        .edit-back { display: flex; align-items: center; gap: 0.35rem; color: #64748b; text-decoration: none; font-size: 0.82rem; transition: color 0.2s; }
        .edit-back:hover { color: #7B2CBF; }
        .edit-header-title { font-size: 1rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.4rem; }

        .edit-actions { display: flex; gap: 0.6rem; align-items: center; }
        .edit-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.55rem 1.1rem; border-radius: 9px;
          font-size: 0.83rem; font-weight: 600;
          font-family: 'Poppins', sans-serif; cursor: pointer; border: none;
          transition: all 0.2s; text-decoration: none;
        }
        .edit-btn.primary { background: linear-gradient(135deg, #7B2CBF, #5A189A); color: #fff; box-shadow: 0 2px 8px rgba(14,165,233,0.3); }
        .edit-btn.primary:hover { box-shadow: 0 4px 14px rgba(14,165,233,0.4); transform: translateY(-1px); }
        .edit-btn.secondary { background: #f1f5f9; color: #475569; }
        .edit-btn.secondary:hover { background: #e2e8f0; }
        .edit-btn.publish { background: #10b981; color: #fff; }
        .edit-btn.publish:hover { background: #059669; }
        .edit-btn.preview { background: #fff; color: #7B2CBF; border: 1.5px solid #7B2CBF; }
        .edit-btn.preview:hover { background: #f0f9ff; }
        .edit-btn.danger { background: #fff; color: #ef4444; border: 1.5px solid #fecaca; }
        .edit-btn.danger:hover { background: #fef2f2; border-color: #ef4444; }
        .edit-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; }

        /* Layout */
        .edit-body {
          max-width: 1200px; margin: 2rem auto; padding: 0 2rem;
          display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem;
          align-items: start;
        }
        .edit-card {
          background: #fff; border-radius: 14px; padding: 1.75rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 1.25rem;
        }
        .edit-card-title {
          font-size: 0.78rem; font-weight: 700; color: #64748b;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1.25rem;
        }
        .edit-field { margin-bottom: 1.1rem; }
        .edit-label { display: block; font-size: 0.78rem; font-weight: 600; color: #475569; margin-bottom: 0.35rem; }
        .edit-input, .edit-select, .edit-textarea {
          width: 100%; padding: 0.58rem 0.9rem;
          border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-size: 0.86rem; font-family: 'Poppins', sans-serif;
          color: #0f172a; background: #fff; outline: none;
          transition: border-color 0.2s; box-sizing: border-box;
        }
        .edit-input:focus, .edit-select:focus, .edit-textarea:focus { border-color: #7B2CBF; }
        .edit-textarea { resize: vertical; min-height: 320px; line-height: 1.65; }
        .edit-textarea.short { min-height: 80px; }
        .edit-hint { font-size: 0.72rem; color: #94a3b8; margin-top: 0.25rem; }
        .edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        /* Image */
        .img-upload-area {
          border: 2px dashed #e2e8f0; border-radius: 12px;
          padding: 1.5rem; text-align: center; cursor: pointer;
          transition: all 0.2s; position: relative; background: #f8fafc;
        }
        .img-upload-area:hover { border-color: #7B2CBF; background: #f0f9ff; }
        .img-upload-area input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .img-preview { position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 16/9; background: #ffffff; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; }
        .img-preview img { width: 100%; height: 100%; object-fit: contain; padding: 12px; }
        .img-remove {
          position: absolute; top: 6px; right: 6px;
          background: rgba(0,0,0,0.55); color: #fff;
          border: none; border-radius: 50%; width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .img-remove:hover { background: #ef4444; }

        /* Sidebar */
        .edit-sidebar { position: sticky; top: 80px; }

        /* Status select */
        .status-row { display: flex; flex-direction: column; gap: 0.5rem; }
        .status-option {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.6rem 0.9rem; border-radius: 8px;
          border: 2px solid #e2e8f0; cursor: pointer;
          font-size: 0.83rem; font-weight: 600; color: #475569;
          transition: all 0.2s; font-family: 'Poppins', sans-serif;
          background: #fff;
        }
        .status-option.active-pending { border-color: #ea580c; color: #c2410c; background: #fff7ed; }
        .status-option.active-draft { border-color: #f59e0b; color: #d97706; background: #fffbeb; }
        .status-option.active-published { border-color: #10b981; color: #059669; background: #f0fdf4; }
        .status-option.active-archived { border-color: #94a3b8; color: #64748b; background: #f8fafc; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* Toggle */
        .edit-toggle {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.7rem 0; border-bottom: 1px solid #f1f5f9;
        }
        .edit-toggle:last-child { border-bottom: none; }
        .edit-toggle-label { font-size: 0.83rem; font-weight: 600; color: #0f172a; }
        .edit-toggle-sub { font-size: 0.72rem; color: #94a3b8; }
        .toggle-switch { position: relative; width: 38px; height: 20px; cursor: pointer; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; inset: 0; border-radius: 9999px; background: #e2e8f0; transition: background 0.2s; }
        .toggle-slider::before { content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #fff; left: 3px; top: 3px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .toggle-switch input:checked + .toggle-slider { background: #7B2CBF; }
        .toggle-switch input:checked + .toggle-slider::before { transform: translateX(18px); }

        /* Spinner */
        .edit-spinner {
          width: 36px; height: 36px;
          border: 3px solid #e2e8f0; border-top-color: #7B2CBF;
          border-radius: 50%; animation: spin 0.7s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .saved-toast {
          position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
          background: #10b981; color: #fff; padding: 0.7rem 1.5rem;
          border-radius: 9999px; font-size: 0.85rem; font-weight: 600;
          box-shadow: 0 4px 16px rgba(16,185,129,0.35);
          animation: slideUp 0.3s ease; z-index: 999;
        }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }

        @media (max-width: 900px) {
          .edit-body { grid-template-columns: 1fr; }
          .edit-sidebar { position: static; }
        }
        @media (max-width: 600px) {
          .edit-body { padding: 0 1rem; }
          .edit-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="edit-page">
        {/* Header */}
        <div className="edit-header">
          <div className="edit-header-left">
            <Link href="/admin/revista" className="edit-back">
              <ArrowLeft size={15} /> Revista
            </Link>
            <div className="edit-header-title">
              <Code2 size={16} color="#7B2CBF" />
              Editar História
            </div>
          </div>
          <div className="edit-actions">
            <Link
              href={`/revista/${formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              target="_blank"
              className="edit-btn preview"
            >
              <Eye size={14} /> Pré-visualizar
            </Link>
            <button
              className="edit-btn secondary"
              onClick={() => handleSave('draft')}
              disabled={loading}
            >
              <Save size={14} /> Rascunho
            </button>
            <button
              className="edit-btn primary"
              onClick={() => handleSave()}
              disabled={loading}
            >
              {loading ? 'A guardar...' : '✓ Guardar'}
            </button>
            {formData.status !== 'published' && (
              <button
                className="edit-btn publish"
                onClick={() => handleSave('published')}
                disabled={loading}
              >
                <Eye size={14} /> Publicar
              </button>
            )}
            <button
              className="edit-btn danger"
              onClick={handleDelete}
              disabled={loading}
              title="Eliminar história"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="edit-body">
          {/* Main Content */}
          <div>
            {submissionInfo?.isCommunity && (
              <div
                style={{
                  background: '#fff7ed',
                  border: '1.5px solid #fdba74',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#c2410c', fontSize: '0.9rem' }}>
                    <span>📢</span> Submissão da Comunidade
                  </div>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#9a3412', lineHeight: 1.5 }}>
                    Enviada por <strong>{submissionInfo.submitterName || formData.author.name}</strong> ({submissionInfo.submitterEmail || formData.author.email})
                    {submissionInfo.submittedAt && ` em ${new Date(submissionInfo.submittedAt).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' })}`}.
                  </p>
                </div>
                {formData.status !== 'published' && (
                  <button
                    onClick={() => handleSave('published')}
                    disabled={loading}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.6rem 1.25rem',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                    }}
                  >
                    ✓ Aprovar & Publicar Agora
                  </button>
                )}
              </div>
            )}

            <div className="edit-card">
              <p className="edit-card-title">📝 Conteúdo</p>

              <div className="edit-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="edit-label" style={{ margin: 0 }}>Título *</label>
                  <span style={{ fontSize: '0.72rem', color: formData.title.length > 90 ? (formData.title.length >= 100 ? '#ef4444' : '#d97706') : '#94a3b8', fontWeight: 600 }}>
                    {formData.title.length} / 100
                  </span>
                </div>
                <input className="edit-input" type="text" maxLength={100} value={formData.title} onChange={e => set('title', e.target.value)} />
              </div>

              <div className="edit-field">
                <label className="edit-label">Link Permanente (Slug / URL da História)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                  <span style={{ padding: '0.55rem 0.75rem', background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    /revista/
                  </span>
                  <input
                    className="edit-input"
                    style={{ border: 'none', borderRadius: 0, paddingLeft: '0.5rem' }}
                    type="text"
                    placeholder="como-construi-meu-saas"
                    value={formData.slug}
                    onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                  />
                </div>
                <p className="edit-hint">O URL onde esta publicação fica acessível. Podes alterar a qualquer momento.</p>
              </div>

              <div className="edit-field">
                <label className="edit-label">Texto em Destaque (highlight azul no título)</label>
                <input
                  className="edit-input" type="text"
                  placeholder="Parte do título com fundo azul"
                  value={formData.highlightText}
                  onChange={e => set('highlightText', e.target.value)}
                />
                <p className="edit-hint">Deve ser uma substring exacta do título.</p>
              </div>

              <div className="edit-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="edit-label" style={{ margin: 0 }}>Resumo *</label>
                  <span style={{ fontSize: '0.72rem', color: formData.excerpt.length > 450 ? (formData.excerpt.length >= 500 ? '#ef4444' : '#d97706') : '#94a3b8', fontWeight: 600 }}>
                    {formData.excerpt.length} / 500
                  </span>
                </div>
                <textarea className="edit-textarea short" maxLength={500} value={formData.excerpt} onChange={e => set('excerpt', e.target.value)} />
              </div>

              <div className="edit-row">
                <div className="edit-field">
                  <label className="edit-label">Categoria</label>
                  <select className="edit-select" value={formData.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="edit-field">
                  <label className="edit-label">Tags (vírgula)</label>
                  <input className="edit-input" placeholder="nodejs, api, backend" value={formData.tags} onChange={e => set('tags', e.target.value)} />
                </div>
              </div>

              <div className="edit-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="edit-label" style={{ margin: 0 }}>Conteúdo *</label>
                  <span style={{ fontSize: '0.72rem', color: formData.content.length > 4800 ? (formData.content.length >= 5000 ? '#ef4444' : '#d97706') : '#94a3b8', fontWeight: 600 }}>
                    {formData.content.length.toLocaleString('pt-MZ')} / 5.000 caracteres
                  </span>
                </div>
                <p className="edit-hint" style={{ marginBottom: '0.4rem' }}>## Título, {'>'} Pull quote, * Lista (máx. 5.000 caracteres)</p>
                <textarea className="edit-textarea" maxLength={5000} value={formData.content} onChange={e => set('content', e.target.value)} />
              </div>
            </div>

            <div className="edit-card">
              <p className="edit-card-title">🖼️ Imagem de Capa</p>
              {formData.coverImage ? (
                <div className="img-preview">
                  <img src={formData.coverImage} alt="Capa" />
                  <button className="img-remove" onClick={() => set('coverImage', '')}><X size={12} /></button>
                </div>
              ) : (
                <label className="img-upload-area">
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                  <ImageIcon size={28} color="#94a3b8" style={{ margin: '0 auto 0.4rem' }} />
                  <p style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                    {uploadingImage ? 'A fazer upload...' : 'Clica para upload'}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PNG, JPG, WEBP - 1200×800px recomendado</p>
                </label>
              )}
              <div className="edit-field" style={{ marginTop: '0.75rem' }}>
                <label className="edit-label">Ou URL directa</label>
                <input className="edit-input" type="url" placeholder="https://..." value={formData.coverImage} onChange={e => set('coverImage', e.target.value)} />
              </div>
            </div>

            <div className="edit-card">
              <p className="edit-card-title">👤 Autor</p>
              <div className="edit-row">
                <div className="edit-field">
                  <label className="edit-label">Nome</label>
                  <input className="edit-input" value={formData.author.name} onChange={e => setAuthor('name', e.target.value)} />
                </div>
                <div className="edit-field">
                  <label className="edit-label">Email</label>
                  <input className="edit-input" type="email" value={formData.author.email} onChange={e => setAuthor('email', e.target.value)} />
                </div>
              </div>
              <div className="edit-field" style={{ marginBottom: '1rem' }}>
                <label className="edit-label">Foto / Avatar do Autor (Aparece na Partilha do WhatsApp e Redes)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  {formData.author.avatar ? (
                    <div style={{ position: 'relative', width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid #7B2CBF', flexShrink: 0, boxShadow: '0 2px 8px rgba(123,44,191,0.25)' }}>
                      <img src={formData.author.avatar} alt="Avatar do autor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setAuthor('avatar', '')}
                        style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Remover foto"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                      <Upload size={14} color="#7B2CBF" />
                      <span>{uploadingAvatar ? 'A carregar foto...' : 'Carregar foto do autor'}</span>
                      <input type="file" accept="image/*" onChange={handleAuthorAvatarUpload} disabled={uploadingAvatar} style={{ display: 'none' }} />
                    </label>
                  )}
                  <input
                    className="edit-input"
                    type="url"
                    placeholder="Ou cole o link direto da foto (URL)..."
                    value={formData.author.avatar}
                    onChange={e => setAuthor('avatar', e.target.value)}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                </div>
              </div>

              <div className="edit-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="edit-label" style={{ margin: 0 }}>Bio curta</label>
                  <span style={{ fontSize: '0.72rem', color: (formData.author.bio || '').length > 450 ? ((formData.author.bio || '').length >= 500 ? '#ef4444' : '#d97706') : '#94a3b8', fontWeight: 600 }}>
                    {(formData.author.bio || '').length} / 500
                  </span>
                </div>
                <input className="edit-input" maxLength={500} placeholder="Engenheiro em Maputo..." value={formData.author.bio} onChange={e => setAuthor('bio', e.target.value)} />
              </div>

              <div className="edit-field">
                <label className="edit-label">Website / Portfólio (URL)</label>
                <input className="edit-input" type="url" placeholder="https://o-meu-site.com" value={formData.author.website} onChange={e => setAuthor('website', e.target.value)} />
              </div>

              <p className="edit-label" style={{ marginTop: '1rem', marginBottom: '0.4rem', fontWeight: 700, color: '#334155' }}>
                Redes Sociais do Autor
              </p>
              <div className="edit-row">
                <div className="edit-field">
                  <label className="edit-label">LinkedIn</label>
                  <input className="edit-input" placeholder="https://linkedin.com/in/... ou username" value={formData.author.socials.linkedin} onChange={e => setAuthorSocial('linkedin', e.target.value)} />
                </div>
                <div className="edit-field">
                  <label className="edit-label">GitHub</label>
                  <input className="edit-input" placeholder="https://github.com/... ou username" value={formData.author.socials.github} onChange={e => setAuthorSocial('github', e.target.value)} />
                </div>
              </div>
              <div className="edit-row">
                <div className="edit-field">
                  <label className="edit-label">Twitter / X</label>
                  <input className="edit-input" placeholder="https://x.com/... ou @username" value={formData.author.socials.twitter} onChange={e => setAuthorSocial('twitter', e.target.value)} />
                </div>
                <div className="edit-field">
                  <label className="edit-label">Instagram</label>
                  <input className="edit-input" placeholder="https://instagram.com/... ou @username" value={formData.author.socials.instagram} onChange={e => setAuthorSocial('instagram', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="edit-card">
              <p className="edit-card-title">🔍 SEO</p>
              <div className="edit-field">
                <label className="edit-label">Meta Título</label>
                <input className="edit-input" placeholder={formData.title} value={formData.seo.metaTitle} onChange={e => setSeo('metaTitle', e.target.value)} />
              </div>
              <div className="edit-field">
                <label className="edit-label">Meta Descrição</label>
                <textarea className="edit-textarea short" placeholder={formData.excerpt} value={formData.seo.metaDescription} onChange={e => setSeo('metaDescription', e.target.value)} />
              </div>
              <div className="edit-field">
                <label className="edit-label">Keywords</label>
                <input className="edit-input" placeholder="tech, mozambique, codigo" value={formData.seo.keywords} onChange={e => setSeo('keywords', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="edit-sidebar">
            <div className="edit-card">
              <p className="edit-card-title">📌 Status</p>
              <div className="status-row">
                {[
                  { key: 'pending',   label: 'Pendente de Revisão', dot: '#ea580c' },
                  { key: 'published', label: 'Publicado',           dot: '#10b981' },
                  { key: 'draft',     label: 'Rascunho',            dot: '#f59e0b' },
                  { key: 'archived',  label: 'Arquivado',           dot: '#94a3b8' },
                ].map(s => (
                  <button
                    key={s.key}
                    className={`status-option${formData.status === s.key ? ` active-${s.key}` : ''}`}
                    onClick={() => set('status', s.key)}
                  >
                    <span className="status-dot" style={{ background: s.dot }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="edit-card">
              <p className="edit-card-title">⚙️ Opções</p>
              <div className="edit-toggle">
                <div>
                  <div className="edit-toggle-label">Em Destaque</div>
                  <div className="edit-toggle-sub">Aparece no hero da revista</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={formData.featured} onChange={e => set('featured', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="edit-field" style={{ marginTop: '1.25rem' }}>
                <label className="edit-label">📅 Data de Publicação</label>
                <input
                  className="edit-input"
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={e => set('publishedAt', e.target.value)}
                />
                <p className="edit-hint">Data visível no cabeçalho do artigo na revista.</p>
              </div>

              <div className="edit-field" style={{ marginTop: '1rem' }}>
                <label className="edit-label">👁️ Visualizações (Contador Real)</label>
                <input
                  className="edit-input"
                  type="number"
                  min="0"
                  value={formData.views}
                  onChange={e => set('views', Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
                <p className="edit-hint">Incrementado automaticamente com leituras reais.</p>
              </div>
            </div>

            <div className="edit-card">
              <p className="edit-card-title">🔗 Acções</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="edit-btn primary" onClick={() => handleSave()} disabled={loading} style={{ justifyContent: 'center' }}>
                  <Save size={14} /> {loading ? 'A guardar...' : 'Guardar Alterações'}
                </button>
                {formData.status !== 'published' && (
                  <button className="edit-btn publish" onClick={() => handleSave('published')} disabled={loading} style={{ justifyContent: 'center' }}>
                    <Eye size={14} /> Publicar
                  </button>
                )}
                <Link href="/admin/revista" className="edit-btn secondary" style={{ justifyContent: 'center' }}>
                  <ArrowLeft size={14} /> Cancelar
                </Link>
                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0.25rem 0' }} />
                <button
                  className="edit-btn danger"
                  onClick={handleDelete}
                  disabled={loading}
                  style={{ justifyContent: 'center' }}
                >
                  <Trash2 size={14} /> Eliminar História
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {saved && <div className="saved-toast">✓ Guardado com sucesso!</div>}
    </>
  );
}
