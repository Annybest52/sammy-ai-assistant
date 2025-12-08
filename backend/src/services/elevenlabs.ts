import axios from 'axios';
import { config } from '../config/index.js';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export class ElevenLabsService {
  private apiKey: string;
  private voiceId: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = config.elevenLabs.apiKey;
    this.voiceId = config.elevenLabs.voiceId;
  }

  async generateSpeech(text: string, options?: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
  }): Promise<string | undefined> {
    // Check if API key is configured
    if (!this.apiKey || this.apiKey === 'your-elevenlabs-key') {
      console.log('🔊 [MOCK] Generating speech for text:', text.substring(0, 50) + '...');
      return undefined;
    }

    try {
      const voiceId = options?.voiceId || this.voiceId;
      
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2', // Updated model for free tier
          voice_settings: {
            stability: options?.stability || 0.5,
            similarity_boost: options?.similarityBoost || 0.75,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      // Save to file and return URL (in production, upload to cloud storage)
      const filename = `speech-${uuid()}.mp3`;
      const audioPath = path.join(process.cwd(), 'public', 'audio', filename);
      
      // Ensure directory exists
      const audioDir = path.dirname(audioPath);
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      fs.writeFileSync(audioPath, response.data);
      
      // Return URL (adjust based on your hosting setup)
      return `/audio/${filename}`;
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  async getVoices(): Promise<Array<{ voice_id: string; name: string }>> {
    if (!this.apiKey || this.apiKey === 'your-elevenlabs-key') {
      return [
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
        { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
      ];
    }

    const response = await axios.get(`${this.baseUrl}/voices`, {
      headers: { 'xi-api-key': this.apiKey },
    });

    return response.data.voices;
  }

  async streamSpeech(text: string, onChunk: (chunk: Buffer) => void): Promise<void> {
    if (!this.apiKey || this.apiKey === 'your-elevenlabs-key') {
      console.log('🔊 [MOCK] Streaming speech...');
      return;
    }

    const response = await axios.post(
      `${this.baseUrl}/text-to-speech/${this.voiceId}/stream`,
      {
        text,
        model_id: 'eleven_multilingual_v2', // Updated model for free tier
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      }
    );

    response.data.on('data', (chunk: Buffer) => {
      onChunk(chunk);
    });

    return new Promise((resolve, reject) => {
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });
  }
}


