import type { ProviderAdapter, ProviderConfig } from './types';

export const EmailAdapter: ProviderAdapter = {
  name: 'email',

  isConfigured(config: ProviderConfig): boolean {
    return !!(config.sendgrid_api_key && config.sendgrid_from_email);
  },

  validateConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.sendgrid_api_key) {
      errors.push('SendGrid API Key is required');
    }
    if (!config.sendgrid_from_email) {
      errors.push('SendGrid From Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.sendgrid_from_email)) {
      errors.push('SendGrid From Email must be a valid email address');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  async sendMessage(
    to: string,
    content: string,
    config: ProviderConfig,
    mediaUrls?: string[]
  ): Promise<{ success: boolean; external_id?: string; error?: string }> {
    if (!this.isConfigured(config)) {
      return { success: false, error: 'SendGrid not configured' };
    }

    try {
      const emailPayload: any = {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.sendgrid_from_email },
        subject: 'New Message',
        content: [{ type: 'text/plain', value: content }]
      };

      if (mediaUrls && mediaUrls.length > 0) {
        emailPayload.attachments = mediaUrls.map((url, index) => ({
          content: url,
          filename: `attachment_${index + 1}`,
          type: 'application/octet-stream',
          disposition: 'attachment'
        }));
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.sendgrid_api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid API error:', error);
        return { success: false, error: `SendGrid API error: ${error}` };
      }

      const messageId = response.headers.get('x-message-id');
      return {
        success: true,
        external_id: messageId || undefined
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
