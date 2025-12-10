import { useState } from 'react';
import { motion } from 'framer-motion';
import { VoiceOnlyAssistant } from './VoiceOnlyAssistant';

export function ChatBubble() {
  const [isActive, setIsActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleOrbClick = () => {
    if (!isActive) {
      setIsActive(true);
    }
  };

  return (
    <>
      {/* Voice-only assistant (no UI) */}
      {isActive && <VoiceOnlyAssistant />}

      {/* Floating Glowing Orb - Pure orb, no emoji */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 9998,
          cursor: 'pointer',
        }}
        onClick={handleOrbClick}
      >
            {/* Outer Glow Rings - iPhone-style soft pulsing */}
            <motion.div
              animate={{
                scale: isHovered ? [1, 1.25, 1] : [1, 1.12, 1],
                opacity: [0.25, 0.5, 0.25],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: [0.4, 0, 0.6, 1],
              }}
              style={{
                position: 'absolute',
                inset: '-24px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0, 122, 255, 0.35) 0%, rgba(88, 86, 214, 0.2) 40%, transparent 70%)',
                pointerEvents: 'none',
                filter: 'blur(8px)',
              }}
            />
            
            <motion.div
              animate={{
                scale: isHovered ? [1, 1.18, 1] : [1, 1.08, 1],
                opacity: [0.15, 0.4, 0.15],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: [0.4, 0, 0.6, 1],
                delay: 0.4,
              }}
              style={{
                position: 'absolute',
                inset: '-36px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(88, 86, 214, 0.25) 0%, rgba(175, 82, 222, 0.15) 50%, transparent 75%)',
                pointerEvents: 'none',
                filter: 'blur(12px)',
              }}
            />

            {/* Main Orb */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: isHovered
                  ? [
                      '0 0 24px rgba(0, 122, 255, 0.5), 0 0 48px rgba(88, 86, 214, 0.35), 0 0 72px rgba(175, 82, 222, 0.25), inset 0 0 24px rgba(255, 255, 255, 0.15)',
                      '0 0 36px rgba(0, 122, 255, 0.65), 0 0 72px rgba(88, 86, 214, 0.5), 0 0 108px rgba(175, 82, 222, 0.35), inset 0 0 32px rgba(255, 255, 255, 0.25)',
                      '0 0 24px rgba(0, 122, 255, 0.5), 0 0 48px rgba(88, 86, 214, 0.35), 0 0 72px rgba(175, 82, 222, 0.25), inset 0 0 24px rgba(255, 255, 255, 0.15)',
                    ]
                  : [
                      '0 0 16px rgba(0, 122, 255, 0.4), 0 0 32px rgba(88, 86, 214, 0.25), 0 0 48px rgba(175, 82, 222, 0.15), inset 0 0 16px rgba(255, 255, 255, 0.1)',
                      '0 0 24px rgba(0, 122, 255, 0.5), 0 0 48px rgba(88, 86, 214, 0.35), 0 0 72px rgba(175, 82, 222, 0.25), inset 0 0 24px rgba(255, 255, 255, 0.15)',
                      '0 0 16px rgba(0, 122, 255, 0.4), 0 0 32px rgba(88, 86, 214, 0.25), 0 0 48px rgba(175, 82, 222, 0.15), inset 0 0 16px rgba(255, 255, 255, 0.1)',
                    ],
              }}
              transition={{
                boxShadow: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1],
                },
              }}
              style={{
                position: 'relative',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                background: `
                  radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.35) 0%, transparent 55%),
                  radial-gradient(circle at 75% 75%, rgba(88, 86, 214, 0.3) 0%, transparent 55%),
                  linear-gradient(135deg, rgba(0, 122, 255, 0.92) 0%, rgba(88, 86, 214, 0.92) 50%, rgba(175, 82, 222, 0.92) 100%)
                `,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: 'white',
                overflow: 'hidden',
                isolation: 'isolate',
                boxSizing: 'border-box',
              }}
            >
              {/* Inner Shine - iPhone-style smooth sweep */}
              <motion.div
                animate={{
                  background: [
                    'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 30%, transparent 65%)',
                    'radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 30%, transparent 65%)',
                    'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 30%, transparent 65%)',
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1],
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
              
              {/* Subtle inner glow layer */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1],
                }}
                style={{
                  position: 'absolute',
                  inset: '8px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Sparkling particles - iPhone-style subtle shimmer */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: [
                      Math.cos((i / 6) * Math.PI * 2) * 12,
                      Math.cos((i / 6) * Math.PI * 2 + Math.PI) * 18,
                      Math.cos((i / 6) * Math.PI * 2) * 12,
                    ],
                    y: [
                      Math.sin((i / 6) * Math.PI * 2) * 12,
                      Math.sin((i / 6) * Math.PI * 2 + Math.PI) * 18,
                      Math.sin((i / 6) * Math.PI * 2) * 12,
                    ],
                    opacity: [0.2, 0.7, 0.2],
                    scale: [0.6, 1.1, 0.6],
                  }}
                  transition={{
                    duration: 4 + i * 0.3,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.6, 1],
                    delay: i * 0.15,
                  }}
                  style={{
                    position: 'absolute',
                    width: '2.5px',
                    height: '2.5px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(0, 122, 255, 0.5)',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    filter: 'blur(0.5px)',
                  }}
                />
              ))}

              {/* Active indicator - iPhone-style pulsing dot */}
              {isActive && (
                <motion.span
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.9, 1, 0.9],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.6, 1],
                  }}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '10px',
                    height: '10px',
                    background: 'rgba(52, 199, 89, 1)',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px rgba(52, 199, 89, 0.8), 0 0 16px rgba(52, 199, 89, 0.5), inset 0 0 4px rgba(255, 255, 255, 0.3)',
                    zIndex: 2,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                />
              )}
            </motion.button>

            {/* Floating Particles on hover - iPhone-style subtle effect */}
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
                      x: 36 + Math.cos((i / 6) * Math.PI * 2) * 45,
                      y: 36 + Math.sin((i / 6) * Math.PI * 2) * 45,
                      opacity: [0, 0.8, 0],
                      scale: [0, 1.2, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.12,
                      ease: [0.4, 0, 0.6, 1],
                    }}
                    style={{
                      position: 'absolute',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: `rgba(${i % 2 === 0 ? '0, 122, 255' : '88, 86, 214'}, 0.8)`,
                      boxShadow: `0 0 8px rgba(${i % 2 === 0 ? '0, 122, 255' : '88, 86, 214'}, 0.6), 0 0 16px rgba(${i % 2 === 0 ? '0, 122, 255' : '88, 86, 214'}, 0.3)`,
                      pointerEvents: 'none',
                      filter: 'blur(1px)',
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
    </>
  );
}
