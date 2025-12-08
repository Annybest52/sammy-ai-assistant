import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { config } from '../config/index.js';

interface KnowledgeResult {
  id: string;
  title: string;
  content: string;
  source: string;
  score: number;
}

export class KnowledgeBase {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName: string;

  constructor() {
    this.pinecone = new Pinecone({ apiKey: config.pinecone.apiKey });
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    this.indexName = config.pinecone.index;
  }

  async search(query: string, topK: number = 5): Promise<KnowledgeResult[]> {
    try {
      // Generate embedding for query
      const embedding = await this.generateEmbedding(query);

      // Search Pinecone
      const index = this.pinecone.index(this.indexName);
      const results = await index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
      });

      return results.matches?.map(match => ({
        id: match.id,
        title: (match.metadata?.title as string) || 'Untitled',
        content: (match.metadata?.content as string) || '',
        source: (match.metadata?.source as string) || 'unknown',
        score: match.score || 0,
      })) || [];
    } catch (error) {
      console.error('Knowledge base search error:', error);
      return [];
    }
  }

  async addDocument(doc: {
    id: string;
    title: string;
    content: string;
    source: string;
    category?: string;
  }): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(`${doc.title}\n${doc.content}`);

      const index = this.pinecone.index(this.indexName);
      await index.upsert([
        {
          id: doc.id,
          values: embedding,
          metadata: {
            title: doc.title,
            content: doc.content,
            source: doc.source,
            category: doc.category || 'general',
            createdAt: new Date().toISOString(),
          },
        },
      ]);

      console.log(`✅ Added document to knowledge base: ${doc.title}`);
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  async addDocuments(docs: Array<{
    id: string;
    title: string;
    content: string;
    source: string;
    category?: string;
  }>): Promise<void> {
    const batchSize = 100;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      const vectors = await Promise.all(
        batch.map(async (doc) => ({
          id: doc.id,
          values: await this.generateEmbedding(`${doc.title}\n${doc.content}`),
          metadata: {
            title: doc.title,
            content: doc.content,
            source: doc.source,
            category: doc.category || 'general',
            createdAt: new Date().toISOString(),
          },
        }))
      );

      const index = this.pinecone.index(this.indexName);
      await index.upsert(vectors);
      console.log(`✅ Added batch ${i / batchSize + 1} of documents`);
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteOne(id);
      console.log(`🗑️ Deleted document: ${id}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1024, // Match Pinecone index dimensions
    });
    return response.data[0].embedding;
  }
}


