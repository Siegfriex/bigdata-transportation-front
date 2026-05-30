import type { RefObject } from "react";
import { Map, Plus, Sparkles } from "lucide-react";
import type { ChatMessage } from "../../../entities/chat-message";
import type { ReportType } from "../../../entities/report";
import type { RoutePlan } from "../../../entities/route-plan";
import type { MapLayerState } from "../../../features/toggle-map-layer";
import { renderMarkdown } from "../../../features/send-ai-chat";

type AiChatLayerProps = {
  mapLayer: MapLayerState;
  chatMessages: ChatMessage[];
  chatInput: string;
  chatbotLoading: boolean;
  suggestedPrompts: string[];
  plans: RoutePlan[];
  selectedPlan: RoutePlan | null;
  chatEndRef: RefObject<HTMLDivElement>;
  onClose: () => void;
  onSetMapLayer: (layer: MapLayerState) => void;
  onSelectPlan: (plan: RoutePlan) => void;
  onSaveTacticalReport: () => void;
  onShowReport: (reportType: ReportType) => void;
  onChangeChatInput: (value: string) => void;
  onSendMessage: (message: string) => void;
};

export function AiChatLayer({
  mapLayer,
  chatMessages,
  chatInput,
  chatbotLoading,
  suggestedPrompts,
  plans,
  selectedPlan,
  chatEndRef,
  onClose,
  onSetMapLayer,
  onSelectPlan,
  onSaveTacticalReport,
  onShowReport,
  onChangeChatInput,
  onSendMessage,
}: AiChatLayerProps) {
  if (mapLayer === "default" || mapLayer === "report_detail") return null;

  return (
    <div className={`absolute z-40 transition-all duration-300 pointer-events-none ${
      mapLayer === "ai_result"
        ? "bottom-[76px] inset-x-3"
        : "inset-x-0 top-0 bottom-[64px] flex flex-col justify-end"
    }`}>
      {mapLayer === "ai_result" && (
        <div className="apple-glass border border-white/20 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 pointer-events-auto">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0A84FF]" />
              <span className="text-xs font-bold text-white">AI 경로 분석 결과</span>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
          <div className="apple-glass-light border border-white/10 p-3 rounded-xl">
            <p className="text-[11px] text-white/80 leading-relaxed font-sans line-clamp-3">
              {chatMessages[chatMessages.length - 1]?.text?.replace(/[*#]/g, "") || "분석 완료"}
            </p>
          </div>

          {plans.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/50 font-bold px-1">추천 경로 (선택하면 지도에 반영)</span>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => onSelectPlan(plan)}
                    className={`shrink-0 border px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      selectedPlan?.id === plan.id
                        ? "bg-[#0A84FF]/20 border-[#0A84FF] text-white"
                        : "apple-glass border-white/10 text-white/60 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {plan.name} <span className="text-[#0A84FF] ml-1">{plan.eta}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onSetMapLayer("report_detail")}
              className="flex-1 apple-glass hover:bg-white/10 border border-[#0A84FF]/50 text-[#0A84FF] py-2 rounded-xl text-xs font-bold transition-colors shadow-[0_0_12px_rgba(10,132,255,0.2)]"
            >
              상세 경로 확인
            </button>
            <button
              onClick={onSaveTacticalReport}
              className="flex-1 bg-[#0A84FF] text-white py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              리포트 저장
            </button>
          </div>
        </div>
      )}

      {(mapLayer === "ai_overlay" || mapLayer === "ai_peek") && (
        <>
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 backdrop-blur-[2px] pointer-events-auto ${
              mapLayer === "ai_peek" ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            onClick={onClose}
          />
          <div
            className={`relative apple-glass shadow-[0_-8px_32px_rgba(0,0,0,0.6)] flex flex-col transition-all duration-300 pointer-events-auto cursor-pointer border border-white/10 ${
              mapLayer === "ai_peek" ? "h-[70px] rounded-[24px] mx-3 mb-3 opacity-90 hover:opacity-100" : "w-full rounded-t-[32px] h-[75vh]"
            }`}
            onClick={() => {
              if (mapLayer === "ai_peek") onSetMapLayer("ai_overlay");
            }}
          >
            <div className="w-full flex items-center justify-between px-4 pt-3 pb-2">
              <div className="w-6" />
              <div
                className="flex-1 flex justify-center cursor-grab active:cursor-grabbing py-2"
                onClick={(event) => {
                  event.stopPropagation();
                  onSetMapLayer(mapLayer === "ai_overlay" ? "ai_peek" : "ai_overlay");
                }}
              >
                <div className="w-12 h-1.5 bg-white/25 rounded-full" />
              </div>
              <button
                className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className={`flex-1 flex flex-col overflow-hidden px-4 pb-4 ${mapLayer === "ai_peek" ? "pointer-events-none opacity-40 blur-[1px]" : "opacity-100"}`}>
              <div className="apple-glass rounded-2xl border border-white/10 p-3 text-center mb-2.5 shrink-0">
                <span className="text-[10px] bg-[#0A84FF]/10 text-[#0A84FF] px-2.5 py-1 rounded-full font-mono font-bold inline-block mb-1.5">AI ROUTE ENGINE</span>
                <p className="text-[11px] text-white/70 leading-relaxed max-w-[280px] mx-auto">
                  지도의 현재 상태를 결합해 복합수단 최적 해법을 브리핑합니다. 질문 시 자동으로 지도 경로가 반응합니다.
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1 mb-3 scrollbar-none min-h-[120px]">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm ${
                        message.sender === "user"
                          ? "bg-[#0A84FF] text-white rounded-tr-none font-sans"
                          : "apple-glass text-[#E3E5DD] border border-white/10 rounded-tl-none font-sans leading-relaxed"
                      }`}
                    >
                      {message.sender === "ai" ? renderMarkdown(message.text) : <p className="font-bold leading-relaxed">{message.text}</p>}
                      <div className="flex items-center justify-between mt-2.5">
                        <span
                          className={`text-[8.5px] font-mono ${
                            message.sender === "user" ? "text-white/60" : "text-white/50"
                          }`}
                        >
                          {message.timestamp}
                        </span>
                        {message.sender === "ai" && message.suggestedReportType && (
                          <button
                            onClick={() => onShowReport(message.suggestedReportType as ReportType)}
                            className="text-[#0A84FF] flex items-center gap-0.5 text-[9px] font-bold font-sans bg-[#0A84FF]/10 px-1.5 py-0.5 rounded active:scale-95 transition-transform"
                          >
                            <span>지도에서 보기</span>
                            <Map className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {chatbotLoading && (
                  <div className="flex justify-start">
                    <div className="apple-glass border border-white/10 rounded-2xl rounded-tl-none p-3.5 max-w-[80%] space-y-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[10px] text-white/50 font-mono block">경로 조건과 교통 패턴을 분석하는 중...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="space-y-2 shrink-0">
                <span className="text-[9px] font-mono text-white/50 uppercase tracking-wider block">추천 안전 질문</span>
                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => onSendMessage(prompt)}
                      className="text-left apple-glass hover:bg-white/10 border border-white/10 p-2 rounded-xl text-[10px] text-white/70 transition-colors truncate block"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    id="chat-input-field"
                    type="text"
                    value={chatInput}
                    onChange={(event) => onChangeChatInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && onSendMessage(chatInput)}
                    className="flex-1 apple-glass border border-white/10 focus:border-[#0A84FF] rounded-xl py-3 px-4 text-xs text-white outline-none font-sans"
                    placeholder="지각 예방에 관해 무엇이든 물어보세요..."
                  />
                  <button
                    id="chat-send-action"
                    onClick={() => onSendMessage(chatInput)}
                    className="bg-[#0A84FF] text-white px-4 rounded-xl text-xs font-bold transition-transform active:scale-95 shrink-0"
                  >
                    전송
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
