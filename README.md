# 🤖 AI Business Agent

A fully autonomous AI assistant for business tasks. Book appointments, answer questions, send emails, make calls, and provide real-time guidance - all powered by GPT-4.

![AI Agent](https://img.shields.io/badge/AI-Powered-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

- **🧠 Intelligent Conversations** - Natural language understanding with GPT-4
- **📅 Appointment Booking** - Google Calendar / Calendly integration
- **📧 Email Automation** - Send confirmations, follow-ups, and information
- **📞 Voice Calls** - Twilio integration for phone calls
- **🌐 Website Crawling** - Learn from your website and competitors
- **🔊 Voice Responses** - ElevenLabs TTS for natural speech
- **💾 Contextual Memory** - Remembers past conversations
- **⚡ Real-time Chat** - WebSocket-based instant messaging

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Chat Widget │  │ Admin Panel │  │ Voice Interface     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ WebSocket / REST
┌───────────────────────────▼─────────────────────────────────┐
│                     BACKEND (Node.js)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Agent Orchestrator                  │    │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │    │
│  │  │ GPT-4   │  │ Tools    │  │ Memory Manager     │  │    │
│  │  │ Brain   │  │ Executor │  │ (Short + Long)     │  │    │
│  │  └─────────┘  └──────────┘  └────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────── TOOLS ─────────────────────────────┐  │
│  │ Calendar │ Email │ Phone │ Scraper │ Knowledge Base   │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      EXTERNAL SERVICES                       │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Supabase │ │Pinecone │ │ Twilio   │ │ Google Calendar  │ │
│  │ (DB)     │ │(Vector) │ │ (Calls)  │ │ (Appointments)   │ │
│  └──────────┘ └─────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐                      │
│  │ OpenAI   │ │ElevenLab│ │ Resend   │                      │
│  │ (LLM)    │ │ (TTS)   │ │ (Email)  │                      │
│  └──────────┘ └─────────┘ └──────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Pinecone account
- OpenAI API key

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Copy `backend/env.example.txt` to `backend/.env` and fill in your API keys:

```env
# Required
OPENAI_API_KEY=sk-your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX=ai-agent-knowledge

# Optional (for full features)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
RESEND_API_KEY=your-resend-key
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### 3. Setup Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy contents of database/schema.sql and run in Supabase
```

### 4. Setup Pinecone

Create a Pinecone index:
- Name: `ai-agent-knowledge`
- Dimensions: `1536` (for OpenAI embeddings)
- Metric: `cosine`

### 5. Start Development

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Open http://localhost:3000 🎉

## 📚 API Reference

### Chat Endpoint

```http
POST /api/agent/chat
Content-Type: application/json

{
  "message": "I'd like to book an appointment",
  "sessionId": "optional-session-id",
  "userId": "optional-user-id"
}
```

### Scrape Website

```http
POST /api/scrape/website
Content-Type: application/json

{
  "url": "https://example.com",
  "maxPages": 10
}
```

### Check Calendar Availability

```http
GET /api/calendar/availability/2024-01-15
```

## 🛠️ Available Tools

The AI agent can use these tools autonomously:

| Tool | Description |
|------|-------------|
| `search_knowledge_base` | Search scraped website content |
| `book_appointment` | Create calendar events |
| `check_availability` | Check available time slots |
| `send_email` | Send transactional emails |
| `initiate_call` | Make phone calls via Twilio |
| `save_customer_info` | Store customer data |
| `get_customer_info` | Retrieve customer data |

## 🔧 Configuration

### Adding Website Knowledge

1. Open the Admin Panel (⚙️ icon)
2. Enter website URLs to scrape
3. Click "Scrape Websites"
4. The AI will learn from the content

### Customizing the Agent

Edit `backend/src/agents/prompts.ts` to customize:
- Agent personality
- Business-specific instructions
- Response formatting
- Available tools

## 📁 Project Structure

```
aiagent/
├── backend/
│   ├── src/
│   │   ├── agents/         # AI agent logic
│   │   ├── api/            # REST endpoints
│   │   ├── config/         # Configuration
│   │   ├── knowledge/      # Vector DB operations
│   │   ├── memory/         # Conversation memory
│   │   ├── scraper/        # Web scraping
│   │   ├── services/       # External integrations
│   │   └── tools/          # Agent tools
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── store/          # State management
│   └── package.json
├── database/
│   └── schema.sql          # Supabase schema
└── README.md
```

## 🔒 Security Notes

- Never expose API keys in frontend code
- Use Supabase RLS for database security
- Validate all user inputs
- Rate limit API endpoints in production

## 🚀 Production Deployment

### Backend (e.g., Railway, Render, DigitalOcean)

```bash
cd backend
npm run build
npm start
```

### Frontend (e.g., Vercel, Netlify)

```bash
cd frontend
npm run build
# Deploy dist/ folder
```

## 📈 Roadmap

- [ ] Multi-language support
- [ ] WhatsApp integration
- [ ] Slack/Teams integration
- [ ] Custom training on documents
- [ ] Analytics dashboard
- [ ] A/B testing for responses

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

## 📄 License

MIT License - feel free to use for commercial projects!

---

Built with ❤️ using GPT-4, React, Node.js, and modern AI tools.


