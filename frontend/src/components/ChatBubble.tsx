import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SammyPremium } from './SammyPremium';

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Glowing Orb */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            style={{
              position: 'fixed',
              bottom: '32px',
              right: '32px',
              zIndex: 9998,
              cursor: 'pointer',
            }}
            onClick={() => setIsOpen(true)}
          >
            {/* Outer Glow Rings */}
            <motion.div
              animate={{
                scale: isHovered ? [1, 1.2, 1] : [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                inset: '-20px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            
            <motion.div
              animate={{
                scale: isHovered ? [1, 1.15, 1] : [1, 1.05, 1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3,
              }}
              style={{
                position: 'absolute',
                inset: '-30px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Main Orb */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: isHovered
                  ? [
                      '0 0 30px rgba(99, 102, 241, 0.6), 0 0 60px rgba(139, 92, 246, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.1)',
                      '0 0 50px rgba(99, 102, 241, 0.8), 0 0 100px rgba(139, 92, 246, 0.6), inset 0 0 40px rgba(255, 255, 255, 0.2)',
                      '0 0 30px rgba(99, 102, 241, 0.6), 0 0 60px rgba(139, 92, 246, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.1)',
                    ]
                  : [
                      '0 0 20px rgba(99, 102, 241, 0.5), 0 0 40px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.05)',
                      '0 0 30px rgba(99, 102, 241, 0.6), 0 0 60px rgba(139, 92, 246, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.1)',
                      '0 0 20px rgba(99, 102, 241, 0.5), 0 0 40px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.05)',
                    ],
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              style={{
                position: 'relative',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: 'none',
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
                  radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
                  linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 50%, rgba(99, 102, 241, 0.95) 100%)
                `,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: 'white',
                overflow: 'hidden',
                isolation: 'isolate',
              }}
            >
              {/* Inner Shine */}
              <motion.div
                animate={{
                  background: [
                    'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
                    'radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
                    'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />

              {/* Icon */}
              <motion.span
                animate={{
                  scale: isHovered ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                }}
              >
                🤖
              </motion.span>

              {/* Online Indicator */}
              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '16px',
                  height: '16px',
                  background: '#22c55e',
                  borderRadius: '50%',
                  border: '3px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 0 10px rgba(34, 197, 94, 0.6), inset 0 0 5px rgba(255, 255, 255, 0.3)',
                  zIndex: 2,
                }}
              />
            </motion.button>

            {/* Floating Particles */}
            {isHovered && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: 36,
                      y: 36,
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      x: 36 + Math.cos((i / 6) * Math.PI * 2) * 40,
                      y: 36 + Math.sin((i / 6) * Math.PI * 2) * 40,
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeOut',
                    }}
                    style={{
                      position: 'absolute',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.8)',
                      boxShadow: '0 0 8px rgba(99, 102, 241, 0.6)',
                      pointerEvents: 'none',
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
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
