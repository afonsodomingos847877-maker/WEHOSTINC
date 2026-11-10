import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { sendWelcomeEmail, sendLoginNotificationEmail } from '@/lib/sendgrid';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { generateNumericCode } from '@/lib/serverAuth';

// Validar configuração do NextAuth
const requiredEnvVars = ['NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('[NextAuth] ❌ VARIÁVEIS DE AMBIENTE FALTANDO:', missingEnvVars);
  console.error('[NextAuth] ⚠️ Google OAuth NÃO funcionará sem estas variáveis');
}

// Validar configuração do Google OAuth antes de inicializar
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;

const isGoogleConfigured = googleClientId && googleClientSecret && 
  googleClientId !== 'your-google-client-id' && 
  googleClientSecret !== 'your-google-client-secret';

if (!isGoogleConfigured) {
  console.error('[NextAuth] ❌ Google OAuth NÃO configurado corretamente');
  console.error('[NextAuth] Verifique GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env.local');
}

// 🔒 Header interno para autenticar chamadas server-side à /api/users
// Evita que o endpoint /api/users seja acessível publicamente por browsers externos
function getInternalHeaders(): Record<string, string> {
  const secret = process.env.NEXTAUTH_SECRET || '';
  return {
    'Content-Type': 'application/json',
    ...(secret ? { 'x-internal-auth': secret } : {}),
  };
}

export const GET = NextAuth({
  providers: [
    GoogleProvider({
      clientId: googleClientId || '',
      clientSecret: googleClientSecret || '',
      authorization: {
        params: {
          // 🔒 Solicitar apenas o mínimo necessário de permissões Google
          scope: 'openid email profile',
        },
      },
      // Ativar PKCE e proteção CSRF State no fluxo OAuth
      checks: ['pkce', 'state'],
    }),
  ],
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account }: any) {
      // 🔒 Verificar se Google OAuth está configurado
      if (!isGoogleConfigured) {
        console.error('[Google OAuth] ❌ Provider não configurado - login negado');
        return false;
      }

      // 🔒 Apenas processar login via Google OAuth
      if (account?.provider !== 'google') return false;

      if (!user.email) {
        console.error('[Google OAuth] ERRO: Email não fornecido pelo Google');
        return false;
      }

      try {
        await connectDB();
        const cleanEmail = (user.email || '').toLowerCase().trim();

        const existingUser = await UserModel.findOne({
          $or: [
            { email: cleanEmail },
            { email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
          ]
        }).lean() as any;

        if (existingUser) {
          console.log('[Google OAuth] Usuário encontrado no MongoDB:', { email: user.email, status: existingUser.status, role: existingUser.role });
          
          // Propagar dados do usuário para o objeto user
          (user as any).id = existingUser.id;
          (user as any).role = existingUser.role || 'user';
          (user as any).plan = existingUser.plan || 'none';
          (user as any).status = existingUser.status || 'active';
          (user as any).dueDate = existingUser.dueDate;
          (user as any).createdAt = existingUser.createdAt;
          
          // Se o usuário for admin/super_admin ou já estiver ativo, permitir login diretamente
          if (existingUser.role === 'admin' || existingUser.role === 'super_admin' || existingUser.status === 'active') {
            console.log('[Google OAuth] Login permitido para utilizador ativo ou admin:', user.email);
            return true;
          }
          
          // Se o usuário estiver pendente, negar login (será tratado no redirect callback)
          if (existingUser.status === 'pending') {
            console.warn('[Google OAuth] Conta pendente de confirmação:', user.email);
            (user as any).needsConfirmation = true;
            return true;
          }
          
          // Para outros status (suspended), negar login
          console.warn('[Google OAuth] Conta com status inválido:', existingUser.status);
          return false;
        }

        // Utilizador novo — criar conta com status pending (requer confirmação)
        console.log('[Google OAuth] Criando novo utilizador Google:', user.email);

        const confirmationCode = generateNumericCode(6);
        const confirmationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const newUser = {
          id: `USER-${Date.now()}`,
          name: user.name || 'Utilizador Google',
          email: cleanEmail,
          plan: 'none' as const,
          status: 'pending' as const,
          role: 'user' as const,
          avatar: user.image,
          createdAt: new Date().toISOString(),
          confirmationCode,
          confirmationCodeExpiresAt,
        };

        await UserModel.create(newUser);
        console.log('[Google OAuth] Utilizador criado com sucesso no MongoDB:', cleanEmail);

        // Enviar email de boas-vindas com código de confirmação
        sendWelcomeEmail(newUser.email, newUser.name, newUser.plan, confirmationCode).catch((err: any) => {
          console.error('[Google OAuth] Erro ao enviar email de boas-vindas:', err);
        });

        (user as any).id = newUser.id;
        (user as any).role = newUser.role;
        (user as any).plan = newUser.plan;
        (user as any).status = newUser.status;
        (user as any).createdAt = newUser.createdAt;
        (user as any).needsConfirmation = true;
        return true;
      } catch (error) {
        console.error('[Google OAuth] ERRO ao processar login:', error instanceof Error ? error.message : 'Erro desconhecido');
        return false;
      }
    },

    async session({ session, token }: any) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.role = token.role || 'user';
        session.user.plan = token.plan || 'none';
        session.user.status = token.status || 'active';
        session.user.dueDate = token.dueDate;
        session.user.createdAt = token.createdAt;
      }
      
      // Enviar notificação de login (apenas na primeira criação de sessão)
      if (session.user && session.user.email && !token.loginNotified) {
        const loginTime = new Date().toLocaleString('pt-PT', { 
          timeZone: 'Africa/Maputo',
          dateStyle: 'full',
          timeStyle: 'long'
        });
        
        sendLoginNotificationEmail(
          session.user.email,
          session.user.name || 'Usuário',
          loginTime
        ).catch((err: any) => {
          console.error('[NextAuth Session] Erro ao enviar notificação de login:', err);
        });
        
        token.loginNotified = true;
      }
      
      return session;
    },

    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id || token.sub;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.needsConfirmation = (user as any).needsConfirmation || false;
        token.role = (user as any).role || 'user';
        token.plan = (user as any).plan || 'none';
        token.status = (user as any).status || 'active';
        token.dueDate = (user as any).dueDate;
        token.createdAt = (user as any).createdAt;
      }

      // Sincronizar role e status com MongoDB Atlas em tempo real
      if (token?.email) {
        try {
          await connectDB();
          const cleanEmail = token.email.toLowerCase().trim();
          const dbUser = await UserModel.findOne({
            $or: [
              { email: cleanEmail },
              { email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
            ]
          }).lean() as any;
          
          console.log('[NextAuth JWT Callback] DB User findOne:', { email: cleanEmail, found: !!dbUser, role: dbUser?.role, status: dbUser?.status });
          
          if (dbUser) {
            token.role = dbUser.role || token.role || 'user';
            token.status = dbUser.status || token.status || 'active';
            token.plan = dbUser.plan || token.plan || 'none';
          }
        } catch (e) {
          console.warn('[NextAuth JWT] Erro ao sincronizar token com MongoDB:', e);
        }
      }

      console.log('[NextAuth JWT Final Token]:', { email: token?.email, role: token?.role, status: token?.status });
      return token;
    },

    // 🔒 Validar callbackUrl para permitir redirecionamentos seguros
    async redirect({ url, baseUrl }: any) {
      // Permitir URLs relativas (ex: /api/auth/redirect-role ou /admin)
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) {
          return url;
        }
      } catch {
        // URL inválida — usar baseUrl
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login?error=OAuthError',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});

export const POST = GET;
