/**
 * Seed the Pinecone knowledge base with Dealey Media International data
 * Run with: pnpm tsx src/scripts/seed-knowledge.ts
 */

import { config } from '../config/index.js';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { v4 as uuid } from 'uuid';
import { KNOWLEDGE_DOCUMENTS } from '../data/dealey-media-knowledge.js';

async function seedKnowledgeBase() {
  console.log('🌱 Seeding Dealey Media International knowledge base...\n');

  // Initialize clients
  const pinecone = new Pinecone({ apiKey: config.pinecone.apiKey });
  const openai = new OpenAI({ apiKey: config.openai.apiKey });
  const index = pinecone.index(config.pinecone.index);

  // Generate embeddings and upsert documents
  for (const doc of KNOWLEDGE_DOCUMENTS) {
    try {
      console.log(`📄 Processing: ${doc.title}`);
      
      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `${doc.title}\n${doc.content}`,
        dimensions: 1024,
      });
      
      const embedding = embeddingResponse.data[0].embedding;

      // Upsert to Pinecone
      await index.upsert([
        {
          id: uuid(),
          values: embedding,
          metadata: {
            title: doc.title,
            content: doc.content,
            category: doc.category,
            source: 'https://dealeymediainternational.com',
            createdAt: new Date().toISOString(),
          },
        },
      ]);

      console.log(`   ✅ Added: ${doc.title}`);
    } catch (error) {
      console.error(`   ❌ Failed: ${doc.title}`, error);
    }
  }

  console.log('\n🎉 Knowledge base seeding complete!');
  console.log(`   📊 Total documents: ${KNOWLEDGE_DOCUMENTS.length}`);
  console.log('\n💡 Sammy now knows all about Dealey Media International!');
}

// Run the seeding
seedKnowledgeBase().catch(console.error);

