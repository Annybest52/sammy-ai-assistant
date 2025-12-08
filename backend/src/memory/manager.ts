import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export class MemoryManager {
  private supabase: SupabaseClient;
  private inMemoryCache: Map<string, Message[]> = new Map();

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceKey);
  }

  async getConversationHistory(sessionId: string, limit: number = 20): Promise<Message[]> {
    // Check cache first
    const cached = this.inMemoryCache.get(sessionId);
    if (cached && cached.length > 0) {
      return cached.slice(-limit);
    }

    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching conversation history:', error);
        return [];
      }

      const messages = (data as ConversationMessage[]).map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));

      // Update cache
      this.inMemoryCache.set(sessionId, messages);

      return messages;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  async saveMessage(
    sessionId: string,
    userId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    // Update in-memory cache
    if (!this.inMemoryCache.has(sessionId)) {
      this.inMemoryCache.set(sessionId, []);
    }
    this.inMemoryCache.get(sessionId)!.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Persist to Supabase
    try {
      const { error } = await this.supabase.from('conversations').insert({
        session_id: sessionId,
        user_id: userId,
        role,
        content,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  async clearSession(sessionId: string): Promise<void> {
    this.inMemoryCache.delete(sessionId);
    
    try {
      await this.supabase
        .from('conversations')
        .delete()
        .eq('session_id', sessionId);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  async getSessionSummary(sessionId: string): Promise<string> {
    const history = await this.getConversationHistory(sessionId, 50);
    if (history.length === 0) {
      return 'No conversation history.';
    }

    // Create a summary of key points from the conversation
    const userMessages = history.filter(m => m.role === 'user').map(m => m.content);
    return `Conversation with ${history.length} messages. User discussed: ${userMessages.slice(-5).join('; ')}`;
  }
}


