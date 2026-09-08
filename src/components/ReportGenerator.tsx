"use client";
import { useState } from "react";
import { Printer, DownloadSimple, CheckCircle } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { HashBadge } from "./HashBadge";

export function ReportGenerator({ investigationId }: { investigationId: string }) {
  const [status, setStatus] = useState<"IDLE" | "GENERATING" | "READY">("IDLE");
  const [reportData, setReportData] = useState<{ generatedAt: string; reportHash: string; downloadUrl: string } | null>(null);

  const handleGenerate = async () => {
    setStatus("GENERATING");
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investigationId })
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        setStatus("READY");
      } else {
        setStatus("IDLE");
      }
    } catch (e) {
      console.error(e);
      setStatus("IDLE");
    }
  };

  return (
    <div className="flex flex-col items-end">
      <AnimatePresence mode="wait">
        {status === "IDLE" && (
          <motion.button 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={handleGenerate} 
            className="btn-gov text-xs py-2 px-4 flex items-center gap-2"
          >
            <Printer size={16} /> Generate Section 65B Report
          </motion.button>
        )}

        {status === "GENERATING" && (
          <motion.div 
            key="generating"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            {/* Animated Stamp SVG */}
            <motion.div
              initial={{ scale: 2, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="w-16 h-16 rounded-full border-4 border-red-600/80 text-red-600/80 flex items-center justify-center relative overflow-hidden"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-red-600/40 rounded-full"
              />
              <span className="text-[10px] font-bold tracking-widest font-mono uppercase transform -rotate-12">
                SEALING
              </span>
            </motion.div>
            <span className="text-[10px] font-mono text-zinc-400 animate-pulse">CRYPTOGRAPHICALLY STAMPING...</span>
          </motion.div>
        )}

        {status === "READY" && reportData && (
          <motion.div 
            key="ready"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-end gap-3"
          >
            <div className="flex items-center gap-2 text-green-500 font-mono text-xs font-bold bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <CheckCircle size={16} weight="fill" />
              EVIDENTIARY SEAL APPLIED
            </div>
            <a 
              href={reportData.downloadUrl}
              download
              className="btn-gov text-xs py-2 px-4 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
            >
              <DownloadSimple size={16} /> Download Certified PDF
            </a>
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-[10px] font-mono uppercase">Doc Hash (SHA-256):</span>
              <HashBadge hash={reportData.reportHash} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
