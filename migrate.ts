import * as fs from 'fs';
import * as path from 'path';

const file = path.join(process.cwd(), 'src/App.tsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Remove the old chat tab content
const chatUIStart = '          {/* TAB 2: AI 실시간 챗봇 (AI Chat TAB CHAT-01) */}';
const chatUIEnd = '          {/* TAB 3: 통근 기록 보관함 & 아카이브 (Report Archive TAB REP-01) */}';

const chatUIIndex1 = code.indexOf(chatUIStart);
const chatUIIndex2 = code.indexOf(chatUIEnd);

if (chatUIIndex1 === -1 || chatUIIndex2 === -1) {
    console.error("Chat UI bounds not found");
    process.exit(1);
}

const oldChatUI = code.substring(chatUIIndex1, chatUIIndex2);
code = code.replace(oldChatUI, '');

// Extract the inner part of Chat UI that we want to reuse (the messages and input)
const innerChatStart = '              {/* Chat screen introductory guidance header */}';
const innerChatEnd = '            </div>\n          )}\n';
const extractedChat = oldChatUI.substring(oldChatUI.indexOf(innerChatStart), oldChatUI.indexOf(innerChatEnd));


// 2. Insert the new Overlay structure right after </main>
const mainEndMatch = '        </main>';
const overlayCode = `
        {/* Global AI Chat Layer */}
        {aiLayerState !== "collapsed" && (
          <div className={\`absolute z-40 transition-all duration-300 \${
            aiLayerState === "floating" 
              ? "bottom-[76px] right-4" 
              : "inset-0 flex flex-col justify-end"
          }\`}>
             {aiLayerState === "floating" ? (
                <button 
                  onClick={() => setAiLayerState("overlay")}
                  className="apple-glass-light border border-white/20 shadow-2xl shadow-[#0A84FF]/20 rounded-full p-3 pl-4 flex items-center gap-2.5 active:scale-95 transition-transform"
                >
                  <Sparkles className="w-5 h-5 text-[#0A84FF]" />
                  <span className="text-[13px] font-semibold text-white pr-2 whitespace-nowrap">안심 길 묻기</span>
                </button>
             ) : (
                <>
                  <div 
                    className={\`absolute inset-0 bg-black/50 transition-opacity duration-300 backdrop-blur-[2px] \${
                      aiLayerState === "peek" ? "opacity-0 pointer-events-none" : "opacity-100"
                    }\`}
                    onClick={() => setAiLayerState("floating")}
                  />
                  <div className={\`relative w-full apple-glass border-t border-white/10 rounded-t-[32px] shadow-[0_-8px_32px_rgba(0,0,0,0.6)] flex flex-col transition-all duration-300 \${
                      aiLayerState === "peek" ? "h-[85px] translate-y-3 opacity-90" : "h-[75vh]"
                  }\`}>
                     {/* Drag Handle */}
                     <div 
                        className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                        onClick={(e) => {
                           e.stopPropagation();
                           setAiLayerState(aiLayerState === "overlay" ? "peek" : "overlay");
                        }}
                     >
                        <div className="w-12 h-1.5 bg-white/25 rounded-full" />
                     </div>
                     <div 
                       className={\`flex-1 flex flex-col overflow-hidden px-4 pb-4 \${aiLayerState === "peek" ? "pointer-events-none opacity-40 blur-[1px]" : "opacity-100"}\`}
                       onClick={(e) => {
                          if (aiLayerState === "peek") {
                             e.stopPropagation();
                             setAiLayerState("overlay");
                          }
                       }}
                     >
${extractedChat.split('\n').map(line => '           ' + line).join('\n')}
                     </div>
                  </div>
                </>
             )}
          </div>
        )}
`;

code = code.replace(mainEndMatch, mainEndMatch + '\n' + overlayCode);

fs.writeFileSync(file, code);
console.log("Migration successful");
