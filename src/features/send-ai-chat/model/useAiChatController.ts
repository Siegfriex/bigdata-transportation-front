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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || chatbotLoading) return;

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
      } catch {
        setChatError("실시간 AI 연결이 불안정해 로컬 안전 플랜으로 대체했습니다.");
        setTimeout(() => {
          const fallbackMsg = createFallbackChatMessage(text);
          setChatMessages((prev) => [...prev, fallbackMsg]);
          onApplyFallback(fallbackMsg);
          setChatbotLoading(false);
        }, 700);
      }
    },
    [chatbotLoading, context, onApplyFallback, onApplyResponse]
  );

  return {
    chatInput,
    chatError,
    chatbotLoading,
    chatMessages,
    chatEndRef,
    setChatInput,
    sendMessage,
  };
}
