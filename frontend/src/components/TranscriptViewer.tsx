import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TranscriptViewerProps {
  sessionId: string;
  onClose: () => void;
}

export function TranscriptViewer({ sessionId, onClose }: TranscriptViewerProps) {
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to fetch transcript');
      socket.emit('chat:history');
    });

    socket.on('chat:history:response', (data: { history: Message[] }) => {
      setTranscript(data.history);
      setLoading(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setLoading(false);
    });

    // Also try API endpoint as fallback
    fetch(`${SOCKET_URL.replace('ws://', 'http://').replace('wss://', 'https://')}/api/agent/history/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history) {
          setTranscript(data.history);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to fetch transcript:', err);
        setLoading(false);
      });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  const downloadTranscript = () => {
    const text = transcript.map((msg, index) => {
      const role = msg.role === 'user' ? 'User' : 'Sammy';
      return `[${index + 1}] ${role}: ${msg.content}`;
    }).join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${sessionId.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.98) 0%, rgba(10, 10, 18, 0.99) 100%)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 100px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '700' }}>
              Conversation Transcript
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadTranscript}
                disabled={transcript.length === 0}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: 'white',
                  cursor: transcript.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                }}
              >
                <Download size={16} />
                Download
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  padding: '8px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', padding: '40px' }}>
                Loading transcript...
              </div>
            ) : transcript.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', padding: '40px' }}>
                No conversation history found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {transcript.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: msg.role === 'user'
                        ? 'rgba(99, 102, 241, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${msg.role === 'user' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    }}
                  >
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginBottom: '8px',
                      fontWeight: '600',
                    }}>
                      {msg.role === 'user' ? '👤 You' : '🤖 Sammy'}
                    </div>
                    <div style={{
                      color: 'white',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

