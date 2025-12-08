import twilio from 'twilio';
import { config } from '../config/index.js';

export class TwilioService {
  private client: twilio.Twilio | null = null;
  private phoneNumber: string;

  constructor() {
    this.phoneNumber = config.twilio.phoneNumber;
    
    if (config.twilio.accountSid && config.twilio.authToken &&
        config.twilio.accountSid !== 'your-account-sid') {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    }
  }

  async makeCall(to: string, message: string): Promise<{ callSid: string }> {
    if (!this.client) {
      console.log('📞 [MOCK] Making call:', { to, message });
      return { callSid: `mock-call-${Date.now()}` };
    }

    const call = await this.client.calls.create({
      to,
      from: this.phoneNumber,
      twiml: `
        <Response>
          <Say voice="alice">${message}</Say>
        </Response>
      `,
    });

    console.log(`📞 Call initiated to ${to}: ${call.sid}`);
    return { callSid: call.sid };
  }

  async sendSms(to: string, body: string): Promise<{ messageSid: string }> {
    if (!this.client) {
      console.log('💬 [MOCK] Sending SMS:', { to, body });
      return { messageSid: `mock-sms-${Date.now()}` };
    }

    const message = await this.client.messages.create({
      to,
      from: this.phoneNumber,
      body,
    });

    console.log(`💬 SMS sent to ${to}: ${message.sid}`);
    return { messageSid: message.sid };
  }

  async getCallStatus(callSid: string): Promise<string> {
    if (!this.client) {
      return 'mock-completed';
    }

    const call = await this.client.calls(callSid).fetch();
    return call.status;
  }

  // Generate TwiML for voice responses
  generateVoiceResponse(message: string, options?: {
    voice?: 'alice' | 'man' | 'woman';
    language?: string;
    gather?: {
      action: string;
      numDigits?: number;
      timeout?: number;
    };
  }): string {
    const voice = options?.voice || 'alice';
    const language = options?.language || 'en-US';

    if (options?.gather) {
      return `
        <Response>
          <Gather action="${options.gather.action}" numDigits="${options.gather.numDigits || 1}" timeout="${options.gather.timeout || 5}">
            <Say voice="${voice}" language="${language}">${message}</Say>
          </Gather>
        </Response>
      `;
    }

    return `
      <Response>
        <Say voice="${voice}" language="${language}">${message}</Say>
      </Response>
    `;
  }
}


