import OpenAI from 'openai';
import { config } from '../config/index.js';
import { MemoryManager } from '../memory/manager.js';
import { sendBookingConfirmation, sendBookingNotification } from '../services/email.js';
import { sendBookingSMS, sendBookingNotificationSMS, formatPhoneNumber } from '../services/sms.js';
import { conversationStorage } from '../storage/conversations.js';
import { getGHLService } from '../services/ghl.js';

interface ProcessMessageInput {
  message: string;
  sessionId: string;
  userId: string;
  accent?: string;
}

interface StreamMessageInput extends ProcessMessageInput {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  accent?: string;
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

interface BookingInfo {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  date?: string;
  time?: string;
}

const conversations: Map<string, { role: 'user' | 'assistant'; content: string }[]> = new Map();
const pendingBookings: Map<string, BookingInfo> = new Map();

export class AgentOrchestrator {
  private openai: OpenAI;
  private memoryManager: MemoryManager;
  private knowledgeBase: any;

  constructor(memoryManager: MemoryManager) {
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    this.memoryManager = memoryManager;
  }

  async processMessage(input: ProcessMessageInput): Promise<AgentResponse> {
    const { message, sessionId, accent = 'en-US' } = input;
    
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId)!;

    if (!pendingBookings.has(sessionId)) {
      pendingBookings.set(sessionId, {});
    }
    const booking = pendingBookings.get(sessionId)!;

    // Extract booking info using OpenAI structured output
    await this.extractBookingInfoAI(message, history, booking);

    const systemPrompt = `You are Sammy, a warm and friendly assistant for Dealey Media International.

PERSONALITY:
- Be conversational and natural
- Keep responses concise (1-2 sentences)
- Show genuine interest

SERVICES: Social Media Marketing, SEO, Web Design, Content Creation, PPC Advertising, Brand Strategy

BOOKING: When someone wants to book, collect: name, email, service, date/time. Be friendly and natural.

Current booking info: ${JSON.stringify(booking)}

If all info is collected (name, email, service, date/time), confirm the booking naturally.`;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8),
      { role: 'user', content: message },
    ];

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 120,
        temperature: 0.8,
      });

      let responseText = response.choices[0].message.content || "I'm here to help!";

      // Check if booking is complete and trigger booking
      if (booking.name && booking.email && booking.service && (booking.date || booking.time)) {
        if (!responseText.toLowerCase().includes('booked') && !responseText.toLowerCase().includes('confirmed')) {
          responseText = `Perfect! I've booked your appointment:\n\n📋 Name: ${booking.name}\n📧 Email: ${booking.email}\n🎯 Service: ${booking.service}\n📅 Date/Time: ${booking.date || ''} ${booking.time || ''}\n\nYou'll receive a confirmation email shortly.`;
        }
        
        // Book in GHL
        await this.processBooking(sessionId, booking);
        
        // Clear booking
        pendingBookings.set(sessionId, {});
      }

      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: responseText });

      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      await conversationStorage.saveMessage(sessionId, 'user', message, {
        userId: input.userId,
        email: booking.email,
        name: booking.name,
      });
      await conversationStorage.saveMessage(sessionId, 'assistant', responseText);

      return { text: responseText, actions: [] };
    } catch (error) {
      console.error('OpenAI Error:', error);
      return { text: "I'm having trouble right now. Please try again!", actions: [] };
    }
  }

  async processMessageStream(input: StreamMessageInput): Promise<void> {
    const { message, sessionId, onToken, onComplete, accent = 'en-US' } = input;
    
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId)!;

    if (!pendingBookings.has(sessionId)) {
      pendingBookings.set(sessionId, {});
    }
    const booking = pendingBookings.get(sessionId)!;

    // Extract booking info using OpenAI
    await this.extractBookingInfoAI(message, history, booking);

    const systemPrompt = `You are Sammy, a warm and friendly assistant for Dealey Media International.

PERSONALITY:
- Be conversational and natural
- Keep responses concise (1-2 sentences)
- Show genuine interest

SERVICES: Social Media Marketing, SEO, Web Design, Content Creation, PPC Advertising, Brand Strategy

BOOKING: When someone wants to book, collect: name, email, service, date/time. Be friendly and natural.

Current booking info: ${JSON.stringify(booking)}

If all info is collected (name, email, service, date/time), confirm the booking naturally.`;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8),
      { role: 'user', content: message },
    ];

    try {
      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 120,
        temperature: 0.8,
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
        if (!fullText.toLowerCase().includes('booked') && !fullText.toLowerCase().includes('confirmed')) {
          const bookingConfirm = `\n\n✅ Perfect! Your appointment is booked:\n📋 ${booking.name}\n📧 ${booking.email}\n🎯 ${booking.service}\n📅 ${booking.date || ''} ${booking.time || ''}\n\nYou'll receive a confirmation email shortly.`;
          fullText += bookingConfirm;
          onToken(bookingConfirm);
        }
        
        // Book in GHL
        await this.processBooking(sessionId, booking);
        
        // Clear booking
        pendingBookings.set(sessionId, {});
      }

      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: fullText });

      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      await conversationStorage.saveMessage(sessionId, 'user', message, {
        userId: input.userId,
        email: booking.email,
        name: booking.name,
      });
      await conversationStorage.saveMessage(sessionId, 'assistant', fullText);

      onComplete(fullText);
    } catch (error) {
      console.error('Streaming Error:', error);
      const errorMsg = "I'm having trouble right now. Please try again!";
      onToken(errorMsg);
      onComplete(errorMsg);
    }
  }

  // Use OpenAI to extract booking info reliably
  private async extractBookingInfoAI(message: string, history: any[], booking: BookingInfo): Promise<void> {
    try {
      const recentContext = history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
      const extractionPrompt = `Extract booking information from this conversation. Return ONLY valid JSON with the structure:
{
  "name": "extracted name or null",
  "email": "extracted email or null", 
  "phone": "extracted phone or null",
  "service": "one of: Social Media Marketing, SEO, Web Design, Content Creation, PPC Advertising, Brand Strategy, or null",
  "date": "extracted date (e.g., Monday, Tuesday, tomorrow, today) or null",
  "time": "extracted time (e.g., 2 PM, 2:00 PM, morning, afternoon) or null"
}

Current message: "${message}"
Recent context:
${recentContext}

Current booking state: ${JSON.stringify(booking)}

Extract ONLY new information from the current message. If a field already has a value and the new message doesn't provide a better/clearer value, keep the existing value.
Return valid JSON only, no other text.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: extractionPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 200,
      });

      const extracted = JSON.parse(response.choices[0].message.content || '{}') as BookingInfo;
      
      // Merge extracted info (only update if new value is provided)
      if (extracted.name) booking.name = extracted.name;
      if (extracted.email) {
        // Clean email
        booking.email = extracted.email
          .toLowerCase()
          .replace(/addressis/gi, '')
          .replace(/merciani/gi, 'mercyanny')
          .replace(/messiani/gi, 'mercyanny')
          .trim();
      }
      if (extracted.phone) booking.phone = extracted.phone;
      if (extracted.service) booking.service = extracted.service;
      if (extracted.date) booking.date = extracted.date;
      if (extracted.time) booking.time = extracted.time;

    } catch (error) {
      // Fallback: simple regex extraction if AI fails
      this.extractBookingInfoFallback(message, booking);
    }
  }

  // Simple fallback extraction
  private extractBookingInfoFallback(message: string, booking: BookingInfo): void {
    const lower = message.toLowerCase();
    
    // Email
    const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      booking.email = emailMatch[0].toLowerCase()
        .replace(/addressis/gi, '')
        .replace(/merciani/gi, 'mercyanny')
        .replace(/messiani/gi, 'mercyanny');
    }
    
    // Name
    const nameMatch = message.match(/(?:name is|i'm|i am|is)\s+([A-Z][a-z]+)/i);
    if (nameMatch) booking.name = nameMatch[1];
    
    // Service
    if (lower.includes('seo') || lower.includes('optimization')) booking.service = 'SEO';
    else if (lower.includes('social media')) booking.service = 'Social Media Marketing';
    else if (lower.includes('web design')) booking.service = 'Web Design';
    else if (lower.includes('content')) booking.service = 'Content Creation';
    else if (lower.includes('ppc') || lower.includes('ads')) booking.service = 'PPC Advertising';
    else if (lower.includes('brand')) booking.service = 'Brand Strategy';
    
    // Date
    if (lower.includes('monday')) booking.date = 'Monday';
    else if (lower.includes('tuesday')) booking.date = 'Tuesday';
    else if (lower.includes('wednesday')) booking.date = 'Wednesday';
    else if (lower.includes('thursday')) booking.date = 'Thursday';
    else if (lower.includes('friday')) booking.date = 'Friday';
    else if (lower.includes('saturday') || lower === 'cp') booking.date = 'Saturday';
    else if (lower.includes('sunday')) booking.date = 'Sunday';
    else if (lower.includes('tomorrow')) booking.date = 'Tomorrow';
    else if (lower.includes('today')) booking.date = 'Today';
    
    // Time
    const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM|a\.m\.|p\.m\.)/i);
    if (timeMatch) {
      booking.time = `${timeMatch[1]}${timeMatch[2] ? ':' + timeMatch[2] : ''} ${timeMatch[3].replace(/\./g, '').toUpperCase()}`;
    } else if (lower.includes('morning')) booking.time = 'Morning';
    else if (lower.includes('afternoon')) booking.time = 'Afternoon';
    else if (lower.includes('evening')) booking.time = 'Evening';
  }

  // Process booking in GHL
  private async processBooking(sessionId: string, booking: BookingInfo): Promise<void> {
    const ghlService = getGHLService();
    if (!ghlService) {
      console.error('GHL not configured');
      return;
    }

    if (!booking.name || !booking.email || !booking.service || (!booking.date && !booking.time)) {
      console.error('Missing booking info');
      return;
    }

    try {
      const result = await ghlService.bookAppointment(
        booking.email,
        booking.name,
        booking.service,
        booking.date || 'tomorrow',
        booking.time || '10 AM',
        booking.phone
      );

      if (result.success) {
        console.log(`✅ GHL booking successful: ${result.appointmentId}`);
        
        // Send notifications
        const bookingData = { ...booking, phone: booking.phone ? formatPhoneNumber(booking.phone) || booking.phone : undefined };
        Promise.all([
          sendBookingConfirmation(bookingData),
          sendBookingNotification(bookingData),
          sendBookingSMS(bookingData),
          sendBookingNotificationSMS(bookingData),
        ]).catch(err => console.error('Notification error:', err));
      } else {
        console.error(`GHL booking failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
    }
  }

  getConversationHistory(sessionId: string): { role: 'user' | 'assistant'; content: string }[] {
    return conversations.get(sessionId) || [];
  }

  getAllSessions(): string[] {
    return Array.from(conversations.keys());
  }
}
