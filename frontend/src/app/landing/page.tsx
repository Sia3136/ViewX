"use client";

import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { useRouter } from "next/navigation";
import { Shield, Eye, Activity, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden flex flex-col items-center justify-center relative p-6">
      {/* Background Orbs */}
      <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[var(--primary)] opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[var(--accent)] opacity-[0.05] blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-4xl w-full text-center z-10"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
          <span className="text-xs font-medium text-[var(--text-2)] tracking-wide uppercase">Next-Gen Exam Proctoring</span>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-balance">
          Intelligent Surveillance <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
            Powered by AI
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-[var(--text-2)] mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
          DrishtiAI provides real-time, automated monitoring to ensure examination integrity. High-accuracy behavior analysis without the cognitive overload.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GlassButton 
            variant="primary" 
            className="px-8 py-6 text-base group"
            onClick={() => router.push("/")}
          >
            Enter Dashboard
            <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </GlassButton>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full z-10">
        {[
          { icon: <Eye className="text-[var(--primary)] mb-4" size={32} />, title: "Live Computer Vision", desc: "Real-time pose and behavior analysis processing multiple streams flawlessly." },
          { icon: <Activity className="text-[var(--sage)] mb-4" size={32} />, title: "Instant Alerts", desc: "Zero-latency notifications for prohibited objects and suspicious activities." },
          { icon: <Shield className="text-[var(--accent)] mb-4" size={32} />, title: "Automated Integrity", desc: "Eliminate manual monitoring with intelligent, self-managing oversight." },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1), duration: 0.5 }}
            className="card-surface p-8 text-left hover:border-[var(--primary)]/30 transition-colors cursor-default"
          >
            {feature.icon}
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-[var(--text-2)] leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
