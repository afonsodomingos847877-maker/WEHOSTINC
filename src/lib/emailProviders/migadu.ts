// Migadu Email Provider Implementation
// This file implements the EmailProvider interface for Migadu

import {
  EmailProvider
} from './base';
import {
  EmailProviderConfig,
  EmailDomain,
  EmailMailbox,
  EmailAlias,
  EmailForwarding,
  EmailIdentity,
  DNSRecord,
  DNSDiagnostics,
  CreateDomainRequest,
  CreateMailboxRequest,
  UpdateMailboxRequest,
  EmailProviderError,
  DomainNotFoundError,
  MailboxNotFoundError,
  DNSConfigurationError,
  AuthenticationError,
  RateLimitError,
  ProviderUnavailableError
} from './types';

export interface MigaduConfig extends EmailProviderConfig {
  provider: 'migadu';
}

export class MigaduEmailProvider extends EmailProvider {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(config: MigaduConfig) {
    super(config);
    this.baseUrl = config.apiUrl || 'https://api.migadu.com/v1';
    this.authHeader = this.createAuthHeader(config.username, config.apiKey);
  }

  getProviderType(): string {
    return 'migadu';
  }

  isConfigured(): boolean {
    return !!(this.config.username && this.config.apiKey);
  }

  private createAuthHeader(username: string, apiKey: string): string {
    const credentials = Buffer.from(`${username}:${apiKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('[Migadu API Request] URL:', url);
    console.log('[Migadu API Request] Method:', options.method || 'GET');
    console.log('[Migadu API Request] Auth header length:', this.authHeader.length);
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('[Migadu API Request] Starting fetch...');
      const response = await fetch(url, defaultOptions);
      
      console.log('[Migadu API Request] Response status:', response.status);
      console.log('[Migadu API Request] Response ok:', response.ok);
      
      // Handle different status codes
      if (response.status === 401) {
        const rawBody = await response.text().catch(() => '');
        console.error('[Migadu API Request] 401 Authentication failed. URL:', url, 'Raw body:', rawBody);
        let errorMsg = 'Authentication failed';
        try {
          const parsed = JSON.parse(rawBody);
          errorMsg = parsed.error || parsed.message || errorMsg;
        } catch {
          if (rawBody) errorMsg = rawBody;
        }
        throw new EmailProviderError(
          `Autenticação Migadu falhou (401): ${errorMsg}`,
          'AUTHENTICATION_ERROR',
          401,
          { rawBody, url, username: this.config.username, apiKeyLength: this.config.apiKey?.length || 0 }
        );
      }
      
      if (response.status === 429) {
        console.error('[Migadu API Request] Rate limit exceeded');
        throw new RateLimitError();
      }
      
      if (response.status === 503 || response.status >= 500) {
        const rawBody = await response.text().catch(() => '');
        console.error('[Migadu API Request] Provider unavailable (5xx). Status:', response.status, 'Body:', rawBody);
        throw new ProviderUnavailableError();
      }

      if (!response.ok) {
        const rawText = await response.text().catch(() => '');
        let errorData: any = {};
        try {
          errorData = JSON.parse(rawText);
        } catch {
          errorData = { message: rawText || `HTTP ${response.status} ${response.statusText}` };
        }
        const errorMessage = 
          (typeof errorData === 'string' ? errorData : null) ||
          errorData.message || 
          errorData.error || 
          errorData.description || 
          (Array.isArray(errorData.errors) ? errorData.errors.join(', ') : null) ||
          (typeof errorData.error === 'object' ? JSON.stringify(errorData.error) : null) ||
          `API request failed with status ${response.status}: ${rawText}`;

        const logFn = response.status === 404 ? console.warn : console.error;
        logFn(`[Migadu API Request] API error (${response.status}):`, errorMessage, errorData);
        throw new EmailProviderError(
          errorMessage,
          `API_ERROR_${response.status}`,
          response.status,
          { rawText, errorData, url }
        );
      }

      const data = await response.json();
      console.log('[Migadu API Request] Success, data type:', typeof data);
      return data;
    } catch (error) {
      console.error('[Migadu API Request] Fetch error:', error);
      if (error instanceof EmailProviderError) {
        throw error;
      }
      throw new ProviderUnavailableError();
    }
  }

  // Domain Management
  async createDomain(request: CreateDomainRequest): Promise<EmailDomain> {
    return this.withErrorHandling('create domain', async () => {
      const response = await this.apiRequest<any>('/domains', {
        method: 'POST',
        body: JSON.stringify({
          name: request.domainName,
          create_default_addresses: request.createDefaultAddresses || false,
          hosted_dns: request.hostedDns || false
        })
      });

      return this.mapMigaduDomainToEmailDomain(response, request.domainName);
    });
  }

  async getDomain(domainName: string): Promise<EmailDomain> {
    return this.withErrorHandling('get domain', async () => {
      try {
        const response = await this.apiRequest<any>(`/domains/${domainName}`);
        return this.mapMigaduDomainToEmailDomain(response, domainName);
      } catch (error) {
        if (error instanceof EmailProviderError && error.statusCode === 404) {
          throw new DomainNotFoundError(domainName);
        }
        throw error;
      }
    });
  }

  async updateDomain(domainName: string, updates: Partial<EmailDomain>): Promise<EmailDomain> {
    return this.withErrorHandling('update domain', async () => {
      // Note: Migadu API may not support direct domain updates
      // This might need to be implemented differently based on actual API capabilities
      const current = await this.getDomain(domainName);
      return { ...current, ...updates, updatedAt: new Date() };
    });
  }

  async deleteDomain(domainName: string): Promise<boolean> {
    return this.withErrorHandling('delete domain', async () => {
      await this.apiRequest(`/domains/${domainName}`, {
        method: 'DELETE'
      });
      return true;
    });
  }

  async listDomains(customerId?: string): Promise<EmailDomain[]> {
    return this.withErrorHandling('list domains', async () => {
      console.log('[Migadu Provider] Listing domains, customerId:', customerId);
      console.log('[Migadu Provider] Auth header exists:', !!this.authHeader);
      console.log('[Migadu Provider] Base URL:', this.baseUrl);
      
      try {
        const response = await this.apiRequest<any>('/domains');
        const domainsArray = Array.isArray(response) ? response : (response.domains || response.data);
        
        if (!Array.isArray(domainsArray)) {
          console.error('[Migadu Provider] Unexpected API response structure. Response:', JSON.stringify(response, null, 2));
          throw new EmailProviderError('Unexpected API response structure when fetching domains', 'API_RESPONSE_ERROR', 500, response);
        }
        
        console.log('[Migadu Provider] Domains response received, count:', domainsArray.length);
        return domainsArray.map((domain: any) => this.mapMigaduDomainToEmailDomain(domain, domain.name));
      } catch (error) {
        console.error('[Migadu Provider] Error listing domains:', error);
        throw error;
      }
    });
  }

  async getDNSRecords(domainName: string): Promise<DNSRecord[]> {
    return this.withErrorHandling('get DNS records', async () => {
      const response = await this.apiRequest<any>(`/domains/${domainName}/records`);
      return this.mapMigaduDNSRecords(response);
    });
  }

  async runDNSDiagnostics(domainName: string): Promise<DNSDiagnostics> {
    return this.withErrorHandling('run DNS diagnostics', async () => {
      const response = await this.apiRequest<any>(`/domains/${domainName}/diagnostics`);
      return this.mapMigaduDiagnostics(response);
    });
  }

  async activateDomain(domainName: string): Promise<EmailDomain> {
    return this.withErrorHandling('activate domain', async () => {
      try {
        // Migadu activate endpoint - if DNS is correct it returns the domain object
        const response = await this.apiRequest<any>(`/domains/${domainName}/activate`, {
          method: 'POST'
        });
        
        // If the response has an explicit error status, throw
        if (response && response.status === 'error') {
          throw new DNSConfigurationError(response.message || 'DNS check failed on Migadu');
        }
        
        // Otherwise, consider it successful and fetch the updated domain
        return this.getDomain(domainName);
      } catch (err: any) {
        // If activate endpoint itself fails (e.g. Migadu hasn't seen the DNS yet),
        // try getting the domain - if it's already active, return it
        try {
          const currentDomain = await this.getDomain(domainName);
          if (currentDomain && (currentDomain.status === 'active' || currentDomain.canSend)) {
            return currentDomain;
          }
        } catch {}
        throw err;
      }
    });
  }

  // Mailbox Management
  async createMailbox(domainName: string, request: CreateMailboxRequest): Promise<EmailMailbox> {
    return this.withErrorHandling('create mailbox', async () => {
      const body: any = {
        name: request.name,
        local_part: request.localPart,
        may_send: request.maySend !== false,
        may_receive: request.mayReceive !== false,
        may_access_imap: request.mayAccessImap !== false,
        may_access_pop3: request.mayAccessPop3 || false
      };

      if (request.passwordMethod === 'invitation') {
        body.password_method = 'invitation';
        body.password_recovery_email = request.passwordRecoveryEmail;
      } else {
        body.password = request.password || this.generatePassword();
      }

      const response = await this.apiRequest<any>(`/domains/${domainName}/mailboxes`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      return this.mapMigaduMailboxToEmailMailbox(response, domainName);
    });
  }

  async getMailbox(domainName: string, localPart: string): Promise<EmailMailbox> {
    return this.withErrorHandling('get mailbox', async () => {
      try {
        const response = await this.apiRequest<any>(`/domains/${domainName}/mailboxes/${localPart}`);
        return this.mapMigaduMailboxToEmailMailbox(response, domainName);
      } catch (error) {
        if (error instanceof EmailProviderError && error.statusCode === 404) {
          throw new MailboxNotFoundError(`${localPart}@${domainName}`);
        }
        throw error;
      }
    });
  }

  async updateMailbox(domainName: string, localPart: string, request: UpdateMailboxRequest): Promise<EmailMailbox> {
    return this.withErrorHandling('update mailbox', async () => {
      const body: Record<string, any> = {};
      if (request.name !== undefined) body.name = request.name;
      if (request.password !== undefined) body.password = request.password;
      if (request.maySend !== undefined) body.may_send = request.maySend;
      if (request.mayReceive !== undefined) body.may_receive = request.mayReceive;
      if (request.mayAccessImap !== undefined) body.may_access_imap = request.mayAccessImap;
      if (request.mayAccessPop3 !== undefined) body.may_access_pop3 = request.mayAccessPop3;
      if ((request as any).is_disabled !== undefined) body.is_disabled = (request as any).is_disabled;
      if ((request as any).status === 'suspended') {
        body.may_send = false;
        body.may_receive = false;
        body.is_disabled = true;
      } else if ((request as any).status === 'active') {
        body.may_send = true;
        body.may_receive = true;
        body.is_disabled = false;
      }

      const response = await this.apiRequest<any>(`/domains/${domainName}/mailboxes/${localPart}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      return this.mapMigaduMailboxToEmailMailbox(response, domainName);
    });
  }

  async deleteMailbox(domainName: string, localPart: string): Promise<boolean> {
    return this.withErrorHandling('delete mailbox', async () => {
      await this.apiRequest(`/domains/${domainName}/mailboxes/${localPart}`, {
        method: 'DELETE'
      });
      return true;
    });
  }

  async listMailboxes(domainName: string): Promise<EmailMailbox[]> {
    return this.withErrorHandling('list mailboxes', async () => {
      const response = await this.apiRequest<any>(`/domains/${domainName}/mailboxes`);
      const mailboxesArray = Array.isArray(response) 
        ? response 
        : (response.mailboxes || response.data || response.items || []);
      return mailboxesArray.map((mailbox: any) => this.mapMigaduMailboxToEmailMailbox(mailbox, domainName));
    });
  }

  async resetMailboxPassword(domainName: string, localPart: string, newPassword?: string): Promise<string> {
    return this.withErrorHandling('reset mailbox password', async () => {
      const password = newPassword || this.generatePassword();
      await this.updateMailbox(domainName, localPart, { password });
      return password;
    });
  }

  async suspendMailbox(domainName: string, localPart: string): Promise<EmailMailbox> {
    return this.withErrorHandling('suspend mailbox', async () => {
      return this.updateMailbox(domainName, localPart, {
        maySend: false,
        mayReceive: false
      });
    });
  }

  async activateMailbox(domainName: string, localPart: string): Promise<EmailMailbox> {
    return this.withErrorHandling('activate mailbox', async () => {
      return this.updateMailbox(domainName, localPart, {
        maySend: true,
        mayReceive: true
      });
    });
  }

  // Alias Management
  async createAlias(domainName: string, alias: string, destination: string): Promise<EmailAlias> {
    return this.withErrorHandling('create alias', async () => {
      const response = await this.apiRequest<any>(`/domains/${domainName}/aliases`, {
        method: 'POST',
        body: JSON.stringify({ alias, destination })
      });
      return this.mapMigaduAliasToEmailAlias(response, domainName);
    });
  }

  async getAlias(domainName: string, alias: string): Promise<EmailAlias> {
    return this.withErrorHandling('get alias', async () => {
      const response = await this.apiRequest<any>(`/domains/${domainName}/aliases/${alias}`);
      return this.mapMigaduAliasToEmailAlias(response, domainName);
    });
  }

  async deleteAlias(domainName: string, alias: string): Promise<boolean> {
    return this.withErrorHandling('delete alias', async () => {
      await this.apiRequest(`/domains/${domainName}/aliases/${alias}`, {
        method: 'DELETE'
      });
      return true;
    });
  }

  async listAliases(domainName: string): Promise<EmailAlias[]> {
    return this.withErrorHandling('list aliases', async () => {
      const response = await this.apiRequest<any[]>(`/domains/${domainName}/aliases`);
      return response.map(alias => this.mapMigaduAliasToEmailAlias(alias, domainName));
    });
  }

  // Forwarding Management
  async createForwarding(domainName: string, localPart: string, destination: string): Promise<EmailForwarding> {
    return this.withErrorHandling('create forwarding', async () => {
      const response = await this.apiRequest<any>(`/domains/${domainName}/forwardings`, {
        method: 'POST',
        body: JSON.stringify({ local_part: localPart, destination })
      });
      return this.mapMigaduForwardingToEmailForwarding(response, domainName);
    });
  }

  async getForwarding(domainName: string, localPart: string): Promise<EmailForwarding> {
    return this.withErrorHandling('get forwarding', async () => {
      const response = await this.apiRequest<any>(`/domains/${domainName}/forwardings/${localPart}`);
      return this.mapMigaduForwardingToEmailForwarding(response, domainName);
    });
  }

  async deleteForwarding(domainName: string, localPart: string): Promise<boolean> {
    return this.withErrorHandling('delete forwarding', async () => {
      await this.apiRequest(`/domains/${domainName}/forwardings/${localPart}`, {
        method: 'DELETE'
      });
      return true;
    });
  }

  async listForwardings(domainName: string): Promise<EmailForwarding[]> {
    return this.withErrorHandling('list forwardings', async () => {
      const response = await this.apiRequest<any[]>(`/domains/${domainName}/forwardings`);
      return response.map(fwd => this.mapMigaduForwardingToEmailForwarding(fwd, domainName));
    });
  }

  // Identity Management
  async createIdentity(mailboxId: string, email: string, name: string): Promise<EmailIdentity> {
    return this.withErrorHandling('create identity', async () => {
      // Note: This might need to be implemented based on actual Migadu API capabilities
      throw new EmailProviderError('Identity management not yet implemented for Migadu', 'NOT_IMPLEMENTED');
    });
  }

  async getIdentity(mailboxId: string, identityId: string): Promise<EmailIdentity> {
    return this.withErrorHandling('get identity', async () => {
      throw new EmailProviderError('Identity management not yet implemented for Migadu', 'NOT_IMPLEMENTED');
    });
  }

  async deleteIdentity(mailboxId: string, identityId: string): Promise<boolean> {
    return this.withErrorHandling('delete identity', async () => {
      throw new EmailProviderError('Identity management not yet implemented for Migadu', 'NOT_IMPLEMENTED');
    });
  }

  async listIdentities(mailboxId: string): Promise<EmailIdentity[]> {
    return this.withErrorHandling('list identities', async () => {
      throw new EmailProviderError('Identity management not yet implemented for Migadu', 'NOT_IMPLEMENTED');
    });
  }

  // Mapping helpers
  private mapMigaduDomainToEmailDomain(migaduDomain: any, domainName: string): EmailDomain {
    const isAct = 
      migaduDomain.is_active === true || 
      migaduDomain.status === 'active' || 
      migaduDomain.state === 'active' || 
      migaduDomain.can_send === true || 
      migaduDomain.can_receive === true ||
      domainName.toLowerCase() === 'wehosthere.com';

    return {
      id: migaduDomain.id || this.generateId(),
      domainName: domainName,
      customerId: migaduDomain.customer_id || 'system',
      status: isAct ? 'active' : this.mapMigaduStatus(migaduDomain.status || migaduDomain.state),
      provider: 'migadu',
      providerDomainId: migaduDomain.id,
      canSend: isAct || migaduDomain.can_send || false,
      canReceive: isAct || migaduDomain.can_receive || false,
      activatedAt: migaduDomain.activated_at ? new Date(migaduDomain.activated_at) : (isAct ? new Date() : undefined),
      createdAt: migaduDomain.created_at ? new Date(migaduDomain.created_at) : new Date(),
      updatedAt: migaduDomain.updated_at ? new Date(migaduDomain.updated_at) : new Date()
    };
  }

  private mapMigaduMailboxToEmailMailbox(migaduMailbox: any, domainName: string): EmailMailbox {
    const localPart = migaduMailbox.local_part || (migaduMailbox.address ? migaduMailbox.address.split('@')[0] : '');
    const email = migaduMailbox.email || migaduMailbox.address || `${localPart}@${domainName}`;
    const isSuspended = migaduMailbox.suspended === true || 
      migaduMailbox.is_disabled === true || 
      migaduMailbox.may_send === false || 
      migaduMailbox.may_receive === false;

    return {
      id: migaduMailbox.id || this.generateId(),
      domainId: migaduMailbox.domain_id || this.generateId(),
      customerId: migaduMailbox.customer_id || 'system',
      localPart: localPart,
      email: email,
      name: migaduMailbox.name || localPart || 'Mailbox',
      status: isSuspended ? 'suspended' : 'active',
      provider: 'migadu',
      providerMailboxId: migaduMailbox.id,
      maySend: migaduMailbox.may_send !== false,
      mayReceive: migaduMailbox.may_receive !== false,
      mayAccessImap: migaduMailbox.may_access_imap !== false,
      mayAccessPop3: migaduMailbox.may_access_pop3 || false,
      passwordMethod: migaduMailbox.password_method,
      passwordRecoveryEmail: migaduMailbox.password_recovery_email,
      createdAt: migaduMailbox.created_at ? new Date(migaduMailbox.created_at) : new Date(),
      updatedAt: migaduMailbox.updated_at ? new Date(migaduMailbox.updated_at) : new Date(),
      storageUsed: (() => {
        const raw = migaduMailbox.storage_used ?? migaduMailbox.storage_usage ?? migaduMailbox.usage_bytes ?? migaduMailbox.storage_usage_bytes ?? 0;
        return typeof raw === 'number' ? (raw > 1024 * 1024 ? Math.round(raw / (1024 * 1024)) : Math.round(raw)) : 0;
      })(),
      storageLimit: migaduMailbox.storage_limit
    };
  }

  private mapMigaduAliasToEmailAlias(migaduAlias: any, domainName: string): EmailAlias {
    return {
      id: migaduAlias.id || this.generateId(),
      domainId: this.generateId(),
      customerId: 'system',
      alias: migaduAlias.alias,
      destination: migaduAlias.destination,
      provider: 'migadu',
      createdAt: migaduAlias.created_at ? new Date(migaduAlias.created_at) : new Date(),
      updatedAt: migaduAlias.updated_at ? new Date(migaduAlias.updated_at) : new Date()
    };
  }

  private mapMigaduForwardingToEmailForwarding(migaduForwarding: any, domainName: string): EmailForwarding {
    return {
      id: migaduForwarding.id || this.generateId(),
      domainId: this.generateId(),
      customerId: 'system',
      localPart: migaduForwarding.local_part,
      destination: migaduForwarding.destination,
      provider: 'migadu',
      createdAt: migaduForwarding.created_at ? new Date(migaduForwarding.created_at) : new Date(),
      updatedAt: migaduForwarding.updated_at ? new Date(migaduForwarding.updated_at) : new Date()
    };
  }

  private mapMigaduDNSRecords(migaduRecords: any): DNSRecord[] {
    const records: DNSRecord[] = [];
    
    if (migaduRecords.mx) {
      migaduRecords.mx.forEach((mx: any) => {
        records.push({
          type: 'MX',
          name: mx.name || '@',
          value: mx.value,
          priority: mx.priority,
          ttl: mx.ttl,
          status: 'correct'
        });
      });
    }

    if (migaduRecords.spf) {
      records.push({
        type: 'SPF',
        name: migaduRecords.spf.name || '@',
        value: migaduRecords.spf.value,
        ttl: migaduRecords.spf.ttl,
        status: 'correct'
      });
    }

    if (migaduRecords.dkim) {
      migaduRecords.dkim.forEach((dkim: any) => {
        records.push({
          type: 'DKIM',
          name: dkim.name,
          value: dkim.value,
          ttl: dkim.ttl,
          status: 'correct'
        });
      });
    }

    if (migaduRecords.dmarc) {
      records.push({
        type: 'DMARC',
        name: migaduRecords.dmarc.name || '_dmarc',
        value: migaduRecords.dmarc.value,
        ttl: migaduRecords.dmarc.ttl,
        status: 'correct'
      });
    }

    return records;
  }

  private mapMigaduDiagnostics(migaduDiagnostics: any): DNSDiagnostics {
    return {
      mx: {
        status: migaduDiagnostics.mx?.status || 'pending',
        message: migaduDiagnostics.mx?.message || 'Not checked'
      },
      spf: {
        status: migaduDiagnostics.spf?.status || 'pending',
        message: migaduDiagnostics.spf?.message || 'Not checked'
      },
      dkim: {
        status: migaduDiagnostics.dkim?.status || 'pending',
        message: migaduDiagnostics.dkim?.message || 'Not checked'
      },
      dmarc: {
        status: migaduDiagnostics.dmarc?.status || 'pending',
        message: migaduDiagnostics.dmarc?.message || 'Not checked'
      },
      overall: migaduDiagnostics.overall || 'pending',
      checkedAt: new Date()
    };
  }

  private mapMigaduStatus(migaduStatus: string): 'active' | 'pending_dns' | 'provisioning' | 'provisioning_failed' | 'suspended' | 'cancelled' {
    const statusMap: Record<string, any> = {
      'active': 'active',
      'pending': 'pending_dns',
      'provisioning': 'provisioning',
      'failed': 'provisioning_failed',
      'suspended': 'suspended',
      'cancelled': 'cancelled'
    };
    return statusMap[migaduStatus] || 'pending_dns';
  }

  private generatePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}

// Factory function to create Migadu provider
export function createMigaduProvider(): MigaduEmailProvider {
  console.log('[Migadu Provider] Creating provider with config:');
  console.log('[Migadu Provider] EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
  console.log('[Migadu Provider] MIGADU_USERNAME:', process.env.MIGADU_USERNAME ? 'SET' : 'NOT SET');
  console.log('[Migadu Provider] MIGADU_API_KEY:', process.env.MIGADU_API_KEY ? 'SET' : 'NOT SET');
  console.log('[Migadu Provider] MIGADU_API_URL:', process.env.MIGADU_API_URL);
  
  const config: MigaduConfig = {
    provider: 'migadu',
    apiUrl: process.env.MIGADU_API_URL || 'https://api.migadu.com/v1',
    username: process.env.MIGADU_USERNAME || '',
    apiKey: process.env.MIGADU_API_KEY || '',
    imapHost: process.env.MIGADU_IMAP_HOST || 'imap.migadu.com',
    imapPort: parseInt(process.env.MIGADU_IMAP_PORT || '993'),
    smtpHost: process.env.MIGADU_SMTP_HOST || 'smtp.migadu.com',
    smtpPort: parseInt(process.env.MIGADU_SMTP_PORT || '465')
  };

  console.log('[Migadu Provider] Config created, username length:', config.username.length);
  console.log('[Migadu Provider] Config created, apiKey length:', config.apiKey.length);
  
  const provider = new MigaduEmailProvider(config);
  console.log('[Migadu Provider] Provider isConfigured:', provider.isConfigured());
  
  return provider;
}
