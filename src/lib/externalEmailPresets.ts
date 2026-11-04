export type ExternalSecurityMode = 'ssl' | 'starttls' | 'none';

export interface ProviderPreset {
  name: string;
  imapHost: string;
  imapPort: number;
  imapSecure: ExternalSecurityMode;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: ExternalSecurityMode;
}

export const EMAIL_PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  custom: {
    name: 'Servidor Personalizado / Empresa',
    imapHost: '',
    imapPort: 993,
    imapSecure: 'ssl',
    smtpHost: '',
    smtpPort: 465,
    smtpSecure: 'ssl',
  },
  cpanel: {
    name: 'cPanel / Webmail Corporativo',
    imapHost: 'mail.',
    imapPort: 993,
    imapSecure: 'ssl',
    smtpHost: 'mail.',
    smtpPort: 465,
    smtpSecure: 'ssl',
  },
  hostinger: {
    name: 'Hostinger Business Email',
    imapHost: 'imap.hostinger.com',
    imapPort: 993,
    imapSecure: 'ssl',
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    smtpSecure: 'ssl',
  },
  zoho: {
    name: 'Zoho Mail Corporativo',
    imapHost: 'imappro.zoho.com',
    imapPort: 993,
    imapSecure: 'ssl',
    smtpHost: 'smtppro.zoho.com',
    smtpPort: 465,
    smtpSecure: 'ssl',
  },
  titan: {
    name: 'Titan Email',
    imapHost: 'imap.titan.email',
    imapPort: 993,
    imapSecure: 'ssl',
    smtpHost: 'smtp.titan.email',
    smtpPort: 465,
    smtpSecure: 'ssl',
  },
  google: {
    name: 'Google Workspace / Gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapSecure: 'ssl',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: 'ssl',
  },
  microsoft: {
    name: 'Microsoft 365 / Outlook',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapSecure: 'ssl',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: 'starttls',
  },
};

