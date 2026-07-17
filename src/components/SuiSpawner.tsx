import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const FONT_FAMILIES = [
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  '"Comic Sans MS", "Comic Sans", cursive',
  '"Impact", fantasy',
  '"Courier New", Courier, monospace',
  '"Trebuchet MS", sans-serif',
  '"Arial Black", sans-serif',
  '"Georgia", serif',
  '"Verdana", sans-serif',
  'system-ui',
  '"Times New Roman", Times, serif',
  'Arial, Helvetica, sans-serif',
  '"Palatino Linotype", "Book Antiqua", Palatino, serif',
  '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
  'Tahoma, Geneva, sans-serif',
  '"Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif',
  'Papyrus, fantasy',
  '"Brush Script MT", cursive',
  'Copperplate, fantasy',
  'Consolas, monospace',
  '"Segoe UI", Roboto, Helvetica, sans-serif',
  'Optima, Candara, Calibri, sans-serif',
  'Didot, serif',
  'Monaco, monospace'
];
const FONT_WEIGHTS = ['normal', 'bold', '100', '300', '900'];
const TEXT_VARIATIONS = ['SIU', 'SIUU', 'SIUUU', 'SIUUUU', 'SIUUUUU'];

interface SuiInstance {
  id: number;
  x: number;
  rotation: number;
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  letterSpacing: string;
  text: string;
  tossHeight: string;
  duration: number;
  fadeStart: number;
}

export default function SuiSpawner() {
  const [suis, setSuis] = useState<SuiInstance[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const isMutedRef = useRef(true);

  useEffect(() => {
    // Intentionally empty or remove entirely to enforce muted by default
  }, []);

  const toggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    isMutedRef.current = newVal;
  };

  useEffect(() => {
    let idCounter = 0;
    
    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('#mute-btn')) {
        return; // Ignore clicks on the mute button
      }

      if (!isMutedRef.current) {
        const delay = Math.random() * 80; // 0-80ms delay
        
        setTimeout(() => {
          const audio = new Audio('/sui.mp3');
          const targetVol = Math.random() * 0.15 + 0.20; // 20-35%
          audio.playbackRate = Math.random() * 0.2 + 0.9; // 0.9x to 1.1x
          audio.volume = 0; // Start at 0 for fade in
          
          audio.play().then(() => {
            // Fade in over ~20ms
            let vol = 0;
            const fadeInInterval = setInterval(() => {
              vol += targetVol / 4;
              if (vol >= targetVol) {
                audio.volume = targetVol;
                clearInterval(fadeInInterval);
              } else {
                audio.volume = vol;
              }
            }, 5);

            // Fade out near the end
            audio.addEventListener('timeupdate', () => {
              if (audio.duration && (audio.duration - audio.currentTime <= 0.08)) {
                audio.volume = Math.max(0, audio.volume - targetVol / 4);
              }
            });
          }).catch(() => {}); // Play sound without waiting, ignore autoplay restrictions
        }, delay);
      }

      const tossHeight = Math.floor(Math.random() * 60 + 10) + 'vh'; // peak between 10vh and 70vh
      const duration = Math.random() * 1.5 + 1.5; // 1.5s to 3s
      const fadeStart = Math.random() * 0.4 + 0.3; // start fading between 30% and 70% of duration
      
      const newSui: SuiInstance = {
        id: idCounter++,
        x: Math.random() * 90 + 5, // random horizontal position 5vw to 95vw
        rotation: Math.random() * 60 - 30, // initial rotation -30 to 30 degrees
        fontFamily: FONT_FAMILIES[Math.floor(Math.random() * FONT_FAMILIES.length)],
        fontWeight: FONT_WEIGHTS[Math.floor(Math.random() * FONT_WEIGHTS.length)],
        fontSize: Math.floor(Math.random() * 60 + 36) + 'px', // 36px to 96px
        letterSpacing: Math.random() * 0.5 + 'em', // 0em to 0.5em
        text: TEXT_VARIATIONS[Math.floor(Math.random() * TEXT_VARIATIONS.length)],
        tossHeight,
        duration,
        fadeStart
      };
      
      setSuis((prev) => [...prev, newSui]);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleAnimationComplete = (id: number) => {
    setSuis((prev) => prev.filter(sui => sui.id !== id));
  };

  return (
    <>
      <button 
        id="mute-btn"
        onClick={toggleMute}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          background: 'rgba(255, 255, 255, 0.8)',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          userSelect: 'none'
        }}
        title={isMuted ? "Unmute SIU sounds" : "Mute SIU sounds"}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {suis.map((sui) => (
        <motion.div
          key={sui.id}
          initial={{ 
            y: "110vh",
            x: "-50%",
            rotate: sui.rotation,
            opacity: 1,
          }}
          animate={{
            y: ["110vh", sui.tossHeight, "120vh"], // travel up to random height, then fall down
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: sui.duration,
            times: [0, sui.fadeStart, 1], // fade out starts at random time
            ease: ["easeOut", "easeIn"],
          }}
          onAnimationComplete={() => handleAnimationComplete(sui.id)}
          style={{
            position: 'fixed',
            left: `${sui.x}vw`,
            top: 0,
            pointerEvents: 'none',
            userSelect: 'none',
            color: '#FAFAFA',
            WebkitTextStroke: '2px #222',
            textShadow: '2px 4px 6px rgba(0, 0, 0, 0.2)',
            fontSize: sui.fontSize,
            fontWeight: sui.fontWeight,
            fontFamily: sui.fontFamily,
            letterSpacing: sui.letterSpacing,
            textTransform: 'uppercase',
            zIndex: 9999,
          }}
        >
          {sui.text}
        </motion.div>
      ))}
    </>
  );
}
