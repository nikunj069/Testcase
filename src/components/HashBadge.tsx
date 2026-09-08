"use client";
import { useState } from "react";
import { Copy, CheckCircle } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

export function HashBadge({ hash }: { hash?: string }) {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  if (!hash) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800/40 text-zinc-500 border border-zinc-700/50 rounded text-[10px] font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" />
        HASH PENDING
      </div>
    );
  }

  const shortHash = hash.substring(0, 8);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="relative inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 text-zinc-300 border border-white/10 rounded hover:border-sky-500/50 transition-colors cursor-pointer group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleCopy}
    >
      <span className="text-[10px] font-mono font-medium tracking-wider">
        {shortHash}
      </span>
      {copied ? (
        <CheckCircle size={12} className="text-green-500" weight="bold" />
      ) : (
        <Copy size={12} className="text-zinc-500 group-hover:text-sky-400 transition-colors" />
      )}

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] font-mono rounded shadow-xl border border-zinc-700 whitespace-nowrap z-50 pointer-events-none"
          >
            {hash}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
