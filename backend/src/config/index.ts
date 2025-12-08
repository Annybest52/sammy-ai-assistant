import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini', // Faster model for quicker responses
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  },

  // Pinecone
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY!,
    index: process.env.PINECONE_INDEX || 'ai-agent-knowledge',
  },

  // Google Calendar
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  },

  // Calendly
  calendly: {
    apiKey: process.env.CALENDLY_API_KEY!,
  },

  // Email
  email: {
    resendApiKey: process.env.RESEND_API_KEY!,
    from: process.env.EMAIL_FROM || 'assistant@yourdomain.com',
  },

  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
  },

  // ElevenLabs
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY!,
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL', // Default: Sarah
  },
};


