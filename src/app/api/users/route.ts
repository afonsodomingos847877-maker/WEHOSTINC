import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import { addAdminNotification, dispatchMessage } from '@/lib/notifications';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import bcrypt from 'bcryptjs';
import { sendAccountDeletionEmail, sendRoleChangeEmail } from '@/lib/sendgrid';
import { getSessionUser, hasValidInternalAuth, isAdminRole, requireAdmin, requireAuth, setSessionCookie } from '@/lib/serverAuth';
import { DomainInvitation } from '@/models/DomainInvitation';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import EmailAccountModel from '@/lib/models/EmailAccount';
import SiteModel from '@/lib/models/Site';
import Affiliate from '@/lib/models/Affiliate';
import AffiliateEvent, { buildAnonymizedVisitorLabel } from '@/lib/models/AffiliateEvent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function buildUserFilter(targetId?: string, targetEmail?: string) {
  const cleanId = String(targetId || '').trim();
  const cleanEmail = String(targetEmail || '').trim().toLowerCase();
  const orConditions: any[] = [];

  if (cleanEmail) {
    orConditions.push({ email: cleanEmail });
    orConditions.push({ email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
  }

  if (cleanId) {
    orConditions.push({ id: cleanId });
    orConditions.push({ id: cleanId.toLowerCase() });
    orConditions.push({ id: cleanId.toUpperCase() });
    if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      try {
        orConditions.push({ _id: new mongoose.Types.ObjectId(cleanId) });
      } catch {}
    }
  }

  return orConditions.length > 0 ? { $or: orConditions } : { id: '___non_existent___' };
}

const DEFAULT_ADMIN_HASH = '$2a$12$uKp3eU0f.E8ZTuQJg2B3K.Ekqb7BqmPLoHdwmdu7pmtdIeUGaq7wG';

// Fallback in-memory para quando MongoDB não estiver acessível (dev local sem rede)
let FALLBACK_USERS: any[] = [
  {
    id: 'admin_root',
    name: 'Administrador WEHOSTHERE',
    email: 'admin@wehosthere.com',
    password: process.env.ADMIN_DEFAULT_PASSWORD_HASH || DEFAULT_ADMIN_HASH,
    plan: 'enterprise',
    status: 'active',
    role: 'admin',
    dueDate: 29,
    createdAt: new Date().toISOString()
  }
];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue:', err);
    return false;
  }
}

async function ensureAdmin() {
  const adminHash = process.env.ADMIN_DEFAULT_PASSWORD_HASH?.trim() || DEFAULT_ADMIN_HASH;
  const adminPayload = {
    ...FALLBACK_USERS[0],
    password: adminHash,
  };

  const exists = await UserModel.findOne({ email: 'admin@wehosthere.com' });
  if (!exists) {
    await UserModel.create(adminPayload);
    return;
  }

  // Só sincroniza hash se ainda não houver um hash bcrypt válido (evita sobrescrever troca de senha)
  if (!exists.password || !exists.password.startsWith('$2')) {
    await UserModel.findOneAndUpdate(
      { email: 'admin@wehosthere.com' },
      { $set: { password: adminHash, role: 'admin', status: 'active' } }
    );
  }
}

export async function GET(request: Request) {
  let isAdminOrInternal = hasValidInternalAuth(request);
  let sessionEmail = '';

  if (!isAdminOrInternal) {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    isAdminOrInternal = isAdminRole(auth.user.role);
    sessionEmail = auth.user.email.toLowerCase().trim();
  }

  try {
    const url = new URL(request.url);
    const emailParam = url.searchParams.get('email');
    const targetEmail = emailParam?.trim().toLowerCase();

    if (!isAdminOrInternal) {
      // Utilizadores comuns só podem consultar o seu próprio perfil
      const lookupEmail = targetEmail || sessionEmail;
      if (lookupEmail !== sessionEmail) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
      if (await tryMongo()) {
        const singleUser = await UserModel.findOne({
          $or: [
            { email: sessionEmail },
            { email: { $regex: new RegExp(`^${sessionEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
          ]
        }).lean();
        if (singleUser) {
          const { password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...safeUser } = singleUser as any;
          return NextResponse.json({ success: true, user: safeUser });
        }
        return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 });
    }

    if (await tryMongo()) {
      await ensureAdmin();
      if (targetEmail) {
        const singleUser = await UserModel.findOne({
          $or: [
            { email: targetEmail },
            { email: { $regex: new RegExp(`^${targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
          ]
        }).lean();
        if (singleUser) {
          const { password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...safeUser } = singleUser as any;
          return NextResponse.json({ success: true, user: safeUser });
        }
      }

      const users = await UserModel.find({}).lean();
      // 🔒 NUNCA retornar passwords ou códigos de confirmação na resposta
      const safeUsers = users.map(({ password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...u }: any) => u);
      return NextResponse.json({ users: safeUsers });
    }
  } catch (e) {
    console.error('MongoDB indisponível, usando fallback:', e);
  }
  if (!isAdminOrInternal) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  // Fallback: remover passwords
  const safeFallback = FALLBACK_USERS.map(({ password: _pw, ...u }: any) => u);
  return NextResponse.json({ users: safeFallback });
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, user, userId, plan, status, email, password, avatar } = body;
    const useMongo = await tryMongo();

    // Sanitização básica de inputs
    const sanitizeInput = (input: any): string => {
      if (typeof input !== 'string') return '';
      return input.trim().replace(/[<>]/g, '');
    };

    const safeEmail = email ? sanitizeInput(email).toLowerCase() : '';
    const safePassword = password ? sanitizeInput(password) : '';
    const safeName = user?.name ? sanitizeInput(user.name) : '';

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (safeEmail && !emailRegex.test(safeEmail)) {
      return NextResponse.json({ error: 'Formato de email inválido.' }, { status: 400 });
    }

    // Endpoint de login - valida credenciais no servidor (database-first)
    if (action === 'login') {
      const targetEmail = safeEmail;
      const targetPassword = safePassword;
      const clientIpAddress = body.ipAddress || '';
      const clientCountry = body.country || '';

      if (!targetEmail || !targetPassword) {
        return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
      }

      // Rate limiting para prevenir força bruta
      const rateLimitResult = rateLimit(
        getRateLimitIdentifier(clientIpAddress, targetEmail),
        5, // 5 tentativas
        60000 // 1 minuto
      );

      if (!rateLimitResult.success) {
        return NextResponse.json(
          { 
            error: 'Muitas tentativas de login. Tente novamente em 1 minuto.',
            resetTime: rateLimitResult.resetTime
          }, 
          { status: 429 }
        );
      }

      if (useMongo) {
        const userDoc = await UserModel.findOne({
          $or: [
            { email: targetEmail },
            { email: { $regex: new RegExp(`^${targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
          ]
        }).lean();
        
        if (!userDoc) {
          // Registrar tentativa falha com IP e país
          try {
            const SecurityLogModel = (await import('@/lib/models/SecurityLog')).default;
            await SecurityLogModel.create({
              id: Date.now().toString(),
              email: targetEmail,
              type: 'failed_login',
              message: 'Usuário não encontrado',
              ipAddress: clientIpAddress,
              country: clientCountry,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error('Erro ao registrar log de segurança:', e);
          }
          return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
        }

        // Se o usuário não tem senha configurada (conta Google)
        if (!userDoc.password) {
          return NextResponse.json(
            { error: 'Esta conta foi registada com o Google. Por favor, clique no botão "Entrar com Google" para aceder.' },
            { status: 400 }
          );
        }

        // 🔒 Comparar com bcrypt — com migração automática apenas para hashes antigos em plaintext
        let passwordMatch = false;
        if (userDoc.password.startsWith('$2')) {
          passwordMatch = await bcrypt.compare(targetPassword, userDoc.password);
        } else if (userDoc.password === targetPassword) {
          // Migração automática e transparente de contas antigas para bcrypt
          passwordMatch = true;
        }

        if (passwordMatch && (!userDoc.password || !userDoc.password.startsWith('$2'))) {
          try {
            const newHashed = await bcrypt.hash(targetPassword, 12);
            await UserModel.updateOne({ email: targetEmail }, { $set: { password: newHashed } });
          } catch (e) {
            console.error('Erro ao atualizar hash:', e);
          }
        }

        if (!passwordMatch) {
          // Registrar tentativa falha com IP e país
          try {
            const SecurityLogModel = (await import('@/lib/models/SecurityLog')).default;
            await SecurityLogModel.create({
              id: Date.now().toString(),
              email: targetEmail,
              type: 'failed_login',
              message: 'Senha incorreta',
              ipAddress: clientIpAddress,
              country: clientCountry,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error('Erro ao registrar log de segurança:', e);
          }
          return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
        }

        if (userDoc.status === 'suspended') {
          // Registrar tentativa de conta suspensa com IP e país
          try {
            const SecurityLogModel = (await import('@/lib/models/SecurityLog')).default;
            await SecurityLogModel.create({
              id: Date.now().toString(),
              email: targetEmail,
              type: 'suspended_attempt',
              message: 'Tentativa de login em conta suspensa',
              ipAddress: clientIpAddress,
              country: clientCountry,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error('Erro ao registrar log de segurança:', e);
          }
          return NextResponse.json({ error: 'Sua conta encontra-se suspensa por questões de faturação ou incumprimento dos termos. Por favor, entre em contacto com o suporte WEHOSTHERE (+258 84 833 5618).' }, { status: 403 });
        }

        const { password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...safeUser } = userDoc as any;
        const response = NextResponse.json({ success: true, user: safeUser });
        setSessionCookie(response, safeUser);
        return response;
      } else {
        const fallbackUser = FALLBACK_USERS.find(u => u.email.toLowerCase() === targetEmail);

        if (!fallbackUser) {
          return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
        }

        // 🔒 Comparar com bcrypt
        let fallbackMatch = false;
        if (fallbackUser.password) {
          if (fallbackUser.password.startsWith('$2')) {
            fallbackMatch = await bcrypt.compare(targetPassword, fallbackUser.password);
          } else if (fallbackUser.password === targetPassword) {
            fallbackMatch = true;
          }
        }
        if (!fallbackMatch) {
          return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
        }

        if (fallbackUser.status === 'suspended') {
          return NextResponse.json({ error: 'Sua conta encontra-se suspensa por questões de faturação ou incumprimento dos termos. Por favor, entre em contacto com o suporte WEHOSTHERE (+258 84 833 5618).' }, { status: 403 });
        }

        const { password: _pw, ...safeFallbackUser } = fallbackUser;
        const response = NextResponse.json({ success: true, user: safeFallbackUser });
        setSessionCookie(response, safeFallbackUser);
        return response;
      }
    }

    if (action === 'update_password') {
      const auth = await requireAuth(req);
      if (auth.error) return auth.error;

      const isAdmin = isAdminRole(auth.user.role);
      const targetId = isAdmin ? String(userId || body.id || '').trim() : auth.user.id;
      const targetEmail = isAdmin
        ? (safeEmail || (body.email || '').trim().toLowerCase())
        : auth.user.email;

      if (!isAdmin) {
        const reqEmail = (safeEmail || (body.email || '').trim().toLowerCase());
        if (reqEmail && reqEmail !== auth.user.email) {
          return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
        }
      }

      if (!safePassword) {
        return NextResponse.json({ error: 'Nova senha é obrigatória.' }, { status: 400 });
      }
      if (safePassword.length < 6) {
        return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
      }

      const hashedPassword = safePassword.startsWith('$2')
        ? safePassword
        : await bcrypt.hash(safePassword, 12);

      if (useMongo) {
        const filter = buildUserFilter(targetId, targetEmail);

        const updated = await UserModel.findOneAndUpdate(
          filter,
          { $set: { password: hashedPassword } },
          { new: true }
        ).lean();

        if (!updated) {
          return NextResponse.json({ error: 'Usuário não encontrado no banco de dados.' }, { status: 404 });
        }

        const { password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...safeUser } = updated as any;
        return NextResponse.json({ success: true, user: safeUser });
      }

      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && (u.id === targetId || u.id.toLowerCase() === targetId.toLowerCase())) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, password: hashedPassword }
          : u
      );
      const updatedFallback = FALLBACK_USERS.find(u =>
        (targetId && (u.id === targetId || u.id.toLowerCase() === targetId.toLowerCase())) || (targetEmail && u.email.toLowerCase() === targetEmail)
      );
      if (!updatedFallback) {
        return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }
      const { password: _pw, ...safeUser } = updatedFallback;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'update_confirmation_code') {
      const adminAuth = await requireAdmin(req);
      if (adminAuth.error) return adminAuth.error;
      const targetId = (userId || body.id || '').toLowerCase();
      const targetEmail = (email || body.email || '').trim().toLowerCase();
      const newCode = body.confirmationCode;
      const newExpiresAt = body.confirmationCodeExpiresAt;

      if (!newCode || !newExpiresAt) {
        return NextResponse.json({ error: 'Código e expiração são obrigatórios' }, { status: 400 });
      }

      if (useMongo) {
        const filter = targetEmail
          ? { $or: [{ id: targetId }, { email: targetEmail }] }
          : { id: targetId };
        
        const updated = await UserModel.findOneAndUpdate(
          filter,
          { 
            confirmationCode: newCode,
            confirmationCodeExpiresAt: newExpiresAt
          },
          { new: true }
        ).lean();
        
        if (!updated) {
          return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, user: updated });
      }
      
      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && u.id.toLowerCase() === targetId) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, confirmationCode: newCode, confirmationCodeExpiresAt: newExpiresAt } : u
      );
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    if (action === 'confirm_email') {
      const adminAuth = await requireAdmin(req);
      if (adminAuth.error) return adminAuth.error;

      const targetId = (userId || body.id || '').toLowerCase();
      const targetEmail = (email || body.email || '').trim().toLowerCase();
      
      if (useMongo) {
        const filter = targetEmail
          ? { $or: [{ id: targetId }, { email: targetEmail }] }
          : { id: targetId };
        
        const updated = await UserModel.findOneAndUpdate(
          filter,
          { status: 'active', $unset: { confirmationCode: 1, confirmationCodeExpiresAt: 1 } },
          { new: true }
        ).lean();
        
        if (!updated) {
          return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }
        
        const users = await UserModel.find({}).lean();
        const safeUsers = users.map(({ password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...u }: any) => u);
        const { password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...safeUpdated } = updated as any;
        return NextResponse.json({ success: true, user: safeUpdated, users: safeUsers });
      }
      
      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && u.id.toLowerCase() === targetId) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, status: 'active', confirmationCode: undefined, confirmationCodeExpiresAt: undefined } : u
      );
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    if (action === 'update_status') {
      const adminAuth = await requireAdmin(req);
      if (adminAuth.error) return adminAuth.error;

      const targetId = String(userId || body.id || '').trim();
      const targetEmail = (body.email || body.userEmail || '').trim().toLowerCase();
      if (useMongo) {
        const filter = buildUserFilter(targetId, targetEmail);
        await UserModel.updateMany(filter, { status });
        const users = await UserModel.find({}).lean();
        const safeUsers = users.map(({ password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...u }: any) => u);
        return NextResponse.json({ success: true, users: safeUsers });
      }
      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && (u.id === targetId || u.id.toLowerCase() === targetId.toLowerCase())) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, status } : u
      );
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    if (action === 'update_plan') {
      const adminAuth = await requireAdmin(req);
      if (adminAuth.error) return adminAuth.error;

      const targetId = String(userId || body.id || '').trim();
      const targetEmail = (body.email || body.userEmail || '').trim().toLowerCase();
      const targetPlan = plan || body.plan || 'basic';
      if (useMongo) {
        const filter = buildUserFilter(targetId, targetEmail);
        await UserModel.updateMany(filter, { plan: targetPlan, ...(body.status ? { status: body.status } : { status: 'active' }), ...(body.dueDate !== undefined ? { dueDate: Number(body.dueDate) } : {}) });
        const users = await UserModel.find({}).lean();
        const safeUsers = users.map(({ password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...u }: any) => u);
        return NextResponse.json({ success: true, users: safeUsers });
      }
      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && (u.id === targetId || u.id.toLowerCase() === targetId.toLowerCase())) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, plan: targetPlan, status: 'active' } : u
      );
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    if (action === 'update_due_date') {
      const adminAuth = await requireAdmin(req);
      if (adminAuth.error) return adminAuth.error;

      const targetId = String(userId || body.id || '').trim();
      const targetEmail = (body.email || body.userEmail || '').trim().toLowerCase();
      const newDueDate = Number(body.dueDate) || 29;

      if (useMongo) {
        const filter = buildUserFilter(targetId, targetEmail);
        await UserModel.updateMany(filter, { dueDate: newDueDate });
        const users = await UserModel.find({}).lean();
        const safeUsers = users.map(({ password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...u }: any) => u);
        return NextResponse.json({ success: true, users: safeUsers, dueDate: newDueDate });
      }
      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (targetId && (u.id === targetId || u.id.toLowerCase() === targetId.toLowerCase())) || (targetEmail && u.email.toLowerCase() === targetEmail)
          ? { ...u, dueDate: newDueDate } : u
      );
      return NextResponse.json({ success: true, users: FALLBACK_USERS, dueDate: newDueDate });
    }

    if (action === 'update_avatar') {
      const auth = await requireAuth(req);
      if (auth.error) return auth.error;

      const isAdmin = isAdminRole(auth.user.role);
      const targetId = isAdmin ? String(userId || body.id || '').trim() : auth.user.id;
      const targetEmail = isAdmin ? String(body.email || '').trim().toLowerCase() : auth.user.email;

      if (!isAdmin && body.email && String(body.email).trim().toLowerCase() !== auth.user.email) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
      }

      if (useMongo) {
        const updated = await UserModel.findOneAndUpdate(
          buildUserFilter(targetId, targetEmail),
          { avatar },
          { new: true }
        ).lean();
        if (isAdmin) {
          const users = await UserModel.find({}).lean();
          const safeUsers = users.map(({ password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...u }: any) => u);
          return NextResponse.json({ success: true, users: safeUsers });
        }
        const { password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...safeUser } = (updated || {}) as any;
        return NextResponse.json({ success: true, user: safeUser });
      }
      FALLBACK_USERS = FALLBACK_USERS.map(u => (u.id === targetId || u.id.toLowerCase() === targetId.toLowerCase()) ? { ...u, avatar } : u);
      return NextResponse.json({ success: true, users: isAdmin ? FALLBACK_USERS : undefined });
    }

    if (action === 'update_profile') {
      const auth = await requireAuth(req);
      if (auth.error) return auth.error;

      const isAdmin = isAdminRole(auth.user.role);
      const profilePayload = body.user || body;
      const targetEmail = isAdmin && profilePayload?.email
        ? String(profilePayload.email).trim().toLowerCase()
        : auth.user.email;
      const targetId = isAdmin && profilePayload?.id ? String(profilePayload.id).trim() : auth.user.id;

      const updateFields: Record<string, any> = {};
      if (typeof profilePayload?.name === 'string' && profilePayload.name.trim()) {
        updateFields.name = sanitizeInput(profilePayload.name).slice(0, 120);
      }
      if (profilePayload?.birthdate !== undefined) {
        updateFields.birthdate = profilePayload.birthdate ? String(profilePayload.birthdate).slice(0, 32) : null;
      }
      if (typeof profilePayload?.avatar === 'string') {
        updateFields.avatar = profilePayload.avatar;
      }

      if (useMongo) {
        const updated = await UserModel.findOneAndUpdate(
          buildUserFilter(targetId, targetEmail),
          { $set: updateFields },
          { new: true }
        ).lean();
        if (!updated) {
          return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
        }
        const { password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...safeUser } = updated as any;
        return NextResponse.json({ success: true, user: safeUser });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'update_role') {
      const adminAuth = await requireAdmin(req);
      if (adminAuth.error) return adminAuth.error;

      const targetId = String(userId || body.id || body.userId || '').trim();
      const targetEmail = String(email || body.email || body.userEmail || '').trim().toLowerCase();
      const newRole = body.role;

      if (!newRole || !['user', 'admin', 'super_admin'].includes(newRole)) {
        return NextResponse.json({ error: 'Role inválida. Use "user", "admin" ou "super_admin".' }, { status: 400 });
      }

      if (!targetId && !targetEmail) {
        return NextResponse.json({ error: 'ID ou e-mail do utilizador é obrigatório.' }, { status: 400 });
      }

      // Proteger: não permitir tocar no Super Admin root
      const isRootAdmin = targetEmail === 'admin@wehosthere.com' || targetId.toLowerCase() === 'admin_root';
      if (isRootAdmin) {
        return NextResponse.json({ error: 'Não é possível alterar as permissões do Super Administrador principal.' }, { status: 403 });
      }

      const isRootSuperAdmin = adminAuth.user.role === 'super_admin' || adminAuth.user.email === 'admin@wehosthere.com';

      if (useMongo) {
        const filter = buildUserFilter(targetId, targetEmail);
        const existingTarget = await UserModel.findOne(filter);

        if (!existingTarget) {
          console.error('[Users API update_role] ❌ Utilizador não encontrado no MongoDB Atlas:', { targetId, targetEmail });
          return NextResponse.json({ 
            error: `Utilizador não encontrado no banco de dados MongoDB Atlas (${targetEmail || targetId}).` 
          }, { status: 404 });
        }

        // Não permitir alterar outro super_admin — exceto pelo Super Admin root
        if (existingTarget.role === 'super_admin' && !isRootSuperAdmin && newRole !== 'super_admin') {
          return NextResponse.json({ error: 'Apenas o Super Administrador principal pode despromover outro Super Administrador.' }, { status: 403 });
        }

        // 1. Atualizar e salvar o documento diretamente via Mongoose (dispara validações e garante gravação)
        existingTarget.role = newRole;
        if (newRole === 'admin' || newRole === 'super_admin') {
          existingTarget.status = 'active';
          existingTarget.plan = 'enterprise';
        }
        await existingTarget.save();

        // 2. Sincronizar em massa por email e id para garantir consistência total no MongoDB
        const cleanEmail = existingTarget.email.toLowerCase();
        await UserModel.updateMany(
          {
            $or: [
              { _id: existingTarget._id },
              { id: existingTarget.id },
              { email: cleanEmail },
              { email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
            ]
          },
          {
            $set: {
              role: newRole,
              ...(newRole === 'admin' || newRole === 'super_admin' ? { status: 'active', plan: 'enterprise' } : {})
            }
          }
        );

        console.log(`[Users API update_role] ✅ Cargo atualizado com sucesso no MongoDB Atlas para "${newRole}" em: ${cleanEmail} (ID: ${existingTarget.id})`);

        // Enviar e-mail de notificação de cargo
        if (existingTarget?.email) {
          sendRoleChangeEmail(existingTarget.email, existingTarget.name || existingTarget.email, newRole as any).catch(err => {
            console.error('[UsersAPI] Erro ao enviar email de mudança de cargo:', err);
          });
        }

        const users = await UserModel.find({}).lean();
        const safeUsers = users.map(({ password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...u }: any) => u);
        return NextResponse.json({ 
          success: true, 
          user: {
            id: existingTarget.id,
            name: existingTarget.name,
            email: existingTarget.email,
            role: newRole,
            status: existingTarget.status
          },
          users: safeUsers 
        });
      }

      // Fallback em memória
      const localTarget = FALLBACK_USERS.find(u =>
        (targetId && (u.id.toLowerCase() === targetId.toLowerCase() || u.id === targetId)) ||
        (targetEmail && u.email.toLowerCase() === targetEmail)
      );
      if (!localTarget) {
        return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
      }
      if (localTarget.role === 'super_admin' && !isRootSuperAdmin && newRole !== 'super_admin') {
        return NextResponse.json({ error: 'Não é possível alterar as permissões de um Super Administrador.' }, { status: 403 });
      }
      if (localTarget.email) {
        sendRoleChangeEmail(localTarget.email, localTarget.name || localTarget.email, newRole as any).catch(() => {});
      }

      FALLBACK_USERS = FALLBACK_USERS.map(u =>
        (u.id === localTarget.id || u.email.toLowerCase() === localTarget.email.toLowerCase())
          ? { ...u, role: newRole, ...(newRole === 'admin' || newRole === 'super_admin' ? { status: 'active' } : {}) }
          : u
      );
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    if (action === 'update_plan') {
      const targetEmail = (email || body.email || '').trim().toLowerCase();
      const targetUserId = (userId || body.userId || '').trim();
      const newPlan = body.plan || 'basic';
      const newStatus = body.status || 'active';
      const newDueDate = body.dueDate || new Date().getDate();

      if (useMongo) {
        const filter = targetUserId ? { id: targetUserId } : { email: new RegExp(`^${targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
        await UserModel.findOneAndUpdate(
          filter,
          { $set: { plan: newPlan, status: newStatus, dueDate: newDueDate } },
          { new: true }
        );
        const users = await UserModel.find({}).lean();
        return NextResponse.json({ success: true, users });
      }

      FALLBACK_USERS = FALLBACK_USERS.map(u => {
        if ((targetEmail && u.email.toLowerCase() === targetEmail) || (targetUserId && u.id === targetUserId)) {
          return { ...u, plan: newPlan, status: newStatus, dueDate: newDueDate };
        }
        return u;
      });
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    if (action === 'delete') {
      const adminAuth = await requireAdmin(req);
      if (adminAuth.error) return adminAuth.error;

      const targetId = (userId || body.userId || '').toLowerCase().trim();
      const targetEmail = (body.email || body.userEmail || '').toLowerCase().trim();
      const escapedEmail = targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      if (useMongo) {
        // Protect root admin from deletion
        const isRootAdmin = targetEmail === 'admin@wehosthere.com' || targetId === 'admin_root';
        if (!isRootAdmin) {
          // Buscar usuário para enviar email antes de deletar
          const orDel: any[] = [];
          if (targetId) orDel.push({ id: targetId });
          if (targetEmail) orDel.push({ email: new RegExp(`^${escapedEmail}$`, 'i') });
          const userToDelete = orDel.length > 0 ? await UserModel.findOne({ $or: orDel }) : null;
          
          // Enviar email de notificação antes de deletar
          if (userToDelete && userToDelete.email) {
            sendAccountDeletionEmail(
              userToDelete.email,
              userToDelete.name,
              body.reason || 'Violação dos termos de serviço'
            ).catch((err) => {
              console.error('[Users API] Erro ao enviar email de exclusão:', err);
            });
          }
          
          if (orDel.length > 0) {
            await UserModel.deleteMany({ $or: orDel });
          }
        }
        const users = await UserModel.find({}).lean();
        const safeUsers = users.map(({ password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...u }: any) => u);
        return NextResponse.json({ success: true, users: safeUsers });
      }
      
      // Para fallback, buscar usuário antes de deletar
      const userToDelete = FALLBACK_USERS.find(u =>
        (targetId && (u.id.toLowerCase() === targetId || u.email.toLowerCase() === targetId)) ||
        (targetEmail && (u.id.toLowerCase() === targetEmail || u.email.toLowerCase() === targetEmail))
      );
      
      // Enviar email de notificação antes de deletar
      if (userToDelete && userToDelete.email && userToDelete.email.toLowerCase() !== 'admin@wehosthere.com') {
        sendAccountDeletionEmail(
          userToDelete.email,
          userToDelete.name,
          body.reason || 'Violação dos termos de serviço'
        ).catch((err) => {
          console.error('[Users API] Erro ao enviar email de exclusão:', err);
        });
      }
      
      FALLBACK_USERS = FALLBACK_USERS.filter(u =>
        u.email.toLowerCase() === 'admin@wehosthere.com' ||
        (!(targetId && (u.id.toLowerCase() === targetId || u.email.toLowerCase() === targetId)) &&
         !(targetEmail && (u.id.toLowerCase() === targetEmail || u.email.toLowerCase() === targetEmail)))
      );
      return NextResponse.json({ success: true, users: FALLBACK_USERS });
    }

    const reqEmail = (user?.email || body.email || '').trim().toLowerCase();

    if (action !== 'register') {
      // Qualquer outra mutação genérica em /api/users exige administrador autenticado
      const adminAuth = await requireAdmin(req);
      if (adminAuth.error) return adminAuth.error;
    }

    if (action === 'register') {
      console.log('[Users API] Iniciando registro:', { email: reqEmail, hasUser: !!user, hasBody: !!body });
      
      if (useMongo) {
        const exists = await UserModel.findOne({ email: reqEmail });
        if (exists) {
          console.log('[Users API] Email já existe:', reqEmail);
          return NextResponse.json({ error: 'Este e-mail já está registado na plataforma.' }, { status: 400 });
        }
      } else {
        const exists = FALLBACK_USERS.find(u => u.email.toLowerCase() === reqEmail);
        if (exists) {
          console.log('[Users API] Email já existe (fallback):', reqEmail);
          return NextResponse.json({ error: 'Este e-mail já está registado na plataforma.' }, { status: 400 });
        }
      }
    }

    // 🔒 Se existe uma password em texto puro vinda do body, fazer hash antes de guardar
    let incomingPassword = (user?.password) || body.password || '';
    if (incomingPassword && !incomingPassword.startsWith('$2')) {
      // Ainda não está em hash bcrypt (hashes bcrypt começam com $2a$ ou $2b$)
      incomingPassword = await bcrypt.hash(incomingPassword, 12);
    }

    const userData = user || {
      id: body.id || Date.now().toString(),
      name: body.name,
      email: body.email,
      password: incomingPassword, // Sempre guardado em hash
      plan: body.plan || 'none',
      status: body.status || 'pending',
      dueDate: body.dueDate || 29,
      role: body.role || 'user',
      createdAt: body.createdAt || new Date().toISOString()
    };

    // Garantir que o userData.password também está em hash quando veio do objeto user
    if (userData.password && !userData.password.startsWith('$2')) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }

    // 🔒 SEGURANÇA: No registo público, nunca aceitar role privilegiada nem status ativo pré-forjado
    if (action === 'register') {
      userData.role = 'user';
      userData.status = 'pending';
    }

    // Adicionar campos de confirmação se existirem no body.user ou body
    const userBody = body.user || body;
    if (userBody.confirmationCode) {
      userData.confirmationCode = userBody.confirmationCode;
      console.log('[Users API] Código de confirmação adicionado:', userBody.confirmationCode);
    }
    if (userBody.confirmationCodeExpiresAt) {
      userData.confirmationCodeExpiresAt = userBody.confirmationCodeExpiresAt;
      console.log('[Users API] Expiração do código adicionada:', userBody.confirmationCodeExpiresAt);
    }
    if (userBody.birthdate !== undefined) {
      userData.birthdate = userBody.birthdate;
    }

    console.log('[Users API] Dados do usuário antes de salvar:', { 
      email: userData.email, 
      hasConfirmationCode: !!userData.confirmationCode,
      hasExpiration: !!userData.confirmationCodeExpiresAt 
    });

    if (useMongo) {
      // Garantir email limpo em minúsculas
      const cleanEmail = reqEmail || (userData.email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return NextResponse.json({ error: 'E-mail é obrigatório para registo.' }, { status: 400 });
      }

      // 🎯 Extrair código de afiliado (do body ou do cookie)
      const cookieHeader = req.headers.get('cookie') || '';
      let affiliateCode = body.referredBy || body.user?.referredBy || '';
      if (!affiliateCode && cookieHeader.includes('affiliate_code=')) {
        const match = cookieHeader.match(/affiliate_code=([^;]+)/);
        if (match) affiliateCode = decodeURIComponent(match[1].trim());
      }

      if (affiliateCode) {
        userData.referredBy = affiliateCode;
      }

      userData.email = cleanEmail;
      if (!userData.id) userData.id = Date.now().toString();

      let saved;
      const existingDoc = await UserModel.findOne({ email: cleanEmail });
      if (existingDoc) {
        saved = await UserModel.findOneAndUpdate(
          { email: cleanEmail },
          { $set: userData },
          { new: true }
        ).lean();
      } else {
        const createdDoc = await UserModel.create(userData);
        saved = createdDoc.toObject ? createdDoc.toObject() : createdDoc;

        // Notificar admin do novo registo
        if (action === 'register') {
          addAdminNotification({
            title: `👤 Novo Utilizador Registado`,
            message: `${userData.name || userData.email} criou uma nova conta na plataforma.`,
            type: 'user_signup',
            userEmail: userData.email,
            userName: userData.name,
            link: '/admin?tab=users'
          });

          // 🎯 Registar evento anonimizado de registo na jornada de afiliado
          if (affiliateCode) {
            try {
              const affDoc = await Affiliate.findOne({ affiliateCode: String(affiliateCode).trim().toUpperCase() }).lean();
              if (affDoc) {
                const sidMatch = cookieHeader.match(/wh_aff_sid=([^;]+)/);
                const affSessionId = sidMatch ? decodeURIComponent(sidMatch[1].trim()) : `reg_${Date.now().toString(36)}`;
                await AffiliateEvent.create({
                  affiliateId: (affDoc as any)._id,
                  affiliateCode: (affDoc as any).affiliateCode,
                  sessionId: affSessionId,
                  visitorLabel: buildAnonymizedVisitorLabel(affSessionId),
                  eventType: 'signup',
                  page: '/register',
                  metadata: { source: 'registration' },
                });
              }
            } catch (affErr) {
              console.warn('[Users API] Falha não impeditiva ao registar evento de afiliado:', affErr);
            }
          }

          // 🔔 Push imediato para o telemóvel dos administradores
          try {
            const { sendPushToAdmins } = await import('@/lib/pushService');
            await sendPushToAdmins({
              title: '👤 Nova Conta Criada',
              message: `${userData.name || 'Novo utilizador'} (${userData.email}) acabou de criar conta na WEHOSTHERE.`,
              url: '/admin?tab=users',
              tag: `user-signup-${userData.email}`
            });
          } catch (pushErr) {
            console.warn('[Users API] Falha não impeditiva ao disparar push de novo utilizador:', pushErr);
          }

          // Enviar e-mail de boas-vindas ao cliente
          dispatchMessage({
            recipientEmail: userData.email,
            recipientName: userData.name || userData.email.split('@')[0],
            templateId: 'welcome',
            variables: {
              nome_cliente: userData.name || userData.email.split('@')[0],
              email: userData.email
            },
            isAutomatic: true,
            eventType: 'user_signup'
          });

          // 🎯 Rastreamento de Afiliado & Envio de E-mail de Novo Lead
          if (affiliateCode) {
            try {
              const AffiliateModel = (await import('@/lib/models/Affiliate')).default;
              const affiliateDoc = await AffiliateModel.findOne({ affiliateCode });
              if (affiliateDoc) {
                await AffiliateModel.findByIdAndUpdate(affiliateDoc._id, {
                  $inc: { totalReferredUsers: 1 }
                });

                // Buscar dados do afiliado para enviar o email
                const affiliateUser = await UserModel.findOne({
                  $or: [{ id: affiliateDoc.userId }, { email: affiliateDoc.userId }]
                });

                if (affiliateUser && affiliateUser.email) {
                  const { sendAffiliateNewLeadEmail } = await import('@/lib/affiliateEmails');
                  sendAffiliateNewLeadEmail(
                    affiliateUser.email,
                    affiliateUser.name || 'Parceiro Afiliado',
                    userData.name || 'Novo Cliente',
                    userData.email
                  ).catch((err: any) => console.error('[Affiliate Lead Email] Erro:', err));

                  // 🔔 Push imediato no telemóvel do afiliado
                  try {
                    const { sendPushToUser } = await import('@/lib/pushService');
                    const targetIdentifier = affiliateUser.email || affiliateDoc.userId;
                    await sendPushToUser(targetIdentifier, {
                      title: '🎯 Novo Registo com o seu Link!',
                      message: `${userData.name || 'Um visitante'} criou conta na WEHOSTHERE através do seu link de afiliado!`,
                      url: '/dashboard/affiliates',
                      tag: `affiliate-lead-${userData.email}`
                    });
                  } catch (pushErr) {
                    console.warn('[Affiliate Lead Push] Falha ao disparar push:', pushErr);
                  }
                }
              }
            } catch (affErr) {
              console.error('[Users API] Erro ao processar afiliado:', affErr);
            }
          }

          // 🎁 Auto-claim de convite de domínio pré-provisionado
          try {
            const inviteToken = body.inviteToken || body.user?.inviteToken;
            const query: any = inviteToken 
              ? { token: inviteToken, status: 'pending' }
              : { invitedEmail: cleanEmail, status: 'pending' };

            const pendingInvite = await DomainInvitation.findOne(query);
            if (pendingInvite) {
              const dName = pendingInvite.domainName;
              const escapedDomain = String(dName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const domDoc = await EmailDomain.findOne({ domainName: new RegExp(`^${escapedDomain}$`, 'i') });
              if (domDoc) {
                domDoc.customerId = cleanEmail;
                domDoc.updatedAt = new Date();
                await domDoc.save();

                await EmailMailbox.updateMany(
                  {
                    $or: [
                      { domainId: domDoc._id.toString() },
                      { email: { $regex: `@${escapedDomain}$`, $options: 'i' } }
                    ]
                  },
                  { $set: { customerId: cleanEmail, updatedAt: new Date() } }
                );

                await EmailAccountModel.updateMany(
                  {
                    $or: [
                      { domain: new RegExp(`^${escapedDomain}$`, 'i') },
                      { email: { $regex: `@${escapedDomain}$`, $options: 'i' } }
                    ]
                  },
                  { $set: { userEmail: cleanEmail } }
                );

                await SiteModel.findOneAndUpdate(
                  { domain: new RegExp(`^${escapedDomain}$`, 'i') },
                  {
                    $set: {
                      domain: dName.toLowerCase().trim(),
                      name: dName,
                      userEmail: cleanEmail,
                      status: domDoc.status === 'active' ? 'active' : 'pending',
                      storage: 10,
                      bandwidth: 100,
                      createdAt: domDoc.createdAt ? new Date(domDoc.createdAt).toISOString() : new Date().toISOString()
                    },
                    $setOnInsert: {
                      id: `site_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
                    }
                  },
                  { upsert: true, new: true }
                ).catch(() => {});
              }

              pendingInvite.status = 'accepted';
              pendingInvite.acceptedByEmail = cleanEmail;
              pendingInvite.acceptedAt = new Date();
              await pendingInvite.save();
              console.log(`[Registration] Domínio ${dName} atribuído com sucesso a ${cleanEmail} via convite`);
            }
          } catch (invErr) {
            console.warn('[Registration] Erro ao processar auto-claim de convite de domínio:', invErr);
          }
        }
      }

      const { password: _pw, confirmationCode: _cc, confirmationCodeExpiresAt: _cce, ...safeSaved } = (saved || {}) as any;
      if (action === 'register') {
        return NextResponse.json({ success: true, user: safeSaved });
      }
      const users = await UserModel.find({}).lean();
      const safeUsers = users.map(({ password: _upw, confirmationCode: _ucc, confirmationCodeExpiresAt: _ucce, ...u }: any) => u);
      return NextResponse.json({ success: true, user: safeSaved, users: safeUsers });
    }

    const idx = FALLBACK_USERS.findIndex(u => u.email.toLowerCase() === reqEmail);
    const isNewFallback = idx < 0;
    if (idx >= 0) FALLBACK_USERS[idx] = { ...FALLBACK_USERS[idx], ...userData };
    else FALLBACK_USERS.push(userData);

    if (isNewFallback && action === 'register') {
      addAdminNotification({
        title: `👤 Novo Utilizador Registado`,
        message: `${userData.name || userData.email} criou uma nova conta na plataforma.`,
        type: 'user_signup',
        userEmail: userData.email,
        userName: userData.name,
        link: '/admin?tab=users'
      });

      // 🔔 Push imediato para o telemóvel dos administradores (fallback)
      try {
        const { sendPushToAdmins } = await import('@/lib/pushService');
        await sendPushToAdmins({
          title: '👤 Nova Conta Criada',
          message: `${userData.name || 'Novo utilizador'} (${userData.email}) acabou de criar conta na WEHOSTHERE.`,
          url: '/admin?tab=users',
          tag: `user-signup-${userData.email}`
        });
      } catch (pushErr) {
        console.warn('[Users API Fallback] Falha não impeditiva ao disparar push de novo utilizador:', pushErr);
      }

      dispatchMessage({
        recipientEmail: userData.email,
        recipientName: userData.name || userData.email.split('@')[0],
        templateId: 'welcome',
        variables: {
          nome_cliente: userData.name || userData.email.split('@')[0],
          email: userData.email
        },
        isAutomatic: true,
        eventType: 'user_signup'
      });
    }

    return NextResponse.json({ success: true, user: userData, users: FALLBACK_USERS });

  } catch (error: any) {
    console.error('Erro na API de Utilizadores:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao processar utilizadores' }, { status: 500 });
  }
}
