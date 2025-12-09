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
  private knowledgeBase: any; // Lazy-loaded

  constructor(memoryManager: MemoryManager) {
    const apiKey = config.openai.apiKey;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required. Please set it in your Railway environment variables.');
    }
    this.openai = new OpenAI({ apiKey });
    this.memoryManager = memoryManager;
  }

  // Lazy-load knowledge base
  private async getKnowledgeBase() {
    if (!this.knowledgeBase) {
      const { KnowledgeBase } = await import('../knowledge/base.js');
      this.knowledgeBase = new KnowledgeBase();
    }
    return this.knowledgeBase;
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

    // Detect if this seems like a problem-solving conversation
    const isProblemSolved = history.length > 0 && 
      (history[history.length - 1]?.role === 'assistant' && 
       (history[history.length - 1]?.content.toLowerCase().includes('great') ||
        history[history.length - 1]?.content.toLowerCase().includes('perfect') ||
        history[history.length - 1]?.content.toLowerCase().includes('done') ||
        history[history.length - 1]?.content.toLowerCase().includes('solved')));

    // Get relevant knowledge from scraped website content
    let knowledgeContext = '';
    try {
      const kb = await this.getKnowledgeBase();
      const knowledgeResults = await kb.search(message, 3); // Get top 3 relevant results
      if (knowledgeResults.length > 0) {
        knowledgeContext = '\n\nRELEVANT COMPANY INFORMATION FROM WEBSITE:\n';
        knowledgeResults.forEach((result: { title: string; content: string }, idx: number) => {
          knowledgeContext += `\n[${idx + 1}] ${result.title}\n${result.content.substring(0, 500)}\n`;
        });
      }
    } catch (error) {
      console.warn('Knowledge base search failed (continuing anyway):', error);
    }

    // Build system prompt
    const systemPrompt = `You are Sammy, a warm and friendly assistant for Dealey Media International. You're here to help customers naturally, like a helpful colleague.
${knowledgeContext}

PERSONALITY & TONE:
- Be conversational and natural - talk like a real person, not a robot
- Use friendly, casual language (but stay professional)
- Show genuine interest in helping
- Keep responses concise (1-2 sentences, max 3)
- Use natural transitions and follow-ups
- After solving a problem or completing a task, ALWAYS ask: "Is there anything else I can help you with?" or "What else can I do for you today?"

IMPORTANT: Make customers forget they're talking to a bot. Be engaging, proactive, and genuinely helpful.

SERVICES OFFERED:
- Social Media Marketing
- SEO (Search Engine Optimization)
- Web Design & Development
- Content Creation
- PPC Advertising
- Brand Strategy

BOOKING APPOINTMENTS:
When someone wants to book an appointment:
1. Ask for their NAME (if not provided) - be friendly: "What's your name?"
2. Ask for their EMAIL (if not provided) - "And what's your email address?"
3. Ask what SERVICE they're interested in - "Which service are you interested in?"
4. Ask for preferred DATE and TIME - "When would work best for you?"
5. Confirm all details naturally and say "Perfect! Your appointment is booked!"

Current booking info for this customer:
${JSON.stringify(booking, null, 2)}

If all required info (name, email, service, date/time) is collected, confirm the booking!

CONTACT INFO:
- Email: info@dealeymediainternational.com
- Website: dealeymediainternational.com

${isProblemSolved ? 'IMPORTANT: The customer just had a problem solved. Be proactive and ask if they need anything else!' : ''}

Remember: Be natural, helpful, and make them feel like they're talking to a friend who genuinely cares about helping them.`;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8),
      { role: 'user', content: message },
    ];

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 120, // Reduced for faster responses
        temperature: 0.8, // Slightly higher for more natural conversation
        presence_penalty: 0.1, // Encourage variety in responses
      });

      let responseText = response.choices[0].message.content || "I'm here to help!";

      // Extract and store booking info from conversation
      this.extractBookingInfo(message, booking);

      // Check if booking is complete
      if (booking.name && booking.email && booking.service && (booking.date || booking.time)) {
        // Auto-confirm booking
        if (!responseText.toLowerCase().includes('booked') && !responseText.toLowerCase().includes('confirmed')) {
          responseText = `Perfect! I've booked your appointment:\n\n📋 Name: ${booking.name}\n📧 Email: ${booking.email}\n🎯 Service: ${booking.service}\n📅 Date/Time: ${booking.date || ''} ${booking.time || ''}\n\nYou'll receive a confirmation email shortly. Is there anything else I can help you with today?`;
        } else {
          // Add follow-up if not already present
          if (!responseText.toLowerCase().includes('anything else') && 
              !responseText.toLowerCase().includes('what else') &&
              !responseText.toLowerCase().includes('need help')) {
            responseText += " Is there anything else I can help you with?";
          }
        }
        
        // ALWAYS send confirmation emails & SMS when booking is complete
        console.log('📧📱 Sending booking confirmations...');
        console.log('📋 Booking details:', JSON.stringify(booking));
        
        // Format phone number if provided
        const bookingData = { 
          ...booking,
          phone: booking.phone ? formatPhoneNumber(booking.phone) || booking.phone : undefined
        };
        
        // Book in GoHighLevel first
        const ghlService = getGHLService();
        let ghlAppointmentId: string | undefined;
        
        if (ghlService && booking.name && booking.email && booking.service && (booking.date || booking.time)) {
          console.log('📅 Booking appointment in GoHighLevel...');
          const ghlResult = await ghlService.bookAppointment(
            booking.email,
            booking.name,
            booking.service,
            booking.date || 'tomorrow',
            booking.time || '10 AM',
            booking.phone,
            `Booked via Sammy AI Assistant\nService: ${booking.service}`
          );
          
          if (ghlResult.success) {
            ghlAppointmentId = ghlResult.appointmentId;
            console.log(`✅ GHL Appointment created: ${ghlAppointmentId}`);
          } else {
            console.error(`❌ GHL Booking failed: ${ghlResult.error}`);
          }
        }
        
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
          if (ghlAppointmentId) {
            console.log(`📅 GHL Appointment: ${ghlAppointmentId} ✅`);
          }
        }).catch(err => {
          console.error('📧📱 Notification error:', err);
        });
        
        // Clear booking after confirmation
        pendingBookings.set(sessionId, {});
      }

      // Add proactive follow-up if this seems like a completed task/problem
      const lowerResponse = responseText.toLowerCase();
      const isCompletingTask = lowerResponse.includes('done') || 
                               lowerResponse.includes('complete') ||
                               lowerResponse.includes('solved') ||
                               lowerResponse.includes('fixed') ||
                               lowerResponse.includes('booked') ||
                               lowerResponse.includes('confirmed') ||
                               lowerResponse.includes('perfect!') ||
                               lowerResponse.includes('great!');
      
      if (isCompletingTask && 
          !lowerResponse.includes('anything else') && 
          !lowerResponse.includes('what else') &&
          !lowerResponse.includes('need help') &&
          !lowerResponse.includes('can help')) {
        responseText += " Is there anything else I can help you with?";
      }

      // Save to history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: responseText });

      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      // Save to persistent storage
      try {
        await conversationStorage.saveMessage(sessionId, 'user', message, {
          userId: input.userId,
          email: booking.email,
          name: booking.name,
        });
        await conversationStorage.saveMessage(sessionId, 'assistant', responseText);
      } catch (error) {
        console.error('Error saving conversation to storage:', error);
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

    // Detect if this seems like a problem-solving conversation
    const isProblemSolved = history.length > 0 && 
      (history[history.length - 1]?.role === 'assistant' && 
       (history[history.length - 1]?.content.toLowerCase().includes('great') ||
        history[history.length - 1]?.content.toLowerCase().includes('perfect') ||
        history[history.length - 1]?.content.toLowerCase().includes('done') ||
        history[history.length - 1]?.content.toLowerCase().includes('solved')));

    const systemPrompt = `You are Sammy, a warm and friendly assistant for Dealey Media International. You're here to help customers naturally, like a helpful colleague.

PERSONALITY & TONE:
- Be conversational and natural - talk like a real person, not a robot
- Use friendly, casual language (but stay professional)
- Show genuine interest in helping
- Keep responses concise (1-2 sentences, max 3)
- Use natural transitions and follow-ups
- After solving a problem or completing a task, ALWAYS ask: "Is there anything else I can help you with?" or "What else can I do for you today?"

IMPORTANT: Make customers forget they're talking to a bot. Be engaging, proactive, and genuinely helpful.

SERVICES OFFERED:
- Social Media Marketing
- SEO (Search Engine Optimization)
- Web Design & Development
- Content Creation
- PPC Advertising
- Brand Strategy

BOOKING APPOINTMENTS:
When someone wants to book an appointment:
1. Ask for their NAME (if not provided) - be friendly: "What's your name?"
2. Ask for their EMAIL (if not provided) - "And what's your email address?"
3. Ask what SERVICE they're interested in - "Which service are you interested in?"
4. Ask for preferred DATE and TIME - "When would work best for you?"
5. Confirm all details naturally and say "Perfect! Your appointment is booked!"

Current booking info for this customer:
${JSON.stringify(booking, null, 2)}

If all required info (name, email, service, date/time) is collected, confirm the booking!

CONTACT INFO:
- Email: info@dealeymediainternational.com
- Website: dealeymediainternational.com

${isProblemSolved ? 'IMPORTANT: The customer just had a problem solved. Be proactive and ask if they need anything else!' : ''}

Remember: Be natural, helpful, and make them feel like they're talking to a friend who genuinely cares about helping them.`;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8),
      { role: 'user', content: message },
    ];

    try {
      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 120, // Reduced for faster responses
        temperature: 0.8, // Slightly higher for more natural conversation
        presence_penalty: 0.1, // Encourage variety in responses
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
          const bookingConfirm = `\n\n✅ Perfect! Your appointment is booked:\n📋 ${booking.name}\n📧 ${booking.email}\n🎯 ${booking.service}\n📅 ${booking.date || ''} ${booking.time || ''}\n\nYou'll receive a confirmation email shortly. Is there anything else I can help you with today?`;
          fullText += bookingConfirm;
          onToken(bookingConfirm);
        } else {
          // Add follow-up if not already present
          const lowerFull = fullText.toLowerCase();
          if (!lowerFull.includes('anything else') && 
              !lowerFull.includes('what else') &&
              !lowerFull.includes('need help')) {
            const followUp = " Is there anything else I can help you with?";
            fullText += followUp;
            onToken(followUp);
          }
        }
        
        // ALWAYS send confirmation emails & SMS when booking is complete
        console.log('📧📱 Sending booking confirmations...');
        console.log('📋 Booking details:', JSON.stringify(booking));
        
        // Format phone number if provided
        const bookingData = { 
          ...booking,
          phone: booking.phone ? formatPhoneNumber(booking.phone) || booking.phone : undefined
        };
        
        // Book in GoHighLevel first (with availability check)
        const ghlService = getGHLService();
        let ghlAppointmentId: string | undefined;
        let ghlError: string | undefined;
        
        if (ghlService && booking.name && booking.email && booking.service && (booking.date || booking.time)) {
          console.log('📅 Booking appointment in GoHighLevel...');
          const ghlResult = await ghlService.bookAppointment(
            booking.email,
            booking.name,
            booking.service,
            booking.date || 'tomorrow',
            booking.time || '10 AM',
            booking.phone,
            `Booked via Sammy AI Assistant\nService: ${booking.service}`
          );
          
          if (ghlResult.success) {
            ghlAppointmentId = ghlResult.appointmentId;
            console.log(`✅ GHL Appointment created: ${ghlAppointmentId}`);
          } else {
            ghlError = ghlResult.error;
            console.error(`❌ GHL Booking failed: ${ghlError}`);
            // Update response to mention availability issue
            if (ghlError.includes('not available') || ghlError.includes('already an appointment')) {
              fullText = `I'm sorry, but that time slot is already booked. Would you like to try a different time? ${fullText}`;
              onToken(`I'm sorry, but that time slot is already booked. Would you like to try a different time? `);
            }
          }
        }
        
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
          if (ghlAppointmentId) {
            console.log(`📅 GHL Appointment: ${ghlAppointmentId} ✅`);
          }
        }).catch(err => {
          console.error('📧📱 Notification error:', err);
        });
        
        // Clear booking after confirmation
        pendingBookings.set(sessionId, {});
      }

      // Add proactive follow-up if this seems like a completed task/problem
      const lowerFull = fullText.toLowerCase();
      const isCompletingTask = lowerFull.includes('done') || 
                               lowerFull.includes('complete') ||
                               lowerFull.includes('solved') ||
                               lowerFull.includes('fixed') ||
                               lowerFull.includes('booked') ||
                               lowerFull.includes('confirmed') ||
                               lowerFull.includes('perfect!') ||
                               lowerFull.includes('great!');
      
      if (isCompletingTask && 
          !lowerFull.includes('anything else') && 
          !lowerFull.includes('what else') &&
          !lowerFull.includes('need help') &&
          !lowerFull.includes('can help')) {
        const followUp = " Is there anything else I can help you with?";
        fullText += followUp;
        onToken(followUp);
      }

      // Save to history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: fullText });

      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      // Save to persistent storage
      try {
        await conversationStorage.saveMessage(sessionId, 'user', message, {
          userId: input.userId,
          email: booking.email,
          name: booking.name,
        });
        await conversationStorage.saveMessage(sessionId, 'assistant', fullText);
      } catch (error) {
        console.error('Error saving conversation to storage:', error);
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

  // Get conversation history for a session
  getConversationHistory(sessionId: string): { role: 'user' | 'assistant'; content: string }[] {
    return conversations.get(sessionId) || [];
  }

  // Get all conversation sessions (for admin/debugging)
  getAllSessions(): string[] {
    return Array.from(conversations.keys());
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
