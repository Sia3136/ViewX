"use client";

import { motion } from "framer-motion";
import { AIMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AIMessageBubble({ message, index }: { message: AIMessage; index: number }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser ? "bg-[var(--sage)] text-white rounded-br-md" : "card-surface rounded-bl-md"
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}
