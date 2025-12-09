import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  sessionId: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
  metadata?: {
    userId?: string;
    email?: string;
    name?: string;
  };
}

const STORAGE_DIR = path.join(__dirname, '../../data/conversations');

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating storage directory:', error);
  }
}

// Initialize on module load
ensureStorageDir();

export class ConversationStorage {
  // Save a conversation message
  async saveMessage(sessionId: string, role: 'user' | 'assistant', content: string, metadata?: { userId?: string; email?: string; name?: string }) {
    try {
      await ensureStorageDir();
      
      const filePath = path.join(STORAGE_DIR, `${sessionId}.json`);
      
      let conversation: Conversation;
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        conversation = JSON.parse(fileContent);
      } catch {
        // File doesn't exist, create new conversation
        conversation = {
          sessionId,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: metadata || {},
        };
      }

      // Add new message
      conversation.messages.push({
        role,
        content,
        timestamp: new Date().toISOString(),
      });

      // Update metadata if provided
      if (metadata) {
        conversation.metadata = { ...conversation.metadata, ...metadata };
      }

      conversation.updatedAt = new Date().toISOString();

      // Save to file
      await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8');
      
      return conversation;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  // Get a conversation by session ID
  async getConversation(sessionId: string): Promise<Conversation | null> {
    try {
      const filePath = path.join(STORAGE_DIR, `${sessionId}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      return null;
    }
  }

  // Get all conversations
  async getAllConversations(): Promise<Conversation[]> {
    try {
      await ensureStorageDir();
      
      const files = await fs.readdir(STORAGE_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const conversations: Conversation[] = [];
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(STORAGE_DIR, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const conversation = JSON.parse(fileContent);
          conversations.push(conversation);
        } catch (error) {
          console.error(`Error reading conversation file ${file}:`, error);
        }
      }

      // Sort by updatedAt (most recent first)
      return conversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Error getting all conversations:', error);
      return [];
    }
  }

  // Get conversations by date range
  async getConversationsByDateRange(startDate: Date, endDate: Date): Promise<Conversation[]> {
    const all = await this.getAllConversations();
    return all.filter(conv => {
      const updated = new Date(conv.updatedAt);
      return updated >= startDate && updated <= endDate;
    });
  }

  // Search conversations by content or metadata
  async searchConversations(query: string): Promise<Conversation[]> {
    const all = await this.getAllConversations();
    const lowerQuery = query.toLowerCase();
    
    return all.filter(conv => {
      // Search in messages
      const messageMatch = conv.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      );
      
      // Search in metadata
      const metadataMatch = 
        conv.metadata?.email?.toLowerCase().includes(lowerQuery) ||
        conv.metadata?.name?.toLowerCase().includes(lowerQuery) ||
        conv.sessionId.toLowerCase().includes(lowerQuery);
      
      return messageMatch || metadataMatch;
    });
  }
}

export const conversationStorage = new ConversationStorage();

