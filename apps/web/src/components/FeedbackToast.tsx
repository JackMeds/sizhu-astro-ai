import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { subscribeFeedback, type FeedbackMessage } from "@/lib/feedback";

export function FeedbackToast() {
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => subscribeFeedback(setFeedback), []);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  return (
    <div className="feedback-toast-host" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait">
        {feedback ? (
          <motion.div
            className={`feedback-toast ${feedback.tone}`}
            key={feedback.id}
            initial={{ opacity: 0, y: -12, scale: .98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: .985 }}
            transition={{ duration: .2, ease: [0.22, 1, 0.36, 1] }}
            role={feedback.tone === "error" ? "alert" : "status"}
          >
            <span className="feedback-toast-icon">
              {feedback.tone === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            </span>
            <div>
              <strong>{feedback.title}</strong>
              <span>{feedback.message}</span>
            </div>
            <button type="button" aria-label="关闭提示" onClick={() => setFeedback(null)}><X size={15} /></button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
