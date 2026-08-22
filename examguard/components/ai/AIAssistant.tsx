"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Send, X } from "lucide-react";
import { suggestedQuestions, getMockAIResponse } from "@/lib/mock-data/ai";
import { AIMessage } from "@/lib/types";
import { AIMessageBubble } from "./AIMessage";

export function AIAssistant({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
}) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function ask(question: string) {
    if (!question.trim()) return;
    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      const reply: AIMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: getMockAIResponse(question),
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      };
      setMessages((prev) => [...prev, reply]);
      setTyping(false);
    }, 1100 + Math.random() * 700);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            role="complementary"
            aria-label="ExamGuard AI Assistant"
            className="fixed z-50 right-0 top-0 h-full w-full sm:w-[400px] glass-surface border-l shadow-2xl flex flex-col
                       sm:top-4 sm:right-4 sm:h-[calc(100vh-2rem)] sm:rounded-3xl sm:border"
          >
            <div className="flex items-center gap-3 p-5 border-b shrink-0">
              <div className="w-9 h-9 rounded-full bg-[var(--sage)] flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="font-semibold text-sm">ExamGuard AI</div>
                <div className="text-xs text-[var(--text-2)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--sage)] breathing-dot" />
                  Online · Monitoring active
                </div>
              </div>
              <button onClick={onClose} aria-label="Close AI assistant" className="ml-auto rounded-full p-1.5 hover:bg-[var(--surface-2)]">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center text-center gap-2 py-8"
                >
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles size={28} className="text-[var(--sage)]" />
                  </motion.div>
                  <p className="font-medium mt-2">How can I help?</p>
                  <p className="text-sm text-[var(--text-2)]">Ask me about the current examination</p>
                </motion.div>
              )}

              {messages.map((m, i) => (
                <AIMessageBubble key={m.id} message={m} index={i} />
              ))}

              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 pl-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--text-2)]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </motion.div>
              )}

              {messages.length === 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {suggestedQuestions.map((q, i) => (
                    <motion.button
                      key={q}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.15 + i * 0.08 }}
                      onClick={() => ask(q)}
                      className="text-left text-sm px-4 py-3 rounded-2xl card-surface hover:border-[var(--sage-light)] transition-colors"
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="p-4 border-t shrink-0 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask ExamGuard AI..."
                aria-label="Ask ExamGuard AI"
                className="flex-1 bg-transparent border rounded-full px-4 py-2.5 text-sm outline-none focus:border-[var(--sage-light)] placeholder:text-[var(--text-2)]"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="rounded-full p-2.5 bg-[var(--sage)] text-white hover:brightness-110 transition-all disabled:opacity-50"
                disabled={!input.trim()}
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
