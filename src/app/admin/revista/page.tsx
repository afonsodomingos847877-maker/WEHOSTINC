'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Edit, Trash2, Eye, Clock, Tag, Filter,
  ArrowLeft, Code2, Star, BookOpen, ChevronDown, Search, Check,
  Mail, Send, X, Loader2, Sparkles, CheckCheck, Download
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: { name: string; email?: string };
  category: string;
  status: string;
  featured: boolean;
  views: number;
  commentsCount?: number;
  readingTime?: number;
  publishedAt?: string;
  createdAt: string;
  submission?: {
    isCommunity?: boolean;
    submitterEmail?: string;
    submitterName?: string;
    submittedAt?: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  published: 'Publicado',
  pending:   'Pendente',
  draft:     'Rascunho',
  archived:  'Arquivado',
};

const STATUS_COLORS: Record<string, string> = {
  published: '#10b981',
  pending:   '#f97316',
  draft:     '#f59e0b',
  archived:  '#94a3b8',
};

const CAT_COLORS: Record<string, string> = {
  codigo:    '#7B2CBF',
  startups:  '#5A189A',
  ia:        '#9D4EDD',
  design:    '#ec4899',
  carreira:  '#f59e0b',
  tutoriais: '#10b981',
  noticias:  '#64748b',
};

export default function AdminRevistaPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [pdfDownloads, setPdfDownloads] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Modal de Convite VIP
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [inviteData, setInviteData] = useState({
    inviteeName: '',
    toEmail: '',
    proposedTopic: '',
    category: 'codigo',
    customNote: '',
  });

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteFeedback(null);

    try {
      const res = await fetch('/api/admin/revista/convidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInviteFeedback({ type: 'success', msg: data.message || 'Convite enviado com sucesso!' });
        setTimeout(() => {
          setInviteModalOpen(false);
          setInviteFeedback(null);
          setInviteData({
            inviteeName: '',
            toEmail: '',
            proposedTopic: '',
            category: 'codigo',
            customNote: '',
          });
        }, 2200);
      } else {
        setInviteFeedback({ type: 'error', msg: data.error || 'Erro ao enviar convite.' });
      }
    } catch {
      setInviteFeedback({ type: 'error', msg: 'Erro de conexão ao enviar convite.' });
    } finally {
      setInviteLoading(false);
    }
  };

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/revista/historias?status=${filter}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setStories(data.stories);
        if (typeof data.pdfDownloadsCount === 'number') {
          setPdfDownloads(data.pdfDownloadsCount);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta história permanentemente?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/revista/historias/${id}`, { method: 'DELETE' });
      fetchStories();
    } catch (e) {
      alert('Erro ao remover.');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/revista/historias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchStories();
      setStatusDropdown(null);
    } catch { alert('Erro ao alterar status.'); }
  };

  const handleFeature = async (id: string, featured: boolean) => {
    try {
      await fetch(`/api/admin/revista/historias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !featured }),
      });
      fetchStories();
    } catch { alert('Erro ao atualizar.'); }
  };

  const filtered = stories.filter(s => {
    const q = search.toLowerCase();
    return !q || s.title.toLowerCase().includes(q) || s.author?.name?.toLowerCase().includes(q);
  });

  const stats = {
    total:        stories.length,
    pending:      stories.filter(s => s.status === 'pending').length,
    published:    stories.filter(s => s.status === 'published').length,
    draft:        stories.filter(s => s.status === 'draft').length,
    views:        stories.reduce((acc, s) => acc + (s.views || 0), 0),
    pdfDownloads: pdfDownloads,
  };

  return (
    <>
      <style>{`
        .admin-revista { font-family: 'Poppins', sans-serif; min-height: 100vh; background: #f8fafc; }

        /* Header */
        .ar-header {
          background: #fff; border-bottom: 1px solid #e2e8f0;
          padding: 1.25rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ar-header-left { display: flex; align-items: center; gap: 1rem; }
        .ar-back {
          display: flex; align-items: center; gap: 0.4rem;
          color: #64748b; text-decoration: none; font-size: 0.82rem;
          transition: color 0.2s;
        }
        .ar-back:hover { color: #7B2CBF; }
        .ar-brand { display: flex; align-items: center; gap: 0.5rem; }
        .ar-brand-text { font-size: 1.1rem; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
        .ar-brand-text span { color: #7B2CBF; }
        .ar-new-btn {
          display: flex; align-items: center; gap: 0.4rem;
          background: linear-gradient(135deg, #7B2CBF, #5A189A);
          color: #fff; text-decoration: none;
          padding: 0.55rem 1.1rem; border-radius: 9px;
          font-size: 0.83rem; font-weight: 600;
          box-shadow: 0 2px 8px rgba(14,165,233,0.3);
          transition: all 0.2s;
        }
        .ar-new-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(14,165,233,0.4); }

        /* Stats */
        .ar-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
          max-width: 1100px; margin: 2rem auto 0; padding: 0 2rem;
        }
        .ar-stat {
          background: #fff; border-radius: 12px; padding: 1.25rem 1.5rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .ar-stat-val { font-size: 1.8rem; font-weight: 800; color: #0f172a; }
        .ar-stat-label { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; font-weight: 500; }

        /* Toolbar */
        .ar-toolbar {
          max-width: 1100px; margin: 1.5rem auto 0; padding: 0 2rem;
          display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
        }
        .ar-filter-btn {
          padding: 0.4rem 0.9rem; border-radius: 9999px;
          font-size: 0.78rem; font-weight: 600; cursor: pointer;
          border: 2px solid #e2e8f0; background: #fff; color: #475569;
          font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
        }
        .ar-filter-btn.active { background: #0f172a; border-color: #0f172a; color: #fff; }
        .ar-filter-btn:not(.active):hover { border-color: #7B2CBF; color: #7B2CBF; }
        .ar-search {
          margin-left: auto; position: relative;
        }
        .ar-search input {
          padding: 0.45rem 1rem 0.45rem 2.2rem;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          font-size: 0.82rem; font-family: 'Poppins', sans-serif;
          background: #fff; color: #0f172a; outline: none;
          transition: border-color 0.2s; width: 220px;
        }
        .ar-search input:focus { border-color: #7B2CBF; }
        .ar-search-icon {
          position: absolute; left: 0.6rem; top: 50%; transform: translateY(-50%);
          color: #94a3b8;
        }

        /* Table */
        .ar-table-wrap {
          max-width: 1100px; margin: 1.5rem auto 3rem; padding: 0 2rem;
        }
        .ar-table {
          width: 100%; background: #fff; border-radius: 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-collapse: collapse;
          overflow: hidden;
        }
        .ar-table thead { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .ar-table th {
          padding: 0.85rem 1.25rem; text-align: left;
          font-size: 0.72rem; font-weight: 700; color: #64748b;
          letter-spacing: 0.07em; text-transform: uppercase;
        }
        .ar-table td {
          padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .ar-table tr:last-child td { border-bottom: none; }
        .ar-table tr:hover td { background: #f8fafc; }

        .ar-title-cell { font-weight: 600; font-size: 0.88rem; color: #0f172a; max-width: 260px; }
        .ar-title-cell .ar-excerpt {
          font-weight: 400; font-size: 0.76rem; color: #94a3b8;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ar-cat-badge {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; padding: 0.2rem 0.6rem;
          border-radius: 9999px; background: #f0f9ff; color: #7B2CBF;
          border: 1px solid #bae6fd;
          display: inline-block;
        }
        .ar-status-wrap { position: relative; display: inline-block; }
        .ar-status-btn {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.25rem 0.7rem; border-radius: 9999px;
          font-size: 0.72rem; font-weight: 600; cursor: pointer;
          border: 1.5px solid; font-family: 'Poppins', sans-serif;
          background: transparent; transition: opacity 0.2s;
        }
        .ar-status-btn:hover { opacity: 0.75; }
        .ar-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .ar-status-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0; z-index: 99;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1); min-width: 140px; overflow: hidden;
        }
        .ar-status-option {
          padding: 0.6rem 1rem; font-size: 0.8rem; cursor: pointer;
          font-family: 'Poppins', sans-serif; color: #334155;
          transition: background 0.15s;
        }
        .ar-status-option:hover { background: #f0f9ff; color: #7B2CBF; }

        .ar-actions { display: flex; align-items: center; gap: 0.4rem; }
        .ar-action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid #e2e8f0; background: #fff; cursor: pointer;
          color: #475569; transition: all 0.2s; text-decoration: none;
        }
        .ar-action-btn:hover { background: #f0f9ff; color: #7B2CBF; border-color: #bae6fd; }
        .ar-action-btn.danger:hover { background: #fff5f5; color: #ef4444; border-color: #fecaca; }
        .ar-action-btn.feature-active { background: #fef3c7; color: #d97706; border-color: #fde68a; }

        .ar-empty { text-align: center; padding: 4rem 1rem; color: #94a3b8; }
        .ar-spinner {
          width: 32px; height: 32px;
          border: 3px solid #e2e8f0; border-top-color: #7B2CBF;
          border-radius: 50%; animation: spin 0.7s linear infinite;
          margin: 3rem auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .ar-stats { grid-template-columns: repeat(2, 1fr); }
          .ar-table-wrap { padding: 0 1rem; }
          .ar-table { display: block; overflow-x: auto; }
        }

        .ar-modal-input {
          width: 100%;
          padding: 0.65rem 0.85rem;
          border-radius: 9px;
          border: 1.5px solid #cbd5e1;
          font-size: 0.85rem;
          font-family: 'Poppins', sans-serif;
          outline: none;
          color: #0f172a !important;
          background-color: #ffffff !important;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ar-modal-input:focus {
          border-color: #7B2CBF !important;
          box-shadow: 0 0 0 3px rgba(123, 44, 191, 0.15) !important;
        }
        .ar-modal-input::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }
      `}</style>

      <div className="admin-revista" onClick={() => setStatusDropdown(null)}>
        {/* Header */}
        <div className="ar-header">
          <div className="ar-header-left">
            <Link href="/admin" className="ar-back">
              <ArrowLeft size={15} /> Admin
            </Link>
            <div className="ar-brand">
              <Code2 size={18} color="#7B2CBF" />
              <span className="ar-brand-text">
                codando <span>histórias</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>- gestão da revista</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link href="/revista" target="_blank" className="ar-action-btn" style={{ width: 'auto', padding: '0.4rem 0.85rem', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 500 }}>
              <Eye size={14} /> Ver Revista
            </Link>
            <a
              href="/api/revista/download"
              target="_blank"
              rel="noopener noreferrer"
              className="ar-action-btn"
              style={{ width: 'auto', padding: '0.4rem 0.85rem', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 500, color: '#7B2CBF' }}
              title="Baixar a versão atual do PDF da revista"
            >
              <Download size={14} /> Baixar PDF
            </a>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#FAF5FF',
                border: '1.5px solid #C77DFF',
                color: '#7B2CBF',
                padding: '0.5rem 1rem',
                borderRadius: '9px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Mail size={15} /> Convidar Convidado VIP
            </button>
            <Link href="/admin/revista/nova" className="ar-new-btn">
              <Plus size={16} /> Nova História
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="ar-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="ar-stat">
            <div className="ar-stat-val">{stats.total}</div>
            <div className="ar-stat-label">Total de Histórias</div>
          </div>
          <div
            className="ar-stat"
            style={{
              border: stats.pending > 0 ? '1.5px solid #fdba74' : undefined,
              background: stats.pending > 0 ? '#fff7ed' : '#fff',
            }}
          >
            <div className="ar-stat-val" style={{ color: '#ea580c' }}>
              {stats.pending}
            </div>
            <div
              className="ar-stat-label"
              style={{
                color: stats.pending > 0 ? '#c2410c' : '#64748b',
                fontWeight: stats.pending > 0 ? 700 : 500,
              }}
            >
              Pendentes de Revisão
            </div>
          </div>
          <div className="ar-stat">
            <div className="ar-stat-val" style={{ color: '#10b981' }}>{stats.published}</div>
            <div className="ar-stat-label">Publicadas</div>
          </div>
          <div className="ar-stat">
            <div className="ar-stat-val" style={{ color: '#f59e0b' }}>{stats.draft}</div>
            <div className="ar-stat-label">Rascunhos</div>
          </div>
          <div className="ar-stat">
            <div className="ar-stat-val" style={{ color: '#7B2CBF' }}>{stats.views.toLocaleString()}</div>
            <div className="ar-stat-label">Total de Leituras</div>
          </div>
          <div
            className="ar-stat"
            style={{
              border: '1.5px solid #E0AAFF',
              background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="ar-stat-val" style={{ color: '#7B2CBF' }}>
                {stats.pdfDownloads.toLocaleString()}
              </div>
              <div
                style={{
                  background: '#7B2CBF',
                  color: '#fff',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Download size={16} />
              </div>
            </div>
            <div className="ar-stat-label" style={{ color: '#5A189A', fontWeight: 600 }}>
              Downloads do PDF
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ar-toolbar">
          {['all', 'pending', 'published', 'draft', 'archived'].map(f => (
            <button
              key={f}
              className={`ar-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
              style={f === 'pending' && stats.pending > 0 && filter !== f ? { borderColor: '#fdba74', color: '#ea580c', background: '#fff7ed' } : undefined}
            >
              {f === 'all' ? 'Todas' : STATUS_LABELS[f] || f}
              {f === 'pending' && stats.pending > 0 && (
                <span style={{ marginLeft: 6, background: '#ea580c', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '9999px', fontWeight: 700 }}>
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
          <div className="ar-search">
            <Search size={14} className="ar-search-icon" />
            <input
              type="text"
              placeholder="Pesquisar histórias..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="ar-table-wrap">
          {loading ? (
            <div className="ar-spinner" />
          ) : filtered.length === 0 ? (
            <div className="ar-empty">
              <BookOpen size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p>Nenhuma história encontrada.</p>
              <Link href="/admin/revista/nova" className="ar-new-btn" style={{ display: 'inline-flex', marginTop: '1rem' }}>
                <Plus size={15} /> Criar primeira história
              </Link>
            </div>
          ) : (
            <table className="ar-table">
              <thead>
                <tr>
                  <th>História</th>
                  <th>Categoria</th>
                  <th>Autor</th>
                  <th>Status</th>
                  <th>Leituras</th>
                  <th>Acções</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(story => (
                  <tr key={story.id}>
                    {/* Title */}
                    <td>
                      <div className="ar-title-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                          {story.featured && (
                            <Star size={12} color="#d97706" style={{ verticalAlign: 'middle' }} />
                          )}
                          {story.submission?.isCommunity && (
                            <span style={{ fontSize: '0.62rem', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #fde68a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Comunidade
                            </span>
                          )}
                        </div>
                        {story.title}
                        <div className="ar-excerpt">{story.excerpt}</div>
                        <div style={{ fontSize: '0.72rem', color: '#7B2CBF', marginTop: '3px', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600 }}>/revista/{story.slug}</span>
                          {story.commentsCount != null && story.commentsCount > 0 && (
                            <span style={{ color: '#6366f1', fontWeight: 600 }}>
                              💬 {story.commentsCount} {story.commentsCount === 1 ? 'comentário' : 'comentários'}
                            </span>
                          )}
                          {story.publishedAt && (
                            <span style={{ color: '#94a3b8' }}>
                              • {new Date(story.publishedAt).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span
                        className="ar-cat-badge"
                        style={{ color: CAT_COLORS[story.category] || '#7B2CBF', background: `${CAT_COLORS[story.category] || '#7B2CBF'}15`, borderColor: `${CAT_COLORS[story.category] || '#7B2CBF'}40` }}
                      >
                        {story.category}
                      </span>
                    </td>

                    {/* Author */}
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                      <div style={{ fontWeight: 600 }}>{story.author?.name}</div>
                      {story.submission?.submitterEmail && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {story.submission.submitterEmail}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td onClick={e => e.stopPropagation()}>
                      <div className="ar-status-wrap">
                        <button
                          className="ar-status-btn"
                          style={{
                            color: STATUS_COLORS[story.status] || '#94a3b8',
                            borderColor: `${STATUS_COLORS[story.status] || '#94a3b8'}40`,
                          }}
                          onClick={() => setStatusDropdown(statusDropdown === story.id ? null : story.id)}
                        >
                          <span className="ar-status-dot" style={{ background: STATUS_COLORS[story.status] || '#94a3b8' }} />
                          {STATUS_LABELS[story.status] || story.status}
                          <ChevronDown size={11} />
                        </button>
                        {statusDropdown === story.id && (
                          <div className="ar-status-dropdown">
                            {['published', 'pending', 'draft', 'archived'].map(s => (
                              <div
                                key={s}
                                className="ar-status-option"
                                onClick={() => handleStatusChange(story.id, s)}
                              >
                                {STATUS_LABELS[s]}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Views */}
                    <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Eye size={13} color="#94a3b8" /> {story.views}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="ar-actions">
                        {story.status === 'pending' && (
                          <button
                            className="ar-action-btn"
                            style={{
                              background: '#ecfdf5',
                              color: '#059669',
                              borderColor: '#a7f3d0',
                              padding: '0.3rem 0.65rem',
                              width: 'auto',
                              gap: 4,
                              fontWeight: 700,
                              fontSize: '0.74rem',
                            }}
                            onClick={() => handleStatusChange(story.id, 'published')}
                            title="Aprovar e Publicar Imediatamente"
                          >
                            <Check size={13} /> Aprovar
                          </button>
                        )}
                        <button
                          className={`ar-action-btn${story.featured ? ' feature-active' : ''}`}
                          onClick={() => handleFeature(story.id, story.featured)}
                          title={story.featured ? 'Remover destaque' : 'Marcar como destaque'}
                        >
                          <Star size={14} />
                        </button>
                        <Link
                          href={`/revista/${story.slug}`}
                          target="_blank"
                          className="ar-action-btn"
                          title="Ver história"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/admin/revista/editar/${story.id}`}
                          className="ar-action-btn"
                          title="Editar"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          className="ar-action-btn danger"
                          onClick={() => handleDelete(story.id)}
                          disabled={deleting === story.id}
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Convite VIP */}
      {inviteModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(5px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem',
          }}
          onClick={() => setInviteModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff', borderRadius: 20, maxWidth: 580, width: '100%',
              border: '1.5px solid #E0AAFF', boxShadow: '0 25px 60px -15px rgba(123,44,191,0.3)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
              borderBottom: '1px solid #E0AAFF', padding: '1.25rem 1.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'linear-gradient(135deg, #7B2CBF, #5A189A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  <Mail size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    Convidar Autor VIP para a Revista
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b' }}>
                    O convidado receberá um e-mail editorial com link inteligente pré-preenchido.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendInvite} style={{ padding: '1.5rem 1.75rem' }}>
              {inviteFeedback && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem',
                  fontSize: '0.84rem', fontWeight: 600,
                  background: inviteFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${inviteFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  color: inviteFeedback.type === 'success' ? '#065f46' : '#991b1b',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  {inviteFeedback.type === 'success' ? <CheckCheck size={18} /> : <span>⚠️</span>}
                  <span>{inviteFeedback.msg}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Nome do Convidado *
                  </label>
                  <input
                    className="ar-modal-input"
                    type="text"
                    required
                    placeholder="Ex: Valter Manhiça"
                    value={inviteData.inviteeName}
                    onChange={e => setInviteData(prev => ({ ...prev, inviteeName: e.target.value }))}
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    E-mail do Convidado *
                  </label>
                  <input
                    className="ar-modal-input"
                    type="email"
                    required
                    placeholder="valter@empresa.com"
                    value={inviteData.toEmail}
                    onChange={e => setInviteData(prev => ({ ...prev, toEmail: e.target.value }))}
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Categoria Sugerida
                  </label>
                  <select
                    className="ar-modal-input"
                    value={inviteData.category}
                    onChange={e => setInviteData(prev => ({ ...prev, category: e.target.value }))}
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  >
                    <option value="codigo">Código & Arquitectura</option>
                    <option value="startups">Startups & Produtos</option>
                    <option value="ia">IA & Machine Learning</option>
                    <option value="design">Design & UI/UX</option>
                    <option value="carreira">Carreira & Trabalho Remoto</option>
                    <option value="tutoriais">Guias Práticos</option>
                    <option value="noticias">Ecossistema & Notícias</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Tema / Pauta Sugerida (Opcional)
                  </label>
                  <input
                    className="ar-modal-input"
                    type="text"
                    placeholder="Ex: Como escalei o meu SaaS"
                    value={inviteData.proposedTopic}
                    onChange={e => setInviteData(prev => ({ ...prev, proposedTopic: e.target.value }))}
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Nota Personalizada do Editor (Opcional)
                </label>
                <textarea
                  className="ar-modal-input"
                  rows={3}
                  placeholder="Ex: Adorámos a tua apresentação recente sobre microsserviços e seria uma honra ter a tua perspectiva na revista..."
                  value={inviteData.customNote}
                  onChange={e => setInviteData(prev => ({ ...prev, customNote: e.target.value }))}
                  style={{ color: '#0f172a', backgroundColor: '#ffffff', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  style={{
                    background: '#fff', border: '1px solid #cbd5e1', color: '#64748b',
                    padding: '0.6rem 1.1rem', borderRadius: 9, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                    background: 'linear-gradient(135deg, #7B2CBF, #5A189A)', color: '#fff',
                    padding: '0.6rem 1.4rem', borderRadius: 9, border: 'none',
                    fontSize: '0.85rem', fontWeight: 700, cursor: inviteLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(123,44,191,0.3)', opacity: inviteLoading ? 0.7 : 1,
                  }}
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 size={16} /> A enviar e-mail...
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Disparar Convite VIP
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
