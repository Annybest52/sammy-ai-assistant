import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { config } from './config/index.js';
import { agentRouter } from './api/agent.routes.js';
import { calendarRouter } from './api/calendar.routes.js';
import { scrapeRouter } from './api/scrape.routes.js';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { MemoryManager } from './memory/manager.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for development
app.use(express.json());

// Serve static audio files from public folder
app.use('/audio', express.static('public/audio'));

// API Routes
app.use('/api/agent', agentRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/scrape', scrapeRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize services
const memoryManager = new MemoryManager();

// Lazy initialization - only create orchestrator when needed
let agentOrchestrator: AgentOrchestrator | null = null;

function getOrchestrator(): AgentOrchestrator {
  if (!agentOrchestrator) {
    agentOrchestrator = new AgentOrchestrator(memoryManager);
  }
  return agentOrchestrator;
}

// WebSocket handling for real-time chat
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  let sessionId = socket.handshake.query.sessionId as string;
  
  socket.on('chat:message', async (data: { message: string; userId?: string; stream?: boolean }) => {
    try {
      const { message, userId, stream = true } = data;
      
      console.log(`📨 Message received: "${message}" (stream: ${stream})`);
      
      // Emit typing indicator
      socket.emit('agent:typing', { isTyping: true });

      if (stream) {
        // Use streaming for faster perceived response
        await getOrchestrator().processMessageStream({
          message,
          sessionId,
          userId: userId || 'anonymous',
          onToken: (token: string) => {
            socket.emit('agent:stream', { token });
          },
          onComplete: (fullText: string) => {
            socket.emit('agent:typing', { isTyping: false });
            socket.emit('agent:response', {
              message: fullText,
              actions: [],
              timestamp: new Date().toISOString(),
            });
            console.log(`🤖 Streamed response complete: "${fullText.substring(0, 100)}..."`);
          },
        });
      } else {
        // Non-streaming fallback
        const response = await getOrchestrator().processMessage({
          message,
          sessionId,
          userId: userId || 'anonymous',
        });

        socket.emit('agent:typing', { isTyping: false });
        
        console.log(`🤖 Response: "${response.text.substring(0, 100)}..."`);
        
        socket.emit('agent:response', {
          message: response.text,
          actions: response.actions,
          audioUrl: response.audioUrl,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error: any) {
      console.error('Error processing message:', error);
      socket.emit('agent:typing', { isTyping: false });
      
      // Provide helpful error message for missing API key
      if (error?.message?.includes('OPENAI_API_KEY')) {
        socket.emit('agent:error', { 
          message: 'Server configuration error: OpenAI API key is missing. Please contact support.' 
        });
      } else {
        socket.emit('agent:error', { 
          message: 'Sorry, I encountered an error. Please try again.' 
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start server
httpServer.listen(config.port, () => {
  console.log(`
  🤖 AI Agent Backend Running!
  ============================
  📡 Server: http://localhost:${config.port}
  🔌 WebSocket: ws://localhost:${config.port}
  📊 Health: http://localhost:${config.port}/health
  `);
});

export { io };


