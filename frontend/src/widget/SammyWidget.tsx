import { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WidgetConfig {
  serverUrl: string;
  primaryColor: string;
  position: 'left' | 'right';
  greeting: string;
  agentName: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{ tool: string; result: string; success: boolean }>;
}

// Speech Recognition types for TypeScript
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

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

export function SammyWidget({ config }: { config: WidgetConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Connect to server
  useEffect(() => {
    socketRef.current = io(config.serverUrl, {
      query: { sessionId: sessionIdRef.current },
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('agent:typing', ({ isTyping }: { isTyping: boolean }) => {
      setIsTyping(isTyping);
    });

    socket.on('agent:response', (data: { message: string; actions?: any[]; audioUrl?: string }) => {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        actions: data.actions,
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Speak the response
      if (audioEnabled) {
        speakText(data.message);
      }
    });

    socket.on('agent:error', ({ message }: { message: string }) => {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
      }]);
    });

    return () => {
      socket.disconnect();
    };
  }, [config.serverUrl]);

  // Listen for global events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    const handleToggle = () => setIsOpen(prev => !prev);

    window.addEventListener('sammy:open', handleOpen);
    window.addEventListener('sammy:close', handleClose);
    window.addEventListener('sammy:toggle', handleToggle);

    return () => {
      window.removeEventListener('sammy:open', handleOpen);
      window.removeEventListener('sammy:close', handleClose);
      window.removeEventListener('sammy:toggle', handleToggle);
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-greet
  useEffect(() => {
    if (isOpen && isConnected && !hasGreeted && messages.length === 0) {
      setHasGreeted(true);
      setTimeout(() => {
        const greetingMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: config.greeting,
          timestamp: new Date(),
        };
        setMessages([greetingMessage]);
        if (audioEnabled) {
          speakText(config.greeting);
        }
      }, 500);
    }
  }, [isOpen, isConnected, hasGreeted, messages.length, config.greeting]);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Microsoft')
    );
    if (preferredVoice) utterance.voice = preferredVoice;
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        setInterimTranscript(interim);
        
        if (final) {
          setInput(final);
          setInterimTranscript('');
          // Auto-send after recognition
          setTimeout(() => {
            if (final.trim()) {
              sendMessage(final.trim());
              setInput('');
            }
          }, 300);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported. Use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const sendMessage = useCallback((text: string) => {
    if (!socketRef.current?.connected || !text.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    socketRef.current.emit('chat:message', { message: text });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  const positionClass = config.position === 'left' ? 'sammy-left' : 'sammy-right';

  return (
    <div className={`sammy-widget ${positionClass}`}>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="sammy-bubble"
          style={{ background: `linear-gradient(135deg, ${config.primaryColor}, #a855f7)` }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="sammy-pulse" style={{ background: config.primaryColor }} />
          <span className="sammy-online" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="sammy-window">
          {/* Header */}
          <div className="sammy-header" style={{ background: `linear-gradient(135deg, ${config.primaryColor}, #a855f7)` }}>
            <div className="sammy-header-info">
              <div className="sammy-avatar">🤖</div>
              <div>
                <div className="sammy-name">{config.agentName}</div>
                <div className="sammy-status">
                  {isConnected ? 'Online • Ready to help' : 'Connecting...'}
                </div>
              </div>
            </div>
            <div className="sammy-header-actions">
              <button onClick={() => setAudioEnabled(!audioEnabled)} className="sammy-icon-btn">
                {audioEnabled ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                )}
              </button>
              <button onClick={() => setIsOpen(false)} className="sammy-icon-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="sammy-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`sammy-message ${message.role === 'user' ? 'sammy-user' : 'sammy-assistant'}`}
              >
                <div 
                  className="sammy-message-bubble"
                  style={message.role === 'user' ? { background: config.primaryColor } : undefined}
                >
                  {message.content}
                  {message.actions && message.actions.length > 0 && (
                    <div className="sammy-actions">
                      {message.actions.map((action, idx) => (
                        <div key={idx} className="sammy-action">
                          {action.success ? '✓' : '✗'} {action.tool.replace(/_/g, ' ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="sammy-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="sammy-message sammy-assistant">
                <div className="sammy-message-bubble sammy-typing">
                  <span className="sammy-dot" />
                  <span className="sammy-dot" />
                  <span className="sammy-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 1 && !isTyping && (
            <div className="sammy-quick-replies">
              {['What AI services do you offer?', 'Book a consultation', 'Pricing info', 'Lead generation'].map((text) => (
                <button key={text} onClick={() => sendMessage(text)} className="sammy-quick-btn">
                  {text}
                </button>
              ))}
            </div>
          )}

          {/* Voice listening indicator */}
          {isListening && (
            <div className="sammy-listening">
              <div className="sammy-listening-dots">
                <span className="sammy-listening-dot" />
                <span className="sammy-listening-dot" />
                <span className="sammy-listening-dot" />
              </div>
              <span className="sammy-listening-text">
                {interimTranscript || 'Listening... Speak now'}
              </span>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="sammy-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type or tap mic..."}
              disabled={!isConnected || isListening}
              className="sammy-input"
            />
            
            {/* Microphone button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={!isConnected}
              className={`sammy-mic-btn ${isListening ? 'sammy-mic-active' : ''}`}
            >
              {isListening ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
            
            <button
              type="submit"
              disabled={!input.trim() || !isConnected || isListening}
              className="sammy-send-btn"
              style={{ background: config.primaryColor }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>

          <div className="sammy-footer">
            Powered by {config.agentName} AI
          </div>
        </div>
      )}
    </div>
  );
}

