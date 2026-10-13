'use client';

import React from 'react';
import { System7Window } from './System7Window';

interface HelpModalProps {
  onClose: () => void;
}

/**
 * [Help] 정통 클래식 Mac OS System 7 스타일 이용 안내 팝업 창
 */
export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 font-mono">
      <div className="w-full max-w-md">
        <System7Window
          title="서고 이용 안내 (Help Guide)"
          onClose={onClose}
          className="shadow-[4px_4px_0px_#000]"
        >
          <div className="space-y-3 text-xs">
            {/* 상단: 1991 System 7 가이드 픽셀 비트맵 아이콘 + 헤더 */}
            <div className="flex items-center space-x-3 pb-3 border-b-2 border-black">
              <div className="w-10 h-10 border-2 border-black bg-white p-1 shrink-0 flex items-center justify-center shadow-[1px_1px_0px_#000]">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  style={{ imageRendering: 'pixelated' }}
                >
                  {/* 클래식 맥 문서 물음표 비트맵 그래픽 */}
                  <rect x="2" y="1" width="11" height="14" fill="#000" />
                  <rect x="3" y="2" width="9" height="12" fill="#fff" />
                  {/* 물음표 픽셀 패턴 */}
                  <rect x="5" y="4" width="5" height="1" fill="#000" />
                  <rect x="9" y="5" width="2" height="2" fill="#000" />
                  <rect x="6" y="7" width="4" height="1" fill="#000" />
                  <rect x="6" y="8" width="2" height="2" fill="#000" />
                  <rect x="6" y="11" width="2" height="2" fill="#000" />
                </svg>
              </div>

              <div>
                <div className="font-bold text-sm text-black tracking-tight">
                  사적 온톨로지 이용 지침
                </div>
                <div className="text-[11px] text-gray-600 font-bold">
                  System 7.1.0 • 장서 카드 단말기 안내서
                </div>
              </div>
            </div>

            {/* 안내 본문: 100% 흑백 위계와 인셋 박스 */}
            <div className="space-y-2 text-black leading-relaxed">
              <p className="text-[11px]">
                본 단말기는 화면 중앙에 <strong>단 1장의 단상 카드</strong>만 단정하게 렌더링되어, 깊은 몰입과 유기적인 사유의 흐름을 돕습니다.
              </p>

              {/* 방향키 조작 체계 System 7 인셋 프레임 */}
              <div className="border-2 border-black bg-white p-2.5 shadow-[2px_2px_0px_#000] space-y-1.5">
                <div className="flex items-center justify-between border-b border-black pb-1 mb-1">
                  <span className="font-bold text-black text-[11px]">
                    [ ⌨️ 방향키 조작 체계 ]
                  </span>
                  <span className="text-[10px] bg-black text-white px-1 font-bold">
                    SYSTEM 7 HIG
                  </span>
                </div>

                <div className="text-[11px] space-y-1 font-mono">
                  <div>
                    • <span className="font-bold bg-black text-white px-1 py-0.2">[← / →]</span> :{' '}
                    <span className="font-bold underline">같은 주제 내 이동</span> (이전 단상 / 다음 단상)
                  </div>
                  <div>
                    • <span className="font-bold bg-black text-white px-1 py-0.2">[↑ / ↓]</span> :{' '}
                    <span className="font-bold underline">다른 주제 전환</span> (이전 토픽 / 다음 토픽)
                  </div>
                  <div className="pt-1 border-t border-black text-[#333333] space-y-0.5">
                    <div>• <span className="font-bold text-black">[Space]</span> : 무작위 토픽 카드로 전환</div>
                    <div>• <span className="font-bold text-black">[/]</span> : 카드 검색 창 (Search) 열기</div>
                    <div>• <span className="font-bold text-black">[Enter]</span> : 전체 장서 색인 창 토글</div>
                    <div>• <span className="font-bold text-black">[M]</span> : 서고 전체도(Overview) 창 토글</div>
                    <div>• <span className="font-bold text-black">[B]</span> : 역링크(인용 목록) 창 토글</div>
                    <div>• <span className="font-bold text-black">[Esc]</span> : 창 닫기 또는 첫 번째 카드로 복귀</div>
                  </div>
                </div>
              </div>


            </div>

            {/* 하단 버튼: 다른 팝업과 통일된 표준 네모 버튼 (sys7-btn) */}
            <div className="pt-2 border-t border-gray-300 flex justify-end">
              <button
                onClick={onClose}
                type="button"
                className="sys7-btn px-4 py-1 text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
              >
                확인 (Esc)
              </button>
            </div>
          </div>
        </System7Window>
      </div>
    </div>
  );
};
