import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { conversationStorage } from '../storage/conversations.js';
import { testGHLCredentials } from '../services/ghl.js';

const router: ExpressRouter = Router();

// GET /api/admin/conversations - Get all conversations
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { search, startDate, endDate, limit } = req.query;
    
    let conversations;
    
    if (search) {
      conversations = await conversationStorage.searchConversations(search as string);
    } else if (startDate && endDate) {
      conversations = await conversationStorage.getConversationsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else {
      conversations = await conversationStorage.getAllConversations();
    }

    // Apply limit if provided
    if (limit) {
      conversations = conversations.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations',
    });
  }
});

// GET /api/admin/conversations/:sessionId - Get specific conversation
router.get('/conversations/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const conversation = await conversationStorage.getConversation(sessionId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation',
    });
  }
});

// GET /api/admin/stats - Get conversation statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const conversations = await conversationStorage.getAllConversations();
    
    const stats = {
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
      conversationsWithEmail: conversations.filter(c => c.metadata?.email).length,
      conversationsWithName: conversations.filter(c => c.metadata?.name).length,
      recentConversations: conversations.slice(0, 10).map(c => ({
        sessionId: c.sessionId,
        messageCount: c.messages.length,
        updatedAt: c.updatedAt,
        email: c.metadata?.email,
        name: c.metadata?.name,
      })),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// GET /api/admin/test-ghl - Test GHL credentials
router.get('/test-ghl', async (req: Request, res: Response) => {
  try {
    const result = await testGHLCredentials();
    res.json({
      success: result.valid,
      valid: result.valid,
      error: result.error,
      message: result.valid 
        ? '✅ GHL credentials are valid!' 
        : `❌ GHL credentials are invalid: ${result.error}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      valid: false,
      error: error.message || 'Unknown error',
    });
  }
});

export { router as adminRouter };

