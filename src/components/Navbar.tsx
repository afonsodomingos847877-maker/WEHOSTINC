'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, LayoutDashboard, LogOut, User as UserIcon, LogIn, UserPlus } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import LanguageSelector from '@/components/LanguageSelector';
import Toast from '@/components/Toast';
import { useLanguage } from '@/context/LanguageContext';
import { auth, User } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const { t } = useLanguage();
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
      {isLoggingOut && <PageLoader text="A encerrar a sua sessão com segurança..." />}
      {showLogoutToast && (
        <Toast
          type="success"
          title="Sessão Encerrada"
          message="A sua conta foi desvinculada com segurança. Até breve!"
          onClose={() => setShowLogoutToast(false)}
          duration={4000}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-15">
          
          {/* Logo */}
          <BrandLogo onClick={closeMobileMenu} />

          {/* Desktop Navigation Links (Apple-inspired clean spacing & minimalist typography) */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 xl:space-x-10">
            <Link 
              href="/#planos" 
              className="text-[13px] font-normal text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.plans')}
            </Link>
            <Link 
              href="/#criacao-sites" 
              className="text-[13px] font-normal text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
            >
              Sites
            </Link>
            <Link 
              href="/academy" 
              className="text-[13px] font-normal text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
            >
              Cursos
            </Link>
            <Link 
              href="/systems" 
              className="text-[13px] font-normal text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.systems')}
            </Link>
            <Link 
              href="/revista" 
              className="text-[13px] font-normal text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
            >
              Revista
            </Link>
            <Link 
              href="/#recursos" 
              className="text-[13px] font-normal text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.resources')}
            </Link>
            <Link 
              href="/#contacto" 
              className="text-[13px] font-normal text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.contact')}
            </Link>
          </nav>

          {/* Desktop CTA Action Buttons */}
          <div className="hidden md:flex items-center space-x-2.5 lg:space-x-3 shrink-0">
            <LanguageSelector />

            {user ? (
              <>
                <div className="flex items-center space-x-1.5 lg:space-x-2">
                  {user.avatar && (
                    <div className="relative group cursor-pointer shrink-0">
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-primary-200 hover:border-primary-400 transition"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <UserIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                  )}
                  <Link
                    href={auth.isAdminUser(user) ? '/admin' : '/dashboard'}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-[12px] rounded-full shadow-sm hover:shadow transition flex items-center space-x-1.5 whitespace-nowrap shrink-0"
                    title={auth.isAdminUser(user) ? t('nav.admin') : t('nav.dashboard')}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
                    <span>{auth.isAdminUser(user) ? t('nav.admin_short') : t('nav.dashboard_short')}</span>
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition cursor-pointer border border-gray-200 shrink-0"
                  title="Sair da Conta"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100/80 rounded-full transition-all whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5 text-gray-500 group-hover:text-primary-600 transition-colors" />
                  <span>{t('nav.login')}</span>
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-[13px] font-medium rounded-full shadow-sm hover:shadow transition-all whitespace-nowrap shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                  <span>{t('nav.register')}</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center space-x-1 sm:space-x-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-lg px-3 sm:px-4 pt-2 sm:pt-3 pb-4 sm:pb-6 space-y-3 sm:space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1.5 sm:space-y-2">
            <Link
              href="#planos"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              {t('nav.plans')}
            </Link>
            <Link
              href="/#criacao-sites"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              Sites
            </Link>
            <Link
              href="/academy"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              Cursos
            </Link>
            <Link
              href="/systems"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              {t('nav.systems')}
            </Link>
            <Link
              href="/revista"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              Revista
            </Link>
            <Link
              href="#recursos"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              {t('nav.resources')}
            </Link>
            <Link
              href="#contacto"
              onClick={closeMobileMenu}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-gray-800 hover:bg-primary-50 hover:text-primary-600 transition"
            >
              {t('nav.contact')}
            </Link>
          </nav>

          <div className="pt-2 sm:pt-2.5 border-t border-gray-100 flex flex-col space-y-2 sm:space-y-2.5">
            {user ? (
              <>
                {user.avatar ? (
                  <div className="flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">{t('nav.dashboard')}:</p>
                      <p className="text-xs sm:text-sm text-gray-900 font-bold truncate">{user.name}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 rounded-xl border border-gray-200 text-[10px] sm:text-xs text-gray-600 font-medium truncate">
                    {t('nav.dashboard')}: <strong className="text-gray-900 font-bold block">{user.email}</strong>
                  </div>
                )}
                <Link
                  href={auth.isAdminUser(user) ? '/admin' : '/dashboard'}
                  onClick={closeMobileMenu}
                  className="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md transition flex items-center justify-center space-x-1.5 sm:space-x-2"
                >
                  <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{auth.isAdminUser(user) ? t('nav.admin') : t('nav.dashboard')}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-gray-600" />
                  <span>{t('nav.login')}</span>
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md transition flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-white" />
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
