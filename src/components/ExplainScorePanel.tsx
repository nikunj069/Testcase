"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import { X, ChartBar } from "@phosphor-icons/react";

function AnimatedNumber({ value, delay = 0, duration = 0.8 }: { value: number, delay?: number, duration?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Number(latest.toFixed(2)));
  
  useEffect(() => {
    const controls = animate(count, value, { duration, delay });
    return () => controls.stop();
  }, [value, delay, count]);
  
  return <motion.span>{rounded}</motion.span>;
}

export function ExplainScorePanel({ data, onClose, nodeLabel }: { data: any, onClose: () => void, nodeLabel: string }) {
  // data shape: { total: number, components: [{ name: string, raw: number, weight: number, contribution: number }] }
  const [showTotal, setShowTotal] = useState(false);

  useEffect(() => {
    if (data && data.components) {
      // Show total score after all component rows have animated
      const timer = setTimeout(() => {
        setShowTotal(true);
      }, data.components.length * 250 + 800);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute top-4 right-4 z-40 w-96 bg-zinc-900/95 backdrop-blur-xl shadow-2xl border border-sky-500/30 rounded-[2rem] overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]"
    >
      <div className="p-5 bg-sky-500/10 text-white flex justify-between items-start border-b border-sky-500/20">
        <div>
          <div className="text-[10px] font-mono text-sky-400 uppercase tracking-widest mb-1">DETERMINISTIC RISK BREAKDOWN</div>
          <h2 className="text-lg font-bold font-mono">{nodeLabel}</h2>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-5">
        {data.error || !data.components ? (
          <div className="text-red-400 font-mono text-sm border border-red-500/30 bg-red-500/10 p-4 rounded-xl">
            {data.error || "Risk score data unavailable."}
          </div>
        ) : (
          <>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
              S = min(100, Σ weight × raw)
            </div>

            <div className="space-y-4">
              {data.components.map((item: any, i: number) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.25 }}
                  className="bg-zinc-800/40 border border-white/5 rounded-xl p-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <span className="text-xs text-zinc-300 font-medium uppercase tracking-wide">{item.name}</span>
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      +<AnimatedNumber value={item.contribution} delay={i * 0.25 + 0.4} />
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 relative z-10">
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.25 + 0.1 }}>
                      Raw: {item.raw}
                    </motion.span>
                    <span>×</span>
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.25 + 0.2 }}>
                      W: {item.weight}
                    </motion.span>
                  </div>

                  {/* Progress bar background */}
                  <div className="absolute bottom-0 left-0 h-1 bg-zinc-700/50 w-full">
                    <motion.div
                      className="h-full bg-sky-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, item.raw)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.25 + 0.5 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm font-mono text-zinc-400">TOTAL SCORE</span>
              {showTotal ? (
                <motion.span 
                  initial={{ scale: 0.5, opacity: 0, color: '#fff' }}
                  animate={{ scale: 1, opacity: 1, color: data.total >= 67 ? '#dc2626' : data.total >= 34 ? '#d97706' : '#16a34a' }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="text-4xl font-bold font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                  <AnimatedNumber value={data.total} duration={1.5} />
                </motion.span>
              ) : (
                <span className="text-4xl font-bold text-transparent font-mono">00</span>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
