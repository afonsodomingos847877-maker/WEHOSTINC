'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Clock, Eye, ChevronRight, BookOpen, Code2,
  Cpu, Palette, Briefcase, Newspaper, Star, Menu, X, Home, ExternalLink, Maximize2,
  Bell, BellOff, BellRing, Check, Download, FileText
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  author: { name: string; avatar?: string };
  category: string;
  tags: string[];
  readingTime?: number;
  views: number;
  featured: boolean;
  highlightText?: string;
  publishedAt?: string;
}

const CATEGORIES = [
  { key: 'all', label: 'Todas', icon: Newspaper },
  { key: 'codigo', label: 'Código', icon: Code2 },
  { key: 'startups', label: 'Startups', icon: Briefcase },
  { key: 'ia', label: 'IA', icon: Cpu },
  { key: 'design', label: 'Design', icon: Palette },
  { key: 'carreira', label: 'Carreira', icon: BookOpen },
];

const CAT_COLORS: Record<string, string> = {
  codigo: '#7B2CBF',
  startups: '#5A189A',
  ia: '#9D4EDD',
  design: '#ec4899',
  carreira: '#f59e0b',
  tutoriais: '#10b981',
  noticias: '#64748b',
};

function buildTitle(title: string, highlight?: string) {
  if (!highlight || !title.includes(highlight)) {
    return <span>{title}</span>;
  }
  const parts = title.split(highlight);
  return (
    <>
      {parts[0]}
      <mark style={{
        background: '#7B2CBF',
        color: '#fff',
        borderRadius: '3px',
        padding: '0 4px',
        fontStyle: 'normal',
      }}>{highlight}</mark>
      {parts.slice(1).join(highlight)}
    </>
  );
}

function TypedTitle({
  title,
  highlight,
  speed = 30,
}: {
  title: string;
  highlight?: string;
  speed?: number;
}) {
  const [typedLength, setTypedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setTypedLength(0);
    setIsComplete(false);

    let current = 0;
    const total = title.length;
    const interval = setInterval(() => {
      current++;
      setTypedLength(current);
      if (current >= total) {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [title, speed]);

  if (!highlight || !title.includes(highlight)) {
    const currentText = title.slice(0, typedLength);
    return (
      <span>
        {currentText}
        <span
          className={`hero-typing-cursor${isComplete ? ' complete' : ''}`}
          aria-hidden="true"
        />
      </span>
    );
  }

  const highlightStart = title.indexOf(highlight);
  const highlightEnd = highlightStart + highlight.length;

  const beforeText = title.slice(0, Math.min(typedLength, highlightStart));
  const showHighlight = typedLength > highlightStart;
  const highlightTyped = showHighlight
    ? title.slice(highlightStart, Math.min(typedLength, highlightEnd))
    : '';
  const showAfter = typedLength > highlightEnd;
  const afterTyped = showAfter ? title.slice(highlightEnd, typedLength) : '';

  return (
    <span>
      {beforeText}
      {showHighlight && (
        <mark
          style={{
            background: '#7B2CBF',
            color: '#fff',
            borderRadius: '4px',
            padding: '0 5px',
            fontStyle: 'normal',
            display: 'inline',
          }}
        >
          {highlightTyped}
        </mark>
      )}
      {afterTyped}
      <span
        className={`hero-typing-cursor${isComplete ? ' complete' : ''}`}
        aria-hidden="true"
      />
    </span>
  );
}

export default function RevistaPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'recentes' | 'mais-lidas' | 'destaque'>('recentes');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ── Push Notifications ──
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushDone, setPushDone] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
      if (Notification.permission === 'granted') setPushDone(true);
    }
    // Verificar se o utilizador já dispensou o banner
    try {
      if (localStorage.getItem('revista_push_dismissed') === '1') setPushDismissed(true);
      if (localStorage.getItem('revista_push_done') === '1') setPushDone(true);
    } catch (_) {}
  }, []);

  const handlePushSubscribe = async () => {
    if (!pushSupported || pushLoading) return;
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== 'granted') { setPushLoading(false); return; }

      const reg = await navigator.serviceWorker.register('/sw.js');
      const vapidRes = await fetch('/api/push/vapid-key');
      const { publicKey } = await vapidRes.json();

      // Convert VAPID key
      const padding = '='.repeat((4 - publicKey.length % 4) % 4);
      const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const key = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) key[i] = rawData.charCodeAt(i);

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), role: 'user', isAdmin: false }),
      });

      setPushDone(true);
      try { localStorage.setItem('revista_push_done', '1'); } catch (_) {}
    } catch (err) {
      console.error('[Revista Push]', err);
    } finally {
      setPushLoading(false);
    }
  };

  const handlePushDismiss = () => {
    setPushDismissed(true);
    try { localStorage.setItem('revista_push_dismissed', '1'); } catch (_) {}
  };

  // Fechar lightbox ao pressionar ESC e travar scroll do corpo
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen]);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/revista/historias?status=published&limit=30');
      const data = await res.json();
      if (data.success) setStories(data.stories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Top stories for hero rotation (featured first, then recent up to 5)
  const heroStories = useMemo(() => {
    if (!stories.length) return [];
    const feat = stories.filter(s => s.featured);
    const others = stories.filter(s => !s.featured);
    return [...feat, ...others].slice(0, 5);
  }, [stories]);

  // Rotate hero story every 10 seconds (pauses on hover)
  useEffect(() => {
    if (heroStories.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroStories.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [heroStories.length, isPaused]);

  const featured = heroStories[heroIndex] || stories[0];

  const filtered = stories
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.title.toLowerCase().includes(q) || s.excerpt.toLowerCase().includes(q);
      const matchCat = category === 'all' || s.category === category;
      return matchSearch && matchCat;
    })
    .filter(s => s.id !== heroStories[0]?.id);

  const tabFiltered =
    tab === 'mais-lidas' ? [...filtered].sort((a, b) => b.views - a.views) :
    tab === 'destaque'   ? filtered.filter(s => s.featured) :
    filtered;

  return (
    <>
      <style>{`
        .revista-page { font-family: 'Poppins', sans-serif; background: #f8fafc; min-height: 100vh; width: 100%; overflow-x: hidden; }

        /* ── Sticky Header (Barra Roxa + Navbar) ─────────────── */
        .revista-sticky-header {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
        }
        .revista-nav {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
        }
        .revista-nav-inner {
          max-width: 1100px; margin: 0 auto;
          padding: 0 2rem;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px;
          gap: 1rem;
        }
        .revista-nav-left {
          display: flex; align-items: center; gap: 0.75rem;
        }
        .revista-nav-home {
          display: inline-flex; align-items: center; gap: 0.35rem;
          text-decoration: none;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.3rem 0.65rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .revista-nav-home:hover {
          background: #FAF5FF;
          border-color: #E0AAFF;
        }
        .revista-nav-home-logo {
          font-size: 0.72rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.02em; line-height: 1;
          white-space: nowrap;
        }
        .revista-nav-home-logo span { color: #7B2CBF; }
        .revista-nav-divider {
          width: 1px; height: 22px; background: #e2e8f0; flex-shrink: 0;
        }
        .revista-nav-brand {
          display: flex; align-items: center; gap: 0.5rem;
          text-decoration: none;
        }
        .revista-nav-brand-text {
          font-size: 1.15rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.04em;
        }
        .revista-nav-brand-text span {
          color: #7B2CBF;
        }
        .revista-nav-links { display: flex; gap: 1.5rem; align-items: center; }
        .revista-nav-links a, .revista-nav-link-btn {
          color: #475569; text-decoration: none; font-size: 0.85rem; font-weight: 500;
          transition: color 0.2s; background: none; border: none; cursor: pointer;
          font-family: 'Poppins', sans-serif; padding: 0;
        }
        .revista-nav-links a:hover, .revista-nav-link-btn:hover { color: #7B2CBF; }
        .revista-nav-links a.active, .revista-nav-link-btn.active {
          color: #7B2CBF;
          border-bottom: 2px solid #7B2CBF;
          padding-bottom: 2px;
        }
        .revista-nav-external {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.8rem !important; color: #7B2CBF !important;
          background: #FAF5FF; padding: 0.35rem 0.75rem !important;
          border-radius: 9999px; border: 1px solid #E0AAFF;
          font-weight: 600 !important; transition: all 0.2s;
        }
        .revista-nav-external:hover {
          background: #7B2CBF !important; color: #fff !important; border-color: #7B2CBF !important;
        }

        .revista-mobile-toggle {
          display: none;
          align-items: center; justify-content: center;
          width: 40px; height: 40px;
          border-radius: 8px; border: 1px solid #e2e8f0;
          background: #f8fafc; cursor: pointer;
          transition: all 0.2s;
        }
        .revista-mobile-toggle:hover {
          background: #f1f5f9; border-color: #cbd5e1;
        }

        /* Mobile Dropdown Menu */
        .revista-mobile-menu {
          background: #fff;
          border-top: 1px solid #f1f5f9;
          border-bottom: 2px solid #E0AAFF;
          box-shadow: 0 16px 32px -8px rgba(0,0,0,0.12);
          animation: navSlideDown 0.22s ease-out;
        }
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .revista-mobile-menu-inner {
          padding: 1.25rem 1.25rem 1.5rem;
          max-width: 1100px; margin: 0 auto;
        }
        .revista-mobile-title {
          font-size: 0.72rem; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
        }
        .revista-mobile-cats {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem; margin-bottom: 1.25rem;
        }
        .revista-mobile-cat-btn {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.65rem 0.85rem; border-radius: 8px;
          border: 1px solid #e2e8f0; background: #f8fafc;
          font-family: 'Poppins', sans-serif; font-size: 0.82rem;
          font-weight: 600; color: #334155; text-align: left;
          cursor: pointer; transition: all 0.18s;
        }
        .revista-mobile-cat-btn.active {
          background: #7B2CBF; color: #fff; border-color: #7B2CBF;
        }
        .revista-mobile-cat-btn:not(.active):hover {
          background: #FAF5FF; color: #7B2CBF; border-color: #E0AAFF;
        }
        .revista-mobile-divider {
          height: 1px; background: #e2e8f0; margin-bottom: 1rem;
        }
        .revista-mobile-links {
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .revista-mobile-link {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.65rem 0.85rem; border-radius: 8px;
          text-decoration: none; font-size: 0.85rem; font-weight: 600;
          color: #334155; transition: all 0.18s;
        }
        .revista-mobile-link:hover {
          background: #f1f5f9; color: #7B2CBF;
        }
        .revista-mobile-link.highlight {
          background: #FAF5FF; color: #7B2CBF; border: 1px solid #E0AAFF;
        }
        .revista-mobile-link.highlight:hover {
          background: #7B2CBF; color: #fff; border-color: #7B2CBF;
        }

        /* ── Hero ──────────────────────────── */
        .revista-hero {
          max-width: 1100px; margin: 0 auto;
          padding: 3.5rem 2rem 2rem;
          display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: center;
          position: relative;
        }
        .hero-fade {
          animation: heroFadeIn 0.35s ease-out;
        }
        @keyframes heroFadeIn {
          from { opacity: 0.3; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-indicators {
          display: flex; gap: 0.45rem; align-items: center;
        }
        .hero-dot {
          height: 6px; width: 22px; border-radius: 9999px;
          background: #e2e8f0; border: none; cursor: pointer;
          transition: all 0.25s ease; padding: 0;
        }
        .hero-dot.active {
          width: 38px; background: #7B2CBF;
        }
        .hero-dot:hover:not(.active) {
          background: #cbd5e1;
        }
        .hero-img-wrap {
          border-radius: 14px; overflow: hidden;
          aspect-ratio: 4/3;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-img-wrap.clickable {
          cursor: zoom-in;
        }
        .hero-img-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(15, 23, 42, 0.75);
          color: #ffffff;
          backdrop-filter: blur(8px);
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          opacity: 0;
          transform: translateY(4px);
          transition: all 0.2s ease;
          pointer-events: none;
        }
        .hero-img-wrap:hover .hero-img-badge {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-img-wrap img {
          width: 100%; height: 100%;
          object-fit: contain;
          padding: 1rem;
          transition: transform 0.25s ease;
        }
        .hero-img-wrap.clickable:hover img {
          transform: scale(1.02);
        }
        .hero-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #10002B, #3C096C);
          font-size: 4rem; color: rgba(255,255,255,0.15);
        }

        /* ── Lightbox / Fullscreen Modal ── */
        .lightbox-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(10, 10, 15, 0.92);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: lightboxFadeIn 0.22s ease-out;
          cursor: zoom-out;
        }
        @keyframes lightboxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .lightbox-close {
          position: fixed;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 100000;
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 9999px;
          height: 40px;
          padding: 0 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .lightbox-close:hover {
          background: #7B2CBF;
          border-color: #7B2CBF;
          transform: scale(1.05);
        }
        .lightbox-esc-hint {
          font-size: 0.7rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .lightbox-content {
          max-width: 92vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: lightboxZoomIn 0.26s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
        }
        @keyframes lightboxZoomIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .lightbox-img {
          max-width: 90vw;
          max-height: 82vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85);
          background: #ffffff;
          padding: 1.25rem;
        }
        .lightbox-caption {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.85rem;
          font-weight: 500;
          max-width: 90vw;
          text-align: center;
        }
        .lightbox-close-text {
          background: none;
          border: none;
          color: #E0AAFF;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s;
          font-family: inherit;
        }
        .lightbox-close-text:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .hero-content { display: flex; flex-direction: column; gap: 1rem; }
        .hero-cat {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;
          color: #64748b; text-transform: uppercase;
        }
        .hero-title {
          font-size: 2rem; font-weight: 800; color: #0f172a;
          line-height: 1.2; letter-spacing: -0.03em;
          min-height: 2.4em;
        }
        .hero-typing-cursor {
          display: inline-block;
          width: 3px;
          height: 0.95em;
          background: #7B2CBF;
          margin-left: 4px;
          vertical-align: -0.08em;
          border-radius: 1px;
          animation: heroCursorBlink 0.8s infinite;
        }
        .hero-typing-cursor.complete {
          animation: heroCursorBlink 0.8s 4 ease-in-out forwards;
        }
        @keyframes heroCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .hero-excerpt { color: #475569; font-size: 0.93rem; line-height: 1.65; }
        .hero-meta { display: flex; align-items: center; gap: 0.75rem; }
        .hero-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: #7B2CBF; display: flex; align-items: center;
          justify-content: center; color: #fff; font-weight: 700; font-size: 0.75rem;
          overflow: hidden; flex-shrink: 0;
        }
        .hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .hero-author { font-size: 0.82rem; color: #475569; font-weight: 500; }
        .hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          background: linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%);
          color: #ffffff !important;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-decoration: none;
          padding: 0.75rem 1.6rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 6px 20px rgba(123, 44, 191, 0.38);
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          width: fit-content;
        }
        .hero-cta:hover {
          background: linear-gradient(135deg, #9d4edd 0%, #7B2CBF 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(123, 44, 191, 0.5);
          color: #ffffff !important;
          gap: 0.8rem;
        }
        .hero-cta:active {
          transform: translateY(0);
          box-shadow: 0 3px 10px rgba(123, 44, 191, 0.3);
        }
        .hero-cta svg {
          transition: transform 0.2s ease;
        }
        .hero-cta:hover svg {
          transform: translateX(4px);
        }

        /* ── Categories Bar ────────────────── */
        .cat-bar {
          max-width: 1100px; margin: 0 auto;
          padding: 0 2rem 1rem;
          display: flex; gap: 0.5rem; flex-wrap: wrap;
        }
        .cat-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 1rem; border-radius: 9999px;
          font-size: 0.8rem; font-weight: 600; cursor: pointer;
          border: 2px solid transparent; transition: all 0.2s;
          background: #fff; color: #475569;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .cat-btn.active { background: #7B2CBF; color: #fff; border-color: #7B2CBF; }
        .cat-btn:not(.active):hover { border-color: #7B2CBF; color: #7B2CBF; }

        /* ── Stories Section ───────────────── */
        .stories-section {
          max-width: 1100px; margin: 0 auto;
          padding: 0.5rem 2rem 4.5rem;
          display: grid; grid-template-columns: 1fr 340px; gap: 3rem;
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }
        .section-title { font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 1.25rem; }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 0;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          align-items: center;
        }
        .tab-btn {
          font-size: 0.83rem; font-weight: 600; color: #94a3b8;
          padding: 0.5rem 1rem; cursor: pointer; border: none;
          background: none; border-bottom: 2px solid transparent;
          margin-bottom: -1px; transition: all 0.2s;
          white-space: nowrap;
        }
        .tab-btn.active { color: #7B2CBF; border-bottom-color: #7B2CBF; }
        .tab-btn:hover:not(.active) { color: #475569; }
        .tabs-search-container {
          margin-left: auto;
        }
        .tabs-search-input {
          width: 180px;
        }

        /* Search */
        .search-wrap {
          position: relative; margin-bottom: 1.5rem;
        }
        .search-wrap input {
          width: 100%; padding: 0.55rem 1rem 0.55rem 2.4rem;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          font-size: 0.83rem; font-family: 'Poppins', sans-serif;
          background: #fff; color: #0f172a; outline: none;
          transition: border-color 0.2s;
        }
        .search-wrap input:focus { border-color: #7B2CBF; }
        .search-wrap .search-icon {
          position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%);
          color: #94a3b8;
        }

        /* ── Top Announcement Bar (estilo Kabum com cores WEHOSTHERE) ── */
        .revista-top-bar {
          background: linear-gradient(90deg, #3C096C 0%, #5A189A 50%, #7B2CBF 100%);
          color: #ffffff;
          padding: 0.45rem 1rem;
          font-size: 0.82rem;
          font-weight: 500;
          position: relative;
          z-index: 55;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .revista-top-bar-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: center;
          gap: 0.65rem; flex-wrap: nowrap; text-align: center;
          white-space: nowrap;
        }
        .revista-top-bar-badge {
          background: rgba(255, 255, 255, 0.22);
          color: #ffffff;
          font-size: 0.7rem; font-weight: 800;
          letter-spacing: 0.06em;
          padding: 0.15rem 0.65rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .revista-top-bar-text {
          color: #ffffff;
          font-weight: 500;
          font-size: 0.8rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .revista-top-bar-link {
          color: #ffffff;
          text-decoration: none;
          display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.18);
          padding: 0.18rem 0.75rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .revista-top-bar-link:hover {
          background: #ffffff;
          color: #5A189A;
          transform: scale(1.05);
        }
        .revista-top-bar-link-text {
          display: inline;
        }

        /* ── Story Card (Maior, Destacado e Visível) ── */
        .story-card {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 1.6rem;
          align-items: stretch;
          padding: 1.35rem;
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          margin-bottom: 1.4rem;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          position: relative;
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }
        .story-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 36px -8px rgba(123, 44, 191, 0.16), 0 2px 6px rgba(0, 0, 0, 0.04);
          border-color: #c084fc;
        }
        .story-card-img {
          border-radius: 14px;
          overflow: hidden;
          width: 100%;
          height: 185px;
          background: linear-gradient(135deg, #10002B 0%, #3C096C 100%);
          flex-shrink: 0;
          position: relative;
        }
        .story-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.4s ease;
        }
        .story-card:hover .story-card-img img {
          transform: scale(1.06);
        }
        .story-card-img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #10002B, #3C096C);
          font-size: 2.2rem;
          color: rgba(255, 255, 255, 0.15);
        }
        .story-card-body {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.45rem;
          min-width: 0;
          overflow: hidden;
        }
        .story-card-cat {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          width: fit-content;
        }
        .story-card-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.35;
          margin: 0.15rem 0 0.35rem;
          transition: color 0.2s;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .story-card:hover .story-card-title {
          color: #5A189A;
        }
        .story-card-excerpt {
          font-size: 0.88rem;
          color: #64748b;
          line-height: 1.55;
          margin: 0 0 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .story-card-meta {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          font-size: 0.76rem;
          color: #64748b;
          margin-top: auto;
          padding-top: 0.6rem;
          border-top: 1px solid #f1f5f9;
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .story-card-meta-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          min-width: 0;
        }
        .story-card-author-info {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
        }
        .story-card-author-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          overflow: hidden;
          background: #7B2CBF;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .story-card-author-avatar img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .story-card-meta-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          white-space: nowrap;
        }
        .story-card-read-more {
          margin-left: auto;
          color: #ffffff;
          background: #7B2CBF;
          padding: 0.32rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.76rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(123, 44, 191, 0.22);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .story-card:hover .story-card-read-more {
          background: #5A189A;
          transform: translateX(3px);
          box-shadow: 0 4px 12px rgba(123, 44, 191, 0.35);
          color: #ffffff;
        }

        /* ── Sidebar PDF Download Card (Kabum Style com cores WEHOSTHERE) ── */
        .sidebar-pdf-card {
          background: linear-gradient(135deg, #240046 0%, #5A189A 60%, #7B2CBF 100%);
          border-radius: 16px;
          padding: 1.4rem;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(90, 24, 154, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          box-sizing: border-box;
          max-width: 100%;
        }
        .sidebar-pdf-card::after {
          content: '';
          position: absolute;
          top: -30px; right: -30px;
          width: 90px; height: 90px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          pointer-events: none;
        }
        .sidebar-pdf-content {
          display: grid;
          grid-template-columns: 85px 1fr;
          gap: 1rem;
          align-items: center;
          min-width: 0;
        }
        .sidebar-pdf-info {
          min-width: 0;
          overflow: hidden;
        }
        .sidebar-pdf-title {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .sidebar-pdf-desc {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .sidebar-pdf-mockup {
          width: 85px;
          height: 115px;
          border-radius: 5px 9px 9px 5px;
          background: linear-gradient(145deg, #10002B 0%, #3C096C 50%, #7B2CBF 100%);
          box-shadow: -4px 6px 14px rgba(0, 0, 0, 0.45), inset 3px 0 5px rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 0.55rem;
          position: relative;
          overflow: hidden;
          transform: perspective(600px) rotateY(-6deg);
          transition: transform 0.3s ease;
        }
        .sidebar-pdf-card:hover .sidebar-pdf-mockup {
          transform: perspective(600px) rotateY(0deg) scale(1.04);
        }
        .sidebar-pdf-mockup-brand {
          font-size: 0.52rem;
          font-weight: 800;
          color: #E0AAFF;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          line-height: 1.1;
        }
        .sidebar-pdf-mockup-badge {
          align-self: flex-start;
          font-size: 0.48rem;
          font-weight: 800;
          background: #ffffff;
          color: #3C096C;
          padding: 1px 4px;
          border-radius: 3px;
        }
        .sidebar-pdf-mockup-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin: 0 auto;
          border: 1.5px solid #E0AAFF;
          overflow: hidden;
          background: #10002B;
        }
        .sidebar-pdf-mockup-avatar img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .sidebar-pdf-mockup-footer {
          font-size: 0.45rem;
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
          font-weight: 600;
        }
        .sidebar-pdf-info {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .sidebar-pdf-tag {
          font-size: 0.65rem;
          font-weight: 700;
          color: #E0AAFF;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .sidebar-pdf-title {
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1.3;
          color: #ffffff;
          margin: 0;
        }
        .sidebar-pdf-desc {
          font-size: 0.73rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }
        .sidebar-pdf-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.72rem 1rem;
          background: #ffffff;
          color: #5A189A;
          border: none;
          border-radius: 10px;
          font-family: 'Poppins', sans-serif;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.22s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .sidebar-pdf-btn:hover {
          background: #FAF5FF;
          color: #3C096C;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
        }

        /* Sidebar */
        .sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
        .sidebar-box {
          background: #fff; border-radius: 14px; padding: 1.5rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .sidebar-box-title {
          font-size: 0.78rem; font-weight: 700; color: #64748b;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1rem;
        }
        .sidebar-mini-card {
          display: flex; gap: 0.75rem; padding: 0.7rem 0;
          border-bottom: 1px solid #f1f5f9; text-decoration: none;
        }
        .sidebar-mini-card:last-child { border-bottom: none; padding-bottom: 0; }
        .sidebar-mini-card:hover .sidebar-mini-title { color: #7B2CBF; }
        .sidebar-mini-img {
          width: 56px; height: 56px; border-radius: 8px; flex-shrink: 0;
          overflow: hidden; background: linear-gradient(135deg, #10002B, #5A189A);
        }
        .sidebar-mini-img img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar-mini-body { display: flex; flex-direction: column; gap: 0.2rem; }
        .sidebar-mini-cat {
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .sidebar-mini-title { font-size: 0.8rem; font-weight: 600; color: #0f172a; line-height: 1.3; transition: color 0.2s; }

        /* Newsletter box */
        .nl-box {
          background: linear-gradient(135deg, #5A189A 0%, #7B2CBF 100%);
          border-radius: 14px; padding: 1.5rem; color: #fff;
        }
        .nl-box h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
        .nl-box p { font-size: 0.8rem; color: rgba(255,255,255,0.85); margin-bottom: 1rem; line-height: 1.5; }
        .nl-input {
          width: 100%; padding: 0.55rem 0.85rem;
          border-radius: 8px; border: none; outline: none;
          font-family: 'Poppins', sans-serif; font-size: 0.82rem;
          margin-bottom: 0.6rem;
        }
        .nl-btn {
          width: 100%; padding: 0.6rem;
          background: #9D4EDD; color: #fff; border: none;
          border-radius: 8px; font-family: 'Poppins', sans-serif;
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          transition: background 0.2s;
        }
        .nl-btn:hover { background: #C77DFF; }

        /* Empty / Loading */
        .empty-state {
          text-align: center; padding: 3rem 1rem;
          color: #94a3b8; font-size: 0.88rem;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #7B2CBF;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin: 2rem auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Push Notification Banner ── */
        .push-banner {
          max-width: 1100px; margin: 0 auto 0;
          padding: 0 2rem 1.25rem;
          animation: pushBannerSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes pushBannerSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .push-banner-inner {
          background: linear-gradient(135deg, #10002B 0%, #3C096C 50%, #7B2CBF 100%);
          border-radius: 14px;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 24px -4px rgba(123, 44, 191, 0.35);
          position: relative;
          overflow: hidden;
        }
        .push-banner-inner::before {
          content: '';
          position: absolute;
          top: -30px; right: -30px;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          pointer-events: none;
        }
        .push-banner-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .push-banner-text { flex: 1; min-width: 0; }
        .push-banner-title {
          font-size: 0.9rem; font-weight: 700; color: #ffffff;
          margin-bottom: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .push-banner-sub {
          font-size: 0.75rem; color: rgba(255,255,255,0.7); line-height: 1.4;
        }
        .push-banner-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .push-subscribe-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: #ffffff; color: #5A189A;
          border: none; border-radius: 9999px;
          padding: 0.5rem 1.1rem;
          font-size: 0.8rem; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
          white-space: nowrap;
        }
        .push-subscribe-btn:hover:not(:disabled) {
          background: #E0AAFF; color: #3C096C;
          transform: scale(1.03);
        }
        .push-subscribe-btn:disabled { opacity: 0.7; cursor: wait; }
        .push-subscribe-btn.done {
          background: #10b981; color: #fff;
        }
        .push-dismiss-btn {
          background: none; border: none;
          color: rgba(255,255,255,0.5); cursor: pointer;
          padding: 0.25rem; border-radius: 6px;
          transition: color 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .push-dismiss-btn:hover { color: #fff; }

        /* Sidebar push box */
        .push-sidebar-box {
          background: linear-gradient(135deg, #10002B, #3C096C);
          border-radius: 14px; padding: 1.25rem;
          color: #fff; position: relative; overflow: hidden;
        }
        .push-sidebar-box::before {
          content: '';
          position: absolute;
          bottom: -20px; right: -20px;
          width: 80px; height: 80px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .push-sidebar-box h3 { font-size: 0.92rem; font-weight: 700; margin-bottom: 0.4rem; }
        .push-sidebar-box p { font-size: 0.76rem; color: rgba(255,255,255,0.75); margin-bottom: 1rem; line-height: 1.5; }
        .push-sidebar-btn {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 0.45rem; padding: 0.6rem;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px; color: #fff;
          font-family: 'Poppins', sans-serif;
          font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .push-sidebar-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
        .push-sidebar-btn:disabled { opacity: 0.7; cursor: wait; }
        .push-sidebar-btn.done { background: #10b981; border-color: #10b981; }

        /* Responsive */
        @media (max-width: 900px) {
          .revista-hero { grid-template-columns: 1fr; gap: 2rem; }
          .stories-section { grid-template-columns: 1fr; gap: 2rem; }
          .sidebar {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-top: 1rem;
            width: 100%;
          }
        }
        @media (max-width: 768px) {
          .revista-nav-inner { padding: 0 1rem; }
          .revista-nav-links { display: none; }
          .revista-mobile-toggle { display: flex; }
          .cat-bar {
            padding: 0.5rem 1rem 1rem;
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .cat-bar::-webkit-scrollbar { display: none; }
          .cat-btn {
            flex-shrink: 0; white-space: nowrap;
            font-size: 0.78rem; padding: 0.35rem 0.85rem;
          }
          .story-card {
            grid-template-columns: 1fr;
            gap: 1.25rem;
            padding: 1.25rem;
          }
          .story-card-img {
            height: 200px;
          }
          .story-card-title {
            font-size: 1.15rem;
          }
        }
        @media (max-width: 600px) {
          .revista-top-bar { padding: 0.35rem 0.75rem; }
          .revista-top-bar-inner { gap: 0.5rem; flex-wrap: nowrap; justify-content: center; }
          .revista-top-bar-text { font-size: 0.75rem; }
          .revista-top-bar-link {
            padding: 0.3rem;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.22);
          }
          .revista-top-bar-link:hover {
            background: #ffffff;
            color: #5A189A;
            transform: scale(1.1);
          }
          .revista-top-bar-link-text { display: none; }
          .revista-hero { padding: 2rem 1rem 1rem; }
          .hero-title { font-size: 1.45rem; }
          .stories-section { padding: 0.5rem 1rem 2.5rem; }
          .tabs {
            flex-wrap: wrap;
            gap: 0.35rem;
            border-bottom: none;
            margin-bottom: 1.2rem;
          }
          .tab-btn {
            padding: 0.4rem 0.75rem;
            font-size: 0.78rem;
          }
          .tabs-search-container {
            width: 100% !important;
            margin-left: 0 !important;
            margin-top: 0.5rem;
          }
          .tabs-search-input {
            width: 100% !important;
          }
        }
        @media (max-width: 520px) {
          .story-card-meta {
            flex-direction: column;
            align-items: stretch;
            gap: 0.65rem;
          }
          .story-card-meta-left {
            justify-content: flex-start;
            gap: 0.55rem;
            font-size: 0.72rem;
          }
          .story-card-read-more {
            width: 100%;
            justify-content: center;
            margin-left: 0;
            padding: 0.45rem 1rem;
            font-size: 0.78rem;
          }
        }
        @media (max-width: 480px) {
          .revista-top-bar-inner { font-size: 0.72rem; }
          .revista-nav-inner { padding: 0 0.75rem; height: 56px; }
          .revista-nav-left { gap: 0.45rem; }
          .revista-nav-home { padding: 0.25rem 0.45rem; }
          .revista-nav-home-logo { display: none; }
          .revista-nav-brand-text { font-size: 0.88rem; }
          .sidebar-pdf-card { padding: 1.1rem; }
          .sidebar-pdf-content { grid-template-columns: 68px 1fr; gap: 0.75rem; }
          .sidebar-pdf-mockup { width: 68px; height: 96px; padding: 0.45rem; }
          .sidebar-pdf-mockup-avatar { width: 28px; height: 28px; }
          .sidebar-pdf-mockup-badge { font-size: 0.52rem; }
          .sidebar-pdf-mockup-brand { font-size: 0.6rem; }
          .sidebar-pdf-mockup-footer { font-size: 0.52rem; }
          .sidebar-pdf-title { font-size: 0.85rem; line-height: 1.3; word-break: break-word; overflow-wrap: break-word; }
          .sidebar-pdf-desc { font-size: 0.74rem; line-height: 1.35; word-break: break-word; overflow-wrap: break-word; }
          .story-card { padding: 1rem; }
          .story-card-title { font-size: 1.08rem; }
          .story-card-img { height: 180px; }
        }
        @media (max-width: 360px) {
          .revista-top-bar-text { display: none; }
          .revista-top-bar-badge { font-size: 0.65rem; }
          .revista-nav-brand-text { font-size: 0.82rem; }
          .cat-btn { font-size: 0.72rem; padding: 0.3rem 0.7rem; }
          .revista-mobile-cats { grid-template-columns: 1fr; }
          .hero-title { font-size: 1.25rem; }
          .story-card { padding: 0.85rem; }
          .story-card-title { font-size: 1rem; }
        }
      `}</style>

      <div className="revista-page">
        {/* ── Sticky Header: Barra Roxa que acompanha o scroll + Navbar ── */}
        <header className="revista-sticky-header">
          {/* ── Top Announcement Bar (Kabum style com cores WEHOSTHERE) ── */}
          <div className="revista-top-bar">
            <div className="revista-top-bar-inner">
              <span className="revista-top-bar-badge">ED. 01</span>
              <span className="revista-top-bar-text">Descarrega a nova edição da revista</span>
              <a
                href="/api/revista/download"
                className="revista-top-bar-link"
                download="Codando-Historias-Edicao-01.pdf"
                title="Descarregar PDF da revista em alta resolução"
                aria-label="Descarregar PDF"
              >
                <Download size={13} />
                <span className="revista-top-bar-link-text">Descarregar PDF →</span>
              </a>
            </div>
          </div>

          {/* ── Navbar ── */}
          <nav className="revista-nav">
          <div className="revista-nav-inner">
            {/* Left: WEHOSTHERE home logo + revista brand */}
            <div className="revista-nav-left">
              <Link href="/" className="revista-nav-home" title="Ir para a página inicial WEHOSTHERE">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B2CBF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="revista-nav-home-logo">WEHOST<span>HERE</span></span>
              </Link>
              <span className="revista-nav-divider" aria-hidden="true" />
              <Link href="/revista" className="revista-nav-brand" onClick={() => setMobileMenuOpen(false)}>
                <Code2 size={20} color="#7B2CBF" />
                <span className="revista-nav-brand-text">
                  codando <span>histórias</span> <span style={{ color: '#7B2CBF', fontFamily: 'monospace', fontWeight: 800 }}>&lt;/&gt;</span>
                </span>
              </Link>
            </div>

            {/* Desktop links */}
            <div className="revista-nav-links">
              <button
                className={`revista-nav-link-btn ${category === 'all' ? 'active' : ''}`}
                onClick={() => setCategory('all')}
              >
                Início
              </button>
              <button
                className={`revista-nav-link-btn ${category === 'codigo' ? 'active' : ''}`}
                onClick={() => setCategory('codigo')}
              >
                Código
              </button>
              <button
                className={`revista-nav-link-btn ${category === 'startups' ? 'active' : ''}`}
                onClick={() => setCategory('startups')}
              >
                Startups
              </button>
              <button
                className={`revista-nav-link-btn ${category === 'ia' ? 'active' : ''}`}
                onClick={() => setCategory('ia')}
              >
                IA
              </button>
              <Link
                href="/revista/submeter"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'linear-gradient(135deg, #7B2CBF, #5A189A)',
                  color: '#ffffff',
                  padding: '0.38rem 0.9rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(123, 44, 191, 0.25)',
                  transition: 'all 0.2s',
                }}
              >
                ✍️ Enviar História
              </Link>
              <Link href="/" target="_blank" rel="noopener noreferrer" className="revista-nav-external">
                WEHOSTHERE <ExternalLink size={12} />
              </Link>
            </div>

            {/* Mobile hamburger button */}
            <button
              className="revista-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X size={22} color="#0f172a" /> : <Menu size={22} color="#0f172a" />}
            </button>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="revista-mobile-menu">
              <div className="revista-mobile-menu-inner">
                <p className="revista-mobile-title">Categorias</p>
                <div className="revista-mobile-cats">
                  {CATEGORIES.map(c => {
                    const Icon = c.icon;
                    const isActive = category === c.key;
                    return (
                      <button
                        key={c.key}
                        className={`revista-mobile-cat-btn ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setCategory(c.key);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Icon size={16} />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="revista-mobile-divider" />

                <div className="revista-mobile-links">
                  <button
                    className="revista-mobile-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                    onClick={() => {
                      setCategory('all');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Home size={16} color="#7B2CBF" />
                    <span>Página Inicial da Revista</span>
                  </button>
                  <Link
                    href="/revista/submeter"
                    className="revista-mobile-link"
                    style={{ background: '#FAF5FF', color: '#7B2CBF', border: '1px solid #E0AAFF' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>✍️</span>
                    <span>Enviar a Tua História (Comunidade)</span>
                  </Link>
                  <Link
                    href="/"
                    className="revista-mobile-link highlight"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ExternalLink size={16} />
                    <span>Ir para WEHOSTHERE Hosting</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
        </header>

        {/* ── Hero ── */}
        {featured && (
          <section
            className="revista-hero hero-fade"
            key={featured.id}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className={`hero-img-wrap${featured.coverImage ? ' clickable' : ''}`}
              onClick={() => featured.coverImage && setLightboxOpen(true)}
              role={featured.coverImage ? 'button' : undefined}
              tabIndex={featured.coverImage ? 0 : undefined}
              title={featured.coverImage ? 'Clique para ver em tela cheia' : undefined}
            >
              {featured.coverImage ? (
                <>
                  <img src={featured.coverImage} alt={featured.title} />
                  <div className="hero-img-badge">
                    <Maximize2 size={13} />
                    <span>Ver em tela cheia</span>
                  </div>
                </>
              ) : (
                <div className="hero-img-placeholder"><Code2 size={64} color="rgba(255,255,255,0.12)" /></div>
              )}
            </div>
            <div className="hero-content">
              <span className="hero-cat">{featured.category?.toUpperCase()}</span>
              <h1 className="hero-title">
                <TypedTitle title={featured.title} highlight={featured.highlightText} speed={28} />
              </h1>
              <p className="hero-excerpt">{featured.excerpt}</p>
              <div className="hero-meta">
                <div className="hero-avatar">
                  {featured.author?.avatar
                    ? <img src={featured.author.avatar} alt={featured.author.name} />
                    : featured.author?.name?.[0]?.toUpperCase()
                  }
                </div>
                <span className="hero-author">{featured.author?.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                <Link href={`/revista/${featured.slug}`} className="hero-cta" id="hero-read-story-btn">
                  <span>Ler a história</span>
                  <ChevronRight size={18} strokeWidth={2.5} />
                </Link>
                {heroStories.length > 1 && (
                  <div className="hero-indicators" title="Passe o cursor para pausar a rotação">
                    {heroStories.map((s, idx) => (
                      <button
                        key={s.id}
                        className={`hero-dot${idx === heroIndex ? ' active' : ''}`}
                        onClick={() => setHeroIndex(idx)}
                        aria-label={`Ver história: ${s.title}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Push Notification Banner ── */}
        {pushSupported && !pushDismissed && !pushDone && pushPermission !== 'denied' && (
          <div className="push-banner">
            <div className="push-banner-inner">
              <div className="push-banner-icon">
                <BellRing size={22} color="#E0AAFF" />
              </div>
              <div className="push-banner-text">
                <div className="push-banner-title">🔔 Fique por dentro das novidades</div>
                <div className="push-banner-sub">Receba uma notificação sempre que publicarmos uma nova história de tech.</div>
              </div>
              <div className="push-banner-actions">
                <button
                  className="push-subscribe-btn"
                  onClick={handlePushSubscribe}
                  disabled={pushLoading}
                >
                  {pushLoading ? (
                    <><div style={{ width: 14, height: 14, border: '2px solid #7B2CBF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> A subscrever...</>
                  ) : (
                    <><Bell size={14} /> Subscrever</>                  
                  )}
                </button>
                <button className="push-dismiss-btn" onClick={handlePushDismiss} title="Dispensar">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Push Done confirmation (shown briefly) */}
        {pushSupported && pushDone && !pushDismissed && (
          <div className="push-banner">
            <div className="push-banner-inner" style={{ background: 'linear-gradient(135deg, #064e3b, #10b981)' }}>
              <div className="push-banner-icon" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Check size={22} color="#fff" />
              </div>
              <div className="push-banner-text">
                <div className="push-banner-title">Subscrito com sucesso! 🎉</div>
                <div className="push-banner-sub">Vais receber uma notificação quando publicarmos a próxima história.</div>
              </div>
              <button className="push-dismiss-btn" onClick={handlePushDismiss} title="Dispensar">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Category Bar ── */}
        <div className="cat-bar">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                className={`cat-btn${category === c.key ? ' active' : ''}`}
                onClick={() => setCategory(c.key)}
              >
                <Icon size={13} />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* ── Stories + Sidebar ── */}
        <div className="stories-section">
          <div>
            <h2 className="section-title">Últimas histórias</h2>

            {/* Tabs + Search */}
            <div className="tabs">
              {(['recentes', 'mais-lidas', 'destaque'] as const).map(t => (
                <button
                  key={t}
                  className={`tab-btn${tab === t ? ' active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t === 'recentes' ? 'Recentes' : t === 'mais-lidas' ? 'Mais lidas' : 'Em destaque'}
                </button>
              ))}
              <div className="tabs-search-container">
                <div className="search-wrap" style={{ marginBottom: 0 }}>
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="tabs-search-input"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : tabFiltered.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                <p>Nenhuma história encontrada.</p>
              </div>
            ) : (
              tabFiltered.map(story => {
                const displayImage = story.coverImage || story.author?.avatar;
                return (
                  <Link key={story.id} href={`/revista/${story.slug}`} className="story-card">
                    <div className="story-card-img">
                      {displayImage ? (
                        <img src={displayImage} alt={story.title} />
                      ) : (
                        <div className="story-card-img-placeholder"><Code2 /></div>
                      )}
                    </div>
                    <div className="story-card-body">
                      <span
                        className="story-card-cat"
                        style={{
                          color: CAT_COLORS[story.category] || '#7B2CBF',
                          background: `${CAT_COLORS[story.category] || '#7B2CBF'}15`,
                          border: `1px solid ${CAT_COLORS[story.category] || '#7B2CBF'}30`
                        }}
                      >
                        {story.category}
                      </span>
                      <h3 className="story-card-title">
                        {buildTitle(story.title, story.highlightText)}
                      </h3>
                      {story.excerpt && (
                        <p className="story-card-excerpt">{story.excerpt}</p>
                      )}
                      <div className="story-card-meta">
                        <div className="story-card-meta-left">
                          <div className="story-card-author-info">
                            <div className="story-card-author-avatar">
                              {story.author?.avatar ? (
                                <img src={story.author.avatar} alt={story.author.name} />
                              ) : (
                                story.author?.name?.[0]?.toUpperCase() || 'W'
                              )}
                            </div>
                            <span>{story.author?.name || 'WEHOSTHERE'}</span>
                          </div>
                          {story.readingTime && (
                            <span className="story-card-meta-tag"><Clock size={12} /> {story.readingTime} min</span>
                          )}
                          <span className="story-card-meta-tag"><Eye size={12} /> {story.views} leituras</span>
                        </div>
                        <span className="story-card-read-more">
                          Ler história <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* ── Card Download PDF (Kabum Style com cores WEHOSTHERE) ── */}
            <div className="sidebar-pdf-card">
              <div className="sidebar-pdf-content">
                <div className="sidebar-pdf-mockup">
                  <div className="sidebar-pdf-mockup-badge">ED. 01</div>
                  <div className="sidebar-pdf-mockup-avatar">
                    <img
                      src={stories[0]?.author?.avatar || stories[0]?.coverImage || '/mascote-transparent.png'}
                      alt="Capa Revista"
                    />
                  </div>
                  <div>
                    <div className="sidebar-pdf-mockup-brand">codando</div>
                    <div className="sidebar-pdf-mockup-footer">HISTÓRIAS &lt;/&gt;</div>
                  </div>
                </div>
                <div className="sidebar-pdf-info">
                  <span className="sidebar-pdf-tag">Edição Digital</span>
                  <h4 className="sidebar-pdf-title">Última edição da revista - Edição 01</h4>
                  <span className="sidebar-pdf-desc">Descarregue gratuitamente o PDF completo para ler offline.</span>
                </div>
              </div>
              <a
                href="/api/revista/download"
                download="Codando-Historias-Edicao-01.pdf"
                className="sidebar-pdf-btn"
                title="Descarregar edição em PDF"
              >
                <Download size={15} />
                DOWNLOAD PDF
              </a>
            </div>

            {/* ── Card Submeter História (Comunidade) ── */}
            <div
              style={{
                background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
                border: '1.5px solid #E0AAFF',
                borderRadius: '16px',
                padding: '1.4rem',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(123, 44, 191, 0.08)',
              }}
            >
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.4rem' }}>✍️</span>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>
                Tens uma história para contar?
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 1rem' }}>
                Partilha a tua jornada de código, produto ou carreira com a comunidade tech de Moçambique.
              </p>
              <Link
                href="/revista/submeter"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  width: '100%',
                  background: '#7B2CBF',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(123, 44, 191, 0.25)',
                  transition: 'all 0.2s',
                }}
              >
                Submeter a Minha História →
              </Link>
            </div>

            {/* Mais lidas */}
            <div className="sidebar-box">
              <p className="sidebar-box-title">Mais Lidas</p>
              {[...stories]
                .sort((a, b) => b.views - a.views)
                .slice(0, 4)
                .map(s => (
                  <Link key={s.id} href={`/revista/${s.slug}`} className="sidebar-mini-card">
                    <div className="sidebar-mini-img">
                      {s.coverImage && <img src={s.coverImage} alt={s.title} />}
                    </div>
                    <div className="sidebar-mini-body">
                      <span className="sidebar-mini-cat" style={{ color: CAT_COLORS[s.category] || '#7B2CBF' }}>
                        {s.category}
                      </span>
                      <p className="sidebar-mini-title">{s.title}</p>
                    </div>
                  </Link>
                ))}
            </div>

            {/* Push Notifications */}
            {pushSupported && (
              <div className="push-sidebar-box">
                <h3>🔔 Notificações Push</h3>
                <p>Receba alertas instantâneos quando publicarmos novas histórias de tech em Moçambique.</p>
                {pushDone ? (
                  <button className="push-sidebar-btn done" disabled>
                    <Check size={15} /> Subscrito!
                  </button>
                ) : pushPermission === 'denied' ? (
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>
                    Notificações bloqueadas no browser. Altere nas definições do browser.
                  </p>
                ) : (
                  <button
                    className="push-sidebar-btn"
                    onClick={handlePushSubscribe}
                    disabled={pushLoading}
                  >
                    {pushLoading ? (
                      <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> A subscrever...</>
                    ) : (
                      <><Bell size={14} /> Ativar notificações</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Newsletter */}
            <div className="nl-box">
              <h3>📬 Receba a próxima história</h3>
              <p>Subscreva e seja o primeiro a ler as nossas histórias de tech.</p>
              <input className="nl-input" type="email" placeholder="o-teu@email.com" />
              <button className="nl-btn">Subscrever a newsletter</button>
            </div>

            {/* Em Destaque */}
            {stories.filter(s => s.featured).length > 0 && (
              <div className="sidebar-box">
                <p className="sidebar-box-title"><Star size={12} style={{ display: 'inline', marginRight: 4 }} />Em Destaque</p>
                {stories.filter(s => s.featured).slice(0, 3).map(s => (
                  <Link key={s.id} href={`/revista/${s.slug}`} className="sidebar-mini-card">
                    <div className="sidebar-mini-body">
                      <span className="sidebar-mini-cat" style={{ color: CAT_COLORS[s.category] || '#7B2CBF' }}>
                        {s.category}
                      </span>
                      <p className="sidebar-mini-title">{s.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>

        {/* ── Lightbox / Tela cheia ── */}
        {lightboxOpen && featured?.coverImage && (
          <div
            className="lightbox-overlay"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Imagem em tela cheia"
          >
            <button
              className="lightbox-close"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
              aria-label="Fechar tela cheia (Esc)"
              title="Fechar (Esc)"
            >
              <X size={20} />
              <span className="lightbox-esc-hint">ESC</span>
            </button>

            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img
                src={featured.coverImage}
                alt={featured.title}
                className="lightbox-img"
              />
              <div className="lightbox-caption">
                <span>{featured.title}</span>
                <button
                  className="lightbox-close-text"
                  onClick={() => setLightboxOpen(false)}
                >
                  Fechar ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
