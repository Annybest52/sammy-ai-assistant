import { Router, Request, Response } from 'express';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import { MemoryManager } from '../memory/manager.js';
import { v4 as uuid } from 'uuid';

const router = Router();
const memoryManager = new MemoryManager();
const agentOrchestrator = new AgentOrchestrator(memoryManager);

// POST /api/agent/chat - Main chat endpoint
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const session = sessionId || uuid();
    const user = userId || 'anonymous';

    const response = await agentOrchestrator.processMessage({
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
    const history = await memoryManager.getConversationHistory(sessionId);

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


