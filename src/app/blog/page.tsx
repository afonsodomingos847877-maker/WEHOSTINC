'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, Tag, ArrowRight, Search, Home } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: { name: string };
  category: string;
  tags: string[];
  publishedAt: string;
  views: number;
  featured: boolean;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);

  const categories = ['all', 'news', 'tutorial', 'announcement', 'update', 'feature'];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/blog/posts?status=published&limit=20');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts || []);
        setFeaturedPosts((data.posts || []).filter((p: BlogPost) => p.featured));
      }
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = (post.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-neutral-700 font-semibold text-sm">Carregando artigos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 antialiased selection:bg-blue-100 selection:text-neutral-950">
      {/* Header com Gradiente */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10 sm:py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Link
              href="/"
              className="text-xs sm:text-sm text-blue-100 hover:text-white font-bold flex items-center gap-1.5 transition-colors"
            >
              <Home size={15} />
              <span>← Voltar ao Início</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black mb-2 sm:mb-3 tracking-tight">Blog WEHOSTHERE</h1>
          <p className="text-sm sm:text-base md:text-xl text-blue-100 font-medium max-w-2xl">
            Notícias, tutoriais práticos e atualizações sobre hospedagem de alta performance e tecnologia empresarial.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por artigos, tutoriais ou palavras-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white text-neutral-950 placeholder-neutral-400 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base font-medium shadow-2xs transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all text-xs sm:text-sm cursor-pointer shadow-2xs ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-blue-500/20'
                    : 'bg-white text-neutral-800 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                {category === 'all' ? 'Todos' : getCategoryLabel(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && selectedCategory === 'all' && !searchTerm && (
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-5 text-neutral-950 tracking-tight flex items-center gap-2">
              <span>★</span> Artigos em Destaque
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                  <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 overflow-hidden group-hover:shadow-lg group-hover:border-neutral-300 transition-all flex flex-col h-full">
                    {post.coverImage && (
                      <div className="h-48 sm:h-56 overflow-hidden bg-neutral-100">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
                            {getCategoryLabel(post.category)}
                          </span>
                          <span className="text-xs text-neutral-600 font-medium flex items-center gap-1">
                            <Calendar size={13} />
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-MZ') : ''}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 text-neutral-950 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-neutral-700 mb-4 line-clamp-3 text-sm leading-relaxed font-normal">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                        <span className="text-xs text-neutral-700 font-semibold flex items-center gap-1.5">
                          <User size={13} className="text-neutral-500" />
                          {post.author?.name || 'WEHOSTHERE'}
                        </span>
                        <span className="text-blue-600 font-bold text-xs sm:text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Ler Artigo <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-950 tracking-tight">
              {selectedCategory === 'all' ? 'Todos os Artigos' : getCategoryLabel(selectedCategory)}
            </h2>
            <span className="text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-200/80 px-3 py-1 rounded-full border border-neutral-300">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'artigo' : 'artigos'}
            </span>
          </div>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-8 shadow-xs">
              <p className="text-neutral-600 font-medium text-base">Nenhum artigo encontrado para o termo pesquisado.</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                  <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 overflow-hidden group-hover:shadow-md group-hover:border-neutral-300 transition-all flex flex-col h-full">
                    {post.coverImage && (
                      <div className="h-44 overflow-hidden bg-neutral-100">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
                            {getCategoryLabel(post.category)}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold mb-2 text-neutral-950 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-neutral-700 mb-4 line-clamp-3 text-xs sm:text-sm leading-relaxed font-normal">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs text-neutral-600">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar size={12} className="text-neutral-500" />
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-MZ') : ''}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-neutral-800">
                          <User size={12} className="text-neutral-500" />
                          {post.author?.name || 'WEHOSTHERE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
