import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  name: string;
  score: number;
  ts: number;
}

interface LeaderboardProps {
  refreshKey: number;
  submittedEntry?: { name: string; score: number } | null;
  autoExpand?: boolean;
}

// ─── constants ────────────────────────────────────────────────────────────────

const MEDALS = ['🥇', '🥈', '🥉'];

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export default function Leaderboard({
  refreshKey,
  submittedEntry,
  autoExpand = false,
}: LeaderboardProps) {
  const [isOpen,  setIsOpen]  = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Non-OK response');
      const data: LeaderboardEntry[] = await res.json();
      setEntries(data);
    } catch {
      setError('Could not load leaderboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount, and whenever a new score is submitted
  useEffect(() => {
    fetchEntries();
  }, [refreshKey, fetchEntries]);

  // Auto-expand after submission
  useEffect(() => {
    if (autoExpand && refreshKey > 0) setIsOpen(true);
  }, [autoExpand, refreshKey]);

  const isHighlighted = (entry: LeaderboardEntry): boolean =>
    !!submittedEntry &&
    entry.name  === submittedEntry.name &&
    entry.score === submittedEntry.score;

  return (
    <div
      id="leaderboard-root"
      style={{ position: 'fixed', top: 80, right: 20, zIndex: 9994, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
    >
      {/* ── Tab ─────────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setIsOpen(o => !o)}
          style={{
            background: 'rgba(255,255,255,0.92)',
            border: 'none',
            borderRadius: '14px',
            padding: '10px 24px',
            fontSize: 13,
            fontFamily: '"Segoe UI", Roboto, sans-serif',
            fontWeight: 700,
            color: '#333',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.09)',
            letterSpacing: '0.08em',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          🏆 TOP 10 {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* ── Drawer ──────────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 160px)',
              width: '340px',
              borderRadius: '16px',
              boxShadow: '0 6px 28px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ padding: '14px 16px 20px', width: '100%', boxSizing: 'border-box' }}>

              {/* Loading */}
              {loading && (
                <div style={{
                  textAlign: 'center',
                  padding: '18px 0',
                  color: '#bbb',
                  fontFamily: '"Segoe UI", sans-serif',
                  fontSize: 14,
                }}>
                  Loading…
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div style={{
                  textAlign: 'center',
                  padding: '14px 0',
                  color: '#FF3B30',
                  fontFamily: '"Segoe UI", sans-serif',
                  fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && entries.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '18px 0',
                  color: '#ccc',
                  fontFamily: '"Segoe UI", sans-serif',
                  fontSize: 14,
                }}>
                  No scores yet. Be the first! 🐐
                </div>
              )}

              {/* Entry rows */}
              {!loading && entries.map((entry, i) => {
                const hl = isHighlighted(entry);
                return (
                  <motion.div
                    key={`${entry.name}-${entry.score}-${i}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.22 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '9px 12px',
                      borderRadius: 12,
                      marginBottom: 5,
                      background: hl
                        ? 'linear-gradient(135deg, #FFF3E0 0%, #FFE0CC 100%)'
                        : i % 2 === 0 ? '#F8F8F8' : 'transparent',
                      border: hl ? '2px solid #FF6B35' : '2px solid transparent',
                      boxShadow: hl ? '0 0 18px rgba(255,107,53,0.22)' : 'none',
                      gap: 12,
                      transition: 'all 0.3s',
                    }}
                  >
                    {/* Rank */}
                    <span style={{
                      fontSize: i < 3 ? 20 : 13,
                      minWidth: 26,
                      textAlign: 'center',
                      fontFamily: '"Segoe UI", sans-serif',
                      fontWeight: 700,
                      color: '#666',
                    }}>
                      {i < 3 ? MEDALS[i] : `${i + 1}.`}
                    </span>

                    {/* Name */}
                    <span style={{
                      flex: 1,
                      fontFamily: '"Segoe UI", Roboto, sans-serif',
                      fontWeight: hl ? 800 : 600,
                      fontSize: 15,
                      color: '#1A1A1A',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {entry.name}
                      {hl && (
                        <span style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: '#FF6B35',
                          fontWeight: 800,
                          letterSpacing: '0.05em',
                        }}>
                          ← you!
                        </span>
                      )}
                    </span>

                    {/* Score */}
                    <span style={{
                      fontFamily: '"Impact", fantasy',
                      fontSize: 22,
                      fontWeight: 900,
                      color: i === 0 ? '#FF6B35' : '#333',
                    }}>
                      {entry.score}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
