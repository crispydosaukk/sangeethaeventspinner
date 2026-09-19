export interface EmailRecipient {
  id: string;
  email: string;
  name: string;
  enabled: boolean;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export interface EmailNotificationConfig {
  enabled: boolean;
  recipients: EmailRecipient[];
  sendCustomerConfirmation: boolean;
  smtp: SmtpConfig;
  updatedAt?: string;
}

export const DEFAULT_EMAIL_NOTIFICATION_CONFIG: EmailNotificationConfig = {
  enabled: true,
  recipients: [
    {
      id: 'recipient-1',
      email: 'rahulbadugu22@gmail.com',
      name: 'Rahul',
      enabled: true,
    },
    {
      id: 'recipient-2',
      email: 'Svrpinneruk@gmail.com',
      name: 'SVR Pinner',
      enabled: true,
    },
    {
      id: 'recipient-3',
      email: 'Digitalbotsolutions@gmail.com',
      name: 'Digital Bot Solutions',
      enabled: true,
    },
  ],
  sendCustomerConfirmation: true,
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'zingbiteuk@gmail.com',
    pass: 'yyozpzropaysxtah',
    fromName: 'Sangeetha Events Pinner',
    fromEmail: 'zingbiteuk@gmail.com',
  },
};

export function sanitizeEmailNotificationConfig(data: any): EmailNotificationConfig {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_EMAIL_NOTIFICATION_CONFIG };
  }

  let recipients: EmailRecipient[] = [];

  if (Array.isArray(data.recipients) && data.recipients.length > 0) {
    recipients = data.recipients
      .map((r: any, idx: number) => ({
        id: String(r.id || `recipient-${idx + 1}`),
        email: String(r.email || '').trim().toLowerCase(),
        name: String(r.name || 'Admin Recipient').trim(),
        enabled: r.enabled !== false,
      }))
      .filter((r: EmailRecipient) => Boolean(r.email && r.email.includes('@')));
  } else if (typeof data.emails === 'string' && data.emails.trim().length > 0) {
    // Backwards compatibility with legacy comma-separated emails
    recipients = data.emails
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => e.includes('@'))
      .map((email: string, idx: number) => ({
        id: `recipient-legacy-${idx + 1}`,
        email,
        name: email.split('@')[0],
        enabled: true,
      }));
  }

  if (recipients.length === 0) {
    recipients = [...DEFAULT_EMAIL_NOTIFICATION_CONFIG.recipients];
  }

  const smtpData = data.smtp || {};
  const smtp: SmtpConfig = {
    host: String(smtpData.host || process.env.SMTP_HOST || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.host),
    port: Number(smtpData.port || process.env.SMTP_PORT) || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.port,
    secure: smtpData.secure !== undefined ? Boolean(smtpData.secure) : DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.secure,
    user: String(smtpData.user || process.env.SMTP_USER || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.user),
    pass: String(smtpData.pass || process.env.SMTP_PASS || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.pass),
    fromName: String(smtpData.fromName || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.fromName),
    fromEmail: String(smtpData.fromEmail || DEFAULT_EMAIL_NOTIFICATION_CONFIG.smtp.fromEmail),
  };

  return {
    enabled: data.enabled !== false,
    recipients,
    sendCustomerConfirmation: data.sendCustomerConfirmation !== false,
    smtp,
    updatedAt: data.updatedAt,
  };
}
