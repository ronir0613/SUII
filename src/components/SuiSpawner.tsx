import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Leaderboard from './Leaderboard';

// ─── constants ────────────────────────────────────────────────────────────────

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
  'Monaco, monospace',
];
const FONT_WEIGHTS = ['normal', 'bold', '100', '300', '900'];
const TEXT_VARIATIONS = ['SIU', 'SIUU', 'SIUUU', 'SIUUUU', 'SIUUUUU'];
const CHALLENGE_DURATION = 10;
const LS_BEST_KEY = 'sui_best_score';

// ─── types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'countdown' | 'done';

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

// ─── helpers ──────────────────────────────────────────────────────────────────

function sanitizeName(val: string): string {
  return val.replace(/[^a-zA-Z0-9 _\-.]/g, '').slice(0, 15);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── TimerDisplay ─────────────────────────────────────────────────────────────

function TimerDisplay({ timeLeft }: { timeLeft: number }) {
  const urgent  = timeLeft <= 2;
  const warning = timeLeft <= 5 && timeLeft > 2;
  const color  = urgent ? '#FF3B30' : warning ? '#FF9F0A' : '#FAFAFA';
  const stroke = urgent ? '#7A0000' : '#222';

  return (
    <div
      aria-live="polite"
      aria-label={`${timeLeft} seconds remaining`}
      style={{
        position: 'fixed',
        top: 24,
        left: 24,
        zIndex: 9998,
        pointerEvents: 'none',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <span style={{
        fontSize: 11,
        fontFamily: '"Segoe UI", Roboto, sans-serif',
        fontWeight: 700,
        letterSpacing: '0.15em',
        color: '#333',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}>
        ⏱ time
      </span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={timeLeft}
          initial={{ y: -28, opacity: 0, scale: 0.75 }}
          animate={{ y: 0,   opacity: 1, scale: 1    }}
          exit   ={{ y: 28,  opacity: 0, scale: 0.75 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            display: 'block',
            fontFamily: '"Impact", fantasy',
            fontSize: 'clamp(52px, 13vw, 84px)',
            fontWeight: 900,
            color,
            WebkitTextStroke: `2px ${stroke}`,
            textShadow: urgent
              ? '0 0 28px rgba(255,59,48,0.55)'
              : '0 4px 12px rgba(0,0,0,0.15)',
            lineHeight: 1,
          }}
        >
          {timeLeft}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─── ClickCounterDisplay ──────────────────────────────────────────────────────

function ClickCounterDisplay({
  count, bestScore, phase,
}: { count: number; bestScore: number; phase: Phase }) {
  if (phase === 'idle' && bestScore === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9997,
      pointerEvents: 'none',
      userSelect: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {phase === 'countdown' && (
        <>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={count}
              initial={{ y: -8, opacity: 0.6 }}
              animate={{ y: 0,  opacity: 1   }}
              transition={{ duration: 0.08 }}
              style={{
                display: 'block',
                fontFamily: '"Impact", fantasy',
                fontSize: 'clamp(28px, 8vw, 50px)',
                fontWeight: 900,
                color: '#111',
                WebkitTextStroke: '1.5px rgba(255,255,255,0.85)',
                textShadow: '0 2px 10px rgba(255,255,255,0.6)',
                lineHeight: 1,
              }}
            >
              {count}
            </motion.span>
          </AnimatePresence>
          <span style={{
            fontSize: 10,
            fontFamily: '"Segoe UI", sans-serif',
            fontWeight: 700,
            color: '#333',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            clicks
          </span>
        </>
      )}

      {phase === 'idle' && bestScore > 0 && (
        <div style={{
          fontSize: 'clamp(11px, 2.8vw, 14px)',
          fontFamily: '"Segoe UI", Roboto, sans-serif',
          fontWeight: 700,
          color: '#333',
          background: 'rgba(255,255,255,0.78)',
          borderRadius: 20,
          padding: '5px 14px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          🏅 Your best: <strong>{bestScore}</strong>
        </div>
      )}
    </div>
  );
}

// ─── ScoreReveal ──────────────────────────────────────────────────────────────

interface ScoreRevealProps {
  score: number;
  onPlayAgain: () => void;
  onSubmitted: (name: string) => void;
}

function ScoreReveal({ score, onPlayAgain, onSubmitted }: ScoreRevealProps) {
  const [name,       setName]       = useState('');
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  // Stable random display values — computed once on mount
  const [scoreFont]    = useState(() => randomFrom(FONT_FAMILIES));
  const [scoreWeight]  = useState(() => randomFrom(FONT_WEIGHTS));
  const [rotateStart]  = useState(() => Math.random() * 28 - 14);

  const emoji = score >= 100 ? '🐐🔥' : score >= 70 ? '🐐' : score >= 40 ? '🔥' : '👏';

  const shareText = encodeURIComponent(
    `I hit ${score} SIUUUs in 10 seconds 🐐 Beat me: clicksiu.buzz`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${shareText}`;
  const waUrl    = `https://wa.me/?text=${shareText}`;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(sanitizeName(e.target.value));
  };

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), score }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? 'Failed to submit. Try again.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      onSubmitted(name.trim());
    } catch {
      setError('Network error. Check your connection.');
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '2px solid #E8E8E8',
    fontSize: 16,   // ≥16 px → prevents iOS auto-zoom
    fontFamily: '"Segoe UI", Roboto, sans-serif',
    outline: 'none',
    background: '#F8F8F8',
    color: '#1A1A1A',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9995,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,190,145,0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ scale: 0.45, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 290, damping: 22, delay: 0.04 }}
        style={{
          background: '#FAFAFA',
          borderRadius: 24,
          padding: 'clamp(20px, 5vw, 36px)',
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          textAlign: 'center',
        }}
      >
        {/* Header */}
        <span style={{
          fontSize: 11,
          fontFamily: '"Segoe UI", sans-serif',
          fontWeight: 800,
          letterSpacing: '0.2em',
          color: '#AAA',
          textTransform: 'uppercase',
        }}>
          CHALLENGE OVER
        </span>

        {/* Score — toss-style reveal, reuses FONT_FAMILIES randomisation */}
        <motion.div
          initial={{ y: '40vh', opacity: 0, scale: 0.4, rotate: rotateStart }}
          animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.12 }}
          style={{
            fontFamily: scoreFont,
            fontWeight: scoreWeight,
            fontSize: 'clamp(72px, 22vw, 120px)',
            color: '#1A1A1A',
            WebkitTextStroke: '2px #888',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {score}
        </motion.div>

        <div style={{
          fontSize: 'clamp(13px, 3.5vw, 16px)',
          color: '#555',
          fontFamily: '"Segoe UI", sans-serif',
          fontWeight: 600,
          marginTop: -6,
        }}>
          SIUUUs in 10 seconds {emoji}
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#000',
              color: '#fff',
              borderRadius: 100,
              padding: '10px 18px',
              fontSize: 14,
              fontFamily: '"Segoe UI", sans-serif',
              fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            𝕏 Share score
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#25D366',
              color: '#fff',
              borderRadius: 100,
              padding: '10px 18px',
              fontSize: 14,
              fontFamily: '"Segoe UI", sans-serif',
              fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            💬 WhatsApp
          </a>
        </div>

        {/* Leaderboard submit */}
        {!submitted ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{
              fontSize: 13,
              color: '#999',
              fontFamily: '"Segoe UI", sans-serif',
              fontWeight: 600,
            }}>
              submit to leaderboard
            </span>
            <input
              id="player-name-input"
              type="text"
              placeholder="your name or handle"
              value={name}
              onChange={handleNameChange}
              maxLength={15}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={inputStyle}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#FF6B35'; }}
              onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = '#E8E8E8'; }}
            />
            {error && (
              <span style={{
                fontSize: 12,
                color: '#FF3B30',
                fontFamily: '"Segoe UI", sans-serif',
              }}>
                {error}
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || submitting}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 14,
                border: 'none',
                background: name.trim() && !submitting
                  ? 'linear-gradient(135deg, #FF6B35 0%, #FFBE91 100%)'
                  : '#EBEBEB',
                color: name.trim() && !submitting ? '#fff' : '#bbb',
                fontSize: 15,
                fontFamily: '"Segoe UI", Roboto, sans-serif',
                fontWeight: 800,
                cursor: name.trim() && !submitting ? 'pointer' : 'not-allowed',
                letterSpacing: '0.03em',
                transition: 'all 0.2s',
                boxShadow: name.trim() && !submitting
                  ? '0 6px 20px rgba(255,107,53,0.35)'
                  : 'none',
              }}
            >
              {submitting ? '⏳ Submitting…' : '🏆 Submit to Leaderboard'}
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1,    opacity: 1 }}
            style={{
              fontSize: 14,
              fontFamily: '"Segoe UI", sans-serif',
              fontWeight: 700,
              color: '#1A9E4E',
              padding: '10px 20px',
              background: '#E8F8EE',
              borderRadius: 12,
              width: '100%',
              textAlign: 'center',
            }}
          >
            ✅ Score submitted! Check the leaderboard ↓
          </motion.div>
        )}

        {/* Play again */}
        <button
          onClick={onPlayAgain}
          style={{
            background: 'transparent',
            border: '2px solid #DDD',
            borderRadius: 100,
            padding: '10px 26px',
            fontSize: 14,
            fontFamily: '"Segoe UI", Roboto, sans-serif',
            fontWeight: 700,
            color: '#888',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#FFBE91';
            (e.currentTarget as HTMLButtonElement).style.color = '#333';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#DDD';
            (e.currentTarget as HTMLButtonElement).style.color = '#888';
          }}
        >
          ↩ Play Again
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── SuiSpawner (main) ────────────────────────────────────────────────────────

export default function SuiSpawner() {
  const [suis,    setSuis]    = useState<SuiInstance[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const isMutedRef = useRef(true);

  // Challenge state
  const [phase,      setPhase]      = useState<Phase>('idle');
  const [timeLeft,   setTimeLeft]   = useState(CHALLENGE_DURATION);
  const [clickCount, setClickCount] = useState(0);    // live display counter
  const [finalScore, setFinalScore] = useState(0);    // accurate score for ScoreReveal
  const [bestScore,  setBestScore]  = useState(0);
  const [lbRefreshKey,  setLbRefreshKey]  = useState(0);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  // Stable refs — shared with the click handler to avoid stale closures
  const phaseRef      = useRef<Phase>('idle');
  const clickCountRef = useRef(0);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load best score on mount
  useEffect(() => {
    const stored = localStorage.getItem(LS_BEST_KEY);
    if (stored) setBestScore(parseInt(stored, 10) || 0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    isMutedRef.current = next;
  };

  const startChallenge = useCallback(() => {
    clickCountRef.current = 0;
    setClickCount(0);
    setFinalScore(0);
    setTimeLeft(CHALLENGE_DURATION);
    setSubmittedName(null);
    phaseRef.current = 'countdown';
    setPhase('countdown');

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timerRef.current!);
          timerRef.current  = null;
          phaseRef.current  = 'done';   // freeze counting immediately (sync)

          const fs = clickCountRef.current;
          setTimeout(() => {
            setFinalScore(fs);
            setPhase('done');
            setBestScore(best => {
              const newBest = Math.max(best, fs);
              localStorage.setItem(LS_BEST_KEY, String(newBest));
              return newBest;
            });
          }, 0);

          return 0;
        }
        return next;
      });
    }, 1000);
  }, []);

  const resetToIdle = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    phaseRef.current = 'idle';
    setPhase('idle');
    setTimeLeft(CHALLENGE_DURATION);
    setClickCount(0);
  }, []);

  const handleSubmitted = useCallback((name: string) => {
    setSubmittedName(name);
    setLbRefreshKey(k => k + 1);
  }, []);

  // ── Main click / touch handler ──────────────────────────────────────────────
  useEffect(() => {
    let idCounter = 0;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Ignore clicks on fixed UI overlays
      if (target.closest('#mute-btn'))        return;
      if (target.closest('#challenge-btn'))   return;
      if (target.closest('#leaderboard-root')) return;

      // Count click during countdown phase
      if (phaseRef.current === 'countdown') {
        clickCountRef.current += 1;
        setClickCount(clickCountRef.current);
      }

      // No SIU spawning when ScoreReveal is up
      if (phaseRef.current === 'done') return;

      // ── Sound ──────────────────────────────────────────────────────────────
      if (!isMutedRef.current) {
        const delay = Math.random() * 80;
        setTimeout(() => {
          const audio = new Audio('/sui.mp3');
          const targetVol = Math.random() * 0.15 + 0.20;
          audio.playbackRate = Math.random() * 0.2 + 0.9;
          audio.volume = 0;
          audio.play().then(() => {
            let vol = 0;
            const fi = setInterval(() => {
              vol += targetVol / 4;
              if (vol >= targetVol) { audio.volume = targetVol; clearInterval(fi); }
              else audio.volume = vol;
            }, 5);
            audio.addEventListener('timeupdate', () => {
              if (audio.duration && audio.duration - audio.currentTime <= 0.08) {
                audio.volume = Math.max(0, audio.volume - targetVol / 4);
              }
            });
          }).catch(() => {});
        }, delay);
      }

      // ── SUI toss ───────────────────────────────────────────────────────────
      const tossHeight = `${Math.floor(Math.random() * 60 + 10)}vh`;
      const duration   = Math.random() * 1.5 + 1.5;
      const fadeStart  = Math.random() * 0.4 + 0.3;

      setSuis(prev => [...prev, {
        id: idCounter++,
        x:             Math.random() * 90 + 5,
        rotation:      Math.random() * 60 - 30,
        fontFamily:    randomFrom(FONT_FAMILIES),
        fontWeight:    randomFrom(FONT_WEIGHTS),
        fontSize:      `clamp(${Math.floor(Math.random() * 20 + 24)}px, ${Math.floor(Math.random() * 10 + 6)}vw, ${Math.floor(Math.random() * 60 + 48)}px)`,
        letterSpacing: `${Math.random() * 0.5}em`,
        text:          randomFrom(TEXT_VARIATIONS),
        tossHeight,
        duration,
        fadeStart,
      }]);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleAnimationComplete = (id: number) => {
    setSuis(prev => prev.filter(s => s.id !== id));
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mute button */}
      <button
        id="mute-btn"
        onClick={toggleMute}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 10000,
          background: 'rgba(255,255,255,0.84)',
          border: 'none',
          borderRadius: '50%',
          width: 50,
          height: 50,
          fontSize: 22,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          userSelect: 'none',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
        title={isMuted ? 'Unmute SIU sounds' : 'Mute SIU sounds'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {/* Animated countdown timer */}
      {phase === 'countdown' && <TimerDisplay timeLeft={timeLeft} />}

      {/* Live click counter / personal best */}
      <ClickCounterDisplay count={clickCount} bestScore={bestScore} phase={phase} />

      {/* Start Challenge button — shown only in idle */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div
            key="challenge-btn-wrapper"
            initial={{ y: 24, opacity: 0, scale: 0.9 }}
            animate={{ y: 0,  opacity: 1, scale: 1   }}
            exit   ={{ y: 24, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              bottom: 82,    // sits above the leaderboard tab
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 9996,
              pointerEvents: 'none',
            }}
          >
            <button
              id="challenge-btn"
              onClick={startChallenge}
              style={{
                pointerEvents: 'auto',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FFBE91 100%)',
                border: 'none',
                borderRadius: 100,
                padding: 'clamp(13px, 3.5vw, 17px) clamp(28px, 7vw, 40px)',
                fontSize: 'clamp(15px, 4.2vw, 19px)',
                fontFamily: '"Segoe UI", Roboto, sans-serif',
                fontWeight: 800,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 8px 28px rgba(255,107,53,0.42)',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              🏆 Start Challenge
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Reveal modal */}
      <AnimatePresence>
        {phase === 'done' && (
          <ScoreReveal
            key="score-reveal"
            score={finalScore}
            onPlayAgain={resetToIdle}
            onSubmitted={handleSubmitted}
          />
        )}
      </AnimatePresence>

      {/* Leaderboard drawer — always mounted, expands after submit */}
      <Leaderboard
        refreshKey={lbRefreshKey}
        submittedEntry={submittedName ? { name: submittedName, score: finalScore } : null}
        autoExpand={lbRefreshKey > 0}
      />

      {/* SUI toss animations */}
      {suis.map(sui => (
        <motion.div
          key={sui.id}
          initial={{ y: '110vh', x: '-50%', rotate: sui.rotation, opacity: 1 }}
          animate={{
            y:       ['110vh', sui.tossHeight, '120vh'],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: sui.duration,
            times:    [0, sui.fadeStart, 1],
            ease:     ['easeOut', 'easeIn'],
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
            textShadow: '2px 4px 6px rgba(0,0,0,0.2)',
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
