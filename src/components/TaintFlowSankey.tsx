"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { SpinnerGap } from "@phosphor-icons/react";

export function TaintFlowSankey({ walletId }: { walletId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/taint-flow/${walletId}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [walletId]);

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-zinc-500 font-mono text-xs">
        <SpinnerGap size={16} className="animate-spin mr-2" />
        TRACING TAINT FLOW...
      </div>
    );
  }

  if (!data) return null;

  // Fixed coordinates for 3-layer visualization
  // Layer 1 (x: 10) -> Layer 2 (x: 150) -> Layer 3 (x: 290)
  
  return (
    <div className="w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4 mt-4">
      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-4">
        MFSCOPE TAINT FLOW ANALYSIS
      </div>
      <div className="relative w-full h-48 overflow-hidden rounded">
        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
          {/* Animated Paths */}
          <motion.path
            d="M 20 100 C 80 100, 100 50, 180 50"
            fill="none"
            stroke="url(#gradient-critical)"
            strokeWidth="12"
            strokeOpacity="0.6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M 180 50 C 240 50, 260 30, 320 30"
            fill="none"
            stroke="url(#gradient-high)"
            strokeWidth="8"
            strokeOpacity="0.6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M 180 50 C 240 50, 260 120, 320 120"
            fill="none"
            stroke="url(#gradient-med)"
            strokeWidth="6"
            strokeOpacity="0.6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.7, ease: "easeInOut" }}
          />
          <motion.path
            d="M 20 100 C 80 100, 100 150, 180 150"
            fill="none"
            stroke="url(#gradient-critical)"
            strokeWidth="8"
            strokeOpacity="0.6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Nodes Layer 1 */}
          <rect x="10" y="80" width="10" height="40" fill="#dc2626" rx="2" />
          <text x="25" y="104" fill="#d4d4d8" fontSize="10" fontFamily="monospace">Darknet</text>
          
          {/* Nodes Layer 2 */}
          <rect x="175" y="30" width="10" height="40" fill="#d97706" rx="2" />
          <text x="190" y="54" fill="#d4d4d8" fontSize="10" fontFamily="monospace">Mixer Pool</text>
          
          <rect x="175" y="130" width="10" height="40" fill="#b91c1c" rx="2" />
          <text x="190" y="154" fill="#d4d4d8" fontSize="10" fontFamily="monospace">OTC Desk</text>
          
          {/* Nodes Layer 3 */}
          <rect x="315" y="10" width="10" height="40" fill="#047857" rx="2" />
          <text x="330" y="34" fill="#d4d4d8" fontSize="10" fontFamily="monospace">Binance (KYC)</text>

          <rect x="315" y="100" width="10" height="40" fill="#16a34a" rx="2" />
          <text x="330" y="124" fill="#d4d4d8" fontSize="10" fontFamily="monospace">HDFC INR</text>

          <defs>
            <linearGradient id="gradient-critical" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="gradient-high" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="gradient-med" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
        <span className="text-[10px] font-mono text-zinc-500">TOTAL VOLUME TRACKED</span>
        <span className="text-xs font-mono font-bold text-amber-400">${data.totalFlow.toLocaleString()} USD</span>
      </div>
    </div>
  );
}
