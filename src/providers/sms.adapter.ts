import type { ProviderAdapter, ProviderConfig } from './types';

export const SMSAdapter: ProviderAdapter = {
  name: 'sms',

  isConfigured(config: ProviderConfig): boolean {
    return !!(
      config.twilio_account_sid &&
      config.twilio_auth_token &&
      config.twilio_phone_number
    );
  },

  validateConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.twilio_account_sid) {
      errors.push('Twilio Account SID is required');
    }
    if (!config.twilio_auth_token) {
      errors.push('Twilio Auth Token is required');
    }
    if (!config.twilio_phone_number) {
      errors.push('Twilio Phone Number is required');
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
      return { success: false, error: 'Twilio SMS not configured' };
    }

    try {
      const auth = btoa(`${config.twilio_account_sid}:${config.twilio_auth_token}`);
      const body = new URLSearchParams({
        To: to,
        From: config.twilio_phone_number!,
        Body: content
      });

      if (mediaUrls && mediaUrls.length > 0) {
        mediaUrls.forEach(url => body.append('MediaUrl', url));
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.twilio_account_sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Twilio API error:', error);
        return { success: false, error: `Twilio API error: ${error}` };
      }

      const result = await response.json();
      return {
        success: true,
        external_id: result.sid
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
