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

              {/* Sparkling particles inside orb - no emoji, just pure glow */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: [
                      Math.cos((i / 8) * Math.PI * 2) * 15,
                      Math.cos((i / 8) * Math.PI * 2 + Math.PI) * 20,
                      Math.cos((i / 8) * Math.PI * 2) * 15,
                    ],
                    y: [
                      Math.sin((i / 8) * Math.PI * 2) * 15,
                      Math.sin((i / 8) * Math.PI * 2 + Math.PI) * 20,
                      Math.sin((i / 8) * Math.PI * 2) * 15,
                    ],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 3 + i * 0.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.1,
                  }}
                  style={{
                    position: 'absolute',
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 0 6px rgba(255, 255, 255, 0.8), 0 0 12px rgba(99, 102, 241, 0.6)',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {/* Active indicator - shows when voice is active */}
              {isActive && (
                <motion.span
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '12px',
                    height: '12px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    boxShadow: '0 0 12px rgba(34, 197, 94, 0.8), 0 0 24px rgba(34, 197, 94, 0.4)',
                    zIndex: 2,
                  }}
                />
              )}
            </motion.button>

            {/* Floating Particles on hover */}
            {isHovered && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: 36,
                      y: 36,
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      x: 36 + Math.cos((i / 8) * Math.PI * 2) * 50,
                      y: 36 + Math.sin((i / 8) * Math.PI * 2) * 50,
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeOut',
                    }}
                    style={{
                      position: 'absolute',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: `hsl(${(i * 45) % 360}, 70%, 60%)`,
                      boxShadow: `0 0 10px hsl(${(i * 45) % 360}, 70%, 60%), 0 0 20px hsl(${(i * 45) % 360}, 70%, 40%)`,
                      pointerEvents: 'none',
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
    </>
  );
}
