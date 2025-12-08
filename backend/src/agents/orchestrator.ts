import OpenAI from 'openai';
import { config } from '../config/index.js';
import { MemoryManager } from '../memory/manager.js';
import { sendBookingConfirmation, sendBookingNotification } from '../services/email.js';
import { sendBookingSMS, sendBookingNotificationSMS, formatPhoneNumber } from '../services/sms.js';

interface ProcessMessageInput {
  message: string;
  sessionId: string;
  userId: string;
}

interface StreamMessageInput extends ProcessMessageInput {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
}

interface AgentResponse {
  text: string;
  actions: ActionTaken[];
  audioUrl?: string;
}

interface ActionTaken {
  tool: string;
  result: string;
  success: boolean;
}

// Simple in-memory conversation store
const conversations: Map<string, { role: 'user' | 'assistant'; content: string }[]> = new Map();

// Pending bookings store
const pendingBookings: Map<string, {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  date?: string;
  time?: string;
}> = new Map();

export class AgentOrchestrator {
  private openai: OpenAI;
  private memoryManager: MemoryManager;

  constructor(memoryManager: MemoryManager) {
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    this.memoryManager = memoryManager;
  }

  async processMessage(input: ProcessMessageInput): Promise<AgentResponse> {
    const { message, sessionId } = input;
    const startTime = Date.now();
    
    console.log(`⏱️ Processing: "${message}"`);

    // Get or create conversation history
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId)!;

    // Get or create pending booking
    if (!pendingBookings.has(sessionId)) {
      pendingBookings.set(sessionId, {});
    }
    const booking = pendingBookings.get(sessionId)!;

    // Check for booking-related keywords
    const lowerMessage = message.toLowerCase();
    const isBookingRequest = lowerMessage.includes('book') || 
                            lowerMessage.includes('appointment') || 
                            lowerMessage.includes('schedule') ||
                            lowerMessage.includes('meeting');

    // Build system prompt
    const systemPrompt = `You are Sammy, a friendly AI assistant for Dealey Media International, a digital marketing agency.

IMPORTANT RULES:
- Keep responses SHORT (2-3 sentences max)
- Be warm, friendly, and professional
- You CAN book appointments!

SERVICES OFFERED:
- Social Media Marketing
- SEO (Search Engine Optimization)
- Web Design & Development
- Content Creation
- PPC Advertising
- Brand Strategy

BOOKING APPOINTMENTS:
When someone wants to book an appointment:
1. Ask for their NAME (if not provided)
2. Ask for their EMAIL (if not provided)
3. Ask what SERVICE they're interested in
4. Ask for preferred DATE and TIME
5. Confirm all details and say "Your appointment is booked!"

Current booking info for this customer:
${JSON.stringify(booking, null, 2)}

If all required info (name, email, service, date/time) is collected, confirm the booking!

CONTACT INFO:
- Email: info@dealeymediainternational.com
- Website: dealeymediainternational.com

Be helpful and guide customers to book appointments!`;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8),
      { role: 'user', content: message },
    ];

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 200,
        temperature: 0.7,
      });

      let responseText = response.choices[0].message.content || "I'm here to help!";

      // Extract and store booking info from conversation
      this.extractBookingInfo(message, booking);

      // Check if booking is complete
      if (booking.name && booking.email && booking.service && (booking.date || booking.time)) {
        // Auto-confirm booking
        if (!responseText.toLowerCase().includes('booked') && !responseText.toLowerCase().includes('confirmed')) {
          responseText = `Perfect! I've booked your appointment:\n\n📋 Name: ${booking.name}\n📧 Email: ${booking.email}\n🎯 Service: ${booking.service}\n📅 Date/Time: ${booking.date || ''} ${booking.time || ''}\n\nYou'll receive a confirmation email shortly. Is there anything else I can help with?`;
        }
        
        // ALWAYS send confirmation emails & SMS when booking is complete
        console.log('📧📱 Sending booking confirmations...');
        console.log('📋 Booking details:', JSON.stringify(booking));
        
        // Format phone number if provided
        const bookingData = { 
          ...booking,
          phone: booking.phone ? formatPhoneNumber(booking.phone) || booking.phone : undefined
        };
        
        Promise.all([
          sendBookingConfirmation(bookingData),
          sendBookingNotification(bookingData),
          sendBookingSMS(bookingData),
          sendBookingNotificationSMS(bookingData),
        ]).then(([customerEmail, businessEmail, customerSMS, businessSMS]) => {
          console.log(`📧 Customer email: ${customerEmail ? 'SENT ✅' : 'FAILED ❌'}`);
          console.log(`📧 Business email: ${businessEmail ? 'SENT ✅' : 'FAILED ❌'}`);
          console.log(`📱 Customer SMS: ${customerSMS ? 'SENT ✅' : 'SKIPPED ⏭️'}`);
          console.log(`📱 Business SMS: ${businessSMS ? 'SENT ✅' : 'SKIPPED ⏭️'}`);
        }).catch(err => {
          console.error('📧📱 Notification error:', err);
        });
        
        // Clear booking after confirmation
        pendingBookings.set(sessionId, {});
      }

      // Save to history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: responseText });

      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Response in ${duration}ms`);

      return {
        text: responseText,
        actions: [],
      };
    } catch (error) {
      console.error('❌ OpenAI Error:', error);
      return {
        text: "I'm having trouble right now. Please try again!",
        actions: [],
      };
    }
  }

  async processMessageStream(input: StreamMessageInput): Promise<void> {
    const { message, sessionId, onToken, onComplete } = input;
    const startTime = Date.now();
    
    console.log(`⏱️ Streaming: "${message}"`);

    // Get or create conversation history
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId)!;

    // Get or create pending booking
    if (!pendingBookings.has(sessionId)) {
      pendingBookings.set(sessionId, {});
    }
    const booking = pendingBookings.get(sessionId)!;

    // Extract booking info
    this.extractBookingInfo(message, booking);

    const systemPrompt = `You are Sammy, a friendly AI assistant for Dealey Media International, a digital marketing agency.

IMPORTANT RULES:
- Keep responses SHORT (2-3 sentences max)
- Be warm, friendly, and professional
- You CAN book appointments!

SERVICES OFFERED:
- Social Media Marketing
- SEO (Search Engine Optimization)
- Web Design & Development
- Content Creation
- PPC Advertising
- Brand Strategy

BOOKING APPOINTMENTS:
When someone wants to book an appointment:
1. Ask for their NAME (if not provided)
2. Ask for their EMAIL (if not provided)
3. Ask what SERVICE they're interested in
4. Ask for preferred DATE and TIME
5. Confirm all details and say "Your appointment is booked!"

Current booking info for this customer:
${JSON.stringify(booking, null, 2)}

If all required info (name, email, service, date/time) is collected, confirm the booking!

CONTACT INFO:
- Email: info@dealeymediainternational.com
- Website: dealeymediainternational.com`;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8),
      { role: 'user', content: message },
    ];

    try {
      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 200,
        temperature: 0.7,
        stream: true,
      });

      let fullText = '';

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullText += token;
          onToken(token);
        }
      }

      // Check if booking is complete
      if (booking.name && booking.email && booking.service && (booking.date || booking.time)) {
        // Add confirmation message if AI didn't already confirm
        if (!fullText.toLowerCase().includes('booked') && !fullText.toLowerCase().includes('confirmed')) {
          const bookingConfirm = `\n\n✅ Appointment Booked!\n📋 ${booking.name}\n📧 ${booking.email}\n🎯 ${booking.service}\n📅 ${booking.date || ''} ${booking.time || ''}`;
          fullText += bookingConfirm;
          onToken(bookingConfirm);
        }
        
        // ALWAYS send confirmation emails & SMS when booking is complete
        console.log('📧📱 Sending booking confirmations...');
        console.log('📋 Booking details:', JSON.stringify(booking));
        
        // Format phone number if provided
        const bookingData = { 
          ...booking,
          phone: booking.phone ? formatPhoneNumber(booking.phone) || booking.phone : undefined
        };
        
        // Send emails & SMS in background (don't block response)
        Promise.all([
          sendBookingConfirmation(bookingData),
          sendBookingNotification(bookingData),
          sendBookingSMS(bookingData),
          sendBookingNotificationSMS(bookingData),
        ]).then(([customerEmail, businessEmail, customerSMS, businessSMS]) => {
          console.log(`📧 Customer email: ${customerEmail ? 'SENT ✅' : 'FAILED ❌'}`);
          console.log(`📧 Business email: ${businessEmail ? 'SENT ✅' : 'FAILED ❌'}`);
          console.log(`📱 Customer SMS: ${customerSMS ? 'SENT ✅' : 'SKIPPED ⏭️'}`);
          console.log(`📱 Business SMS: ${businessSMS ? 'SENT ✅' : 'SKIPPED ⏭️'}`);
        }).catch(err => {
          console.error('📧📱 Notification error:', err);
        });
        
        // Clear booking after confirmation
        pendingBookings.set(sessionId, {});
      }

      // Save to history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: fullText });

      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Streamed in ${duration}ms`);

      onComplete(fullText);

    } catch (error) {
      console.error('❌ Streaming Error:', error);
      const errorMsg = "I'm having trouble right now. Please try again!";
      onToken(errorMsg);
      onComplete(errorMsg);
    }
  }

  private extractBookingInfo(message: string, booking: any) {
    const lower = message.toLowerCase();
    
    // Extract email
    const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      booking.email = emailMatch[0];
    }

    // Extract name (if they say "my name is X" or "I'm X" or "I am X")
    const nameMatch = message.match(/(?:my name is|i'm|i am|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) {
      booking.name = nameMatch[1];
    }

    // Extract phone
    const phoneMatch = message.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
    if (phoneMatch) {
      booking.phone = phoneMatch[0];
    }

    // Extract service interest
    if (lower.includes('social media')) booking.service = 'Social Media Marketing';
    else if (lower.includes('seo')) booking.service = 'SEO';
    else if (lower.includes('web design') || lower.includes('website')) booking.service = 'Web Design';
    else if (lower.includes('content')) booking.service = 'Content Creation';
    else if (lower.includes('ppc') || lower.includes('ads') || lower.includes('advertising')) booking.service = 'PPC Advertising';
    else if (lower.includes('brand')) booking.service = 'Brand Strategy';

    // Extract date/time mentions
    if (lower.includes('tomorrow')) booking.date = 'Tomorrow';
    else if (lower.includes('monday')) booking.date = 'Monday';
    else if (lower.includes('tuesday')) booking.date = 'Tuesday';
    else if (lower.includes('wednesday')) booking.date = 'Wednesday';
    else if (lower.includes('thursday')) booking.date = 'Thursday';
    else if (lower.includes('friday')) booking.date = 'Friday';

    // Extract time
    const timeMatch = message.match(/\b(\d{1,2})\s*(am|pm|AM|PM)\b/);
    if (timeMatch) {
      booking.time = `${timeMatch[1]} ${timeMatch[2].toUpperCase()}`;
    }
    if (lower.includes('morning')) booking.time = 'Morning (9-12)';
    else if (lower.includes('afternoon')) booking.time = 'Afternoon (12-5)';
    else if (lower.includes('evening')) booking.time = 'Evening (5-7)';
  }
}
