import type { RefObject } from "react";
import { AlertTriangle, Lightbulb, Map, Plus, SendHorizontal, Sparkles } from "lucide-react";
import type { ChatMessage } from "../../../entities/chat-message";
import type { ReportType } from "../../../entities/report";
import type { RoutePlan } from "../../../entities/route-plan";
import type { MapLayerState } from "../../../features/toggle-map-layer";
import { renderMarkdown } from "../../../features/send-ai-chat";

type AiChatLayerProps = {
  mapLayer: MapLayerState;
  chatMessages: ChatMessage[];
  chatInput: string;
  chatError: string | null;
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
  chatError,
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

  const isSubmitDisabled = chatbotLoading || !chatInput.trim();

  return (
    <div className={`absolute z-40 transition-all duration-300 pointer-events-none ${
      mapLayer === "ai_result"
        ? "bottom-[76px] inset-x-3"
        : "inset-x-0 top-0 bottom-[64px] flex flex-col justify-end"
    }`}>
      {mapLayer === "ai_result" && (
        <div className="surface-panel flex flex-col gap-3 p-4 animate-in fade-in slide-in-from-bottom-8 pointer-events-auto">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0A84FF]" />
              <span className="type-title text-white">AI 전략 브리핑 종료</span>
            </div>
            <button onClick={onClose} className="control-base focus-ring text-white/50 hover:text-white" aria-label="브리핑 닫기">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
            <p className="type-body line-clamp-3 text-white/82">
              {chatMessages[chatMessages.length - 1]?.text?.replace(/[*#]/g, "") || "분석 완료"}
            </p>
          </div>

          {plans.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="type-caption px-1 text-white/55">추천 전술 경로</span>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => onSelectPlan(plan)}
                    className={`control-base focus-ring shrink-0 rounded-xl border px-3 py-2 text-[11px] font-bold ${
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
              className="control-base focus-ring flex-1 rounded-xl border border-[#0A84FF]/50 bg-white/[0.045] py-2 text-xs font-bold text-[#74B9FF] hover:bg-white/10"
              disabled={chatbotLoading}
            >
              전략 근거 보기
            </button>
            <button
              onClick={onSaveTacticalReport}
              className="control-base focus-ring flex-1 rounded-xl bg-[#0A84FF] py-2 text-xs font-bold text-white"
              disabled={chatbotLoading}
            >
              전략 리포트 저장
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
            className={`surface-panel relative flex cursor-pointer flex-col transition-all duration-300 pointer-events-auto ${
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
                className="control-base focus-ring flex h-6 w-6 items-center justify-center text-white/50 hover:text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                aria-label="AI 패널 닫기"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className={`flex-1 flex flex-col overflow-hidden px-4 pb-4 ${mapLayer === "ai_peek" ? "pointer-events-none opacity-40 blur-[1px]" : "opacity-100"}`}>
              <div className="mb-3 shrink-0 rounded-2xl border border-white/10 bg-[#101316]/82 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="type-label rounded-full border border-[#0A84FF]/25 bg-[#0A84FF]/10 px-2.5 py-1 text-[#74B9FF]">Gemini route engine</span>
                  <span className="type-label text-white/35">실시간 문맥</span>
                </div>
                <p className="type-subtitle max-w-[320px] text-white/68">
                  지도의 현재 상태를 결합해 복합수단 최적 해법을 브리핑합니다. 질문 시 자동으로 지도 경로가 반응합니다.
                </p>
              </div>

              {chatError && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#FFB020]/30 bg-[#FFB020]/12 p-3 text-[11px] font-semibold leading-relaxed text-[#FFB020]">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{chatError}</span>
                </div>
              )}

              <div className="mb-3 flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-none min-h-[120px]" aria-busy={chatbotLoading}>
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-3 shadow-sm ${
                        message.sender === "user"
                          ? "rounded-tr-md bg-[#0A84FF] text-white"
                          : "rounded-tl-md border border-white/10 bg-[#11161A]/88 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                      }`}
                    >
                      {message.sender === "ai" && (
                        <div className="mb-2 flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-[#74B9FF]" />
                          <span className="type-label text-white/45">Talsu AI</span>
                        </div>
                      )}
                      {message.sender === "ai" ? (
                        <div className="type-message text-white/86">{renderMarkdown(message.text)}</div>
                      ) : (
                        <p className="type-message font-semibold text-white">{message.text}</p>
                      )}
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span
                          className={`type-metric ${
                            message.sender === "user" ? "text-white/60" : "text-white/50"
                          }`}
                        >
                          {message.timestamp}
                        </span>
                        {message.sender === "ai" && message.suggestedReportType && (
                          <button
                            onClick={() => onShowReport(message.suggestedReportType as ReportType)}
                            className="control-base focus-ring flex items-center gap-1 rounded-md bg-[#0A84FF]/12 px-2 py-1 text-[10px] font-bold text-[#74B9FF]"
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
                    <div className="skeleton-bubble max-w-[82%] space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="status-dot text-[#0A84FF]" />
                        <span className="type-label text-white/45">데이터 근거 확인 중</span>
                      </div>
                      <div className="space-y-2">
                        <div className="skeleton skeleton-line w-[190px]" />
                        <div className="skeleton skeleton-line w-[235px]" />
                        <div className="skeleton skeleton-line-sm w-[150px]" />
                      </div>
                      <span className="type-caption block text-white/42">혼잡도, 환승 시간, 대체 경로를 함께 대조합니다.</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="space-y-2 shrink-0">
                <span className="type-label block text-white/45">추천 안전 질문</span>
                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => onSendMessage(prompt)}
                      className="control-base focus-ring flex min-h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.055] p-2 text-left text-[10.5px] font-semibold leading-snug text-white/68 hover:bg-white/10 hover:text-white"
                      disabled={chatbotLoading}
                    >
                      <Lightbulb className="h-3 w-3 shrink-0 text-[#74B9FF]" />
                      <span className="line-clamp-2">{prompt}</span>
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
                    className="type-body focus-ring flex-1 rounded-xl border border-white/10 bg-[#0B0D10]/88 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#0A84FF]"
                    placeholder="지각 예방에 관해 무엇이든 물어보세요..."
                    disabled={chatbotLoading}
                  />
                  <button
                    id="chat-send-action"
                    onClick={() => onSendMessage(chatInput)}
                    className="control-base focus-ring flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#0A84FF] text-white"
                    disabled={isSubmitDisabled}
                    aria-label="메시지 전송"
                  >
                    {chatbotLoading ? <span className="button-spinner" /> : <SendHorizontal className="h-4 w-4" />}
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
