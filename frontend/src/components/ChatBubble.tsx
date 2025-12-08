import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SammyPremium } from './SammyPremium';

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '65px',
              height: '65px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
              zIndex: 9998,
              fontSize: '28px',
            }}
          >
            🤖
            
            {/* Online indicator */}
            <span
              style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                width: '14px',
                height: '14px',
                background: '#22c55e',
                borderRadius: '50%',
                border: '2px solid white',
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Voice Assistant Widget (appears on same page) */}
      <AnimatePresence>
        {isOpen && (
          <SammyPremium onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
