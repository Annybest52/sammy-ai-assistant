import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Mic, Send } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface VoiceAssistantProps {
  onClose: () => void;
}

const SOCKET_URL = 'http://localhost:3001';

export function VoiceAssistant({ onClose }: VoiceAssistantProps) {
  const [state, setState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  // Send message to backend
  const sendMessage = useCallback((text: string) => {
    const msg = text.trim();
    if (!msg) {
      setState('idle');
      return;
    }
    
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      setState('idle');
      return;
    }
    
    console.log('📤 SENDING:', msg);
    setDebugInfo('Sending: ' + msg);
    setState('processing');
    setTranscript('');
    
    socketRef.current.emit('chat:message', { message: msg });
  }, []);

  // Text to speech
  const speak = useCallback((text: string, onDone?: () => void) => {
    window.speechSynthesis?.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text.substring(0, 250));
    utterance.rate = 1.0;
    utterance.onend = () => onDone?.();
    utterance.onerror = () => onDone?.();
    
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // Start listening - SIMPLIFIED VERSION
  const startListening = useCallback(() => {
    setError('');
    setTranscript('');
    setDebugInfo('Starting speech recognition...');

    // Check for Speech Recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Use Chrome browser.');
      setDebugInfo('SpeechRecognition API not found');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.stop(); 
        recognitionRef.current = null;
      } catch (e) {}
    }

    try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy

      recognition.onstart = () => {
        console.log('🎤 Speech recognition STARTED');
        setDebugInfo('Listening... speak now!');
        setState('listening');
      };

      recognition.onaudiostart = () => {
        console.log('🎤 Audio capturing started');
        setDebugInfo('Audio capture started');
      };

      recognition.onsoundstart = () => {
        console.log('🎤 Sound detected');
        setDebugInfo('Sound detected!');
      };

      recognition.onspeechstart = () => {
        console.log('🎤 Speech detected');
        setDebugInfo('Speech detected!');
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
            .replace(/\bhigh agent\b/gi, 'AI agent')
            .replace(/\beye automation\b/gi, 'AI automation')
            .replace(/\bay automation\b/gi, 'AI automation')
            .replace(/\bay agent\b/gi, 'AI agent')
            .replace(/\bhi assistant\b/gi, 'AI assistant')
            .replace(/\bsammi\b/gi, 'Sammy')
            .replace(/\bsemi\b/gi, 'Sammy');
          
          console.log('🎤 Transcript:', text);
          setTranscript(text);
          setDebugInfo('Heard: ' + text);
        };

      recognition.onspeechend = () => {
        console.log('🎤 Speech ended');
        setDebugInfo('Speech ended');
      };

      recognition.onerror = (event: any) => {
        console.error('🎤 Error:', event.error);
        setDebugInfo('Error: ' + event.error);
        
        if (event.error === 'not-allowed') {
          setError('Microphone blocked. Click the lock icon in address bar and allow microphone.');
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Try speaking louder.');
        } else if (event.error === 'audio-capture') {
          setError('No microphone found.');
        } else if (event.error === 'network') {
          setError('Network error. Check internet connection.');
        } else {
          setError('Error: ' + event.error);
        }
      };

      recognition.onend = () => {
        console.log('🎤 Recognition ended');
        setDebugInfo('Recognition ended');
      };

      recognitionRef.current = recognition;
      recognition.start();
      console.log('🎤 Called recognition.start()');
      
    } catch (err: any) {
      console.error('Failed to start recognition:', err);
      setError('Failed to start: ' + err.message);
      setDebugInfo('Start failed: ' + err.message);
    }
  }, []);

  // Stop and send
  const stopAndSend = useCallback(() => {
    console.log('📨 Stop and send, transcript:', transcript);
    
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.stop(); 
      } catch (e) {}
      recognitionRef.current = null;
    }
    
    if (transcript.trim()) {
      sendMessage(transcript.trim());
    } else {
      setState('idle');
      setError('No speech captured. Please try again and speak clearly.');
    }
  }, [transcript, sendMessage]);

  // Socket setup
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      query: { sessionId: sessionIdRef.current },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      setDebugInfo('Connected to server');
      setState('speaking');
      speak("Hi! I'm Sammy. Tap the mic to talk!", () => setState('idle'));
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setDebugInfo('Disconnected');
    });

    socket.on('agent:response', (data: { message: string }) => {
      console.log('🤖 Response:', data.message);
      setDebugInfo('Got response');
      setState('speaking');
      speak(data.message, () => setState('idle'));
    });

    socket.on('agent:error', (data: { message: string }) => {
      setError(data.message);
      setState('idle');
    });

    window.speechSynthesis?.getVoices();

    return () => {
      socket.disconnect();
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [speak]);

  const handleMicClick = () => {
    console.log('👆 Mic clicked, state:', state);
    
    if (state === 'idle') {
      startListening();
    } else if (state === 'listening') {
      stopAndSend();
    } else if (state === 'speaking') {
      window.speechSynthesis?.cancel();
      setState('idle');
    }
  };

  const getButtonColor = () => {
    switch (state) {
      case 'listening': return '#22c55e';
      case 'processing': return '#f59e0b';
      case 'speaking': return '#8b5cf6';
      default: return '#3b82f6';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        width: '320px',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 9999,
      }}
    >
      <button 
        onClick={onClose} 
        style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(255,255,255,0.1)', border: 'none',
          color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          padding: '6px', borderRadius: '50%', display: 'flex',
        }}
      >
        <X size={16} />
      </button>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'white', fontSize: '24px', margin: 0, fontWeight: '700' }}>Sammy</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '4px 0 0' }}>Your AI Assistant</p>
      </div>

      {/* Main Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <motion.button
          onClick={handleMicClick}
          disabled={state === 'processing'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: state === 'listening' 
              ? ['0 0 20px #22c55e', '0 0 50px #22c55e', '0 0 20px #22c55e']
              : 'none',
          }}
          transition={{ duration: 0.6, repeat: state === 'listening' ? Infinity : 0 }}
          style={{
            width: '110px', height: '110px', borderRadius: '50%',
            background: getButtonColor(), border: 'none',
            cursor: state === 'processing' ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {state === 'processing' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '40px', height: '40px',
                border: '3px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white', borderRadius: '50%',
              }}
            />
          ) : state === 'speaking' ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  animate={{ height: [10, 30, 10] }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                  style={{ width: '6px', background: 'white', borderRadius: '3px' }}
                />
              ))}
            </div>
          ) : (
            <Mic size={44} color="white" />
          )}
        </motion.button>
      </div>

      {/* Status */}
      <div style={{ textAlign: 'center', minHeight: '80px' }}>
        <p style={{ 
          color: state === 'listening' ? '#4ade80' : 'rgba(255,255,255,0.8)', 
          fontSize: '15px', margin: '0 0 8px', fontWeight: '500',
        }}>
          {state === 'idle' && '🎤 Tap to start talking'}
          {state === 'listening' && '🔴 LISTENING - Tap to send'}
          {state === 'processing' && '🧠 Thinking...'}
          {state === 'speaking' && '🔊 Speaking...'}
        </p>
        
        {transcript && state === 'listening' && (
          <div style={{ margin: '8px 0' }}>
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '2px solid #22c55e',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                fontSize: '16px',
                fontWeight: '500',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="Edit if needed..."
            />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>
              ✏️ You can edit the text above before sending
            </p>
          </div>
        )}

        {/* Debug info */}
        <p style={{ 
          color: 'rgba(255,255,255,0.4)', 
          fontSize: '11px', 
          margin: '8px 0 0',
          fontFamily: 'monospace',
        }}>
          {debugInfo}
        </p>
      </div>

      {/* Error */}
      {error && (
        <p style={{ 
          color: '#f87171', fontSize: '12px', textAlign: 'center',
          margin: '8px 0', padding: '10px',
          background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px',
        }}>
          ⚠️ {error}
        </p>
      )}

      {/* Text input */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const input = (e.target as any).msg;
          if (input.value.trim()) {
            sendMessage(input.value.trim());
            input.value = '';
          }
        }} 
        style={{ marginTop: '16px', display: 'flex', gap: '8px' }}
      >
        <input
          name="msg"
          placeholder="Or type here..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.05)',
            color: 'white', fontSize: '14px', outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            border: 'none', background: '#3b82f6', color: 'white',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={18} />
        </button>
      </form>

      {/* Connection status */}
      <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
        <span style={{
          display: 'inline-block', width: '6px', height: '6px',
          borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444',
          marginRight: '6px',
        }} />
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </motion.div>
  );
}
