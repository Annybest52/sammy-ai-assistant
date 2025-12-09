import { Router, Request, Response } from 'express';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import { MemoryManager } from '../memory/manager.js';
import { v4 as uuid } from 'uuid';

const router = Router();
const memoryManager = new MemoryManager();

// Lazy initialization - only create orchestrator when needed
let agentOrchestrator: AgentOrchestrator | null = null;

function getOrchestrator(): AgentOrchestrator {
  if (!agentOrchestrator) {
    agentOrchestrator = new AgentOrchestrator(memoryManager);
  }
  return agentOrchestrator;
}

// Export for use in index.ts
export { getOrchestrator };

// POST /api/agent/chat - Main chat endpoint
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const session = sessionId || uuid();
    const user = userId || 'anonymous';

    const response = await getOrchestrator().processMessage({
      message,
      sessionId: session,
      userId: user,
    });

    res.json({
      success: true,
      response: response.text,
      actions: response.actions,
      audioUrl: response.audioUrl,
      sessionId: session,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
    });
  }
});

// GET /api/agent/history/:sessionId - Get conversation history
router.get('/history/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Try to get from orchestrator first (in-memory)
    const orchestrator = getOrchestrator();
    const history = orchestrator.getConversationHistory(sessionId);
    
    // If no history in orchestrator, try memory manager
    if (history.length === 0) {
      const memoryHistory = await memoryManager.getConversationHistory(sessionId);
      if (memoryHistory.length > 0) {
        return res.json({
          success: true,
          history: memoryHistory,
        });
      }
    }

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get history',
    });
  }
});

// GET /api/agent/transcript/:sessionId - Get formatted transcript
router.get('/transcript/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const orchestrator = getOrchestrator();
    const history = orchestrator.getConversationHistory(sessionId);
    
    // Format as readable transcript
    const transcript = history.map((msg, index) => {
      const timestamp = new Date().toISOString();
      const role = msg.role === 'user' ? 'User' : 'Sammy';
      return `[${timestamp}] ${role}: ${msg.content}`;
    }).join('\n\n');

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.txt"`);
    res.send(transcript);
  } catch (error) {
    console.error('Transcript error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate transcript',
    });
  }
});

// DELETE /api/agent/session/:sessionId - Clear session
router.delete('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    await memoryManager.clearSession(sessionId);

    res.json({
      success: true,
      message: 'Session cleared',
    });
  } catch (error) {
    console.error('Clear session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear session',
    });
  }
});

// POST /api/agent/session - Create new session
router.post('/session', async (req: Request, res: Response) => {
  const sessionId = uuid();
  res.json({
    success: true,
    sessionId,
  });
});

export { router as agentRouter };


