export type FeedbackTone = "success" | "error";

export interface FeedbackMessage {
  id: number;
  tone: FeedbackTone;
  title: string;
  message: string;
}

const FEEDBACK_EVENT = "sizhu:feedback";

export function showFeedback(tone: FeedbackTone, title: string, message: string) {
  if (typeof window === "undefined") return;
  const detail: FeedbackMessage = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    tone,
    title,
    message
  };
  window.dispatchEvent(new CustomEvent<FeedbackMessage>(FEEDBACK_EVENT, { detail }));
}

export function subscribeFeedback(listener: (message: FeedbackMessage) => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => listener((event as CustomEvent<FeedbackMessage>).detail);
  window.addEventListener(FEEDBACK_EVENT, handler);
  return () => window.removeEventListener(FEEDBACK_EVENT, handler);
}
