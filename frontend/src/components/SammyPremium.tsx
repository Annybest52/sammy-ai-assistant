import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Send, Phone, PhoneOff, Settings, Volume2, VolumeX } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface SammyPremiumProps {
  onClose: () => void;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SOCKET_URL = 'http://localhost:3001';

// Premium color scheme
const COLORS = {
  idle: { primary: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' },
  listening: { primary: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)' },
  processing: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  speaking: { primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
};

// Particle component for orb effect
function Particles({ state, count = 20 }: { state: AssistantState; count?: number }) {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 2,
      angle: (i / count) * 360,
      distance: Math.random() * 30 + 60,
    })), [count]
  );

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={state !== 'idle' ? {
            x: [0, Math.cos(p.angle * Math.PI / 180) * p.distance],
            y: [0, Math.sin(p.angle * Math.PI / 180) * p.distance],
            opacity: [0.8, 0],
            scale: [1, 0.5],
          } : { x: 0, y: 0, opacity: 0 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: COLORS[state].primary,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

// Voice waveform visualizer
function WaveformVisualizer({ state, audioLevel }: { state: AssistantState; audioLevel: number }) {
  const barCount = 32;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px',
      height: '60px',
      width: '100%',
      overflow: 'hidden',
    }}>
      {Array.from({ length: barCount }).map((_, i) => {
        const centerDistance = Math.abs(i - barCount / 2) / (barCount / 2);
        const baseHeight = 8;
        const maxHeight = 50;
        const height = state === 'listening' || state === 'speaking'
          ? baseHeight + (audioLevel * (1 - centerDistance * 0.6) * (maxHeight - baseHeight))
          : baseHeight;
        
        return (
          <motion.div
            key={i}
            animate={{ 
              height,
              backgroundColor: COLORS[state].primary,
            }}
            transition={{ 
              duration: 0.1,
              ease: 'easeOut',
            }}
            style={{
              width: '3px',
              borderRadius: '2px',
              minHeight: baseHeight,
            }}
          />
        );
      })}
    </div>
  );
}

export function SammyPremium({ onClose }: SammyPremiumProps) {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);

  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<string>('');

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio level analyzer
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const analyze = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationFrameRef.current = requestAnimationFrame(analyze);
      };
      
      analyze();
    } catch (err) {
      console.error('Audio analysis error:', err);
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  }, []);

  // Send message to backend
  const sendMessage = useCallback((text: string) => {
    const msg = text.trim();
    if (!msg || !socketRef.current?.connected) {
      setState('idle');
      return;
    }
    
    // Add user message to history
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    }]);
    
    setState('processing');
    setTranscript('');
    socketRef.current.emit('chat:message', { message: msg, stream: true });
  }, []);

  // Text to speech with visual feedback
  const speak = useCallback((text: string, onDone?: () => void) => {
    if (isMuted) {
      onDone?.();
      return;
    }
    
    window.speechSynthesis?.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text.substring(0, 500));
    utterance.rate = voiceSpeed;
    utterance.pitch = 1.0;
    
    // Simulate audio level for speaking animation
    const speakInterval = setInterval(() => {
      setAudioLevel(Math.random() * 0.5 + 0.3);
    }, 100);
    
    utterance.onend = () => {
      clearInterval(speakInterval);
      setAudioLevel(0);
      onDone?.();
    };
    utterance.onerror = () => {
      clearInterval(speakInterval);
      setAudioLevel(0);
      onDone?.();
    };
    
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) 
      || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    
    window.speechSynthesis.speak(utterance);
  }, [isMuted, voiceSpeed]);

  // Start listening
  const startListening = useCallback(() => {
    setError('');
    setTranscript('');
    startAudioAnalysis();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Please use Chrome.');
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

    recognition.onstart = () => setState('listening');

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
      
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow in browser settings.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      stopAudioAnalysis();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [startAudioAnalysis, stopAudioAnalysis]);

  // Stop and send
  const stopAndSend = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    stopAudioAnalysis();
    
    if (transcript.trim()) {
      sendMessage(transcript.trim());
    } else {
      setState('idle');
    }
  }, [transcript, sendMessage, stopAudioAnalysis]);

  // Socket setup
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      query: { sessionId: sessionIdRef.current },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      const greeting = "Hello! I'm Sammy, your AI assistant. How can I help you today?";
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
      setState('speaking');
      speak(greeting, () => setState('idle'));
    });

    socket.on('disconnect', () => setIsConnected(false));

    // Handle streaming tokens for real-time display
    socket.on('agent:stream', (data: { token: string }) => {
      streamingMessageRef.current += data.token;
      // Update the last message if it's from assistant and we're streaming
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg.content.startsWith('▌')) {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: streamingMessageRef.current + '▌' }
          ];
        }
        return prev;
      });
    });

    socket.on('agent:typing', (data: { isTyping: boolean }) => {
      if (data.isTyping) {
        setState('processing');
        streamingMessageRef.current = '';
        // Add placeholder message for streaming
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '▌',
          timestamp: new Date(),
        }]);
      }
    });

    socket.on('agent:response', (data: { message: string }) => {
      // Final message - remove cursor and speak
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIdx = newMessages.findIndex(m => m.content.includes('▌'));
        if (lastIdx >= 0) {
          newMessages[lastIdx] = {
            ...newMessages[lastIdx],
            content: data.message,
          };
        } else {
          newMessages.push({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          });
        }
        return newMessages;
      });
      streamingMessageRef.current = '';
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
      stopAudioAnalysis();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [speak, stopAudioAnalysis]);

  const handleMicClick = () => {
    if (state === 'idle') {
      startListening();
    } else if (state === 'listening') {
      stopAndSend();
    } else if (state === 'speaking') {
      window.speechSynthesis?.cancel();
      setAudioLevel(0);
      setState('idle');
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'idle': return 'Tap to speak';
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '380px',
        height: '600px',
        background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.98) 0%, rgba(10, 10, 18, 0.99) 100%)',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: `0 25px 100px rgba(0, 0, 0, 0.8), 0 0 60px ${COLORS[state].glow}`,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
      }}
    >
      {/* Ambient glow effect */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle at 50% 100%, ${COLORS[state].glow} 0%, transparent 50%)`,
        pointerEvents: 'none',
        transition: 'background 0.5s ease',
      }} />

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.div
            animate={{ 
              boxShadow: `0 0 20px ${COLORS[state].glow}`,
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${COLORS[state].primary} 0%, ${COLORS.speaking.primary} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            🤖
          </motion.div>
          <div>
            <h2 style={{ 
              color: 'white', 
              fontSize: '18px', 
              fontWeight: '700',
              margin: 0,
              letterSpacing: '-0.5px',
            }}>Sammy</h2>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              marginTop: '2px',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isConnected ? '#22c55e' : '#ef4444',
              }} />
              <span style={{ 
                color: 'rgba(255,255,255,0.5)', 
                fontSize: '12px',
              }}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: isMuted ? '#ef4444' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              background: showSettings ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </motion.button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px' }}>
              <label style={{ 
                color: 'rgba(255,255,255,0.6)', 
                fontSize: '12px',
                display: 'block',
                marginBottom: '8px',
              }}>
                Voice Speed: {voiceSpeed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: COLORS[state].primary,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '85%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' 
                ? '18px 18px 4px 18px' 
                : '18px 18px 18px 4px',
              background: msg.role === 'user' 
                ? `linear-gradient(135deg, ${COLORS.idle.primary} 0%, ${COLORS.speaking.primary} 100%)`
                : 'rgba(255,255,255,0.08)',
              color: 'white',
              fontSize: '14px',
              lineHeight: '1.5',
            }}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Waveform & Orb Section */}
      <div style={{
        padding: '20px',
        background: 'rgba(0,0,0,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Waveform */}
        <WaveformVisualizer state={state} audioLevel={audioLevel} />
        
        {/* Main Orb Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginTop: '16px',
          position: 'relative',
        }}>
          <Particles state={state} count={24} />
          
          <motion.button
            onClick={handleMicClick}
            disabled={state === 'processing'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: state !== 'idle' 
                ? [
                    `0 0 30px ${COLORS[state].glow}`,
                    `0 0 60px ${COLORS[state].glow}`,
                    `0 0 30px ${COLORS[state].glow}`,
                  ]
                : `0 0 20px ${COLORS.idle.glow}`,
            }}
            transition={{
              boxShadow: {
                duration: 1.5,
                repeat: state !== 'idle' ? Infinity : 0,
                ease: 'easeInOut',
              },
            }}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: 'none',
              background: `linear-gradient(135deg, ${COLORS[state].primary} 0%, ${
                state === 'idle' ? '#8b5cf6' : COLORS[state].primary
              } 100%)`,
              cursor: state === 'processing' ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {state === 'processing' ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                }}
              />
            ) : state === 'speaking' ? (
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: [8, 24, 8],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{ 
                      duration: 0.4, 
                      repeat: Infinity, 
                      delay: i * 0.1,
                      ease: 'easeInOut',
                    }}
                    style={{
                      width: '4px',
                      background: 'white',
                      borderRadius: '2px',
                    }}
                  />
                ))}
              </div>
            ) : (
              <Mic size={32} color="white" />
            )}
          </motion.button>
        </div>
        
        {/* Status Text */}
        <motion.p
          key={state}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            color: state === 'listening' ? COLORS.listening.primary : 'rgba(255,255,255,0.6)',
            fontSize: '14px',
            fontWeight: '500',
            marginTop: '16px',
          }}
        >
          {getStatusText()}
        </motion.p>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && state === 'listening' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '12px' }}
            >
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `2px solid ${COLORS.listening.primary}`,
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: COLORS.listening.primary,
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div style={{
          padding: '0 16px 12px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {[
            '📅 Book appointment',
            '🎯 Services offered',
            '💬 Contact info',
          ].map((action) => (
            <motion.button
              key={action}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage(action.slice(3))}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {action}
            </motion.button>
          ))}
        </div>
      )}

      {/* Text Input */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const input = (e.target as any).msg;
          if (input.value.trim()) {
            sendMessage(input.value.trim());
            input.value = '';
          }
        }} 
        style={{ 
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          name="msg"
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '14px 18px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            border: 'none',
            background: `linear-gradient(135deg, ${COLORS.idle.primary} 0%, ${COLORS.speaking.primary} 100%)`,
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={20} />
        </motion.button>
      </form>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute',
              bottom: '100px',
              left: '16px',
              right: '16px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {error}
            <button
              onClick={() => setError('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SammyPremium;

