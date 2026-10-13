'use client';

import React, { useEffect, useState } from 'react';

interface ShuffleModalProps {
  isOpen: boolean;
}

/**
 * System 7 클래식 스타일 카드 셔플 팝업 다이얼로그
 * - [Space] 무작위 이동 시 0.8초 동안 표시
 * - 흑백 1비트 도트 스타일의 카드 셔플 4프레임 모션 애니메이션
 * - System 7 핀스트라이프 타이틀 바, 이중 베벨 테두리 및 프로그레스 인디케이터
 */
export const ShuffleModal: React.FC<ShuffleModalProps> = ({ isOpen }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [progressStep, setProgressStep] = useState(0);

  // 100ms 간격으로 카드 셔플 프레임(0~3) 및 프로그레스(0~7) 갱신 (800ms 동안 8단계 진행)
  useEffect(() => {
    if (!isOpen) {
      setFrameIndex(0);
      setProgressStep(0);
      return;
    }

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % 4);
      setProgressStep((prev) => Math.min(prev + 1, 7));
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="카드 셔플 다이얼로그"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-mono select-none"
    >
      {/* System 7 클래식 모달 다이얼로그 프레임 */}
      <div className="w-[300px] bg-[#e6e6e6] p-1 shadow-[5px_5px_0px_#000] border-2 border-black animate-in fade-in zoom-in-95 duration-100">
        <div className="border border-black bg-[#e6e6e6] flex flex-col">
          {/* System 7 핀스트라이프 타이틀 바 */}
          <div className="relative flex items-center h-5 px-1 border-b border-black bg-[#e6e6e6] overflow-hidden">
            <div className="absolute inset-0 pinstripe-bar opacity-80 pointer-events-none" />
            <div className="relative z-10 mx-auto px-2 bg-[#e6e6e6] border-x border-black text-[11px] font-bold tracking-tight whitespace-nowrap text-black">
              단상 서랍 셔플 (Shuffle)
            </div>
          </div>

          {/* 다이얼로그 본문 */}
          <div className="p-3 bg-white flex flex-col items-center space-y-3">
            {/* 흑백 카드 셔플 픽셀 프레임 애니메이션 영역 */}
            <div
              data-testid="shuffle-card-animation"
              className="w-full h-24 bg-[#fafafa] border-2 border-black flex flex-col items-center justify-center p-2 shadow-[inset_1px_1px_0px_#000]"
            >
              <ShuffleFrameSvg frame={frameIndex} />
            </div>

            {/* 안내 텍스트 */}
            <div className="w-full text-center space-y-1">
              <p className="text-xs font-bold text-black tracking-tight">
                무작위 색인 카드를 뒤섞는 중...
              </p>
              <p className="text-[10px] text-gray-600 font-sans">
                서고 서랍을 0.8초 동안 무작위로 탐색합니다
              </p>
            </div>

            {/* System 7 레트로 프로그레스 게이지 (8블록 세그먼트) */}
            <div className="w-full pt-1">
              <div className="flex items-center justify-between text-[9px] text-gray-500 pb-0.5">
                <span>SHUFFLE</span>
                <span>{Math.round(((progressStep + 1) / 8) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-white border border-black p-0.5 flex space-x-0.5 shadow-[inset_1px_1px_0px_#888]">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-full transition-none ${
                      idx <= progressStep ? 'bg-black' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 흑백 1비트 카드 셔플 4단계 프레임 SVG 그래픽
 * - Frame 0: 정돈된 두 묶음의 색인 카드 (셔플 준비)
 * - Frame 1: 좌우로 기울어지며 공중으로 펼쳐지는 카드
 * - Frame 2: 가운데에서 차르륵 교차 맞물리는 리플(Riffle) 셔플
 * - Frame 3: 한 묶음으로 톡톡 정리되며 새로운 카드가 드러나는 순간
 */
function ShuffleFrameSvg({ frame }: { frame: number }) {
  return (
    <svg
      className="w-32 h-18"
      viewBox="0 0 128 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ shapeRendering: 'crispEdges', imageRendering: 'pixelated' }}
    >
      {frame === 0 && (
        <g id="frame-0">
          {/* 왼쪽 카드 묶음 */}
          <rect x="22" y="30" width="34" height="26" fill="#fff" stroke="#000" strokeWidth="2" />
          <line x1="26" y1="36" x2="42" y2="36" stroke="#000" strokeWidth="1" />
          <line x1="26" y1="41" x2="50" y2="41" stroke="#000" strokeWidth="1" />
          <line x1="26" y1="46" x2="46" y2="46" stroke="#000" strokeWidth="1" />
          <rect x="20" y="27" width="34" height="26" fill="#fff" stroke="#000" strokeWidth="1" />
          <rect x="18" y="24" width="34" height="26" fill="#fff" stroke="#000" strokeWidth="2" />
          <rect x="22" y="28" width="12" height="3" fill="#000" />
          <line x1="22" y1="35" x2="46" y2="35" stroke="#000" strokeWidth="1" />
          <line x1="22" y1="40" x2="42" y2="40" stroke="#000" strokeWidth="1" />

          {/* 오른쪽 카드 묶음 */}
          <rect x="72" y="30" width="34" height="26" fill="#fff" stroke="#000" strokeWidth="2" />
          <line x1="76" y1="36" x2="92" y2="36" stroke="#000" strokeWidth="1" />
          <line x1="76" y1="41" x2="100" y2="41" stroke="#000" strokeWidth="1" />
          <line x1="76" y1="46" x2="96" y2="46" stroke="#000" strokeWidth="1" />
          <rect x="74" y="27" width="34" height="26" fill="#fff" stroke="#000" strokeWidth="1" />
          <rect x="76" y="24" width="34" height="26" fill="#fff" stroke="#000" strokeWidth="2" />
          <rect x="80" y="28" width="12" height="3" fill="#000" />
          <line x1="80" y1="35" x2="104" y2="35" stroke="#000" strokeWidth="1" />
          <line x1="80" y1="40" x2="100" y2="40" stroke="#000" strokeWidth="1" />
        </g>
      )}

      {frame === 1 && (
        <g id="frame-1">
          {/* 왼쪽 카드가 오른쪽으로 기울며 공중으로 솟음 */}
          <g transform="translate(18, 18) rotate(-10)">
            <rect x="0" y="0" width="36" height="26" fill="#fff" stroke="#000" strokeWidth="2" />
            <rect x="4" y="4" width="12" height="3" fill="#000" />
            <line x1="4" y1="11" x2="28" y2="11" stroke="#000" strokeWidth="1" />
            <line x1="4" y1="16" x2="24" y2="16" stroke="#000" strokeWidth="1" />
            <line x1="4" y1="21" x2="30" y2="21" stroke="#000" strokeWidth="1" />
          </g>
          <g transform="translate(26, 22) rotate(-5)">
            <rect x="0" y="0" width="36" height="26" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <line x1="4" y1="8" x2="26" y2="8" stroke="#000" strokeWidth="1" />
            <line x1="4" y1="14" x2="30" y2="14" stroke="#000" strokeWidth="1" />
          </g>

          {/* 오른쪽 카드가 왼쪽으로 기울며 마주봄 */}
          <g transform="translate(74, 14) rotate(10)">
            <rect x="0" y="0" width="36" height="26" fill="#fff" stroke="#000" strokeWidth="2" />
            <rect x="4" y="4" width="12" height="3" fill="#000" />
            <line x1="4" y1="11" x2="28" y2="11" stroke="#000" strokeWidth="1" />
            <line x1="4" y1="16" x2="24" y2="16" stroke="#000" strokeWidth="1" />
            <line x1="4" y1="21" x2="30" y2="21" stroke="#000" strokeWidth="1" />
          </g>
          <g transform="translate(66, 18) rotate(5)">
            <rect x="0" y="0" width="36" height="26" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <line x1="4" y1="8" x2="26" y2="8" stroke="#000" strokeWidth="1" />
            <line x1="4" y1="14" x2="30" y2="14" stroke="#000" strokeWidth="1" />
          </g>

          {/* 공중에 흩날리는 픽셀 도트 */}
          <rect x="61" y="12" width="2" height="2" fill="#000" />
          <rect x="65" y="18" width="2" height="2" fill="#000" />
          <rect x="59" y="24" width="2" height="2" fill="#000" />
        </g>
      )}

      {frame === 2 && (
        <g id="frame-2">
          {/* 바닥 카드 */}
          <rect x="42" y="38" width="44" height="28" fill="#000" />
          <rect x="43" y="39" width="42" height="26" fill="#fff" />

          {/* 왼쪽에서 날아드는 카드 */}
          <g transform="translate(24, 16) rotate(-16)">
            <rect x="0" y="0" width="32" height="22" fill="#fff" stroke="#000" strokeWidth="2" />
            <line x1="4" y1="6" x2="20" y2="6" stroke="#000" strokeWidth="1" />
            <line x1="4" y1="11" x2="26" y2="11" stroke="#000" strokeWidth="1" />
          </g>

          {/* 오른쪽에서 날아드는 카드 */}
          <g transform="translate(72, 12) rotate(18)">
            <rect x="0" y="0" width="32" height="22" fill="#fff" stroke="#000" strokeWidth="2" />
            <line x1="4" y1="6" x2="20" y2="6" stroke="#000" strokeWidth="1" />
            <line x1="4" y1="11" x2="26" y2="11" stroke="#000" strokeWidth="1" />
          </g>

          {/* 가운데에서 엇갈리며 교차하는 카드들 */}
          <rect x="36" y="26" width="38" height="24" fill="#fff" stroke="#000" strokeWidth="2" />
          <rect x="54" y="22" width="38" height="24" fill="#fff" stroke="#000" strokeWidth="2" />
          <line x1="58" y1="28" x2="80" y2="28" stroke="#000" strokeWidth="1" />
          <line x1="58" y1="33" x2="86" y2="33" stroke="#000" strokeWidth="1" />

          {/* 속도감 선 (Speed Lines) */}
          <line x1="14" y1="26" x2="22" y2="26" stroke="#000" strokeWidth="1" />
          <line x1="106" y1="22" x2="114" y2="22" stroke="#000" strokeWidth="1" />
          <rect x="63" y="8" width="2" height="2" fill="#000" />
          <rect x="60" y="14" width="2" height="2" fill="#000" />
        </g>
      )}

      {frame === 3 && (
        <g id="frame-3">
          {/* 중앙에 하나로 합쳐지며 탁 정리되는 완성된 카드 묶음 */}
          <rect x="42" y="28" width="44" height="30" fill="#000" />
          <rect x="44" y="26" width="44" height="30" fill="#fff" stroke="#000" strokeWidth="2" />
          <rect x="42" y="22" width="44" height="30" fill="#fff" stroke="#000" strokeWidth="2" />

          {/* 색인 카드 헤더 (인출된 카드) */}
          <rect x="46" y="26" width="18" height="4" fill="#000" />
          <line x1="46" y1="35" x2="78" y2="35" stroke="#000" strokeWidth="1" />
          <line x1="46" y1="40" x2="82" y2="40" stroke="#000" strokeWidth="1" />
          <line x1="46" y1="45" x2="74" y2="45" stroke="#000" strokeWidth="1" />

          {/* 완성 반짝임 효과 (Sparkles) */}
          <rect x="32" y="16" width="2" height="5" fill="#000" />
          <rect x="30.5" y="17.5" width="5" height="2" fill="#000" />

          <rect x="94" y="16" width="2" height="5" fill="#000" />
          <rect x="92.5" y="17.5" width="5" height="2" fill="#000" />
        </g>
      )}
    </svg>
  );
}
