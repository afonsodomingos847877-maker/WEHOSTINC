import { getEmailProvider } from '@/lib/emailProviders/base';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import { DomainInvitation } from '@/models/DomainInvitation';
import { ExternalEmailAccount } from '@/models/ExternalEmailAccount';
import { EmailAgentConfig, EmailAgentLog } from '@/models/EmailAgentConfig';
import EmailAccountModel from '@/lib/models/EmailAccount';
import SiteModel from '@/lib/models/Site';
import UserModel from '@/lib/models/User';
import Affiliate from '@/lib/models/Affiliate';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Elimina uma caixa de e-mail no Migadu e em todas as coleções relacionadas do MongoDB.
 */
export async function cascadeDeleteMailbox(emailAddress: string): Promise<void> {
  const cleanEmail = (emailAddress || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return;

  const [localPart, domain] = cleanEmail.split('@');
  if (localPart && domain) {
    try {
      const provider = getEmailProvider();
      if (provider.isConfigured()) {
        await provider.deleteMailbox(domain, localPart);
      }
    } catch (err) {
      console.warn('[CascadeDelete] Provider mailbox delete warning:', err);
    }
  }

  const exactEmailRegex = new RegExp(`^${escapeRegex(cleanEmail)}$`, 'i');
  await Promise.all([
    EmailMailbox.deleteMany({ email: exactEmailRegex }),
    EmailAccountModel.deleteMany({ email: exactEmailRegex }),
    ExternalEmailAccount.deleteMany({ email: exactEmailRegex }),
    EmailAgentConfig.deleteMany({ email: exactEmailRegex }),
    EmailAgentLog.deleteMany({ agentEmail: exactEmailRegex }),
  ]);
}

/**
 * Elimina um domínio no Migadu e todos os registos dependentes no MongoDB.
 */
export async function cascadeDeleteDomain(domainName: string): Promise<void> {
  const cleanDomain = (domainName || '').trim().toLowerCase();
  if (!cleanDomain) return;

  const exactDomainRegex = new RegExp(`^${escapeRegex(cleanDomain)}$`, 'i');
  const atDomainRegex = new RegExp(`@${escapeRegex(cleanDomain)}$`, 'i');

  const domainDoc = await EmailDomain.findOne({ domainName: exactDomainRegex }).lean();

  const provider = getEmailProvider();
  if (provider.isConfigured()) {
    // 1. Apagar primeiro todas as caixas de correio no Migadu para evitar que o provedor recuse apagar o domínio
    try {
      const mailboxes = await provider.listMailboxes(cleanDomain);
      if (Array.isArray(mailboxes) && mailboxes.length > 0) {
        await Promise.all(
          mailboxes.map(async (mb: any) => {
            const localPart = (mb.localPart || (mb.email ? String(mb.email).split('@')[0] : '')).trim();
            if (!localPart) return;
            try {
              await provider.deleteMailbox(cleanDomain, localPart);
            } catch (mbErr: any) {
              const msg = String(mbErr?.message || '');
              if (mbErr?.statusCode !== 404 && !/404|not found|does not exist/i.test(msg)) {
                console.warn(`[CascadeDelete] Provider mailbox delete warning (${localPart}@${cleanDomain}):`, mbErr);
              }
            }
          })
        );
      }
    } catch (listErr: any) {
      const msg = String(listErr?.message || '');
      if (listErr?.statusCode !== 404 && !/404|not found|does not exist/i.test(msg)) {
        console.warn(`[CascadeDelete] Provider listMailboxes warning (${cleanDomain}):`, listErr);
      }
    }

    // 2. Apagar o domínio no Migadu (só ignora se o domínio já não existir no provedor - 404)
    try {
      await provider.deleteDomain(cleanDomain);
    } catch (err: any) {
      const msg = String(err?.message || '');
      const isNotFound = err?.statusCode === 404 || /404|not found|does not exist/i.test(msg);
      if (!isNotFound) {
        console.error('[CascadeDelete] Provider domain delete failed:', err);
        throw new Error(`Falha ao eliminar o domínio ${cleanDomain} no servidor de e-mail: ${msg || 'erro desconhecido'}`);
      }
    }
  }

  await Promise.all([
    EmailDomain.deleteMany({ domainName: exactDomainRegex }),
    SiteModel.deleteMany({ domain: exactDomainRegex }),
    EmailMailbox.deleteMany({
      $or: [
        { email: atDomainRegex },
        ...(domainDoc?._id ? [{ domainId: String(domainDoc._id) }] : []),
      ],
    }),
    EmailAccountModel.deleteMany({
      $or: [{ domain: exactDomainRegex }, { email: atDomainRegex }],
    }),
    DomainInvitation.deleteMany({ domainName: exactDomainRegex }),
    ExternalEmailAccount.deleteMany({ email: atDomainRegex }),
    EmailAgentConfig.deleteMany({ email: atDomainRegex }),
    EmailAgentLog.deleteMany({ agentEmail: atDomainRegex }),
  ]);
}

/**
 * Elimina uma conta de utilizador e faz limpeza em cascata dos seus domínios,
 * caixas de e-mail, contas externas, convites e registo de afiliado.
 */
export async function cascadeDeleteUser(
  userDoc: { id?: string; _id?: any; email?: string } | null,
  orDel: any[]
): Promise<void> {
  const userEmail = (userDoc?.email || '').trim().toLowerCase();
  const userId = (userDoc?.id || (userDoc?._id ? String(userDoc._id) : '')).trim();
  const escapedEmail = userEmail ? escapeRegex(userEmail) : '';
  const emailRegex = escapedEmail ? new RegExp(`^${escapedEmail}$`, 'i') : null;

  const ownerConditions: any[] = [];
  if (emailRegex) {
    ownerConditions.push({ customerId: emailRegex }, { userEmail: emailRegex });
  }
  if (userId) {
    ownerConditions.push({ customerId: userId });
  }

  if (ownerConditions.length > 0) {
    const [ownedDomains, ownedSites, ownedAccounts, ownedMailboxes] = await Promise.all([
      EmailDomain.find({ $or: ownerConditions }).lean(),
      emailRegex ? SiteModel.find({ userEmail: emailRegex }).lean() : Promise.resolve([]),
      emailRegex ? EmailAccountModel.find({ userEmail: emailRegex }).lean() : Promise.resolve([]),
      EmailMailbox.find({ $or: ownerConditions }).lean(),
    ]);

    const domainsToDelete = new Set<string>();
    for (const d of ownedDomains as any[]) {
      const dn = (d.domainName || '').trim().toLowerCase();
      if (dn && dn !== 'wehosthere.com') domainsToDelete.add(dn);
    }
    for (const s of ownedSites as any[]) {
      const dn = (s.domain || '').trim().toLowerCase();
      if (dn && dn !== 'wehosthere.com' && dn.includes('.')) domainsToDelete.add(dn);
    }

    for (const dn of Array.from(domainsToDelete)) {
      await cascadeDeleteDomain(dn);
    }

    const remainingEmails = new Set<string>();
    for (const acc of ownedAccounts as any[]) {
      if (acc.email) remainingEmails.add(String(acc.email).trim().toLowerCase());
    }
    for (const mb of ownedMailboxes as any[]) {
      if (mb.email) remainingEmails.add(String(mb.email).trim().toLowerCase());
    }

    for (const em of Array.from(remainingEmails)) {
      await cascadeDeleteMailbox(em);
    }
  }

  const cleanupTasks: Promise<any>[] = [];
  if (emailRegex) {
    cleanupTasks.push(
      ExternalEmailAccount.deleteMany({ ownerEmail: emailRegex }),
      DomainInvitation.deleteMany({ $or: [{ invitedEmail: emailRegex }, { invitedBy: emailRegex }] })
    );
  }
  if (userId || userEmail) {
    const affOr: any[] = [];
    if (userId) affOr.push({ userId });
    if (userEmail) affOr.push({ userId: userEmail });
    if (emailRegex) affOr.push({ userId: emailRegex });
    cleanupTasks.push(Affiliate.deleteMany({ $or: affOr }));
  }
  if (orDel.length > 0) {
    cleanupTasks.push(UserModel.deleteMany({ $or: orDel }));
  }

  await Promise.all(cleanupTasks);
}
