import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import EmailAccountModel from '@/lib/models/EmailAccount';
import { EmailMailbox } from '@/models/EmailMailbox';
import { EmailDomain } from '@/models/EmailDomain';
import { getEmailProvider } from '@/lib/emailProviders/base';

let FALLBACK_EMAILS: any[] = [];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (emails):', err);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterUserEmail = searchParams.get('userEmail')?.trim().toLowerCase();

    if (await tryMongo()) {
      const [emailAccounts, dbMailboxes, dbDomains] = await Promise.all([
        EmailAccountModel.find({}).lean(),
        EmailMailbox.find({}).lean(),
        EmailDomain.find({}).lean()
      ]);

      // Build domain -> customer email map from EmailDomain and Site
      const domainOwnerMap = new Map<string, string>();
      dbDomains.forEach((d: any) => {
        if (d.domainName && d.customerId && d.customerId !== 'system') {
          domainOwnerMap.set(d.domainName.toLowerCase().trim(), d.customerId.trim());
        }
      });

      try {
        const SiteModel = (await import('@/lib/models/Site')).default;
        const dbSites = await SiteModel.find({}).lean();
        dbSites.forEach((s: any) => {
          if (s.domain && s.userEmail) {
            domainOwnerMap.set(s.domain.toLowerCase().trim(), s.userEmail.trim());
          }
        });
      } catch {}

      const existingEmails = new Set(emailAccounts.map(e => (e.email || '').toLowerCase().trim()));
      const allEmails: any[] = emailAccounts.map(e => {
        const domain = (e.domain || e.email?.split('@')[1] || '').toLowerCase().trim();
        const owner = domainOwnerMap.get(domain);
        const storageUsed = (e as any).storageUsed || 0;
        if (owner && (!e.userEmail || e.userEmail === 'admin@wehosthere.com' || e.userEmail === 'Cliente')) {
          // Update in memory and database
          EmailAccountModel.updateOne({ _id: e._id }, { $set: { userEmail: owner } }).catch(() => {});
          return { ...e, userEmail: owner, storageUsed };
        }
        return { ...e, storageUsed };
      });

      // Try fetching live mailboxes for Migadu domains if provider configured
      try {
        const provider = getEmailProvider();
        if (provider.isConfigured()) {
          const migaduDomainSet = new Set<string>();
          dbDomains.forEach(d => { if (d.domainName) migaduDomainSet.add(d.domainName.toLowerCase().trim()); });
          try {
            const SiteModel = (await import('@/lib/models/Site')).default;
            const dbSites = await SiteModel.find({}).lean();
            dbSites.forEach((s: any) => { if (s.domain) migaduDomainSet.add(s.domain.toLowerCase().trim()); });
          } catch {}
          migaduDomainSet.add('wehosthere.com');

          try {
            const liveDomains = await provider.listDomains();
            if (Array.isArray(liveDomains)) {
              liveDomains.forEach((ld: any) => {
                const dn = (ld.domainName || ld.name || '').toLowerCase().trim();
                if (dn) migaduDomainSet.add(dn);
              });
            }
          } catch {}

          const migaduDomainNames = Array.from(migaduDomainSet);
          for (const dName of migaduDomainNames) {
            try {
              const cleanDName = dName.toLowerCase().trim();
              const domainOwner = domainOwnerMap.get(cleanDName) || 'admin@wehosthere.com';
              const liveMbs = await provider.listMailboxes(dName);
              for (const mb of liveMbs) {
                const em = (mb.email || `${mb.localPart}@${dName}`).toLowerCase().trim();
                if (em && !existingEmails.has(em)) {
                  existingEmails.add(em);
                  const newEmailObj = {
                    id: `email_${mb.localPart}_${dName.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    email: em,
                    domain: dName,
                    status: mb.status || 'active',
                    storageUsed: mb.storageUsed || 0,
                    userEmail: domainOwner,
                    createdAt: new Date().toISOString()
                  };
                  allEmails.push(newEmailObj);
                  // Save to EmailAccountModel in background
                  EmailAccountModel.findOneAndUpdate({ email: em }, newEmailObj, { upsert: true }).catch(() => {});
                }
              }
            } catch {
              // Ignore single domain errors
            }
          }
        }
      } catch (provErr) {
        console.warn('[Emails GET] Could not sync live provider mailboxes:', provErr);
      }

      // Merge any mailboxes from EmailMailbox
      dbMailboxes.forEach((mb: any) => {
        const em = (mb.email || '').toLowerCase().trim();
        const domain = em.split('@')[1] || '';
        const domainOwner = domainOwnerMap.get(domain) || (mb.customerId === 'system' ? 'admin@wehosthere.com' : (mb.customerId || 'Cliente'));
        if (em && !existingEmails.has(em)) {
          existingEmails.add(em);
          allEmails.push({
            id: mb._id?.toString() || mb.id || `mb_${Date.now()}`,
            email: em,
            domain: domain,
            status: mb.status || 'active',
            storageUsed: mb.storageUsed || 0,
            userEmail: domainOwner,
            createdAt: mb.createdAt || new Date().toISOString()
          });
        }
      });

      // 🔒 ISOLAMENTO MULTI-TENANT: Se o cliente requisitar, devolver APENAS os seus domínios
      if (filterUserEmail) {
        const allowedDomains = new Set<string>();
        if (filterUserEmail.includes('@')) {
          allowedDomains.add(filterUserEmail.split('@')[1].trim().toLowerCase());
        }
        domainOwnerMap.forEach((owner, d) => {
          if (owner.toLowerCase() === filterUserEmail) {
            allowedDomains.add(d);
          }
        });

        const userStrictEmails = allEmails.filter(e => {
          const d = (e.domain || e.email?.split('@')[1] || '').toLowerCase().trim();
          return allowedDomains.has(d);
        });

        return NextResponse.json({ emails: userStrictEmails });
      }

      return NextResponse.json({ emails: allEmails });
    }
  } catch (e) { console.error('MongoDB indisponível (emails):', e); }
  return NextResponse.json({ emails: FALLBACK_EMAILS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, emailId, status, domain, emails, emailStr } = body;
    const useMongo = await tryMongo();

    if (action === 'sync_all' && Array.isArray(emails)) {
      if (useMongo) {
        for (const e of emails) {
          const key = (e.email || e.id || '').toLowerCase();
          if (!key) continue;
          await EmailAccountModel.findOneAndUpdate({ $or: [{ email: key }, { id: e.id }] }, e, { upsert: true, new: true });
        }
        return NextResponse.json({ success: true, emails: await EmailAccountModel.find({}).lean() });
      }
      const map = new Map<string, any>();
      FALLBACK_EMAILS.forEach(e => map.set(e.email?.toLowerCase(), e));
      emails.forEach((e: any) => map.set((e.email||e.id||'').toLowerCase(), { ...map.get((e.email||e.id||'').toLowerCase()), ...e }));
      FALLBACK_EMAILS = Array.from(map.values());
      return NextResponse.json({ success: true, emails: FALLBACK_EMAILS });
    }

    if (action === 'delete') {
      const tId = (emailId || '').toLowerCase().trim();
      const tEmail = (emailStr || '').toLowerCase().trim();
      const tDomain = (domain || '').toLowerCase().trim();

      if (useMongo) {
        let emailAddress = tEmail;
        if (!emailAddress && tId) {
          if (tId.includes('@')) {
            emailAddress = tId;
          } else {
            const foundAcc: any = (await EmailAccountModel.findOne({ id: tId })) || (await EmailMailbox.findById(tId).catch(() => null));
            if (foundAcc && foundAcc.email) {
              emailAddress = foundAcc.email.toLowerCase().trim();
            }
          }
        }

        if (tDomain) {
          const domainRegex = new RegExp(`^${tDomain}$`, 'i');
          const emailRegex = { $regex: `@${tDomain}$`, $options: 'i' };

          await Promise.all([
            EmailAccountModel.deleteMany({
              $or: [{ domain: domainRegex }, { email: emailRegex }]
            }),
            EmailMailbox.deleteMany({ email: emailRegex })
          ]);

          try {
            const provider = getEmailProvider();
            if (provider.isConfigured()) {
              const liveMbs = await provider.listMailboxes(tDomain).catch(() => []);
              if (Array.isArray(liveMbs)) {
                for (const mb of liveMbs) {
                  const lp = mb.localPart || mb.email?.split('@')[0];
                  if (lp) await provider.deleteMailbox(tDomain, lp).catch(() => {});
                }
              }
            }
          } catch (provErr) {
            console.warn('[Emails DELETE Domain] Provider warning:', provErr);
          }
        } else if (emailAddress) {
          const emailRegex = new RegExp(`^${emailAddress}$`, 'i');
          const conditions: any[] = [{ email: emailRegex }];
          if (tId) conditions.push({ id: tId });

          await Promise.all([
            EmailAccountModel.deleteMany({ $or: conditions }),
            EmailMailbox.deleteMany({ email: emailRegex })
          ]);

          if (emailAddress.includes('@')) {
            const [localPart, domainPart] = emailAddress.split('@');
            try {
              const provider = getEmailProvider();
              if (provider.isConfigured() && domainPart && localPart) {
                await provider.deleteMailbox(domainPart, localPart).catch(() => {});
              }
            } catch (provErr) {
              console.warn('[Emails DELETE Mailbox] Provider delete warning:', provErr);
            }
          }
        }

        return NextResponse.json({ success: true, emails: await EmailAccountModel.find({}).lean() });
      }

      FALLBACK_EMAILS = FALLBACK_EMAILS.filter(e => {
        if (tDomain && (e.domain?.toLowerCase() === tDomain || e.email?.toLowerCase().endsWith(`@${tDomain}`))) return false;
        if (tId && (e.id?.toLowerCase() === tId || e.email?.toLowerCase() === tId)) return false;
        if (tEmail && (e.id?.toLowerCase() === tEmail || e.email?.toLowerCase() === tEmail)) return false;
        return true;
      });
      return NextResponse.json({ success: true, emails: FALLBACK_EMAILS });
    }

    if (action === 'update_status') {
      const target = (emailId || emailStr || '').toLowerCase();
      if (useMongo) {
        await EmailAccountModel.findOneAndUpdate({ $or: [{ id: target }, { email: target }] }, { status });
        return NextResponse.json({ success: true, emails: await EmailAccountModel.find({}).lean() });
      }
      FALLBACK_EMAILS = FALLBACK_EMAILS.map(e => (e.id?.toLowerCase() === target || e.email?.toLowerCase() === target) ? { ...e, status } : e);
      return NextResponse.json({ success: true, emails: FALLBACK_EMAILS });
    }

    const emailData = email ? { ...email, userEmail: email.userEmail || body.userEmail } : { id: body.id || Date.now().toString(), email: body.email, domain: body.domain || (body.email?.split('@')[1] || ''), status: body.status || 'pending', quotaGB: body.quotaGB || 5, userEmail: body.userEmail, createdAt: body.createdAt || new Date().toISOString() };
    const targetKey = (emailData.email || '').toLowerCase();

    if (useMongo) {
      await EmailAccountModel.findOneAndUpdate({ $or: [{ id: emailData.id }, { email: targetKey }] }, emailData, { upsert: true, new: true });
      
      // Notificar Administrador sobre novo pedido de conta de e-mail
      try {
        const { addAdminNotification, dispatchMessage } = await import('@/lib/notifications');
        const adminDestEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com';
        
        // 1. Notificação In-App no Sino / Painel Admin
        addAdminNotification({
          title: `📬 Novo Pedido de E-mail: ${emailData.email}`,
          message: `O cliente ${emailData.userEmail || 'Cliente'} solicitou a ativação da conta ${emailData.email}.`,
          type: 'system',
          userEmail: emailData.userEmail,
          link: `/admin/email-domains/${emailData.domain || emailData.email.split('@')[1] || 'abnafrobiznetwork.com'}/mailboxes`
        });

        // 2. Envio de E-mail de Alerta para a Caixa do Admin
        await dispatchMessage({
          recipientEmail: adminDestEmail,
          recipientName: 'Administrador WEHOSTHERE',
          subject: `📬 Novo Pedido de E-mail Corporativo: ${emailData.email}`,
          body: `Olá Administrador,\n\nO cliente ${emailData.userEmail || 'utilizador da plataforma'} solicitou a criação da seguinte conta de e-mail:\n\n• Endereço: ${emailData.email}\n• Domínio: ${emailData.domain}\n• Solicitado por: ${emailData.userEmail}\n• Data: ${new Date().toLocaleString('pt-MZ')}\n\nPara aprovar e ativar esta caixa nos servidores, aceda ao painel:\nhttps://wehosthere.com/admin/email-domains/${emailData.domain}/mailboxes\n\nAtenciosamente,\nSistema de Notificações WEHOSTHERE`,
          isAutomatic: true,
          eventType: 'new_email_requested'
        });
      } catch (notifErr) {
        console.warn('[Emails API] Erro ao disparar notificação ao admin:', notifErr);
      }

      return NextResponse.json({ success: true, email: emailData, emails: await EmailAccountModel.find({}).lean() });
    }
    const idx = FALLBACK_EMAILS.findIndex(e => e.id === emailData.id || e.email?.toLowerCase() === targetKey);
    if (idx >= 0) FALLBACK_EMAILS[idx] = { ...FALLBACK_EMAILS[idx], ...emailData };
    else FALLBACK_EMAILS.unshift(emailData);
    return NextResponse.json({ success: true, email: emailData, emails: FALLBACK_EMAILS });
  } catch (error) {
    console.error('Erro na API de E-mails:', error);
    return NextResponse.json({ error: 'Erro ao processar e-mails' }, { status: 500 });
  }
}
