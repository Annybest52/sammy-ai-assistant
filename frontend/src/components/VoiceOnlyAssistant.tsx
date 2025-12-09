import { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function VoiceOnlyAssistant({ onStarted }: { onStarted?: () => void }) {
  const [isActive, setIsActive] = useState(false);
  const [state, setState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  
  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const hasDetectedSpeechRef = useRef<boolean>(false);
  const stateRef = useRef<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const transcriptRef = useRef<string>('');
  const stopAndSendRef = useRef<(() => void) | null>(null);

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Text to speech
  const speak = useCallback((text: string, onDone?: () => void) => {
    window.speechSynthesis?.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text.substring(0, 500));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => onDone?.();
    utterance.onerror = () => onDone?.();
    
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) 
      || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // Send message
  const sendMessage = useCallback((text: string) => {
    const msg = text.trim();
    if (!msg || !socketRef.current?.connected) {
      setState('idle');
      return;
    }
    
    setState('processing');
    transcriptRef.current = '';
    socketRef.current.emit('chat:message', { message: msg, stream: true });
  }, []);

  // Stop and send
  const stopAndSend = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    
    if (transcriptRef.current.trim()) {
      sendMessage(transcriptRef.current.trim());
    } else {
      setState('idle');
    }
  }, [sendMessage]);

  useEffect(() => {
    stopAndSendRef.current = stopAndSend;
  }, [stopAndSend]);

  // Start listening with voice activity detection
  const startListening = useCallback(async () => {
    transcriptRef.current = '';
    hasDetectedSpeechRef.current = false;
    lastSpeechTimeRef.current = Date.now();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setState('listening');
      lastSpeechTimeRef.current = Date.now();
    };

    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      
      // Auto-correct common misheard words
      text = text
        .replace(/\bhi automation\b/gi, 'AI automation')
        .replace(/\bhi agent\b/gi, 'AI agent')
        .replace(/\bhigh automation\b/gi, 'AI automation')
        .replace(/\bsammi\b/gi, 'Sammy')
        .replace(/\bsemi\b/gi, 'Sammy');
      
      transcriptRef.current = text;
      lastSpeechTimeRef.current = Date.now();
      hasDetectedSpeechRef.current = true;
      
      // Clear and reset silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      // Set new silence timeout
      silenceTimeoutRef.current = setTimeout(() => {
        if (stateRef.current === 'listening' && transcriptRef.current.trim()) {
          stopAndSendRef.current?.();
        }
        silenceTimeoutRef.current = null;
      }, 2000); // 2 seconds of silence
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still in listening state
      if (stateRef.current === 'listening') {
        try {
          recognition.start();
        } catch (e) {
          setState('idle');
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  // Socket setup
  useEffect(() => {
    if (!isActive) return;

    const socket = io(SOCKET_URL, {
      query: { sessionId: sessionIdRef.current },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to server');
      const greeting = "Hello! I'm Sammy, your AI assistant. How can I help you today?";
      setState('speaking');
      speak(greeting, () => {
        setState('idle');
        // Auto-start listening after greeting
        setTimeout(() => {
          if (stateRef.current === 'idle') {
            startListening();
          }
        }, 500);
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('agent:stream', () => {
      // Stream tokens (for future use if needed)
    });

    socket.on('agent:typing', () => {
      setState('processing');
    });

    socket.on('agent:response', (data: { message: string }) => {
      setState('speaking');
      speak(data.message, () => {
        setState('idle');
        // Auto-start listening again after response
        setTimeout(() => {
          if (stateRef.current === 'idle') {
            startListening();
          }
        }, 500);
      });
    });

    socket.on('agent:error', (data: { message: string }) => {
      console.error('Agent error:', data.message);
      setState('idle');
    });

    window.speechSynthesis?.getVoices();

    return () => {
      socket.disconnect();
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [isActive, speak, startListening]);

  // Auto-start when component mounts
  useEffect(() => {
    if (isActive) {
      // Component is active, connection will start via socket effect
      onStarted?.();
    }
  }, [isActive, onStarted]);

  // Expose start function
  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  // Expose via window for ChatBubble to call
  useEffect(() => {
    (window as any).startVoiceAssistant = start;
    return () => {
      delete (window as any).startVoiceAssistant;
    };
  }, [start]);

  return null; // No UI - pure voice interaction
}

