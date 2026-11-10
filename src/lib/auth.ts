import { dataManager } from './data';
import { apiEndpoint } from './siteConfig';
import { sendWelcomeEmail } from './sendgrid';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'none' | 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'pending' | 'suspended';
  dueDate?: number;
  role?: 'super_admin' | 'admin' | 'user';
  avatar?: string;
  referralCode?: string;
  birthdate?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Simulação de banco de dados em localStorage
const STORAGE_KEY = 'wehosthere_auth';

// Utilizador admin padrão (sem credenciais hardcoded no cliente)
const DEFAULT_USERS: Array<User & { password?: string }> = [
  {
    id: 'admin_root',
    name: 'Administrador WEHOSTHERE',
    email: 'admin@wehosthere.com',
    plan: 'enterprise',
    status: 'active',
    role: 'super_admin',
    createdAt: new Date().toISOString()
  }
];

const seedDefaultUsers = () => {
  if (typeof window === 'undefined') return;

  DEFAULT_USERS.forEach((defaultUser) => {
    const key = `user_${defaultUser.id}`;
    if (!localStorage.getItem(key)) {
      // Em desenvolvimento, guardar com senha para permitir login local
      localStorage.setItem(key, JSON.stringify(defaultUser));
    }
  });
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutos

const checkRateLimit = (email: string) => {
  if (typeof window === 'undefined') return;
  const key = `login_attempts_${email.trim().toLowerCase()}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.lockUntil && Date.now() < parsed.lockUntil) {
        const minutesLeft = Math.ceil((parsed.lockUntil - Date.now()) / 60000);
        throw new Error(`Muitas tentativas incorretas de login. Por motivos de segurança, o acesso a esta conta foi bloqueado temporariamente por ${minutesLeft} minuto(s).`);
      }
      if (parsed.lockUntil && Date.now() >= parsed.lockUntil) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('bloqueado')) throw e;
    }
  }
};

const recordFailedAttempt = (email: string, ipAddress?: string, country?: string) => {
  if (typeof window === 'undefined') return;
  const key = `login_attempts_${email.trim().toLowerCase()}`;
  const data = localStorage.getItem(key);
  let count = 1;
  if (data) {
    try {
      const parsed = JSON.parse(data);
      count = (parsed.count || 0) + 1;
    } catch (e) {}
  }
  if (count >= MAX_LOGIN_ATTEMPTS) {
    const lockUntil = Date.now() + LOCK_TIME_MS;
    localStorage.setItem(key, JSON.stringify({ count, lockUntil }));
    try {
      dataManager.addSecurityLog(email, 'account_locked', 'Muitas tentativas incorretas de login. Conta bloqueada temporariamente por 15 minutos.', ipAddress, country);
    } catch {}
  } else {
    localStorage.setItem(key, JSON.stringify({ count }));
    try {
      dataManager.addSecurityLog(email, 'failed_login', `Tentativa de login incorreta (${count}/${MAX_LOGIN_ATTEMPTS}).`, ipAddress, country);
    } catch {}
  }
};

const clearFailedAttempts = (email: string) => {
  if (typeof window === 'undefined') return;
  const key = `login_attempts_${email.trim().toLowerCase()}`;
  localStorage.removeItem(key);
};

// Funcião para obter IP e país do utilizador via API de geolocalização
const getClientLocation = async (): Promise<{ ipAddress: string; country: string }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    // ipapi.co é um serviço de terceiros — apenas o IP público é enviado (necessidade legítima: segurança)
    const res = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        ipAddress: data.ip || '',
        country: data.country_name || ''
      };
    }
  } catch (e) {
    // Silently fail - location is optional
    if (e instanceof Error && e.name !== 'AbortError') {
      console.warn('Não foi possível obter localização do cliente:', e);
    }
  }
  return { ipAddress: '', country: '' };
};

export const auth = {
  // Inicialização de dados padrão
  initDefaults: (): void => {
    seedDefaultUsers();
  },

  // Registrar novo usuário assincronamente (com confirmação garantida no banco de dados do servidor)
  registerAsync: async (name: string, email: string, password: string, plan: 'none' | 'basic' | 'pro' | 'enterprise' = 'none', status: 'active' | 'pending' | 'suspended' = 'pending', dueDate: number = 29, referralCode?: string, inviteToken?: string, birthdate?: string): Promise<User> => {
    console.log('[Register] Iniciando registro para:', email);
    seedDefaultUsers();
    
    // 1. Sincronizar usuários atualizados do servidor para garantir validação global
    console.log('[Register] Buscando usuários do servidor...');
    const users = await auth.fetchUsersAsync();
    console.log('[Register] Usuários buscados:', users.length);
    
    // 2. Verificar se email já existe local ou globalmente
    const targetEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.trim().toLowerCase() === targetEmail);
    if (existing) {
      console.error('[Register] Email já existe:', targetEmail);
      throw new Error('Este endereço de e-mail já está registado na plataforma. Por favor, faça login ou use outro e-mail.');
    }

    // 3. Gerar código de referral único
    const userReferralCode = `WH${email.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Gerar código de confirmação de 6 dígitos com expiração
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const confirmationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email: email.trim(),
      plan,
      status: 'pending', // Sempre cria como pending para requerer confirmação
      dueDate,
      role: 'user',
      referralCode: userReferralCode,
      birthdate: birthdate ? birthdate.trim() : undefined,
      createdAt: new Date().toISOString()
    };

    const userWithPassword = { ...newUser, password, referralCode: userReferralCode, confirmationCode, confirmationCodeExpiresAt, birthdate: birthdate ? birthdate.trim() : undefined };

    console.log('[Register] Enviando dados para API:', { 
      email: newUser.email, 
      plan: newUser.plan, 
      status: newUser.status,
      hasConfirmationCode: !!confirmationCode, 
      codeLength: confirmationCode?.length,
      hasExpiration: !!confirmationCodeExpiresAt,
      expirationDate: confirmationCodeExpiresAt
    });

    // 4. ENVIAR PRIMEIRO PARA O BANCO DE DADOS MONGODB ATLAS (DATABASE-FIRST)
    let savedOnServer = false;
    try {
      const apiUrl = apiEndpoint('/api/users');
      console.log('[Register] URL da API:', apiUrl);
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', user: userWithPassword, referralCode, inviteToken })
      });
      
      console.log('[Register] Resposta da API:', res.status, res.statusText);
      const resData = await res.json();
      console.log('[Register] Dados da resposta:', resData);
      
      if (!res.ok || resData.error) {
        console.error('[Register] Erro na API:', resData.error);
        throw new Error(resData.error || 'Erro ao gravar dados no servidor.');
      }
      savedOnServer = true;
      console.log('[Register] Usuário salvo no servidor com sucesso');
    } catch (err) {
      console.error('[Register] Erro ao salvar no servidor:', err);
      if (err instanceof Error) throw err;
      throw new Error('Não foi possível conectar ao servidor para registar a conta. Por favor, verifique a sua ligação.');
    }

    // 5. Criar registro de referral para o novo usuário
    if (savedOnServer) {
      try {
        dataManager.createReferral(newUser.email, newUser.name);
      } catch (err) {
        console.error('Erro ao criar referral:', err);
      }
    }

    // 5. 🔒 NÃO guardar a password no localStorage - apenas dados seguros
    if (typeof window !== 'undefined') {
      const { password: _pw, confirmationCode: _cc, ...userSafeData } = userWithPassword as any;
      localStorage.setItem(`user_${newUser.id}`, JSON.stringify(userSafeData));
      const currentList = auth.getUsers();
      const updatedList = [...currentList.filter(u => u.id !== newUser.id), newUser];
      localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

      // Enviar email de boas-vindas com código de confirmação
      sendWelcomeEmail(newUser.email, newUser.name, newUser.plan, confirmationCode).catch(err => {
        console.error('Erro ao enviar email de boas-vindas:', err);
      });
    }

    console.log('[Register] Registro concluído com sucesso:', newUser.email);
    return newUser;
  },

  // Registrar novo usuário
  register: (name: string, email: string, password: string, plan: 'none' | 'basic' | 'pro' | 'enterprise' = 'none', status: 'active' | 'pending' | 'suspended' = 'pending', dueDate: number = 29): User => {
    seedDefaultUsers();
    const users = auth.getUsers();
    
    const targetEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.trim().toLowerCase() === targetEmail);
    if (existing) {
      throw new Error('Este endereço de e-mail já está registado na plataforma. Por favor, faça login ou use outro e-mail.');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email: email.trim(),
      plan,
      status,
      dueDate,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    const userWithPassword = { ...newUser, password };

    if (typeof window !== 'undefined') {
      localStorage.setItem(`user_${newUser.id}`, JSON.stringify(userWithPassword));
      const currentList = auth.getUsers();
      const updatedList = [...currentList.filter(u => u.id !== newUser.id), newUser];
      localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

      // Sincronizar com a API do Servidor para aparecer no Admin em qualquer navegador/dispositivo
      fetch(apiEndpoint('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userWithPassword })
      }).catch(err => console.error('Erro de sync no servidor:', err));

      // Enviar email de boas-vindas
      sendWelcomeEmail(newUser.email, newUser.name, newUser.plan).catch(err => {
        console.error('Erro ao enviar email de boas-vindas:', err);
      });
    }

    return newUser;
  },


  // Login assíncrono (database-first - valida sempre no MongoDB Atlas)
  loginAsync: async (email: string, password: string): Promise<User> => {
    seedDefaultUsers();
    checkRateLimit(email);
    
    // Obter localização do cliente (IP e país)
    const { ipAddress, country } = await getClientLocation();
    
    // 1. 🔒 VALIDAÇÃO NO SERVIDOR (MongoDB Atlas) - Database First sempre
    let serverUser: User | null = null;
    try {
      const res = await fetch(apiEndpoint('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password, ipAddress, country })
      });
      
      const resData = await res.json();
      
      if (!res.ok) {
        // Erro do servidor (usuário não encontrado, senha incorreta, conta suspensa, etc)
        recordFailedAttempt(email, ipAddress, country);
        checkRateLimit(email);
        throw new Error(resData.error || 'Erro ao validar credenciais no servidor.');
      }
      
      if (resData.success && resData.user) {
        serverUser = resData.user;
      }
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      // Se houver erro de conexão e local também falhou, lançar erro
      console.warn('Erro de conexão ao validar login no servidor:', err);
      recordFailedAttempt(email, ipAddress, country);
      checkRateLimit(email);
      throw new Error('Credenciais inválidas. Verifique seu email e senha.');
    }

    // 3. Se validou no servidor com sucesso, usar esses dados
    if (serverUser) {
      clearFailedAttempts(email);
      
      // Salvar sessão (sem password)
      const { password: _pw, ...serverUserSafe } = serverUser as any;
      const session = { user: serverUserSafe };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        // 🔒 Atualizar cache local com dados do servidor — SEM password
        localStorage.setItem(`user_${serverUser.id}`, JSON.stringify(serverUserSafe));
      }
      
      return serverUserSafe;
    }

    // Se chegou aqui, credenciais inválidas
    recordFailedAttempt(email, ipAddress, country);
    checkRateLimit(email);
    throw new Error('Credenciais inválidas. Verifique seu email e senha.');
  },

  // Login síncrono (fallback)
  login: (email: string, password: string): User => {
    seedDefaultUsers();
    checkRateLimit(email);
    const users = auth.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      recordFailedAttempt(email);
      checkRateLimit(email);
      throw new Error('Usuário não encontrado');
    }

    let userData: any = user;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`user_${user.id}`);
      if (stored) {
        userData = JSON.parse(stored);
      }
    }

    if (userData.password && userData.password !== password) {
      recordFailedAttempt(email);
      checkRateLimit(email);
      throw new Error('Senha incorreta');
    }

    if (userData.status === 'suspended') {
      throw new Error('Sua conta encontra-se suspensa por questões de faturação ou incumprimento dos termos. Por favor, entre em contacto com o suporte WEHOSTHERE (+258 84 833 5618).');
    }

    clearFailedAttempts(email);

    // Salvar sessão
    const session = { user: userData };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    return userData;
  },


  // Logout Completo & Seguro de todos os sistemas (LocalStorage, SessionStorage, Cookies e NextAuth)
  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      // 1. Limpar sessão principal de autenticação e contas ativas
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('wehost_active_webmail_account');
      localStorage.removeItem('webmail_account');
      localStorage.removeItem('wehosthere_impersonated_user');

      // 2. Limpar todo o SessionStorage (impersonações, modo preview de admin, caches temporários)
      try {
        sessionStorage.removeItem('wehosthere_impersonated_user');
        sessionStorage.removeItem('wehosthere_view_as_client');
        sessionStorage.removeItem('wehosthere_original_admin');
        sessionStorage.clear();
      } catch (e) {}

      // 3. Limpeza exaustiva de todos os cookies no navegador em vários paths
      try {
        const cookies = document.cookie.split(';');
        const paths = ['/', '/admin', '/dashboard', '/api', '/webmail'];
        const domain = window.location.hostname;
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name) {
            paths.forEach(p => {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${p};`;
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${p}; domain=${domain};`;
            });
          }
        }
      } catch (e) {}

      // 4. Invalidar sessões do servidor (NextAuth + Cookie de sessão próprio)
      try {
        await Promise.allSettled([
          fetch('/api/auth/logout', { method: 'POST' }),
          fetch('/api/auth/signout', { method: 'POST' })
        ]);
      } catch (e) {}

      // 5. Notificar todos os componentes e abas ativas
      try {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('wehost_auth_change', { detail: { user: null } }));
      } catch (e) {}
    }
  },

  // Obter usuário atual (com suporte a modo de visualização como cliente)
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    // Se estiver em modo de personificação / visualização de cliente:
    const impersonated = sessionStorage.getItem('wehosthere_impersonated_user');
    if (impersonated) {
      try {
        return JSON.parse(impersonated);
      } catch (e) {}
    }
    const session = localStorage.getItem(STORAGE_KEY);
    if (!session) return null;
    try {
      const parsed = JSON.parse(session);
      return parsed.user || null;
    } catch (e) {
      return null;
    }
  },

  // Ativar modo de visualização como cliente (impersonar cliente específico ou próprio admin como cliente)
  startClientView: (targetUser?: User): void => {
    if (typeof window === 'undefined') return;
    const session = localStorage.getItem(STORAGE_KEY);
    let originalAdmin: User | null = null;
    if (session) {
      try {
        originalAdmin = JSON.parse(session).user || null;
      } catch (e) {}
    }
    if (originalAdmin) {
      sessionStorage.setItem('wehosthere_original_admin', JSON.stringify(originalAdmin));
    }
    if (targetUser) {
      sessionStorage.setItem('wehosthere_impersonated_user', JSON.stringify({ ...targetUser, role: 'user' }));
    } else if (originalAdmin) {
      sessionStorage.setItem('wehosthere_impersonated_user', JSON.stringify({ ...originalAdmin, role: 'user' }));
    }
    sessionStorage.setItem('wehosthere_view_as_client', 'true');
  },

  // Encerrar modo de visualização como cliente e retornar ao Admin
  stopClientView: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('wehosthere_impersonated_user');
    sessionStorage.removeItem('wehosthere_view_as_client');
  },

  // Verificar se está em modo de visualização como cliente
  isClientViewActive: (): boolean => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('wehosthere_view_as_client') === 'true';
  },

  // Obter o usuário real autenticado (mesmo se estiver personificando outro cliente)
  getActualUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem(STORAGE_KEY);
    if (!session) return null;
    try {
      const parsed = JSON.parse(session);
      return parsed.user || null;
    } catch (e) {
      return null;
    }
  },

  // Helper: Super Admin (acesso total)
  isSuperAdmin: (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'super_admin' || user.email.toLowerCase() === 'admin@wehosthere.com';
  },

  // Helper: Admin comum (acesso limitado) ou Super Admin
  isAdminUser: (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'admin' || user.email.toLowerCase() === 'admin@wehosthere.com';
  },

  // Helper: permissões do admin (o que cada role pode fazer)
  getAdminPermissions: (user: User | null): {
    canManageRoles: boolean;
    canAccessFinances: boolean;
    canAccessSecurityLogs: boolean;
    canAccessNewsletter: boolean;
    canAccessSystemSettings: boolean;
    canManageClients: boolean;
    canManageOrders: boolean;
    canManageTickets: boolean;
    canManageSites: boolean;
    canManageAcademy: boolean;
  } => {
    const isSuperAdmin = auth.isSuperAdmin(user);
    const isAdmin = auth.isAdminUser(user);
    return {
      canManageRoles: isSuperAdmin,
      canAccessFinances: isSuperAdmin,
      canAccessSecurityLogs: isSuperAdmin,
      canAccessNewsletter: isSuperAdmin,
      canAccessSystemSettings: isSuperAdmin,
      canManageClients: isAdmin,
      canManageOrders: isAdmin,
      canManageTickets: isAdmin,
      canManageSites: isAdmin,
      canManageAcademy: isAdmin,
    };
  },


  // Verificar se está autenticado
  isAuthenticated: (): boolean => {
    return auth.getCurrentUser() !== null;
  },

  // Obter todos os usuários (com persistência garantida)
  getUsers: (): User[] => {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    seedDefaultUsers();

    const userMap = new Map<string, User>();
    DEFAULT_USERS.forEach(u => userMap.set(u.id, u));

    const storedList = localStorage.getItem('wehosthere_all_users');
    if (storedList) {
      try {
        const parsed: User[] = JSON.parse(storedList);
        parsed.forEach(u => {
          if (u && u.id) userMap.set(u.id, u);
        });
      } catch (e) {}
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('user_')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key) || '{}');
          if (userData && userData.id) {
            userMap.set(userData.id, userData);
          }
        } catch (e) {}
      }
    }

    const allUsers = Array.from(userMap.values());
    localStorage.setItem('wehosthere_all_users', JSON.stringify(allUsers));
    return allUsers;
  },

  // Buscar usuários do servidor via API e atualizar LocalStorage
  fetchUsersAsync: async (): Promise<User[]> => {
    try {
      // 🔒 Adicionar header de autorização interna para aceder ao endpoint protegido
      const internalSecret = typeof window === 'undefined'
        ? (process.env.NEXTAUTH_SECRET || '')
        : ''; // No browser não há acesso a NEXTAUTH_SECRET

      const headers: Record<string, string> = {};
      if (internalSecret) {
        headers['x-internal-auth'] = internalSecret;
      }

      const res = await fetch(apiEndpoint('/api/users'), { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          const serverUsers: User[] = data.users;
          const localUsers = auth.getUsers();
          
          const localMap = new Map<string, User>();
          localUsers.forEach(u => localMap.set(u.id, u));

          const serverKeySet = new Set(serverUsers.map(u => u.id));

          // 1. Atualizar lista com usuários do servidor (MongoDB Atlas é a fonte da verdade)
          const updatedUsers: User[] = serverUsers.map(serverUser => {
            const localMatch = localMap.get(serverUser.id) || Array.from(localMap.values()).find(l => l.email.trim().toLowerCase() === serverUser.email.trim().toLowerCase());
            const role = serverUser.role || localMatch?.role || 'user';
            const status = serverUser.status || localMatch?.status || 'active';
            const plan = serverUser.plan || localMatch?.plan || 'none';
            const merged: User = {
              ...(localMatch || {}),
              ...serverUser,
              role,
              status,
              plan
            };
            if (typeof window !== 'undefined') {
              localStorage.setItem(`user_${serverUser.id}`, JSON.stringify(merged));
            }
            return merged;
          });

          // 2. Preservar apenas usuários criados muito recentemente (< 15s) que ainda não chegaram ao servidor
          localUsers.forEach(localUser => {
            if (!serverKeySet.has(localUser.id) && !serverKeySet.has(localUser.email.toLowerCase())) {
              const createdAtTime = new Date(localUser.createdAt || '').getTime();
              const isJustCreated = !isNaN(createdAtTime) && (Date.now() - createdAtTime < 15000);
              if (isJustCreated) {
                updatedUsers.push(localUser);

                fetch(apiEndpoint('/api/users'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'register', user: localUser })
                }).catch(() => {});
              }
            }
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedUsers));
          }
          return updatedUsers;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar usuários da API:', e);
    }
    return auth.getUsers();
  },

  // Atualizar plano do usuário
  updatePlan: (userId: string, plan: 'none' | 'basic' | 'pro' | 'enterprise'): void => {
    if (typeof window === 'undefined') return;
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    userData.plan = plan;
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));

    const currentList = auth.getUsers();
    const updatedList = currentList.map(u => u.id === userId ? { ...u, plan } : u);
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_plan', userId, plan })
    }).catch(err => console.error('Erro de sync de plano:', err));

    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user.id === userId) {
          parsed.user.plan = plan;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  },

  // Atualizar status do usuário (Ativo, Pendente, Suspenso)
  updateUserStatus: (userId: string, status: 'active' | 'pending' | 'suspended'): void => {
    if (typeof window === 'undefined') return;
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    userData.status = status;
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));

    if (userData.email) {
      clearFailedAttempts(userData.email);
    }

    const currentList = auth.getUsers();
    const updatedList = currentList.map(u => u.id === userId ? { ...u, status } : u);
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', userId, email: userData.email, status })
    }).catch(err => console.error('Erro de sync de status:', err));

    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user.id === userId) {
          parsed.user.status = status;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  },

  // Atualizar dia de vencimento do usuário (ex: Dia 29)
  updateUserDueDate: (userId: string, dueDate: number): void => {
    if (typeof window === 'undefined') return;
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    userData.dueDate = dueDate;
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));

    const currentList = auth.getUsers();
    const updatedList = currentList.map(u => u.id === userId ? { ...u, dueDate } : u);
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_due_date', userId, email: userData.email, dueDate })
    }).catch(err => console.error('Erro de sync de dueDate:', err));

    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user.id === userId) {
          parsed.user.dueDate = dueDate;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  },

  // Atualizar avatar do usuário
  updateUserAvatar: (userId: string, avatarUrl: string): void => {
    if (typeof window === 'undefined') return;
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    userData.avatar = avatarUrl;
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));

    const currentList = auth.getUsers();
    const updatedList = currentList.map(u => u.id === userId ? { ...u, avatar: avatarUrl } : u);
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_avatar', userId, avatar: avatarUrl })
    }).catch(err => console.error('Erro de sync de avatar:', err));

    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user.id === userId) {
          parsed.user.avatar = avatarUrl;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  },

  // Atualizar função/role do usuário (user | admin | super_admin) - Database First
  updateUserRole: async (userId: string, role: 'user' | 'admin' | 'super_admin', userEmail?: string, requestedByEmail?: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    const users = auth.getUsers();
    let userData = users.find(u => u.id === userId || (userEmail && u.email.toLowerCase() === userEmail.toLowerCase()));
    const targetEmail = userEmail || userData?.email || '';

    try {
      const currentUser = auth.getActualUser() || auth.getCurrentUser();
      const requester = requestedByEmail || currentUser?.email || 'admin@wehosthere.com';

      // 1. Gravar primeiro no banco de dados MongoDB Atlas (Database-First)
      const res = await fetch(apiEndpoint('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_role', 
          userId, 
          email: targetEmail, 
          role, 
          requestedByEmail: requester 
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error('Falha ao atualizar cargo no MongoDB Atlas:', data?.error || res.statusText);
        return false;
      }

      // 2. Com a gravação no MongoDB Atlas confirmada, atualizar o cache local
      if (userData) {
        userData.role = role;
        if (role === 'admin' || role === 'super_admin') {
          userData.status = 'active';
          userData.plan = 'enterprise';
        }
        localStorage.setItem(`user_${userData.id}`, JSON.stringify(userData));
      }
      if (userId) {
        const stored = localStorage.getItem(`user_${userId}`);
        if (stored) {
          try {
            const p = JSON.parse(stored);
            p.role = role;
            if (role === 'admin' || role === 'super_admin') {
              p.status = 'active';
              p.plan = 'enterprise';
            }
            localStorage.setItem(`user_${userId}`, JSON.stringify(p));
          } catch {}
        }
      }

      if (data.users && Array.isArray(data.users)) {
        localStorage.setItem('wehosthere_all_users', JSON.stringify(data.users));
      } else {
        const currentList = auth.getUsers();
        const updatedList = currentList.map(u =>
          (u.id === userId || (targetEmail && u.email.toLowerCase() === targetEmail.toLowerCase()))
            ? { ...u, role, ...(role === 'admin' || role === 'super_admin' ? { status: 'active' as const, plan: 'enterprise' } : {}) }
            : u
        );
        localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));
      }

      // 3. Se o utilizador promovido for o utilizador atualmente logado, atualizar a sessão em tempo real
      const currentSession = auth.getActualUser();
      if (currentSession && (currentSession.id === userId || (targetEmail && currentSession.email?.toLowerCase() === targetEmail.toLowerCase()))) {
        const updatedSession = {
          ...currentSession,
          role,
          ...(role === 'admin' || role === 'super_admin' ? { status: 'active' as const, plan: 'enterprise' } : {})
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updatedSession }));
      }

      return true;
    } catch (err) {
      console.error('Erro ao comunicar com o servidor para atualizar cargo:', err);
      return false;
    }
  },

  // Eliminar usuário
  deleteUser: (userId: string, userEmail?: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`user_${userId}`);

    const targetEmail = userEmail?.toLowerCase();
    const currentList = auth.getUsers();
    const updatedList = currentList.filter(
      u => u.id !== userId && (!targetEmail || u.email.toLowerCase() !== targetEmail)
    );
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', userId, userEmail: targetEmail })
    }).catch(err => console.error('Erro ao eliminar usuário no servidor:', err));

    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user.id === userId || (targetEmail && parsed.user.email?.toLowerCase() === targetEmail)) {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {}
    }
  },

  // Atualizar senha do usuário
  updatePassword: (email: string, newPassword: string): void => {
    if (typeof window === 'undefined') return;
    const users = auth.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const userData: any = JSON.parse(localStorage.getItem(`user_${user.id}`) || '{}');
    userData.password = newPassword;
    localStorage.setItem(`user_${user.id}`, JSON.stringify(userData));

    const updatedList = users.map(u => u.id === user.id ? { ...u, password: newPassword } : u);
    localStorage.setItem('wehosthere_all_users', JSON.stringify(updatedList));

    // Sync with server
    fetch(apiEndpoint('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_password', userId: user.id, email: user.email, password: newPassword })
    }).catch(err => console.error('Erro ao sincronizar senha com servidor:', err));
  },

  // Administrador define ou redefine senha de um utilizador diretamente no servidor
  adminSetUserPassword: async (userId: string, userEmail: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch(apiEndpoint('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_password', userId, email: userEmail, password: newPassword })
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

};

