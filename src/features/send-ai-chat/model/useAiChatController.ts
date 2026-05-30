import { useCallback, useEffect, useRef, useState } from "react";
import type { AiChatResponse, ChatMessage } from "../../../entities/chat-message";
import type { UserPreferences } from "../../../entities/user-preferences";
import { formatKoreanTime } from "../../../shared/lib/time";
import { sendAiChat } from "../api/sendAiChat";
import { createFallbackChatMessage } from "./fallback";
import { initialChatMessages } from "./initialMessages";

type AiChatContext = {
  startStation: string;
  endStation: string;
  deadlineTime: string;
  preferences: UserPreferences;
};

type UseAiChatControllerOptions = {
  context: AiChatContext;
  onApplyResponse: (response: AiChatResponse) => void;
  onApplyFallback: (message: ChatMessage) => void;
};

export function useAiChatController({
  context,
  onApplyResponse,
  onApplyFallback,
}: UseAiChatControllerOptions) {
  const [chatInput, setChatInput] = useState("");
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const lastRequestRef = useRef<string | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || chatbotLoading || inFlightRef.current) return;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      inFlightRef.current = true;
      lastRequestRef.current = text;

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: "user",
        text,
        timestamp: formatKoreanTime(),
      };

      setChatMessages((prev) => [...prev, userMsg]);
      setChatInput("");
      setChatError(null);
      setChatbotLoading(true);

      try {
        const data = await sendAiChat({
          message: text,
          context,
        });

        const aiMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "ai",
          text: data.textAnswer,
          timestamp: formatKoreanTime(),
          suggestedReportType: data.suggestedReportType,
          startStation: data.startStation,
          endStation: data.endStation,
          recommendedCarNo: data.recommendedCarNo,
          routeIndex: data.routeIndex,
        };

        setChatMessages((prev) => [...prev, aiMsg]);
        onApplyResponse(data);
        setChatbotLoading(false);
        inFlightRef.current = false;
      } catch {
        setChatError("실시간 AI 연결이 불안정해 로컬 안전 플랜으로 대체했습니다.");
        setChatbotLoading(false);
        inFlightRef.current = false;
        fallbackTimerRef.current = setTimeout(() => {
          const fallbackMsg = createFallbackChatMessage(text);
          setChatMessages((prev) => [...prev, fallbackMsg]);
          onApplyFallback(fallbackMsg);
          fallbackTimerRef.current = null;
        }, 700);
      }
    },
    [chatbotLoading, context, onApplyFallback, onApplyResponse]
  );

  const startContextualBriefing = useCallback(
    (seedText: string, requestText: string) => {
      const seedMsg: ChatMessage = {
        id: `msg-context-${Date.now()}`,
        sender: "ai",
        text: seedText,
        timestamp: formatKoreanTime(),
      };
      setChatMessages([seedMsg]);
      void sendMessage(requestText);
    },
    [sendMessage]
  );

  const retryLastMessage = useCallback(() => {
    const lastRequest = lastRequestRef.current;
    if (!lastRequest || chatbotLoading || inFlightRef.current) return;
    void sendMessage(lastRequest);
  }, [chatbotLoading, sendMessage]);

  return {
    chatInput,
    chatError,
    chatbotLoading,
    chatMessages,
    chatEndRef,
    setChatInput,
    sendMessage,
    startContextualBriefing,
    retryLastMessage,
  };
}
