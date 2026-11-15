'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Upload, X, Code2, ChevronRight, ChevronLeft, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  { value: 'codigo',    label: 'Código' },
  { value: 'startups',  label: 'Startups' },
  { value: 'ia',        label: 'IA & Machine Learning' },
  { value: 'design',    label: 'Design' },
  { value: 'carreira',  label: 'Carreira' },
  { value: 'tutoriais', label: 'Tutoriais' },
  { value: 'noticias',  label: 'Notícias' },
];

export default function NovaHistoriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    highlightText: '',
    excerpt: '',
    content: `## Introdução\n\nEscreve aqui a introdução da história.\n\n> "Coloca aqui uma citação impactante"\n\n## O Tema Principal\n\nDescreve o tema central da história.\n\n* Ponto importante 1\n* Ponto importante 2\n* Ponto importante 3\n\n## Conclusão\n\nFecha a história de forma memorável.`,
    coverImage: '',
    category: 'codigo',
    tags: '',
    status: 'draft',
    featured: false,
    publishedAt: '',
    author: {
      name: 'WEHOSTHERE',
      email: 'info@wehosthere.com',
      avatar: '',
      bio: '',
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

  const set = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));
  const setAuthor = (key: string, value: string) => setFormData(prev => ({
    ...prev, author: { ...prev.author, [key]: value },
  }));
  const setAuthorSocial = (key: string, value: string) => setFormData(prev => ({
    ...prev, author: {
      ...prev.author,
      socials: { ...prev.author.socials, [key]: value },
    },
  }));
  const setSeo = (key: string, value: string) => setFormData(prev => ({
    ...prev, seo: { ...prev.seo, [key]: value },
  }));

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

  const handleSubmit = async (status: 'draft' | 'published') => {
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
      const res = await fetch('/api/admin/revista/historias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug: formData.slug.trim(),
          publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : (status === 'published' ? new Date().toISOString() : undefined),
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => router.push('/admin/revista'), 1200);
      } else {
        alert(data.error || 'Erro ao criar história.');
      }
    } catch { alert('Erro de rede.'); }
    finally { setLoading(false); }
  };

  const steps = [
    { num: 1, label: 'Conteúdo' },
    { num: 2, label: 'Media & Autor' },
    { num: 3, label: 'SEO & Publicar' },
  ];

  return (
    <>
      <style>{`
        .nova-page { font-family: 'Poppins', sans-serif; background: #f8fafc; min-height: 100vh; }

        .nova-header {
          background: #fff; border-bottom: 1px solid #e2e8f0;
          padding: 1rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nova-header-left { display: flex; align-items: center; gap: 1rem; }
        .nova-back { display: flex; align-items: center; gap: 0.35rem; color: #64748b; text-decoration: none; font-size: 0.82rem; transition: color 0.2s; }
        .nova-back:hover { color: #7B2CBF; }
        .nova-title-bar { font-size: 1rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.4rem; }

        /* Steps */
        .nova-steps {
          display: flex; align-items: center; gap: 0;
          max-width: 680px; margin: 2rem auto 0; padding: 0 2rem;
        }
        .nova-step { display: flex; align-items: center; gap: 0.5rem; }
        .nova-step-num {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700;
          background: #e2e8f0; color: #94a3b8;
          transition: all 0.2s;
        }
        .nova-step-num.active { background: #7B2CBF; color: #fff; }
        .nova-step-num.done { background: #10b981; color: #fff; }
        .nova-step-label { font-size: 0.78rem; font-weight: 600; color: #94a3b8; }
        .nova-step-label.active { color: #7B2CBF; }
        .nova-step-label.done { color: #10b981; }
        .nova-step-sep { flex: 1; height: 2px; background: #e2e8f0; margin: 0 0.75rem; min-width: 40px; }
        .nova-step-sep.done { background: #10b981; }

        /* Form */
        .nova-form {
          max-width: 680px; margin: 2rem auto 4rem; padding: 0 2rem;
        }
        .nova-card {
          background: #fff; border-radius: 14px; padding: 2rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 1.5rem;
        }
        .nova-card-title {
          font-size: 0.82rem; font-weight: 700; color: #64748b;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1.25rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .nova-field { margin-bottom: 1.25rem; }
        .nova-label {
          display: block; font-size: 0.78rem; font-weight: 600;
          color: #475569; margin-bottom: 0.4rem;
        }
        .nova-input, .nova-select, .nova-textarea {
          width: 100%; padding: 0.6rem 0.9rem;
          border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-size: 0.86rem; font-family: 'Poppins', sans-serif;
          color: #0f172a; background: #fff; outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .nova-input:focus, .nova-select:focus, .nova-textarea:focus { border-color: #7B2CBF; }
        .nova-textarea { resize: vertical; min-height: 260px; line-height: 1.65; }
        .nova-textarea.short { min-height: 90px; }
        .nova-hint { font-size: 0.72rem; color: #94a3b8; margin-top: 0.3rem; }

        .nova-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        /* Image Upload */
        .img-upload-area {
          border: 2px dashed #e2e8f0; border-radius: 12px;
          padding: 2rem; text-align: center; cursor: pointer;
          transition: all 0.2s; position: relative;
          background: #f8fafc;
        }
        .img-upload-area:hover { border-color: #7B2CBF; background: #f0f9ff; }
        .img-upload-area input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .img-preview { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 16/9; background: #ffffff; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; }
        .img-preview img { width: 100%; height: 100%; object-fit: contain; padding: 12px; }
        .img-remove {
          position: absolute; top: 8px; right: 8px;
          background: rgba(0,0,0,0.6); color: #fff; border: none;
          border-radius: 50%; width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s;
        }
        .img-remove:hover { background: #ef4444; }

        /* Toggle */
        .nova-toggle {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;
        }
        .nova-toggle:last-child { border-bottom: none; }
        .nova-toggle-label { font-size: 0.85rem; font-weight: 600; color: #0f172a; }
        .nova-toggle-sub { font-size: 0.75rem; color: #94a3b8; }
        .toggle-switch {
          position: relative; width: 40px; height: 22px; cursor: pointer;
        }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider {
          position: absolute; inset: 0; border-radius: 9999px;
          background: #e2e8f0; transition: background 0.2s;
        }
        .toggle-slider::before {
          content: ''; position: absolute;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; left: 3px; top: 3px;
          transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .toggle-switch input:checked + .toggle-slider { background: #7B2CBF; }
        .toggle-switch input:checked + .toggle-slider::before { transform: translateX(18px); }

        /* Actions */
        .nova-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .nova-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.65rem 1.4rem; border-radius: 9px;
          font-size: 0.85rem; font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer; border: none; transition: all 0.2s;
          text-decoration: none;
        }
        .nova-btn.primary {
          background: linear-gradient(135deg, #7B2CBF, #5A189A);
          color: #fff; box-shadow: 0 2px 8px rgba(14,165,233,0.3);
        }
        .nova-btn.primary:hover { box-shadow: 0 4px 14px rgba(14,165,233,0.4); transform: translateY(-1px); }
        .nova-btn.secondary { background: #f1f5f9; color: #475569; }
        .nova-btn.secondary:hover { background: #e2e8f0; }
        .nova-btn.ghost { background: #fff; color: #7B2CBF; border: 1.5px solid #7B2CBF; }
        .nova-btn.ghost:hover { background: #f0f9ff; }
        .nova-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; }

        .nova-nav { display: flex; justify-content: space-between; margin-top: 0.5rem; }

        .saved-toast {
          position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
          background: #10b981; color: #fff; padding: 0.75rem 1.5rem;
          border-radius: 9999px; font-size: 0.85rem; font-weight: 600;
          box-shadow: 0 4px 16px rgba(16,185,129,0.4);
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }

        @media (max-width: 640px) {
          .nova-row { grid-template-columns: 1fr; }
          .nova-form { padding: 0 1rem; }
        }
      `}</style>

      <div className="nova-page">
        {/* Header */}
        <div className="nova-header">
          <div className="nova-header-left">
            <Link href="/admin/revista" className="nova-back">
              <ArrowLeft size={15} /> Revista
            </Link>
            <div className="nova-title-bar">
              <Code2 size={16} color="#7B2CBF" />
              Nova História
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="nova-btn secondary"
              onClick={() => handleSubmit('draft')}
              disabled={loading}
            >
              <Save size={15} /> Guardar Rascunho
            </button>
            <button
              className="nova-btn primary"
              onClick={() => handleSubmit('published')}
              disabled={loading}
            >
              <Eye size={15} /> Publicar
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="nova-steps">
          {steps.map((s, i) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
              <div className="nova-step">
                <div className={`nova-step-num${step === s.num ? ' active' : step > s.num ? ' done' : ''}`}>
                  {s.num}
                </div>
                <span className={`nova-step-label${step === s.num ? ' active' : step > s.num ? ' done' : ''}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`nova-step-sep${step > s.num ? ' done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        <div className="nova-form">
          {/* ── Step 1: Conteúdo ── */}
          {step === 1 && (
            <>
              <div className="nova-card">
                <p className="nova-card-title">📝 Conteúdo da História</p>

                <div className="nova-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="nova-label" style={{ margin: 0 }}>Título *</label>
                    <span style={{ fontSize: '0.72rem', color: formData.title.length > 90 ? (formData.title.length >= 100 ? '#ef4444' : '#d97706') : '#94a3b8', fontWeight: 600 }}>
                      {formData.title.length} / 100
                    </span>
                  </div>
                  <input
                    className="nova-input"
                    type="text"
                    maxLength={100}
                    placeholder="Ex: Como construí a minha primeira API em 24 horas"
                    value={formData.title}
                    onChange={e => set('title', e.target.value)}
                  />
                </div>

                <div className="nova-field">
                  <label className="nova-label">Link Permanente Personalizado (Slug / Opcional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                    <span style={{ padding: '0.55rem 0.75rem', background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      /revista/
                    </span>
                    <input
                      className="nova-input"
                      style={{ border: 'none', borderRadius: 0, paddingLeft: '0.5rem' }}
                      type="text"
                      placeholder="deixa em branco para gerar automático"
                      value={formData.slug}
                      onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                    />
                  </div>
                  <p className="nova-hint">Se deixares em branco, o link será criado automaticamente a partir do título.</p>
                </div>

                <div className="nova-field">
                  <label className="nova-label">Texto em Destaque (highlight azul no título)</label>
                  <input
                    className="nova-input"
                    type="text"
                    placeholder="Ex: primeira API (deve ser parte exacta do título)"
                    value={formData.highlightText}
                    onChange={e => set('highlightText', e.target.value)}
                  />
                  <p className="nova-hint">Esta parte do título vai aparecer com fundo azul, como no maningue.</p>
                </div>

                <div className="nova-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="nova-label" style={{ margin: 0 }}>Resumo / Excerpt *</label>
                    <span style={{ fontSize: '0.72rem', color: formData.excerpt.length > 450 ? (formData.excerpt.length >= 500 ? '#ef4444' : '#d97706') : '#94a3b8', fontWeight: 600 }}>
                      {formData.excerpt.length} / 500
                    </span>
                  </div>
                  <textarea
                    className="nova-textarea short"
                    maxLength={500}
                    placeholder="2-3 frases que resumem a história e motivam o leitor a continuar..."
                    value={formData.excerpt}
                    onChange={e => set('excerpt', e.target.value)}
                  />
                </div>

                <div className="nova-row">
                  <div className="nova-field">
                    <label className="nova-label">Categoria *</label>
                    <select
                      className="nova-select"
                      value={formData.category}
                      onChange={e => set('category', e.target.value)}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="nova-field">
                    <label className="nova-label">Tags (separadas por vírgula)</label>
                    <input
                      className="nova-input"
                      type="text"
                      placeholder="Ex: nodejs, api, backend"
                      value={formData.tags}
                      onChange={e => set('tags', e.target.value)}
                    />
                  </div>
                </div>

                <div className="nova-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="nova-label" style={{ margin: 0 }}>Conteúdo *</label>
                    <span style={{ fontSize: '0.72rem', color: formData.content.length > 4800 ? (formData.content.length >= 5000 ? '#ef4444' : '#d97706') : '#94a3b8', fontWeight: 600 }}>
                      {formData.content.length.toLocaleString('pt-MZ')} / 5.000 caracteres
                    </span>
                  </div>
                  <p className="nova-hint" style={{ marginBottom: '0.5rem' }}>
                    Usa ## para títulos, {'>'} para pull quotes, * para listas (máx. 5.000 caracteres).
                  </p>
                  <textarea
                    className="nova-textarea"
                    maxLength={5000}
                    value={formData.content}
                    onChange={e => set('content', e.target.value)}
                  />
                </div>
              </div>

              <div className="nova-nav">
                <div />
                <button className="nova-btn primary" onClick={() => setStep(2)}>
                  Próximo <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Media & Autor ── */}
          {step === 2 && (
            <>
              <div className="nova-card">
                <p className="nova-card-title">🖼️ Imagem de Capa</p>
                {formData.coverImage ? (
                  <div className="img-preview">
                    <img src={formData.coverImage} alt="Capa" />
                    <button className="img-remove" onClick={() => set('coverImage', '')}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="img-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div>A fazer upload...</div>
                    ) : (
                      <>
                        <ImageIcon size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
                        <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                          Clica para fazer upload da imagem de capa
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PNG, JPG, WEBP - Recomendado 1200×800px</p>
                      </>
                    )}
                  </label>
                )}
                <div className="nova-field" style={{ marginTop: '1rem' }}>
                  <label className="nova-label">Ou URL da imagem</label>
                  <input
                    className="nova-input"
                    type="url"
                    placeholder="https://..."
                    value={formData.coverImage}
                    onChange={e => set('coverImage', e.target.value)}
                  />
                </div>
              </div>

              <div className="nova-card">
                <p className="nova-card-title">👤 Autor</p>
                <div className="nova-row">
                  <div className="nova-field">
                    <label className="nova-label">Nome</label>
                    <input className="nova-input" value={formData.author.name} onChange={e => setAuthor('name', e.target.value)} />
                  </div>
                  <div className="nova-field">
                    <label className="nova-label">Email</label>
                    <input className="nova-input" type="email" value={formData.author.email} onChange={e => setAuthor('email', e.target.value)} />
                  </div>
                </div>
                <div className="nova-field">
                  <label className="nova-label">Avatar (URL)</label>
                  <input className="nova-input" type="url" placeholder="https://..." value={formData.author.avatar} onChange={e => setAuthor('avatar', e.target.value)} />
                </div>
                <div className="nova-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="nova-label" style={{ margin: 0 }}>Bio curta</label>
                    <span style={{ fontSize: '0.72rem', color: (formData.author.bio || '').length > 450 ? ((formData.author.bio || '').length >= 500 ? '#ef4444' : '#d97706') : '#94a3b8', fontWeight: 600 }}>
                      {(formData.author.bio || '').length} / 500
                    </span>
                  </div>
                  <input className="nova-input" maxLength={500} placeholder="Ex: Engenheiro de software em Maputo" value={formData.author.bio} onChange={e => setAuthor('bio', e.target.value)} />
                </div>
                <div className="nova-field">
                  <label className="nova-label">Website / Portfólio (URL)</label>
                  <input className="nova-input" type="url" placeholder="https://o-meu-site.com" value={formData.author.website} onChange={e => setAuthor('website', e.target.value)} />
                </div>

                <p className="nova-label" style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontWeight: 700, color: '#334155' }}>
                  Redes Sociais do Autor
                </p>
                <div className="nova-row">
                  <div className="nova-field">
                    <label className="nova-label">LinkedIn</label>
                    <input className="nova-input" placeholder="https://linkedin.com/in/... ou username" value={formData.author.socials.linkedin} onChange={e => setAuthorSocial('linkedin', e.target.value)} />
                  </div>
                  <div className="nova-field">
                    <label className="nova-label">GitHub</label>
                    <input className="nova-input" placeholder="https://github.com/... ou username" value={formData.author.socials.github} onChange={e => setAuthorSocial('github', e.target.value)} />
                  </div>
                </div>
                <div className="nova-row">
                  <div className="nova-field">
                    <label className="nova-label">Twitter / X</label>
                    <input className="nova-input" placeholder="https://x.com/... ou @username" value={formData.author.socials.twitter} onChange={e => setAuthorSocial('twitter', e.target.value)} />
                  </div>
                  <div className="nova-field">
                    <label className="nova-label">Instagram</label>
                    <input className="nova-input" placeholder="https://instagram.com/... ou @username" value={formData.author.socials.instagram} onChange={e => setAuthorSocial('instagram', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="nova-nav">
                <button className="nova-btn secondary" onClick={() => setStep(1)}>
                  <ChevronLeft size={15} /> Anterior
                </button>
                <button className="nova-btn primary" onClick={() => setStep(3)}>
                  Próximo <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: SEO & Publicar ── */}
          {step === 3 && (
            <>
              <div className="nova-card">
                <p className="nova-card-title">🔍 SEO</p>
                <div className="nova-field">
                  <label className="nova-label">Meta Título</label>
                  <input className="nova-input" placeholder={formData.title} value={formData.seo.metaTitle} onChange={e => setSeo('metaTitle', e.target.value)} />
                </div>
                <div className="nova-field">
                  <label className="nova-label">Meta Descrição</label>
                  <textarea className="nova-textarea short" placeholder={formData.excerpt} value={formData.seo.metaDescription} onChange={e => setSeo('metaDescription', e.target.value)} />
                </div>
                <div className="nova-field">
                  <label className="nova-label">Keywords</label>
                  <input className="nova-input" placeholder="ex: nodejs, api, mozambique tech" value={formData.seo.keywords} onChange={e => setSeo('keywords', e.target.value)} />
                </div>
              </div>

              <div className="nova-card">
                <p className="nova-card-title">⚙️ Opções</p>
                <div className="nova-toggle">
                  <div>
                    <div className="nova-toggle-label">História em Destaque</div>
                    <div className="nova-toggle-sub">Aparece no topo da revista e na sidebar</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={e => set('featured', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="nova-field" style={{ marginTop: '1.25rem' }}>
                  <label className="nova-label">📅 Data de Publicação (Opcional)</label>
                  <input
                    className="nova-input"
                    type="datetime-local"
                    value={formData.publishedAt}
                    onChange={e => set('publishedAt', e.target.value)}
                  />
                  <p className="nova-hint">Se deixares em branco, assumirá a data/hora actual ao publicar.</p>
                </div>
              </div>

              <div className="nova-card">
                <p className="nova-card-title">🚀 Publicar</p>
                <div className="nova-actions">
                  <button
                    className="nova-btn ghost"
                    onClick={() => handleSubmit('draft')}
                    disabled={loading}
                  >
                    <Save size={15} /> Guardar Rascunho
                  </button>
                  <button
                    className="nova-btn primary"
                    onClick={() => handleSubmit('published')}
                    disabled={loading}
                  >
                    <Eye size={15} /> {loading ? 'A publicar...' : 'Publicar Agora'}
                  </button>
                </div>
              </div>

              <div className="nova-nav">
                <button className="nova-btn secondary" onClick={() => setStep(2)}>
                  <ChevronLeft size={15} /> Anterior
                </button>
              </div>
            </>
          )}
        </div>

        {saved && (
          <div className="saved-toast">
            ✓ História guardada com sucesso!
          </div>
        )}
      </div>
    </>
  );
}
