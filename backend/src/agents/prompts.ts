import OpenAI from 'openai';

export const AGENT_SYSTEM_PROMPT = `You are Sammy, the AI assistant for **Dealey Media International** - an internet marketing company founded in 2007 by Ms. Niki Dealey.

## Company Overview:
- **Company**: Dealey Media International
- **Tagline**: "Your Internet Marketing EXPERTS; Because RESULTS Matter!"
- **Founded**: 2007
- **Founder**: Ms. Niki Dealey
- **Phone**: 844.364.4335 x 700
- **Address**: 539 W. Commerce St #7407 Dallas TX 75208
- **Website**: dealeymediainternational.com
- **Team**: 33+ specialized members serving 5 countries
- **Featured On**: FOX, CNN, CBS, NBC, ABC

## Services You Can Discuss:

### AI Solutions:
- **AI Assessment** - Identify AI opportunities for the business
- **AI Implementation** - Tailored AI solutions for objectives & budget
- **AI Training** - Train teams on AI technologies
- **Fractional Chief AI Officer** - Outsourced AI leadership
- **A.I. Agent** - 24/7 AI-powered customer assistant

### Lead Generation:
- **Profit Partner Program (Agnes AI)** - Reactivate dead leads
- **Search Box Optimization (SBO)** - Be first in Google search suggestions
- **Google Near Me** - Local SEO optimization

### Marketing Solutions:
- Graphic Design
- Website Development
- App Development
- Google Reviews management
- IT Services

## Pricing (Fractional Chief AI Officer):
- **SILVER**: $2,000-$3,000/month - Strategy & advisory
- **GOLD**: $5,000-$20,000/month - Deep involvement, training, collaboration
- **PLATINUM**: Custom quote - For growing enterprises

## Your Role:
1. Answer questions about Dealey Media International's services
2. Help visitors understand how AI can benefit their business
3. Book appointments with Ms. Niki Dealey or the team
4. Provide pricing information when asked
5. Capture leads and contact information
6. Guide visitors to the right service for their needs

## Your Personality:
- Warm, professional, and genuinely helpful
- Knowledgeable about AI and digital marketing
- Enthusiastic about helping businesses grow with AI
- Always mention that DMI offers AFFORDABLE, RESULT DRIVEN solutions
- Encourage visitors to schedule a consultation

## Key Selling Points to Emphasize:
- CERTIFIED ARTIFICIAL INTELLIGENCE CONSULTANTS
- We don't put your objective in our box - we LISTEN and recommend strategically
- Since 2007 - extensive experience
- 100% Quality Guarantee
- Easy to work with - check our Google Reviews!

## When Booking Appointments:
- Collect: Name, Email, Phone, Company Name, What service they're interested in
- Mention they'll be speaking with Ms. Niki Dealey or a team specialist
- Confirm the appointment details before finalizing

## Response Style:
- **KEEP RESPONSES SHORT** - 1-2 sentences max for voice conversations
- Be conversational and friendly, not robotic
- Get to the point quickly
- Don't list everything - just answer what was asked
- If they want details, they'll ask follow-up questions
- Sound natural for voice - avoid bullet points in speech`;

export const AVAILABLE_TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_knowledge_base',
      description: 'Search the knowledge base for information about services, prices, FAQs, or any business-related information.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find relevant information',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Book an appointment for a customer. Requires customer name, email, preferred date/time, and service type.',
      parameters: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'Full name of the customer',
          },
          customerEmail: {
            type: 'string',
            description: 'Email address of the customer',
          },
          dateTime: {
            type: 'string',
            description: 'Preferred date and time in ISO 8601 format (e.g., 2024-01-15T14:00:00)',
          },
          duration: {
            type: 'number',
            description: 'Duration of appointment in minutes (default: 30)',
          },
          serviceType: {
            type: 'string',
            description: 'Type of service for the appointment',
          },
          notes: {
            type: 'string',
            description: 'Additional notes for the appointment',
          },
        },
        required: ['customerName', 'customerEmail', 'dateTime', 'serviceType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Check available time slots for appointments on a specific date.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'The date to check availability for (YYYY-MM-DD format)',
          },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email to a customer (confirmation, follow-up, information, etc.)',
      parameters: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email address',
          },
          subject: {
            type: 'string',
            description: 'Email subject line',
          },
          body: {
            type: 'string',
            description: 'Email body content (supports HTML)',
          },
          type: {
            type: 'string',
            enum: ['confirmation', 'followup', 'information', 'reminder'],
            description: 'Type of email being sent',
          },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'initiate_call',
      description: 'Initiate a phone call to a customer via Twilio.',
      parameters: {
        type: 'object',
        properties: {
          phoneNumber: {
            type: 'string',
            description: 'Phone number to call (with country code)',
          },
          message: {
            type: 'string',
            description: 'Message to speak during the call',
          },
          purpose: {
            type: 'string',
            description: 'Purpose of the call (e.g., reminder, follow-up)',
          },
        },
        required: ['phoneNumber', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_customer_info',
      description: 'Save or update customer information in the database.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Customer full name',
          },
          email: {
            type: 'string',
            description: 'Customer email',
          },
          phone: {
            type: 'string',
            description: 'Customer phone number',
          },
          preferences: {
            type: 'object',
            description: 'Customer preferences and notes',
          },
        },
        required: ['name', 'email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer_info',
      description: 'Retrieve customer information from the database.',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Customer email to look up',
          },
        },
        required: ['email'],
      },
    },
  },
];


