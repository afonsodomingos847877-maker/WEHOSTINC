'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Calendar, User, Tag, ArrowLeft, Share2, Eye, Facebook, Twitter, Linkedin, MessageCircle, EyeOff, Home } from 'lucide-react';
import AdSenseBanner from '@/components/AdSenseBanner';
import BackToTopBar from '@/components/BackToTopBar';

// Hook de efeito de digitação suave no título
function useTypingEffect(text: string, speed: number = 25) {
  const [displayText, setDisplayText] = useState(text);
  const [isComplete, setIsComplete] = useState(true);

  useEffect(() => {
    if (!text) return;
    setDisplayText('');
    setIsComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayText, isComplete };
}

// Hook de efeito de scroll reveal
function useScrollReveal(enabled: boolean = false) {
  const [visibleSections, setVisibleSections] = useState<number[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      const sections = contentRef.current?.querySelectorAll('.scroll-section');
      if (sections) {
        const allIndices = Array.from({ length: sections.length }, (_, i) => i);
        setVisibleSections(allIndices);
      }
      return;
    }

    setVisibleSections([0]);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            setVisibleSections((prev) => {
              if (!prev.includes(index)) {
                return [...prev, index];
              }
              return prev;
            });
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    const sections = contentRef.current?.querySelectorAll('.scroll-section');
    sections?.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [enabled]);

  return { contentRef, visibleSections };
}

export interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: { name: string; email?: string };
  category: string;
  tags: string[];
  publishedAt: string;
  views: number;
  featured: boolean;
}

interface BlogPostClientProps {
  initialPost: BlogPostData;
  initialRelatedPosts?: BlogPostData[];
}

export default function BlogPostClient({ initialPost, initialRelatedPosts = [] }: BlogPostClientProps) {
  const [post] = useState<BlogPostData>(initialPost);
  const [scrollRevealEnabled, setScrollRevealEnabled] = useState(false);
  const [relatedPosts] = useState<BlogPostData[]>(initialRelatedPosts);

  // Efeito de digitação no título
  const { displayText: typedTitle } = useTypingEffect(post.title || '', 20);

  // Efeito de scroll reveal
  const { contentRef, visibleSections } = useScrollReveal(scrollRevealEnabled);

  useEffect(() => {
    if (initialPost?.slug) {
      // Incrementar views quando o post é carregado
      fetch(`/api/blog/${initialPost.slug}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [initialPost?.slug]);

  const incrementClick = (slug: string) => {
    fetch(`/api/blog/${slug}/click`, { method: 'POST' }).catch(() => {});
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      news: 'Notícias',
      tutorial: 'Tutoriais',
      announcement: 'Anúncios',
      update: 'Atualizações',
      feature: 'Funcionalidades'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      news: 'bg-blue-100 text-blue-900 border border-blue-200',
      tutorial: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
      announcement: 'bg-purple-100 text-purple-900 border border-purple-200',
      update: 'bg-amber-100 text-amber-900 border border-amber-200',
      feature: 'bg-pink-100 text-pink-900 border border-pink-200'
    };
    return colors[category] || 'bg-neutral-100 text-neutral-900 border border-neutral-200';
  };

  const sharePost = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const shareToFacebook = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }
  };

  const shareToTwitter = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(post.title);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  };

  const shareToLinkedIn = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(post.title);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
    }
  };

  const shareToWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`${post.title} - ${window.location.href}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  // Divide o conteúdo em seções legíveis para efeito de scroll
  const splitContentIntoSections = (rawContent: string): string[] => {
    if (!rawContent) return [];
    
    // Se contém tags de parágrafo HTML
    if (/<p>|<h[1-6]>|<div>/i.test(rawContent)) {
      const parts = rawContent.split(/<\/p>|<\/h[1-6]>|<\/div>/i);
      const result: string[] = [];
      let currentSection = '';

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i].trim();
        if (!p) continue;
        currentSection += p + (p.startsWith('<') ? '' : '</p>');
        if (currentSection.length > 500) {
          result.push(currentSection);
          currentSection = '';
        }
      }
      if (currentSection.trim()) result.push(currentSection);
      return result.length > 0 ? result : [rawContent];
    }

    // Se é texto puro separado por quebras de linha
    const paragraphs = rawContent.split(/\n\s*\n/);
    const result: string[] = [];
    let currentBlock = '';

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      if (!para) continue;
      currentBlock += (currentBlock ? '\n\n' : '') + para;
      if (currentBlock.length > 450) {
        result.push(currentBlock);
        currentBlock = '';
      }
    }
    if (currentBlock.trim()) result.push(currentBlock);
    return result.length > 0 ? result : [rawContent];
  };

  // Renderizador estruturado para garantir 100% de legibilidade e texto preto
  const renderFormattedSection = (blockText: string) => {
    if (!blockText) return null;

    // Se é HTML formatado
    if (/<[a-z][\s\S]*>/i.test(blockText)) {
      return (
        <div 
          className="blog-inner-html"
          dangerouslySetInnerHTML={{ __html: blockText }} 
        />
      );
    }

    // Se é texto simples com parágrafos
    const paras = blockText.split(/\n\s*\n/);
    return (
      <div className="space-y-5">
        {paras.map((p, pIdx) => {
          const trimmed = p.trim();
          if (!trimmed) return null;

          // Se é título / subtítulo
          if (/^(?:#{1,3}\s+|[0-9]+\.\s+[A-ZÀ-Ú])/.test(trimmed) || (trimmed.length < 80 && trimmed.endsWith(':'))) {
            const cleanTitle = trimmed.replace(/^#{1,3}\s+/, '');
            return (
              <h2 key={pIdx} className="text-xl sm:text-2xl font-bold text-neutral-950 mt-8 mb-3 tracking-tight">
                {cleanTitle}
              </h2>
            );
          }

          // Se é lista de itens
          if (/^[-*•]\s+/.test(trimmed)) {
            const items = trimmed.split(/\n/).map(line => line.replace(/^[-*•]\s+/, '').trim()).filter(Boolean);
            return (
              <ul key={pIdx} className="list-disc pl-6 space-y-2 text-neutral-900 my-4">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-base sm:text-lg leading-relaxed text-neutral-900">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          // Parágrafo regular
          const lines = trimmed.split('\n');
          return (
            <p key={pIdx} className="text-base sm:text-lg text-neutral-900 leading-relaxed font-normal">
              {lines.map((line, lIdx) => (
                <span key={lIdx}>
                  {line}
                  {lIdx < lines.length - 1 && <br />}
                </span>
              ))}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 antialiased selection:bg-blue-100 selection:text-neutral-950">
      {/* Estilos isolados com garantia estrita de texto preto apenas dentro do Blog */}
      <style jsx global>{`
        .blog-article-content,
        .blog-article-content * {
          color: #0f172a;
        }
        .blog-article-content h1,
        .blog-article-content h2,
        .blog-article-content h3,
        .blog-article-content h4,
        .blog-article-content h5,
        .blog-article-content h6 {
          color: #020617 !important;
          font-weight: 800 !important;
          line-height: 1.3 !important;
          margin-top: 1.75rem !important;
          margin-bottom: 0.75rem !important;
        }
        .blog-article-content p {
          color: #0f172a !important;
          font-size: 1.0625rem !important;
          line-height: 1.85 !important;
          margin-bottom: 1.35rem !important;
          font-weight: 400 !important;
        }
        .blog-article-content strong,
        .blog-article-content b {
          color: #000000 !important;
          font-weight: 700 !important;
        }
        .blog-article-content ul {
          color: #0f172a !important;
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1.5rem !important;
        }
        .blog-article-content ol {
          color: #0f172a !important;
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1.5rem !important;
        }
        .blog-article-content li {
          color: #0f172a !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.7 !important;
        }
        .blog-article-content a {
          color: #2563eb !important;
          text-decoration: underline !important;
          font-weight: 600 !important;
        }
        .blog-article-content a:hover {
          color: #1d4ed8 !important;
        }
        .blog-article-content blockquote {
          color: #0f172a !important;
          border-left: 4px solid #2563eb !important;
          background-color: #f8fafc !important;
          padding: 1rem 1.25rem !important;
          margin: 1.5rem 0 !important;
          border-radius: 0 0.5rem 0.5rem 0 !important;
          font-style: italic !important;
        }
        .blog-article-content code {
          color: #0f172a !important;
          background-color: #f1f5f9 !important;
          padding: 0.2rem 0.4rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.9em !important;
        }
      `}</style>

      {/* Header Sticky com contraste nítido */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link 
            href="/blog" 
            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-2 text-sm sm:text-base transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar para o blog
          </Link>
          <Link 
            href="/" 
            className="text-neutral-600 hover:text-neutral-950 font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
          >
            <Home size={15} />
            <span className="hidden sm:inline">Página Inicial</span>
          </Link>
        </div>
      </header>

      {/* Post Content Container */}
      <article className="container mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16 max-w-4xl">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-neutral-200 bg-white">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto object-contain max-h-[460px] mx-auto"
            />
          </div>
        )}

        {/* Post Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getCategoryColor(post.category)}`}>
              {getCategoryLabel(post.category)}
            </span>
            {post.featured && (
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-amber-100 text-amber-900 border border-amber-300">
                ★ Em Destaque
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-neutral-950 mb-5 tracking-tight leading-tight">
            {typedTitle}
            <span className="inline-block w-1 h-7 sm:h-9 bg-blue-600 ml-1.5 animate-pulse align-middle" />
          </h1>

          {/* Metadata com texto escuro garantido */}
          <div className="flex items-center gap-4 sm:gap-6 text-neutral-700 text-xs sm:text-sm flex-wrap font-medium">
            <span className="flex items-center gap-1.5 text-neutral-900 font-semibold">
              <User size={16} className="text-neutral-700" />
              {post.author.name}
            </span>
            <span className="flex items-center gap-1.5 text-neutral-700">
              <Calendar size={16} className="text-neutral-600" />
              {new Date(post.publishedAt).toLocaleDateString('pt-MZ', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-1.5 text-neutral-800">
              <Eye size={16} className="text-neutral-600" />
              <span className="font-bold text-neutral-950">{post.views || 0}</span> visualizações
            </span>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Tag size={16} className="text-neutral-600" />
              <div className="flex gap-1.5 flex-wrap">
                {post.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="text-xs font-semibold text-neutral-800 bg-neutral-200/80 px-2.5 py-1 rounded-md border border-neutral-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Share Buttons */}
        <div className="mb-8 flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={sharePost}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Copiar link"
          >
            <Share2 size={16} className="text-neutral-700" />
            <span className="hidden sm:inline">Copiar Link</span>
          </button>
          <button
            onClick={shareToFacebook}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Compartilhar no Facebook"
          >
            <Facebook size={16} />
            <span className="hidden sm:inline">Facebook</span>
          </button>
          <button
            onClick={shareToTwitter}
            className="flex items-center gap-2 px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Compartilhar no Twitter"
          >
            <Twitter size={16} />
            <span className="hidden sm:inline">Twitter</span>
          </button>
          <button
            onClick={shareToLinkedIn}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Compartilhar no LinkedIn"
          >
            <Linkedin size={16} />
            <span className="hidden sm:inline">LinkedIn</span>
          </button>
          <button
            onClick={shareToWhatsApp}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Compartilhar no WhatsApp"
          >
            <MessageCircle size={16} />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button
            onClick={() => setScrollRevealEnabled(!scrollRevealEnabled)}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            title={scrollRevealEnabled ? "Mostrar todo o conteúdo" : "Ativar efeito de scroll"}
          >
            {scrollRevealEnabled ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="hidden sm:inline">{scrollRevealEnabled ? "Ver Tudo" : "Scroll Reveal"}</span>
          </button>
        </div>

        {/* Card do Artigo Principal com Fundo Branco e Texto Preto Garantido */}
        <div className="bg-white p-6 sm:p-10 md:p-12 rounded-2xl shadow-sm border border-neutral-200 text-neutral-900 overflow-visible">
          {post.content ? (
            <div ref={contentRef} className="blog-article-content">
              {scrollRevealEnabled ? (
                splitContentIntoSections(post.content).map((section, index) => (
                  <div
                    key={index}
                    data-index={index}
                    className={`scroll-section transition-all duration-700 ease-out mb-6 ${
                      visibleSections.includes(index)
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-8'
                    }`}
                  >
                    {renderFormattedSection(section)}
                  </div>
                ))
              ) : (
                renderFormattedSection(post.content)
              )}
            </div>
          ) : (
            <div className="text-neutral-500 font-medium py-8 text-center">
              Conteúdo não disponível para este artigo.
            </div>
          )}
        </div>

        {/* AdSense Banner Responsivo */}
        <AdSenseBanner className="my-8" />

        {/* Resumo com Cores Fortes e Legíveis */}
        {post.excerpt && (
          <div className="mt-8 p-6 sm:p-7 bg-blue-50/80 rounded-2xl border border-blue-200 shadow-2xs">
            <h3 className="font-bold text-blue-950 text-base sm:text-lg mb-2">Resumo Executivo</h3>
            <p className="text-neutral-900 leading-relaxed text-sm sm:text-base font-normal">{post.excerpt}</p>
          </div>
        )}

        {/* Posts Relacionados com Fundo Branco e Texto Preto */}
        {relatedPosts.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl sm:text-3xl font-black mb-6 text-neutral-950 tracking-tight">Posts Relacionados</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link 
                  key={relatedPost.id} 
                  href={`/blog/${relatedPost.slug}`}
                  onClick={() => incrementClick(relatedPost.slug)}
                  className="bg-white rounded-xl shadow-xs border border-neutral-200 overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all group flex flex-col"
                >
                  {relatedPost.coverImage && (
                    <div className="h-44 overflow-hidden bg-neutral-100">
                      <img 
                        src={relatedPost.coverImage} 
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(relatedPost.category)}`}>
                        {getCategoryLabel(relatedPost.category)}
                      </span>
                      <h3 className="font-bold mt-3 mb-2 text-neutral-950 text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {relatedPost.title}
                      </h3>
                      <p className="text-neutral-700 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                        {relatedPost.excerpt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-600 font-medium">
                      <Eye size={14} className="text-neutral-500" />
                      <span>{relatedPost.views || 0} visualizações</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Barra Branca no Final da Página Inspirada em Voltar ao Topo */}
      <BackToTopBar />
    </div>
  );
}
