'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Send, CheckCircle2, Upload, Sparkles, BookOpen,
  Code2, Eye, User, FileText, Image as ImageIcon, Clock, Check, HelpCircle,
  Wand2, X, RefreshCw, Copy, Lightbulb, Tag, CheckCheck, Loader2
} from 'lucide-react';

const CATEGORIES = [
  { value: 'codigo', label: 'Código & Arquitectura', desc: 'Linguagens, frameworks, boas práticas, APIs e tutoriais técnicos' },
  { value: 'startups', label: 'Startups & Produtos', desc: 'Criação de produtos digitais, validação, monetização e SaaS' },
  { value: 'ia', label: 'IA & Machine Learning', desc: 'Modelos, automação, engenharia de prompts e novidades em IA' },
  { value: 'design', label: 'Design & UI/UX', desc: 'Interfaces, experiência do utilizador, tipografia e boas práticas' },
  { value: 'carreira', label: 'Carreira & Trabalho Remoto', desc: 'Vagas, entrevistas, crescimento profissional e trabalho para o exterior' },
  { value: 'tutoriais', label: 'Guias Práticos', desc: 'Passo a passo prático para resolver problemas reais de tech' },
  { value: 'noticias', label: 'Ecossistema & Notícias', desc: 'Acontecimentos, eventos e novidades tech em Moçambique' },
];

const DEFAULT_CONTENT_TEMPLATE = `## O Início / O Desafio
Partilha o problema ou a situação inicial que enfrentaste. O que te motivou a iniciar este projecto, aprender esta tecnologia ou procurar esta oportunidade?

> "Coloca aqui uma citação marcante ou a lição central da tua história."

## A Solução e Abordagem
Explica o que fizeste, que tecnologias ou ferramentas usaste (ex: Next.js, Python, Tailwind, Docker, etc.) e as decisões mais difíceis que tomaste pelo caminho.

* Ponto chave 1 da implementação
* Ponto chave 2 sobre um obstáculo superado
* Ponto chave 3 sobre o resultado obtido

## O Que Aprendi
1. **Lição Principal:** O que farias diferente se começasses hoje?
2. **Impacto:** Como isto mudou a tua forma de pensar código ou negócios?

## Conclusão
O conselho final que gostarias de deixar para a comunidade de desenvolvedores e criadores em Moçambique...`;

type AiActionType = 'improve_content' | 'suggest_titles' | 'generate_excerpt' | 'suggest_tags';

const MAX_TITLE_CHARS = 100;
const MAX_EXCERPT_CHARS = 500;
const MAX_BIO_CHARS = 500;
const MAX_CONTENT_CHARS = 5000;

export default function SubmeterHistoriaPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdStory, setCreatedStory] = useState<{ id: string; slug: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // AI Assistant State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAction, setAiAction] = useState<AiActionType>('improve_content');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiToast, setAiToast] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    highlightText: '',
    excerpt: '',
    category: 'codigo',
    tags: '',
    coverImage: '',
    content: DEFAULT_CONTENT_TEMPLATE,
    author: {
      name: '',
      email: '',
      bio: '',
      avatar: '',
      website: '',
      socials: {
        linkedin: '',
        github: '',
        twitter: '',
        instagram: '',
      },
    },
  });

  const setField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const setAuthorField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      author: { ...prev.author, [field]: value },
    }));
    setErrorMsg('');
  };

  const setAuthorSocial = (network: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      author: {
        ...prev.author,
        socials: { ...prev.author.socials, [network]: value },
      },
    }));
  };

  // Preenchimento automático se o autor veio de um convite VIP (?name=...&email=...&topic=...)
  const [inviteBanner, setInviteBanner] = useState<{ name: string; topic?: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name') || '';
    const email = params.get('email') || '';
    const topic = params.get('topic') || '';
    const cat = params.get('category') || '';

    if (name || email || topic || cat) {
      setFormData(prev => ({
        ...prev,
        title: topic || prev.title,
        category: cat || prev.category,
        author: {
          ...prev.author,
          name: name || prev.author.name,
          email: email || prev.author.email,
        },
      }));

      if (name) {
        setInviteBanner({ name, topic: topic || undefined });
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setAiToast(msg);
    setTimeout(() => setAiToast(''), 3500);
  };

  const wordCount = useMemo(() => {
    return (formData.content || '').split(/\s+/).filter(Boolean).length;
  }, [formData.content]);

  const readTimeEstimate = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const handleUpload = async (file: File, type: 'cover' | 'avatar') => {
    const isCover = type === 'cover';
    if (isCover) setUploadingCover(true);
    else setUploadingAvatar(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        if (isCover) setField('coverImage', data.url);
        else setAuthorField('avatar', data.url);
      } else {
        alert(data.error || 'Erro ao carregar ficheiro.');
      }
    } catch {
      alert('Erro de conexão durante o upload.');
    } finally {
      if (isCover) setUploadingCover(false);
      else setUploadingAvatar(false);
    }
  };

  // AI Assistant trigger
  const runAiAssistant = async (actionToRun: AiActionType, promptOverride?: string) => {
    setAiAction(actionToRun);
    setAiModalOpen(true);
    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/revista/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionToRun,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          customPrompt: promptOverride !== undefined ? promptOverride : aiCustomPrompt,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiResult(data.result);
      } else {
        alert(data.error || 'Erro ao processar assistência.');
      }
    } catch {
      alert('Erro de conexão com o Assistente de IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!formData.author.name.trim()) {
        setErrorMsg('Por favor indica o teu nome ou nome profissional de autor.');
        return;
      }
      if (!formData.author.email.trim() || !formData.author.email.includes('@')) {
        setErrorMsg('Por favor indica um e-mail válido para contacto editorial.');
        return;
      }
      if (formData.author.bio && formData.author.bio.length > MAX_BIO_CHARS) {
        setErrorMsg(`A bio curta do autor não pode exceder ${MAX_BIO_CHARS} caracteres (actualmente com ${formData.author.bio.length}).`);
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 160, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!formData.title.trim()) {
        setErrorMsg('Por favor indica um título para a tua história.');
        return;
      }
      if (formData.title.length > MAX_TITLE_CHARS) {
        setErrorMsg(`O título da história não pode exceder ${MAX_TITLE_CHARS} caracteres (actualmente com ${formData.title.length}).`);
        return;
      }
      if (!formData.excerpt.trim()) {
        setErrorMsg('Por favor escreve um resumo curto de 1 a 2 frases para o cartão da revista.');
        return;
      }
      if (formData.excerpt.length > MAX_EXCERPT_CHARS) {
        setErrorMsg(`O resumo da história não pode exceder ${MAX_EXCERPT_CHARS} caracteres (actualmente com ${formData.excerpt.length}).`);
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 160, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as 1 | 2 | 3);
      window.scrollTo({ top: 160, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title.trim()) {
      setErrorMsg('Por favor indica um título para a tua história.');
      return;
    }
    if (formData.title.length > MAX_TITLE_CHARS) {
      setErrorMsg(`O título da história não pode exceder ${MAX_TITLE_CHARS} caracteres.`);
      return;
    }
    if (!formData.excerpt.trim()) {
      setErrorMsg('Por favor escreve um resumo curto de 1 a 2 frases para o cartão da revista.');
      return;
    }
    if (formData.excerpt.length > MAX_EXCERPT_CHARS) {
      setErrorMsg(`O resumo da história não pode exceder ${MAX_EXCERPT_CHARS} caracteres.`);
      return;
    }
    if (!formData.author.name.trim()) {
      setErrorMsg('Por favor indica o teu nome ou nome profissional de autor.');
      return;
    }
    if (!formData.author.email.trim() || !formData.author.email.includes('@')) {
      setErrorMsg('Por favor indica um e-mail válido para que possamos avisar-te quando a história for publicada.');
      return;
    }
    if (formData.author.bio && formData.author.bio.length > MAX_BIO_CHARS) {
      setErrorMsg(`A bio curta do autor não pode exceder ${MAX_BIO_CHARS} caracteres.`);
      return;
    }
    if (wordCount < 40) {
      setErrorMsg('O conteúdo parece demasiado curto. Escreve pelo menos alguns parágrafos para que a equipa editorial possa avaliar.');
      return;
    }
    if (formData.content.length > MAX_CONTENT_CHARS) {
      setErrorMsg(`A descrição completa da história não pode exceder ${MAX_CONTENT_CHARS.toLocaleString('pt-MZ')} caracteres (actualmente com ${formData.content.length.toLocaleString('pt-MZ')}).`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/revista/submeter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao submeter história.');
        setLoading(false);
        return;
      }

      setCreatedStory({ id: data.id, slug: data.slug });
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg('Erro de conexão com o servidor. Tenta novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        .submeter-page {
          min-height: 100vh;
          background: #fdfcff;
          font-family: 'Poppins', sans-serif;
          color: #1e293b;
        }

        .sub-nav {
          border-bottom: 1px solid #f1f5f9;
          background: #ffffff;
          padding: 0.75rem 1.5rem;
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .sub-nav-inner {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          min-width: 0;
        }
        .sub-nav-back {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.88rem;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .sub-nav-back:hover {
          color: #7B2CBF;
        }
        .sub-nav-brand {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 800;
          font-size: 0.88rem;
          min-width: 0;
          overflow: hidden;
        }
        .sub-nav-brand-host {
          white-space: nowrap;
          color: #0f172a;
        }
        .sub-nav-brand-tag {
          color: #7B2CBF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 480px) {
          .sub-nav {
            padding: 0.6rem 1rem;
          }
          .sub-nav-back-label {
            display: none;
          }
          .sub-nav-brand-host {
            display: none;
          }
          .sub-nav-brand {
            font-size: 0.82rem;
          }
          .sub-nav-brand-tag {
            max-width: 180px;
          }
        }
        @media (max-width: 360px) {
          .sub-nav-brand-tag {
            max-width: 130px;
          }
        }
        
        .sub-hero {
          background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 50%, #ffffff 100%);
          border-bottom: 1px solid #E0AAFF;
          padding: 3rem 1.5rem 2.5rem;
          position: relative;
        }
        .sub-hero-inner {
          max-width: 1060px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 2.5rem;
          align-items: center;
          text-align: left;
        }
        .sub-hero-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: #7B2CBF; color: #fff; font-size: 0.75rem; font-weight: 700;
          padding: 0.3rem 0.85rem; border-radius: 9999px; text-transform: uppercase;
          letter-spacing: 0.06em; margin-bottom: 0.85rem;
        }
        .sub-hero-title {
          font-size: 2.15rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.03em; margin: 0 0 0.75rem; line-height: 1.2;
        }
        .sub-hero-title span { color: #7B2CBF; }
        .sub-hero-desc {
          max-width: 580px; font-size: 0.95rem; color: #475569; line-height: 1.6; margin: 0;
        }
        .sub-hero-banner-card {
          position: relative;
        }
        .sub-hero-img-wrap {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid #E0AAFF;
          box-shadow: 0 12px 32px -4px rgba(123, 44, 191, 0.22);
          background: #000;
          aspect-ratio: 15 / 10;
        }
        .sub-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        .sub-hero-img-wrap:hover .sub-hero-img {
          transform: scale(1.03);
        }
        .sub-hero-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 60%, rgba(16, 0, 43, 0.7) 100%);
          pointer-events: none;
        }
        .sub-hero-img-tag {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(16, 0, 43, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(224, 170, 255, 0.4);
          color: #E0AAFF;
          font-size: 0.74rem;
          font-weight: 700;
          padding: 0.3rem 0.75rem;
          border-radius: 9999px;
          letter-spacing: 0.04em;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          z-index: 2;
        }
        @media (max-width: 860px) {
          .sub-hero-inner {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 1.75rem;
          }
          .sub-hero-desc {
            margin: 0 auto;
          }
          .sub-hero-banner-card {
            max-width: 480px;
            margin: 0 auto;
            width: 100%;
          }
        }

        .sub-container {
          max-width: 900px; margin: 2.5rem auto 4rem; padding: 0 1.5rem;
        }

        .sub-card {
          background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 2rem; margin-bottom: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .sub-card-header {
          display: flex; align-items: center; gap: 0.6rem;
          padding-bottom: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9;
        }
        .sub-card-num {
          width: 28px; height: 28px; border-radius: 8px;
          background: #FAF5FF; color: #7B2CBF; border: 1px solid #E0AAFF;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.82rem;
        }
        .sub-card-title {
          font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0;
        }

        .form-group { margin-bottom: 1.35rem; }
        .form-label-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 0.4rem;
        }
        .form-label {
          display: block; font-size: 0.83rem; font-weight: 600; color: #334155;
          margin: 0;
        }
        .form-hint {
          font-size: 0.75rem; color: #94a3b8; margin-top: 0.35rem; line-height: 1.4;
        }
        .form-input, .form-textarea, .form-select {
          width: 100%; padding: 0.65rem 0.9rem; border-radius: 10px;
          border: 1.5px solid #cbd5e1; background: #ffffff; font-family: 'Poppins', sans-serif;
          font-size: 0.88rem; color: #0f172a; outline: none; transition: all 0.2s;
        }
        .form-input:focus, .form-textarea:focus, .form-select:focus {
          border-color: #7B2CBF; box-shadow: 0 0 0 3px rgba(123,44,191,0.12);
        }
        .form-textarea { min-height: 90px; resize: vertical; line-height: 1.5; }
        .form-textarea.editor { min-height: 380px; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 0.84rem; line-height: 1.6; }

        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 640px) {
          .form-grid-2 { grid-template-columns: 1fr; }
          .sub-hero-title { font-size: 1.7rem; }
          .sub-card { padding: 1.25rem; }
        }

        /* Stepper Wizard */
        .stepper-wrap {
          position: relative;
          max-width: 680px;
          margin: 0 auto 2.5rem;
          padding: 0 0.5rem;
        }
        .stepper-track {
          position: absolute;
          top: 22px;
          left: 45px;
          right: 45px;
          height: 3px;
          background: #e2e8f0;
          z-index: 1;
        }
        .stepper-progress {
          height: 100%;
          background: linear-gradient(90deg, #7B2CBF, #9D4EDD);
          transition: width 0.35s ease-in-out;
        }
        .stepper-steps {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
        }
        .step-item {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0;
          font-family: inherit;
        }
        .step-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ffffff;
          border: 2.5px solid #cbd5e1;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          font-weight: 700;
          transition: all 0.25s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .step-item.active .step-circle {
          background: #7B2CBF;
          border-color: #7B2CBF;
          color: #ffffff;
          box-shadow: 0 0 0 4px rgba(123,44,191,0.18);
          transform: scale(1.08);
        }
        .step-item.completed .step-circle {
          background: #10b981;
          border-color: #10b981;
          color: #ffffff;
        }
        .step-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 0.5rem;
        }
        .step-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
          transition: color 0.2s;
        }
        .step-item.active .step-title {
          color: #7B2CBF;
        }
        .step-item.completed .step-title {
          color: #0f172a;
        }
        .step-sub {
          font-size: 0.72rem;
          color: #94a3b8;
        }
        @media (max-width: 540px) {
          .step-sub { display: none; }
          .step-circle { width: 36px; height: 36px; font-size: 0.82rem; }
          .stepper-track { top: 18px; left: 24px; right: 24px; }
        }

        /* Step Nav Buttons */
        .step-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.6rem;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-family: inherit;
        }
        .step-nav-btn.prev {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #475569;
        }
        .step-nav-btn.prev:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
        }
        .step-nav-btn.next {
          background: linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(123,44,191,0.25);
        }
        .step-nav-btn.next:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(123,44,191,0.35);
        }

        /* AI Buttons */
        .ai-inline-btn {
          display: inline-flex; align-items: center; gap: 0.35rem;
          background: #FAF5FF; border: 1px solid #E0AAFF; color: #7B2CBF;
          font-size: 0.74rem; font-weight: 700; padding: 0.25rem 0.65rem;
          border-radius: 9999px; cursor: pointer; transition: all 0.2s;
        }
        .ai-inline-btn:hover {
          background: #7B2CBF; color: #ffffff; border-color: #7B2CBF;
          transform: translateY(-1px); box-shadow: 0 4px 12px rgba(123,44,191,0.2);
        }

        .editor-tabs {
          display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; align-items: center;
        }
        .editor-tab-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 0.9rem; border-radius: 8px; border: 1px solid #e2e8f0;
          background: #f8fafc; font-size: 0.8rem; font-weight: 600; color: #64748b;
          cursor: pointer; transition: all 0.2s;
        }
        .editor-tab-btn.active {
          background: #7B2CBF; color: #ffffff; border-color: #7B2CBF;
        }

        .ai-editor-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%);
          border: 1.5px solid #C77DFF; color: #5A189A;
          font-size: 0.78rem; font-weight: 700; padding: 0.4rem 0.95rem;
          border-radius: 8px; cursor: pointer; transition: all 0.2s;
          margin-left: auto;
        }
        .ai-editor-btn:hover {
          background: linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%);
          color: #ffffff; border-color: #5A189A;
          box-shadow: 0 4px 14px rgba(123,44,191,0.25); transform: translateY(-1px);
        }

        .preview-box {
          background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 12px;
          padding: 1.5rem; min-height: 320px; font-size: 0.9rem; line-height: 1.7;
          color: #334155;
        }
        .preview-box h2 {
          font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 1.5rem 0 0.6rem;
          border-bottom: 1px solid #f1f5f9; padding-bottom: 0.3rem;
        }
        .preview-box h2:first-child { margin-top: 0; }
        .preview-box blockquote {
          border-left: 3px solid #7B2CBF; background: #FAF5FF; padding: 0.8rem 1.2rem;
          margin: 1.2rem 0; border-radius: 0 8px 8px 0; font-style: italic; color: #5A189A;
        }
        .preview-box ul, .preview-box ol { padding-left: 1.4rem; margin: 0.8rem 0; }

        .submit-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          background: linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%);
          color: #ffffff; font-weight: 700; font-size: 1.05rem;
          padding: 1rem 2rem; border-radius: 12px; border: none; cursor: pointer;
          box-shadow: 0 4px 18px rgba(123,44,191,0.3); transition: all 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 8px 24px rgba(123,44,191,0.4);
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .upload-dropzone {
          border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 1.25rem;
          background: #f8fafc; text-align: center; cursor: pointer; transition: all 0.2s;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .upload-dropzone:hover { border-color: #7B2CBF; background: #FAF5FF; }

        /* Floating AI Badge */
        .ai-floating-badge {
          position: fixed; bottom: 2rem; right: 2rem; z-index: 50;
          display: flex; align-items: center; gap: 0.55rem;
          background: linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%);
          color: #ffffff; font-weight: 700; font-size: 0.86rem;
          padding: 0.75rem 1.35rem; border-radius: 9999px; border: 1.5px solid #E0AAFF;
          cursor: pointer; box-shadow: 0 8px 25px rgba(123,44,191,0.35);
          transition: all 0.25s;
        }
        .ai-floating-badge:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 12px 30px rgba(123,44,191,0.45);
        }

        /* Modal Styles */
        .ai-modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(5px); z-index: 9999;
          display: flex; align-items: center; justify-content: center; padding: 1.25rem;
        }
        .ai-modal {
          background: #ffffff; border-radius: 20px; max-width: 760px; width: 100%;
          max-height: 88vh; display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 25px 60px -15px rgba(123, 44, 191, 0.35);
          border: 1.5px solid #E0AAFF; animation: aiModalPop 0.22s ease-out;
        }
        @keyframes aiModalPop {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .ai-modal-header {
          padding: 1.25rem 1.75rem;
          background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%);
          border-bottom: 1px solid #E0AAFF;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ai-modal-tabs {
          display: flex; gap: 0.4rem; padding: 0.75rem 1.75rem;
          background: #ffffff; border-bottom: 1px solid #f1f5f9; overflow-x: auto;
        }
        .ai-tab-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.9rem; border-radius: 9999px;
          border: 1px solid #e2e8f0; background: #f8fafc;
          color: #64748b; font-size: 0.78rem; font-weight: 600;
          cursor: pointer; white-space: nowrap; transition: all 0.2s;
        }
        .ai-tab-btn.active {
          background: #7B2CBF; color: #ffffff; border-color: #7B2CBF;
        }
        .ai-modal-body {
          padding: 1.5rem 1.75rem; overflow-y: auto; flex: 1;
        }
        .ai-card-option {
          background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px;
          padding: 1rem 1.25rem; margin-bottom: 0.75rem; transition: all 0.2s;
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .ai-card-option:hover {
          border-color: #7B2CBF; background: #FAF5FF;
          box-shadow: 0 4px 15px rgba(123,44,191,0.08);
        }
        .ai-action-btn-primary {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: #7B2CBF; color: #ffffff; font-size: 0.8rem; font-weight: 700;
          padding: 0.5rem 1.1rem; border-radius: 8px; border: none; cursor: pointer;
          transition: all 0.2s;
        }
        .ai-action-btn-primary:hover {
          background: #5A189A; transform: translateY(-1px);
        }
        .ai-action-btn-secondary {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: #ffffff; color: #475569; font-size: 0.8rem; font-weight: 600;
          padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer;
          transition: all 0.2s;
        }
        .ai-action-btn-secondary:hover {
          background: #f8fafc; color: #0f172a;
        }

        .toast-banner {
          position: fixed; top: 1.5rem; left: 50%; transform: translateX(-50%);
          z-index: 10000; background: #0f172a; color: #ffffff;
          padding: 0.75rem 1.5rem; border-radius: 9999px; font-size: 0.86rem;
          font-weight: 600; display: flex; align-items: center; gap: 0.6rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          animation: slideDown 0.25s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        .success-card {
          background: #ffffff;
          border: 1px solid rgba(123, 44, 191, 0.14);
          border-radius: 24px;
          padding: 3.5rem 2rem;
          text-align: center;
          max-width: 580px;
          margin: 3.5rem auto;
          box-shadow: 0 20px 45px -10px rgba(123, 44, 191, 0.12), 0 4px 20px rgba(0, 0, 0, 0.03);
          animation: successCardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes successCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .success-icon-wrap {
          position: relative;
          width: 76px;
          height: 76px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .success-icon-bg {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(123, 44, 191, 0.18), rgba(224, 170, 255, 0.35));
          animation: successPulse 2.2s ease-in-out infinite;
        }
        @keyframes successPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.35; }
        }
        .success-icon-core {
          position: relative;
          z-index: 2;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 22px rgba(123, 44, 191, 0.35);
        }
      `}</style>

      {/* Toast Notification */}
      {aiToast && (
        <div className="toast-banner">
          <CheckCheck size={18} color="#10b981" />
          <span>{aiToast}</span>
        </div>
      )}

      {/* Botão Flutuante do Assistente IA */}
      {!submitted && (
        <button
          type="button"
          onClick={() => {
            setAiAction('improve_content');
            setAiModalOpen(true);
            if (!aiResult) runAiAssistant('improve_content');
          }}
          className="ai-floating-badge"
          title="Abrir Assistente Editorial IA"
        >
          <Sparkles size={16} />
          <span>Assistente IA</span>
        </button>
      )}

      {/* MODAL DO ASSISTENTE IA */}
      {aiModalOpen && (
        <div className="ai-modal-overlay" onClick={() => setAiModalOpen(false)}>
          <div className="ai-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="ai-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  <Wand2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Assistente IA Editorial • Codando Histórias
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Copiloto inteligente para títulos, resumos e polimento de Markdown técnico.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="ai-modal-tabs">
              <button
                type="button"
                className={`ai-tab-btn ${aiAction === 'improve_content' ? 'active' : ''}`}
                onClick={() => { setAiAction('improve_content'); runAiAssistant('improve_content'); }}
              >
                <FileText size={14} /> Polir Conteúdo (Markdown)
              </button>
              <button
                type="button"
                className={`ai-tab-btn ${aiAction === 'suggest_titles' ? 'active' : ''}`}
                onClick={() => { setAiAction('suggest_titles'); runAiAssistant('suggest_titles'); }}
              >
                <Lightbulb size={14} /> 3 Ideias de Título
              </button>
              <button
                type="button"
                className={`ai-tab-btn ${aiAction === 'generate_excerpt' ? 'active' : ''}`}
                onClick={() => { setAiAction('generate_excerpt'); runAiAssistant('generate_excerpt'); }}
              >
                <BookOpen size={14} /> Resumo do Cartão
              </button>
              <button
                type="button"
                className={`ai-tab-btn ${aiAction === 'suggest_tags' ? 'active' : ''}`}
                onClick={() => { setAiAction('suggest_tags'); runAiAssistant('suggest_tags'); }}
              >
                <Tag size={14} /> Sugerir Tags
              </button>
            </div>

            {/* Modal Body */}
            <div className="ai-modal-body">
              {aiLoading ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: '50%',
                    background: '#FAF5FF', border: '2px solid #E0AAFF',
                    color: '#7B2CBF', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 1.25rem',
                    animation: 'spin 1.5s linear infinite',
                  }}>
                    <Loader2 size={28} />
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem', fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                    O Copiloto IA está a analisar o teu rascunho...
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                    Ajustando o ritmo da narrativa, aplicando directrizes de estilo tech e preservando a tua voz original.
                  </p>
                </div>
              ) : (
                <>
                  {/* TAB 1: Polir Conteúdo */}
                  {aiAction === 'improve_content' && (
                    <div>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                          Orientação Opcional para a IA (ex: &quot;Tom mais descontraído&quot;, &quot;Enfatizar lições de Docker&quot;):
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Escreve uma instrução personalizada..."
                            className="form-input"
                            style={{ flex: 1 }}
                            value={aiCustomPrompt}
                            onChange={e => setAiCustomPrompt(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                runAiAssistant('improve_content', aiCustomPrompt);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => runAiAssistant('improve_content', aiCustomPrompt)}
                            className="ai-action-btn-primary"
                          >
                            <RefreshCw size={14} /> Refinar
                          </button>
                        </div>
                      </div>

                      {aiResult ? (
                        <div>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '0.5rem', fontSize: '0.8rem', color: '#64748b',
                          }}>
                            <span>✨ Proposta Polida com Markdown e Estrutura Editorial:</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(aiResult)}
                                className="ai-action-btn-secondary"
                                style={{ padding: '0.3rem 0.75rem', fontSize: '0.74rem' }}
                              >
                                {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                                {copied ? 'Copiado!' : 'Copiar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setField('content', aiResult);
                                  showToast('✓ Conteúdo polido aplicado com sucesso ao editor!');
                                  setAiModalOpen(false);
                                }}
                                className="ai-action-btn-primary"
                                style={{ padding: '0.3rem 0.85rem', fontSize: '0.74rem' }}
                              >
                                <Check size={14} /> Aplicar ao Meu Rascunho
                              </button>
                            </div>
                          </div>

                          <div style={{
                            background: '#0f172a', color: '#e2e8f0', borderRadius: 12,
                            padding: '1.25rem', fontFamily: 'Menlo, Monaco, monospace',
                            fontSize: '0.8rem', lineHeight: 1.6, maxHeight: 360, overflowY: 'auto',
                            whiteSpace: 'pre-wrap', border: '1px solid #334155',
                          }}>
                            {aiResult}
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                          Clica em Refinar para gerar a versão polida do conteúdo.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Sugerir Títulos */}
                  {aiAction === 'suggest_titles' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                          Opções de títulos com palavra de destaque (highlightText) recomendada:
                        </span>
                        <button
                          type="button"
                          onClick={() => runAiAssistant('suggest_titles')}
                          className="ai-action-btn-secondary"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.74rem' }}
                        >
                          <RefreshCw size={13} /> Gerar Outros
                        </button>
                      </div>

                      {Array.isArray(aiResult) && aiResult.length > 0 ? (
                        <div>
                          {aiResult.map((item: any, i: number) => (
                            <div key={i} className="ai-card-option">
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                                  {item.title}
                                </div>
                                {item.highlight && (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: '#7B2CBF', background: '#FAF5FF', padding: '0.15rem 0.55rem', borderRadius: 9999, border: '1px solid #E0AAFF' }}>
                                    <span>Realce roxo:</span> <strong>&quot;{item.highlight}&quot;</strong>
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setField('title', item.title);
                                  if (item.highlight) setField('highlightText', item.highlight);
                                  showToast('✓ Título e realce aplicados ao formulário!');
                                  setAiModalOpen(false);
                                }}
                                className="ai-action-btn-primary"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.76rem' }}
                              >
                                Usar Este
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
                          padding: '1.25rem', whiteSpace: 'pre-wrap', fontSize: '0.88rem',
                        }}>
                          {typeof aiResult === 'string' ? aiResult : 'Sem títulos gerados ainda.'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Gerar Resumo */}
                  {aiAction === 'generate_excerpt' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                          Resumo de Cartão (1 a 2 frases para cativar leitores na Revista):
                        </span>
                        <button
                          type="button"
                          onClick={() => runAiAssistant('generate_excerpt')}
                          className="ai-action-btn-secondary"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.74rem' }}
                        >
                          <RefreshCw size={13} /> Gerar Outro
                        </button>
                      </div>

                      {aiResult ? (
                        <div style={{ background: '#FAF5FF', border: '1.5px solid #E0AAFF', borderRadius: 14, padding: '1.5rem' }}>
                          <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', lineHeight: 1.6, color: '#1e293b', fontStyle: 'italic' }}>
                            &quot;{aiResult}&quot;
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.75rem', color: '#7B2CBF', fontWeight: 600 }}>
                              {String(aiResult).length} caracteres • Perfeito para cartão
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setField('excerpt', aiResult);
                                showToast('✓ Resumo aplicado ao formulário!');
                                setAiModalOpen(false);
                              }}
                              className="ai-action-btn-primary"
                            >
                              <Check size={14} /> Aplicar ao Formulário
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                          Clica em Gerar para criar o resumo impactante.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: Sugerir Tags */}
                  {aiAction === 'suggest_tags' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                          Tags sugeridas com base no conteúdo e categoria:
                        </span>
                        <button
                          type="button"
                          onClick={() => runAiAssistant('suggest_tags')}
                          className="ai-action-btn-secondary"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.74rem' }}
                        >
                          <RefreshCw size={13} /> Gerar Novamente
                        </button>
                      </div>

                      {aiResult ? (
                        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 14, padding: '1.5rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            {String(aiResult).split(',').map((t, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: '#FAF5FF', border: '1px solid #E0AAFF',
                                  color: '#7B2CBF', fontWeight: 600, fontSize: '0.8rem',
                                  padding: '0.3rem 0.8rem', borderRadius: 9999,
                                }}
                              >
                                #{t.trim()}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setField('tags', aiResult);
                                showToast('✓ Tags aplicadas ao formulário!');
                                setAiModalOpen(false);
                              }}
                              className="ai-action-btn-primary"
                            >
                              <Check size={14} /> Aplicar Tags ({String(aiResult).split(',').length})
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                          Clica em Sugerir Tags para ver as recomendações.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="ai-modal-footer">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                💡 A IA ajuda na formatação e polimento, mas a história é 100% tua.
              </span>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="ai-action-btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="submeter-page">
        {/* Navigation */}
        <nav className="sub-nav">
          <div className="sub-nav-inner">
            <Link href="/revista" className="sub-nav-back">
              <ArrowLeft size={16} />
              <span className="sub-nav-back-label">Voltar à Revista</span>
            </Link>
            <div className="sub-nav-brand">
              <span className="sub-nav-brand-host">WEHOSTHERE</span>
              <span className="sub-nav-brand-tag">• &lt;/&gt; CODANDO HISTÓRIAS</span>
            </div>
          </div>
        </nav>

        {submitted ? (
          /* Tela de Sucesso Dinâmica e Limpa */
          <div className="sub-container">
            <div className="success-card">
              <div className="success-icon-wrap">
                <div className="success-icon-bg" />
                <div className="success-icon-core">
                  <Check size={30} strokeWidth={2.8} />
                </div>
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: '#FAF5FF', border: '1px solid #E0AAFF',
                color: '#7B2CBF', fontSize: '0.74rem', fontWeight: 700,
                padding: '0.3rem 0.85rem', borderRadius: 9999,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                marginBottom: '1rem',
              }}>
                <Sparkles size={12} /> Enviada para Revisão Editorial
              </div>

              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.6rem', letterSpacing: '-0.02em' }}>
                História Submetida! 🎉
              </h2>

              <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 1.5rem' }}>
                Obrigado, <strong>{formData.author.name || 'Autor'}</strong>! A equipa editorial da Codando Histórias irá analisar a tua publicação e receberás atualizações em <strong>{formData.author.email || 'teu e-mail'}</strong>.
              </p>

              {formData.title && (
                <div style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14,
                  padding: '0.85rem 1.25rem', maxWidth: 440, margin: '0 auto 2rem',
                  display: 'flex', alignItems: 'center', gap: '0.85rem', textAlign: 'left',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FAF5FF', color: '#7B2CBF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formData.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                      Status: <strong style={{ color: '#d97706' }}>Pendente de Revisão</strong>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/revista"
                  style={{
                    background: 'linear-gradient(135deg, #7B2CBF 0%, #5A189A 100%)',
                    color: '#fff', padding: '0.75rem 1.75rem',
                    borderRadius: '11px', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem',
                    boxShadow: '0 6px 18px rgba(123,44,191,0.28)',
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  }}
                >
                  <BookOpen size={15} /> Explorar a Revista
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setCurrentStep(1);
                    setFormData({
                      title: '',
                      highlightText: '',
                      excerpt: '',
                      category: 'codigo',
                      tags: '',
                      coverImage: '',
                      content: DEFAULT_CONTENT_TEMPLATE,
                      author: {
                        name: '',
                        email: '',
                        bio: '',
                        avatar: '',
                        website: '',
                        socials: { linkedin: '', github: '', twitter: '', instagram: '' },
                      },
                    });
                  }}
                  style={{
                    background: '#fff', color: '#475569', border: '1.5px solid #cbd5e1',
                    padding: '0.75rem 1.4rem', borderRadius: '11px', fontWeight: 600, fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Submeter Nova História
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Formulário de Submissão */
          <>
            <header className="sub-hero">
              <div className="sub-hero-inner">
                <div className="sub-hero-content">
                  <div className="sub-hero-badge">
                    <Sparkles size={12} /> Espaço da Comunidade
                  </div>
                  <h1 className="sub-hero-title">
                    Conta a Tua História na <span>&lt;/&gt; Codando Histórias</span>
                  </h1>
                  <p className="sub-hero-desc">
                    És programador, designer, fundador de startup ou entusiasta tech? Partilha o teu projecto, erros e lições reais. O teu conhecimento inspira outros criadores em Moçambique.
                  </p>
                </div>

                <div className="sub-hero-banner-card">
                  <div className="sub-hero-img-wrap">
                    <Image
                      src="/codando banner.jpg"
                      alt="</> Codando Histórias"
                      width={560}
                      height={370}
                      className="sub-hero-img"
                      priority
                    />
                    <div className="sub-hero-img-overlay" />
                    <div className="sub-hero-img-tag">
                      <Code2 size={13} />
                      <span>&lt;/&gt; Codando Histórias</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="sub-container">
              <form onSubmit={handleSubmit}>
                {errorMsg && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                    ⚠️ {errorMsg}
                  </div>
                )}

                {/* Banner de Convite VIP da Redacção */}
                {inviteBanner && (
                  <div style={{
                    background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
                    border: '2px solid #C77DFF',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.2rem',
                    boxShadow: '0 4px 18px rgba(123,44,191,0.12)',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7B2CBF, #5A189A)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, boxShadow: '0 4px 12px rgba(123,44,191,0.3)',
                    }}>
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'inline-block', background: '#7B2CBF', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.6rem', borderRadius: 9999, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Convite Editorial VIP
                      </div>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                        Olá, {inviteBanner.name}! O teu convite para a Codando Histórias está activo.
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                        A nossa equipa editorial convidou-te para partilhares a tua trajectória. Já pré-preenchemos os teus dados abaixo. {inviteBanner.topic ? <span>Pauta sugerida: <strong>&quot;{inviteBanner.topic}&quot;</strong>.</span> : ''} Podes usar o nosso <strong>Assistente IA</strong> para polir o teu rascunho com 1 clique!
                      </p>
                    </div>
                  </div>
                )}

                {/* Indicador de Passos (Stepper) */}
                <div className="stepper-wrap">
                  <div className="stepper-track">
                    <div
                      className="stepper-progress"
                      style={{
                        width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                      }}
                    />
                  </div>

                  <div className="stepper-steps">
                    <button
                      type="button"
                      className={`step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
                      onClick={() => setCurrentStep(1)}
                    >
                      <div className="step-circle">
                        {currentStep > 1 ? <Check size={16} /> : '1'}
                      </div>
                      <div className="step-label">
                        <span className="step-title">1. O Autor</span>
                        <span className="step-sub">Quem és tu</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
                      onClick={() => {
                        if (formData.author.name.trim() && formData.author.email.includes('@')) {
                          setCurrentStep(2);
                        }
                      }}
                    >
                      <div className="step-circle">
                        {currentStep > 2 ? <Check size={16} /> : '2'}
                      </div>
                      <div className="step-label">
                        <span className="step-title">2. A História</span>
                        <span className="step-sub">Título e resumo</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`step-item ${currentStep === 3 ? 'active' : ''}`}
                      onClick={() => {
                        if (formData.author.name.trim() && formData.title.trim()) {
                          setCurrentStep(3);
                        }
                      }}
                    >
                      <div className="step-circle">3</div>
                      <div className="step-label">
                        <span className="step-title">3. O Conteúdo</span>
                        <span className="step-sub">Escrever e polir</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Passo 1: O Autor */}
                {currentStep === 1 && (
                  <div className="sub-card">
                    <div className="sub-card-header">
                      <span className="sub-card-num">1</span>
                      <h2 className="sub-card-title">Quem És Tu? (Dados do Autor)</h2>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">O Teu Nome Completo ou Profissional *</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Ex: Afonso Domingos ou Maria Cossa"
                          value={formData.author.name}
                          onChange={e => setAuthorField('name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">O Teu E-mail *</label>
                        <input
                          className="form-input"
                          type="email"
                          placeholder="exemplo@gmail.com"
                          value={formData.author.email}
                          onChange={e => setAuthorField('email', e.target.value)}
                          required
                        />
                        <p className="form-hint">Usaremos apenas para te avisar quando o artigo for aprovado.</p>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="form-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <label className="form-label" style={{ margin: 0 }}>Bio Curta (1 a 2 frases)</label>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: (formData.author.bio || '').length > 450 ? ((formData.author.bio || '').length >= MAX_BIO_CHARS ? '#ef4444' : '#d97706') : '#94a3b8' }}>
                          {(formData.author.bio || '').length} / {MAX_BIO_CHARS} caracteres
                        </span>
                      </div>
                      <textarea
                        className="form-textarea"
                        maxLength={MAX_BIO_CHARS}
                        placeholder="Ex: Frontend Developer em Maputo, apaixonado por Next.js, interfaces limpas e código aberto."
                        value={formData.author.bio}
                        onChange={e => setAuthorField('bio', e.target.value)}
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Foto de Perfil / Avatar</label>
                        <div className="upload-dropzone">
                          <input
                            type="file"
                            accept="image/*"
                            id="avatar-file"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(file, 'avatar');
                            }}
                          />
                          <label htmlFor="avatar-file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <User size={22} color="#7B2CBF" style={{ marginBottom: 4 }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7B2CBF' }}>
                              {uploadingAvatar ? 'A carregar foto...' : formData.author.avatar ? 'Foto carregada ✓ (clica para trocar)' : 'Carregar foto de perfil'}
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Website Pessoal ou Portfólio</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="https://oseusite.com"
                          value={formData.author.website}
                          onChange={e => setAuthorField('website', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Redes Sociais */}
                    <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <label className="form-label" style={{ marginBottom: '0.75rem', color: '#64748b' }}>
                        Redes Sociais (Opcional - exibidas no teu card de autor)
                      </label>
                      <div className="form-grid-2">
                        <input
                          className="form-input"
                          placeholder="LinkedIn (ex: https://linkedin.com/in/... ou username)"
                          value={formData.author.socials.linkedin}
                          onChange={e => setAuthorSocial('linkedin', e.target.value)}
                        />
                        <input
                          className="form-input"
                          placeholder="GitHub (ex: https://github.com/... ou username)"
                          value={formData.author.socials.github}
                          onChange={e => setAuthorSocial('github', e.target.value)}
                        />
                        <input
                          className="form-input"
                          placeholder="Twitter / X (@username)"
                          value={formData.author.socials.twitter}
                          onChange={e => setAuthorSocial('twitter', e.target.value)}
                        />
                        <input
                          className="form-input"
                          placeholder="Instagram (@username)"
                          value={formData.author.socials.instagram}
                          onChange={e => setAuthorSocial('instagram', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Botão Próximo Passo */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        onClick={goToNextStep}
                        className="step-nav-btn next"
                      >
                        <span>Continuar para a História</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Passo 2: A História */}
                {currentStep === 2 && (
                  <div className="sub-card">
                    <div className="sub-card-header">
                      <span className="sub-card-num">2</span>
                      <h2 className="sub-card-title">Sobre a História</h2>
                    </div>

                    <div className="form-group">
                      <div className="form-label-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <label className="form-label" style={{ margin: 0 }}>Título da História *</label>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: formData.title.length > 90 ? (formData.title.length >= MAX_TITLE_CHARS ? '#ef4444' : '#d97706') : '#94a3b8' }}>
                            {formData.title.length} / {MAX_TITLE_CHARS} caracteres
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => runAiAssistant('suggest_titles')}
                          className="ai-inline-btn"
                          title="Pedir ideias de títulos atraentes à IA"
                        >
                          <Sparkles size={12} /> Sugerir Títulos IA
                        </button>
                      </div>
                      <input
                        className="form-input"
                        type="text"
                        maxLength={MAX_TITLE_CHARS}
                        placeholder="Ex: Como construí o meu primeiro SaaS com Next.js em 30 dias"
                        value={formData.title}
                        onChange={e => setField('title', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Palavra ou Frase em Destaque no Título</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Ex: primeiro SaaS"
                          value={formData.highlightText}
                          onChange={e => setField('highlightText', e.target.value)}
                        />
                        <p className="form-hint">Este trecho receberá o realce roxo característico da revista.</p>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Categoria Principal *</label>
                        <select
                          className="form-select"
                          value={formData.category}
                          onChange={e => setField('category', e.target.value)}
                        >
                          {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="form-label-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <label className="form-label" style={{ margin: 0 }}>Resumo Impactante (1 a 2 frases) *</label>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: formData.excerpt.length > 450 ? (formData.excerpt.length >= MAX_EXCERPT_CHARS ? '#ef4444' : '#d97706') : '#94a3b8' }}>
                            {formData.excerpt.length} / {MAX_EXCERPT_CHARS} caracteres
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => runAiAssistant('generate_excerpt')}
                          className="ai-inline-btn"
                          title="Gerar resumo magnético para o cartão"
                        >
                          <Sparkles size={12} /> Gerar com IA
                        </button>
                      </div>
                      <textarea
                        className="form-textarea"
                        maxLength={MAX_EXCERPT_CHARS}
                        placeholder="Ex: Saí do zero, sem investimento externo, e em 30 dias lancei um produto que hoje gera receita. Aqui está o que aprendi pelo caminho."
                        value={formData.excerpt}
                        onChange={e => setField('excerpt', e.target.value)}
                        required
                      />
                      <p className="form-hint">Aparecerá nos cards da página inicial e nas redes sociais (máx. 500 caracteres).</p>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <div className="form-label-row">
                          <label className="form-label">Tags (separadas por vírgula)</label>
                          <button
                            type="button"
                            onClick={() => runAiAssistant('suggest_tags')}
                            className="ai-inline-btn"
                            title="Sugerir tags técnicas para indexação"
                          >
                            <Sparkles size={12} /> Sugerir Tags
                          </button>
                        </div>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="nextjs, saas, mozambique, react"
                          value={formData.tags}
                          onChange={e => setField('tags', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Imagem de Capa (Opcional)</label>
                        <div className="upload-dropzone">
                          <input
                            type="file"
                            accept="image/*"
                            id="cover-file"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(file, 'cover');
                            }}
                          />
                          <label htmlFor="cover-file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <ImageIcon size={22} color="#7B2CBF" style={{ marginBottom: 4 }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7B2CBF' }}>
                              {uploadingCover ? 'A carregar capa...' : formData.coverImage ? 'Imagem carregada ✓ (clica para trocar)' : 'Carregar imagem de capa'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Botões Passo 2 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        onClick={goToPrevStep}
                        className="step-nav-btn prev"
                      >
                        <ArrowLeft size={16} />
                        <span>Voltar ao Autor</span>
                      </button>
                      <button
                        type="button"
                        onClick={goToNextStep}
                        className="step-nav-btn next"
                      >
                        <span>Continuar para o Conteúdo</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Passo 3: Conteúdo */}
                {currentStep === 3 && (
                  <div className="sub-card">
                    <div className="sub-card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="sub-card-num">3</span>
                        <h2 className="sub-card-title">O Conteúdo da História</h2>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
                        <span>📝 <strong>{wordCount}</strong> palavras</span>
                        <span>⏱ ~<strong>{readTimeEstimate} min</strong> de leitura</span>
                        <span style={{ fontWeight: 600, color: formData.content.length > 4800 ? (formData.content.length >= MAX_CONTENT_CHARS ? '#ef4444' : '#d97706') : '#7B2CBF' }}>
                          📏 {formData.content.length.toLocaleString('pt-MZ')} / {MAX_CONTENT_CHARS.toLocaleString('pt-MZ')} caracteres
                        </span>
                      </div>
                    </div>

                    <div className="editor-tabs">
                      <button
                        type="button"
                        className={`editor-tab-btn${activeTab === 'write' ? ' active' : ''}`}
                        onClick={() => setActiveTab('write')}
                      >
                        <Code2 size={13} /> Escrever (Markdown)
                      </button>
                      <button
                        type="button"
                        className={`editor-tab-btn${activeTab === 'preview' ? ' active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                      >
                        <Eye size={13} /> Pré-visualizar Como Fica
                      </button>

                      <button
                        type="button"
                        onClick={() => runAiAssistant('improve_content')}
                        className="ai-editor-btn"
                        title="Revisar gramática, melhorar o ritmo e organizar em Markdown com a IA"
                      >
                        <Wand2 size={14} /> Polir Conteúdo com IA
                      </button>
                    </div>

                    {activeTab === 'write' ? (
                      <div>
                        <textarea
                          className="form-textarea editor"
                          maxLength={MAX_CONTENT_CHARS}
                          value={formData.content}
                          onChange={e => setField('content', e.target.value)}
                          placeholder="Escreve aqui a tua história usando Markdown..."
                          required
                        />
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                          <span>💡 Dicas: Usa <code>## Subtítulo</code> para secções</span>
                          <span>• <code>&gt; Citação</code> para frases impactantes</span>
                          <span>• <code>* Lista</code> para tópicos</span>
                          <span style={{ marginLeft: 'auto', fontWeight: 600, color: formData.content.length >= MAX_CONTENT_CHARS ? '#ef4444' : '#64748b' }}>
                            Máx. 5.000 caracteres
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="preview-box">
                        {formData.content.split('\n').map((line, idx) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <div key={idx} style={{ height: 10 }} />;
                          if (trimmed.startsWith('## ')) {
                            return <h2 key={idx}>{trimmed.replace(/^##\s+/, '')}</h2>;
                          }
                          if (trimmed.startsWith('> ')) {
                            return <blockquote key={idx}>{trimmed.replace(/^>\s+/, '')}</blockquote>;
                          }
                          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                            return <li key={idx} style={{ marginLeft: '1rem' }}>{trimmed.replace(/^[\*\-]\s+/, '')}</li>;
                          }
                          return <p key={idx} style={{ margin: '0.5rem 0' }}>{trimmed}</p>;
                        })}
                      </div>
                    )}

                    {/* Botões Passo 3 (Voltar + Submissão) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        onClick={goToPrevStep}
                        className="step-nav-btn prev"
                      >
                        <ArrowLeft size={16} />
                        <span>Voltar aos Detalhes</span>
                      </button>
                      <button type="submit" className="submit-btn" disabled={loading} style={{ width: 'auto', minWidth: '320px' }}>
                        {loading ? (
                          <span>A enviar história para a redacção...</span>
                        ) : (
                          <>
                            <Send size={18} /> Submeter História para Revisão Editorial
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
                  Ao submeteres, concordas com a publicação do artigo na Revista Digital WEHOSTHERE &quot;Codando Histórias&quot; com os devidos créditos ao teu nome de autor.
                </p>
              </form>
            </main>
          </>
        )}
      </div>
    </>
  );
}
