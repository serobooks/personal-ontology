'use client';

import React from 'react';

interface BottomShortcutBarProps {
  onPrevThread: () => void;
  onNextThread: () => void;
  onPrevTopic: () => void;
  onNextTopic: () => void;
  onRandom: () => void;
  onToggleSearch: () => void;
  onToggleBacklinks: () => void;
  onToggleMap?: () => void;
  onEscape: () => void;
  isModalOpen: boolean;
}

/**
 * 하단 단말기 조작 단축키 안내 바
 * - [← / →]: 같은 주제 내 이동 (이전 단상 / 다음 단상)
 * - [↑ / ↓]: 다른 주제 전환 (이전 토픽 / 다음 토픽)
 * - [/]: 카드 검색
 * - [Space]: 무작위 카드
 * - [M]: 서고 던전 오토맵
 * - [B]: 역링크
 * - [Esc]: 복귀 / 닫기
 */
export const BottomShortcutBar: React.FC<BottomShortcutBarProps> = ({
  onPrevThread,
  onNextThread,
  onPrevTopic,
  onNextTopic,
  onRandom,
  onToggleSearch,
  onToggleBacklinks,
  onToggleMap,
  onEscape,
  isModalOpen,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-8 bg-white border-t-2 border-black flex items-center justify-between px-3 text-xs select-none z-30 font-mono">
      {/* 단축키 버튼 목록 */}
      <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
        <button
          onClick={onEscape}
          type="button"
          title="모달 닫기 또는 첫 번째 홈 카드로 복귀"
          className="sys7-btn px-2 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer"
        >
          <span className="underline">[Esc]</span> {isModalOpen ? '닫기' : '복귀'}
        </button>

        {/* 같은 주제 내 단상 이동 버튼 */}
        <div className="flex items-center space-x-1 bg-[#f0f2f5] px-1.5 py-0.5 border border-black">
          <span className="text-[10px] font-bold text-gray-600">같은 주제:</span>
          <button
            onClick={onPrevThread}
            type="button"
            title="이전 단상 (←)"
            className="sys7-btn px-1.5 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer"
          >
            ←
          </button>
          <button
            onClick={onNextThread}
            type="button"
            title="다음 단상 (→)"
            className="sys7-btn px-1.5 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer"
          >
            →
          </button>
        </div>

        {/* 다른 주제 전환 버튼 */}
        <div className="flex items-center space-x-1 bg-[#f0f2f5] px-1.5 py-0.5 border border-black">
          <span className="text-[10px] font-bold text-gray-600">주제 전환:</span>
          <button
            onClick={onPrevTopic}
            type="button"
            title="이전 주제 (↑)"
            className="sys7-btn px-1.5 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer"
          >
            ↑
          </button>
          <button
            onClick={onNextTopic}
            type="button"
            title="다음 주제 (↓)"
            className="sys7-btn px-1.5 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer"
          >
            ↓
          </button>
        </div>

        <button
          onClick={onRandom}
          type="button"
          title="무작위 카드 뽑기"
          className="sys7-btn px-2 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer bg-[#f5f7fa]"
        >
          <span className="underline">[Space]</span> 랜덤
        </button>

        <button
          onClick={onToggleSearch}
          type="button"
          title="카드 검색 창 (/)"
          className="sys7-btn px-2 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer"
        >
          <span className="underline">[/]</span> 검색
        </button>

        {onToggleMap && (
          <button
            onClick={onToggleMap}
            type="button"
            title="서고 전체도 (M)"
            className="sys7-btn px-2 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer"
          >
            <span className="underline">[M]</span> 전체도
          </button>
        )}

        <button
          onClick={onToggleBacklinks}
          type="button"
          title="이 카드를 언급한 다른 카드들"
          className="sys7-btn px-2 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer"
        >
          <span className="underline">[B]</span> 역링크
        </button>
      </div>
    </footer>
  );
};
