import { CalendarService } from '../services/calendar.js';
import { EmailService } from '../services/email.js';
import { TwilioService } from '../services/twilio.js';
import { KnowledgeBase } from '../knowledge/base.js';
import { CustomerService } from '../services/customer.js';

interface ExecutionContext {
  userId: string;
  sessionId: string;
}

export class ToolExecutor {
  private calendarService: CalendarService;
  private emailService: EmailService;
  private twilioService: TwilioService;
  private knowledgeBase: KnowledgeBase;
  private customerService: CustomerService;

  constructor() {
    this.calendarService = new CalendarService();
    this.emailService = new EmailService();
    this.twilioService = new TwilioService();
    this.knowledgeBase = new KnowledgeBase();
    this.customerService = new CustomerService();
  }

  async execute(toolName: string, args: Record<string, unknown>, context: ExecutionContext): Promise<unknown> {
    console.log(`🔧 Executing tool: ${toolName}`, { args, context });

    switch (toolName) {
      case 'search_knowledge_base':
        return await this.searchKnowledgeBase(args.query as string);

      case 'book_appointment':
        return await this.bookAppointment({
          customerName: args.customerName as string,
          customerEmail: args.customerEmail as string,
          dateTime: args.dateTime as string,
          duration: (args.duration as number) || 30,
          serviceType: args.serviceType as string,
          notes: args.notes as string,
        });

      case 'check_availability':
        return await this.checkAvailability(args.date as string);

      case 'send_email':
        return await this.sendEmail({
          to: args.to as string,
          subject: args.subject as string,
          body: args.body as string,
          type: args.type as string,
        });

      case 'initiate_call':
        return await this.initiateCall({
          phoneNumber: args.phoneNumber as string,
          message: args.message as string,
          purpose: args.purpose as string,
        });

      case 'save_customer_info':
        return await this.saveCustomerInfo({
          name: args.name as string,
          email: args.email as string,
          phone: args.phone as string,
          preferences: args.preferences as Record<string, unknown>,
        });

      case 'get_customer_info':
        return await this.getCustomerInfo(args.email as string);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async searchKnowledgeBase(query: string): Promise<string> {
    const results = await this.knowledgeBase.search(query);
    if (results.length === 0) {
      return 'No relevant information found in the knowledge base.';
    }
    return results.map(r => `${r.title}: ${r.content}`).join('\n\n');
  }

  private async bookAppointment(params: {
    customerName: string;
    customerEmail: string;
    dateTime: string;
    duration: number;
    serviceType: string;
    notes?: string;
  }): Promise<string> {
    try {
      const result = await this.calendarService.createEvent({
        title: `${params.serviceType} - ${params.customerName}`,
        description: params.notes || `Service: ${params.serviceType}`,
        startTime: new Date(params.dateTime),
        endTime: new Date(new Date(params.dateTime).getTime() + params.duration * 60000),
        attendees: [params.customerEmail],
      });

      // Send confirmation email
      await this.emailService.send({
        to: params.customerEmail,
        subject: `Appointment Confirmed - ${params.serviceType}`,
        html: `
          <h2>Your Appointment is Confirmed!</h2>
          <p>Dear ${params.customerName},</p>
          <p>Your appointment has been scheduled:</p>
          <ul>
            <li><strong>Service:</strong> ${params.serviceType}</li>
            <li><strong>Date/Time:</strong> ${new Date(params.dateTime).toLocaleString()}</li>
            <li><strong>Duration:</strong> ${params.duration} minutes</li>
          </ul>
          <p>We look forward to seeing you!</p>
        `,
      });

      return `Appointment successfully booked for ${params.customerName} on ${new Date(params.dateTime).toLocaleString()}. Confirmation email sent to ${params.customerEmail}.`;
    } catch (error) {
      return `Failed to book appointment: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async checkAvailability(date: string): Promise<string> {
    try {
      const slots = await this.calendarService.getAvailableSlots(new Date(date));
      if (slots.length === 0) {
        return `No available slots on ${date}. Please try a different date.`;
      }
      return `Available time slots on ${date}:\n${slots.map(s => `- ${s}`).join('\n')}`;
    } catch (error) {
      return `Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    type?: string;
  }): Promise<string> {
    try {
      await this.emailService.send({
        to: params.to,
        subject: params.subject,
        html: params.body,
      });
      return `Email successfully sent to ${params.to} with subject: "${params.subject}"`;
    } catch (error) {
      return `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async initiateCall(params: {
    phoneNumber: string;
    message: string;
    purpose?: string;
  }): Promise<string> {
    try {
      await this.twilioService.makeCall(params.phoneNumber, params.message);
      return `Call initiated to ${params.phoneNumber}. Message: "${params.message}"`;
    } catch (error) {
      return `Failed to initiate call: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async saveCustomerInfo(params: {
    name: string;
    email: string;
    phone?: string;
    preferences?: Record<string, unknown>;
  }): Promise<string> {
    try {
      await this.customerService.upsertCustomer(params);
      return `Customer information saved for ${params.name} (${params.email})`;
    } catch (error) {
      return `Failed to save customer info: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async getCustomerInfo(email: string): Promise<string> {
    try {
      const customer = await this.customerService.getByEmail(email);
      if (!customer) {
        return `No customer found with email: ${email}`;
      }
      return JSON.stringify(customer, null, 2);
    } catch (error) {
      return `Failed to get customer info: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}


