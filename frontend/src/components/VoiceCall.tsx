import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface VoiceCallProps {
  onClose: () => void;
}

// Speech Recognition types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const SOCKET_URL = 'http://localhost:3001';

export function VoiceCall({ onClose }: VoiceCallProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'listening' | 'processing' | 'speaking'>('connecting');

  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      query: { sessionId: sessionIdRef.current },
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setStatus('connected');
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      // Start with Sammy greeting (local greeting, then AI takes over)
      setTimeout(() => {
        setAiResponse("Hi! I'm Sammy from Dealey Media International. How can I help you today?");
        setStatus('speaking');
        speakWithBrowserTTS("Hi! I'm Sammy from Dealey Media International. How can I help you today?").then(() => {
          setStatus('listening');
          startListening();
        });
      }, 500);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('agent:typing', ({ isTyping }: { isTyping: boolean }) => {
      if (isTyping) {
        setStatus('processing');
      }
    });

    socket.on('agent:response', async (data: { message: string; audioUrl?: string }) => {
      setAiResponse(data.message);
      setStatus('speaking');
      setIsSpeaking(true);

      // Play audio response
      if (data.audioUrl && isSpeakerOn) {
        await playAudio(data.audioUrl);
      } else if (isSpeakerOn) {
        await speakWithBrowserTTS(data.message);
      }

      setIsSpeaking(false);
      
      // Resume listening after AI finishes speaking
      if (!isMuted) {
        startListening();
      }
    });

    return () => {
      socket.disconnect();
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isSpeakerOn, isMuted]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setStatus('listening');
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let fullTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }

        setTranscript(fullTranscript);
        transcriptRef.current = fullTranscript; // Keep ref in sync
        console.log('🎤 Transcript:', fullTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setStatus('connected');
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Auto-restart if not muted and not speaking
        if (!isMuted && !isSpeaking && isConnected) {
          setTimeout(() => {
            if (!isMuted && !isSpeaking) {
              startListening();
            }
          }, 500);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isMuted, isSpeaking, isConnected]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.error('❌ Speech recognition not available');
      alert('Speech recognition is not supported in your browser. Please use Chrome.');
      return;
    }
    
    if (!isListening && !isMuted) {
      try {
        console.log('🎤 Starting speech recognition...');
        recognitionRef.current.start();
      } catch (e) {
        console.log('🎤 Recognition already started or error:', e);
      }
    }
  }, [isListening, isMuted]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // If we have a transcript, send it
      const currentTranscript = transcriptRef.current;
      if (currentTranscript.trim()) {
        console.log('📤 Sending message:', currentTranscript);
        sendMessage(currentTranscript.trim());
        setTranscript('');
        transcriptRef.current = '';
      }
    }
  }, [sendMessage]);

  const sendMessage = useCallback((text: string) => {
    if (socketRef.current?.connected && text.trim()) {
      setStatus('processing');
      socketRef.current.emit('chat:message', { message: text });
    }
  }, []);

  const playAudio = async (audioUrl: string): Promise<void> => {
    return new Promise((resolve) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => resolve();
      audioRef.current.onerror = () => resolve();
      audioRef.current.play().catch(() => resolve());
    });
  };

  const speakWithBrowserTTS = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Microsoft')
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
    });
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      stopListening();
    }
  };

  const endCall = () => {
    stopListening();
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    window.speechSynthesis?.cancel();
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'listening': return 'Listening...';
      case 'processing': return 'Sammy is thinking...';
      case 'speaking': return 'Sammy is speaking...';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div className="w-[400px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-8 shadow-2xl border border-white/10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🤖</span>
            </div>
            {/* Pulse animation when speaking/listening */}
            {(isListening || isSpeaking) && (
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-indigo-400"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">Sammy</h2>
          <p className="text-white/60 text-sm mt-1">{getStatusText()}</p>
          <p className="text-indigo-400 font-mono mt-2">{formatDuration(callDuration)}</p>
        </div>

        {/* Transcript Display */}
        <div className="bg-black/30 rounded-xl p-4 mb-6 min-h-[100px] max-h-[200px] overflow-y-auto">
          {transcript && (
            <div className="mb-2">
              <span className="text-xs text-green-400 block mb-1">You (recording):</span>
              <p className="text-white/80 text-sm">{transcript}</p>
            </div>
          )}
          {aiResponse && (
            <div>
              <span className="text-xs text-indigo-400 block mb-1">Sammy:</span>
              <p className="text-white/80 text-sm">{aiResponse}</p>
            </div>
          )}
          {!transcript && !aiResponse && (
            <p className="text-white/40 text-sm text-center">
              {status === 'listening' ? '🎤 Listening... Speak now!' : 'Tap the microphone to speak'}
            </p>
          )}
          {isListening && !transcript && (
            <p className="text-yellow-400 text-sm text-center mt-2 animate-pulse">
              🎤 Microphone is on - speak now!
            </p>
          )}
        </div>

        {/* Voice Visualizer */}
        <div className="flex justify-center gap-1 mb-6 h-12">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 bg-indigo-500 rounded-full"
              animate={{
                height: isListening || isSpeaking 
                  ? [12, Math.random() * 40 + 8, 12] 
                  : 12,
              }}
              transition={{
                duration: 0.3,
                repeat: isListening || isSpeaking ? Infinity : 0,
                delay: i * 0.05,
              }}
            />
          ))}
        </div>

        {/* Tap to Talk Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <button
            onClick={() => {
              if (isListening) {
                stopListening();
              } else if (!isMuted && !isSpeaking) {
                startListening();
              }
            }}
            disabled={isMuted || isSpeaking}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: isListening ? '#ef4444' : '#6366f1',
              color: 'white',
              boxShadow: isListening 
                ? '0 0 30px rgba(239, 68, 68, 0.6)' 
                : '0 0 20px rgba(99, 102, 241, 0.4)',
              transform: isListening ? 'scale(1.1)' : 'scale(1)',
              opacity: (isMuted || isSpeaking) ? 0.5 : 1,
            }}
          >
            <Mic style={{ width: '40px', height: '40px' }} />
            <span style={{ fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>
              {isListening ? '🔴 SEND' : '🎤 SPEAK'}
            </span>
          </button>
        </div>
        <p className="text-center text-white/50 text-xs mb-4">
          {isListening ? '🔴 Recording... Tap button when done' : '🎤 Tap the button and speak'}
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isMuted ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.3)',
              backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
              color: isMuted ? '#ef4444' : 'white',
              cursor: 'pointer',
            }}
          >
            {isMuted ? <MicOff style={{ width: '24px', height: '24px' }} /> : <Mic style={{ width: '24px', height: '24px' }} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              backgroundColor: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
            }}
          >
            <PhoneOff style={{ width: '28px', height: '28px' }} />
          </button>

          {/* Speaker Button */}
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: !isSpeakerOn ? '2px solid #eab308' : '2px solid rgba(255,255,255,0.3)',
              backgroundColor: !isSpeakerOn ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.1)',
              color: !isSpeakerOn ? '#eab308' : 'white',
              cursor: 'pointer',
            }}
          >
            {isSpeakerOn ? <Volume2 style={{ width: '24px', height: '24px' }} /> : <VolumeX style={{ width: '24px', height: '24px' }} />}
          </button>
        </div>

        {/* Text Input Fallback */}
        <div className="mt-4 px-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            const input = (e.target as HTMLFormElement).elements.namedItem('textInput') as HTMLInputElement;
            if (input.value.trim()) {
              console.log('📤 Sending text:', input.value);
              sendMessage(input.value.trim());
              setTranscript('');
              input.value = '';
            }
          }} className="flex gap-2">
            <input
              name="textInput"
              type="text"
              placeholder="Or type here to test..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-400"
            >
              Send
            </button>
          </form>
        </div>

        {/* Debug Info */}
        <div className="mt-4 px-4 text-xs text-white/30 text-center">
          <p>Status: {status} | Connected: {isConnected ? 'Yes' : 'No'} | Listening: {isListening ? 'Yes' : 'No'}</p>
        </div>

        {/* Help Text */}
        <p className="text-center text-white/40 text-xs mt-4">
          {isMuted ? 'Tap microphone to unmute' : 'Hold mic button to speak, or type below'}
        </p>
      </div>
    </motion.div>
  );
}

