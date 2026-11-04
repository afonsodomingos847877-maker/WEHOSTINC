'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, LayoutDashboard, LogOut, User as UserIcon, LogIn, UserPlus, Sun, Moon } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import LanguageSelector from '@/components/LanguageSelector';
import Toast from '@/components/Toast';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { soundEffects } from '@/lib/soundEffects';
import { auth, User } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);

  useEffect(() => {
    // Verificar se acabou de fazer logout via URL ou sessionStorage
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('logged_out') === '1' || sessionStorage.getItem('wehost_logout_feedback') === 'true') {
          sessionStorage.removeItem('wehost_logout_feedback');
          setShowLogoutToast(true);
          const url = new URL(window.location.href);
          url.searchParams.delete('logged_out');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      }
    } catch (_) {}

    const syncUser = () => {
      // 1. Tentar NextAuth
      if (session?.user) {
        const nextAuthUser: User = {
          id: (session.user as any)?.id || session.user.email || '',
          name: session.user.name || '',
          email: session.user.email || '',
          plan: (session.user as any)?.plan || 'none',
          status: (session.user as any)?.status || 'active',
          role: (session.user as any)?.role || 'user',
          avatar: session.user.image || undefined,
          createdAt: new Date().toISOString()
        };
        setUser(nextAuthUser);
        return;
      }

      // 2. Tentar Auth local
      setUser(auth.getCurrentUser());
    };

    syncUser();

    // Ouvir alterações de sessão/storage em tempo real
    const handleAuthChange = () => syncUser();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('wehost_auth_change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('wehost_auth_change', handleAuthChange);
    };
  }, [session]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleToggleTheme = () => {
    try {
      soundEffects.playClickSound();
    } catch (_) {}
    toggleTheme();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await auth.logout();
    setUser(null);
    closeMobileMenu();
    try {
      await signOut({ redirect: false });
    } catch (_) {}
    setTimeout(() => {
      setShowLogoutToast(true);
      router.push('/');
      setIsLoggingOut(false);
    }, 300);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-black/85 backdrop-blur-md border-b border-gray-100/90 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_5px_rgba(0,0,0,0.6)] transition-colors duration-300">
      {isLoggingOut && <PageLoader text="A encerrar a sua sessão com segurança..." />}
      {showLogoutToast && (
        <Toast
          type="success"
          title="Sessão Encerrada"
          message="A sua conta foi desvinculada com segurança. Até breve!"
          onClose={() => setShowLogoutToast(false)}
          duration={3800}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-13 sm:h-14">
          
          {/* Logo */}
          <BrandLogo onClick={closeMobileMenu} dark={theme === 'dark'} />

          {/* Desktop Navigation Links (Apple-inspired delicate typography & spacious layout) */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 xl:space-x-10">
            <Link 
              href="/#planos" 
              className="text-[11.5px] lg:text-[12px] font-normal text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white tracking-tight transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.plans')}
            </Link>
            <Link 
              href="/#criacao-sites" 
              className="text-[11.5px] lg:text-[12px] font-normal text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white tracking-tight transition-colors whitespace-nowrap shrink-0"
            >
              Sites
            </Link>
            <Link 
              href="/academy" 
              className="text-[11.5px] lg:text-[12px] font-normal text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white tracking-tight transition-colors whitespace-nowrap shrink-0"
            >
              Cursos
            </Link>
            <Link 
              href="/systems" 
              className="text-[11.5px] lg:text-[12px] font-normal text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white tracking-tight transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.systems')}
            </Link>
            <Link 
              href="/revista" 
              className="text-[11.5px] lg:text-[12px] font-normal text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white tracking-tight transition-colors whitespace-nowrap shrink-0"
            >
              Revista
            </Link>
            <Link 
              href="/#recursos" 
              className="text-[11.5px] lg:text-[12px] font-normal text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white tracking-tight transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.resources')}
            </Link>
            <Link 
              href="/#contacto" 
              className="text-[11.5px] lg:text-[12px] font-normal text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white tracking-tight transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.contact')}
            </Link>
          </nav>

          {/* Desktop CTA Action Buttons */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-2.5 shrink-0">
            {/* Seletor de Idioma */}
            <LanguageSelector />

            {/* Botão de Alternar Modo Claro / Modo Escuro (Apple Style) */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-1 sm:p-1.5 rounded-lg text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200/80 dark:border-white/10 transition-all cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Mudar para Modo Claro (☀️)' : 'Mudar para Modo Escuro (🌙)'}
              aria-label="Alternar tema claro/escuro"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-gray-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {user ? (
              <>
                <div className="flex items-center space-x-1.5 lg:space-x-2">
                  {user.avatar && (
                    <div className="relative group cursor-pointer shrink-0">
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full object-cover border-2 border-primary-200 dark:border-primary-500 hover:border-primary-400 transition"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <UserIcon className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                  <Link
                    href={auth.isAdminUser(user) ? '/admin' : '/dashboard'}
                    className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white font-medium text-[11px] rounded-full shadow-sm hover:shadow transition flex items-center space-x-1 whitespace-nowrap shrink-0"
                    title={auth.isAdminUser(user) ? t('nav.admin') : t('nav.dashboard')}
                  >
                    <LayoutDashboard className="h-3 w-3 shrink-0" />
                    <span>{auth.isAdminUser(user) ? t('nav.admin_short') : t('nav.dashboard_short')}</span>
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition cursor-pointer border border-gray-200 dark:border-white/10 shrink-0"
                  title="Sair da Conta"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] lg:text-[12px] font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-full transition-all whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-3 h-3 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-white transition-colors" />
                  <span>{t('nav.login')}</span>
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-600 hover:bg-primary-700 dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-95 text-white text-[11.5px] lg:text-[12px] font-medium rounded-full shadow-sm hover:shadow transition-all whitespace-nowrap shrink-0"
                >
                  <UserPlus className="w-3 h-3 text-white" />
                  <span>{t('nav.register')}</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger & Theme Button */}
          <div className="flex md:hidden items-center space-x-1 sm:space-x-1.5">
            <LanguageSelector />
            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 border border-gray-200/80 dark:border-white/10 transition"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800 dark:text-gray-200" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800 dark:text-gray-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-white/10 bg-white/98 dark:bg-black/95 backdrop-blur-lg px-3 sm:px-4 pt-2 sm:pt-3 pb-4 sm:pb-6 space-y-3 sm:space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1.5 sm:space-y-2">
            <Link
              href="#planos"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-white/10 hover:text-primary-600 transition"
            >
              {t('nav.plans')}
            </Link>
            <Link
              href="/#criacao-sites"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-white/10 hover:text-primary-600 transition"
            >
              Sites
            </Link>
            <Link
              href="/academy"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-white/10 hover:text-primary-600 transition"
            >
              Cursos
            </Link>
            <Link
              href="/systems"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-white/10 hover:text-primary-600 transition"
            >
              {t('nav.systems')}
            </Link>
            <Link
              href="/revista"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-white/10 hover:text-primary-600 transition"
            >
              Revista
            </Link>
            <Link
              href="#recursos"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-white/10 hover:text-primary-600 transition"
            >
              {t('nav.resources')}
            </Link>
            <Link
              href="#contacto"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-white/10 hover:text-primary-600 transition"
            >
              {t('nav.contact')}
            </Link>
          </nav>

          <div className="pt-2 sm:pt-2.5 border-t border-gray-100 dark:border-white/10 flex flex-col space-y-2 sm:space-y-2.5">
            {user ? (
              <>
                {user.avatar ? (
                  <div className="flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-primary-200 dark:border-primary-500 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{t('nav.dashboard')}:</p>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-bold truncate">{user.name}</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 sm:px-4 py-1.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 font-medium truncate">
                    {t('nav.dashboard')}: <strong className="text-gray-900 dark:text-white font-bold block">{user.email}</strong>
                  </div>
                )}
                <Link
                  href={auth.isAdminUser(user) ? '/admin' : '/dashboard'}
                  onClick={closeMobileMenu}
                  className="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{auth.isAdminUser(user) ? t('nav.admin') : t('nav.dashboard')}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/40 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="w-full text-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  <span>{t('nav.login')}</span>
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="w-full text-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                  <span>{t('nav.register')}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
