import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Volume2, VolumeX, Mic, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useChatStore } from '../store/chat';
import { useSocket } from '../hooks/useSocket';
import { clsx } from 'clsx';

export function ChatWidget() {
  const [input, setInput] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, isTyping, isConnected } = useChatStore();
  const { sendMessage } = useSocket();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  // Play audio - uses ElevenLabs if available, otherwise browser TTS
  const playAudio = (audioUrl: string | undefined, text?: string) => {
    if (!audioEnabled) return;
    
    if (audioUrl) {
      // Use ElevenLabs audio if available
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    } else if (text && 'speechSynthesis' in window) {
      // Fallback to browser's built-in TTS (free, no API key needed)
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      // Try to use a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Microsoft')
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto-play voice for new assistant messages
  useEffect(() => {
    if (messages.length > 0 && audioEnabled) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        playAudio(lastMessage.audioUrl, lastMessage.content);
      }
    }
  }, [messages, audioEnabled]);

  return (
    <div className="w-full h-[600px] rounded-2xl glass glow overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div className={clsx(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-800",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Sammy</h3>
            <p className="text-xs text-white/40">
              {isConnected ? 'Online • Ready to help' : 'Connecting...'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          {audioEnabled ? (
            <Volume2 className="w-5 h-5 text-white/60" />
          ) : (
            <VolumeX className="w-5 h-5 text-white/40" />
          )}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-cyan/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Hey, I'm Sammy! 👋</h3>
            <p className="text-white/60 max-w-md mx-auto">
              I'm your AI business assistant. I can help you book appointments, answer questions about our services, and guide you through anything you need.
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                'What services do you offer?',
                'Book an appointment',
                'Contact information',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm text-white/80 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={clsx(
                "flex",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={clsx(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white'
                    : 'bg-dark-600 text-white/90'
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {/* Actions taken */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    {message.actions.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs"
                      >
                        {action.success ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-white/60">
                          {action.tool.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audio playback - works with ElevenLabs or browser TTS */}
                {message.role === 'assistant' && audioEnabled && (
                  <button
                    onClick={() => playAudio(message.audioUrl, message.content)}
                    className="mt-2 flex items-center gap-1 text-xs text-accent-cyan hover:text-accent-cyan/80"
                  >
                    <Volume2 className="w-3 h-3" />
                    🔊 Play voice
                  </button>
                )}

                <div className="mt-1 text-[10px] opacity-50">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="bg-dark-600 rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="typing-dot w-2 h-2 bg-white/40 rounded-full" />
                  <span className="typing-dot w-2 h-2 bg-white/40 rounded-full" />
                  <span className="typing-dot w-2 h-2 bg-white/40 rounded-full" />
                </div>
                <span className="text-xs text-white/40 ml-1">Sammy is thinking...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={!isConnected}
              className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/5 focus:border-primary-500/50 outline-none text-white placeholder:text-white/30 transition-colors disabled:opacity-50"
            />
          </div>
          
          <button
            type="button"
            className="p-3 rounded-xl bg-dark-700 text-white/40 hover:text-white/60 transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="p-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isTyping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


