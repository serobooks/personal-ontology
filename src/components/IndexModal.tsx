'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TopicCard, CategoryScheduleItem } from '@/types/catalog';
import { getCategorySchedule, getCategoryCodeForCard } from '@/lib/catalogUtils';
import { System7Window } from './System7Window';

interface IndexModalProps {
  cards: TopicCard[];
  activeCardId: string;
  onSelectCard: (id: string) => void;
  onClose: () => void;
}

/**
 * [Enter] 대주제 색인 목록 (General Classification Directory)
 * - 도서관 십진분류 안내판처럼 100~500, B 서지 서고 등 대분과 일람 및 건수(0건, N건) 표시
 * - 카드가 존재하는 분과 클릭/선택 시 해당 분과의 첫 번째 카드로 점프
 */
export const IndexModal: React.FC<IndexModalProps> = ({
  cards,
  activeCardId,
  onSelectCard,
  onClose,
}) => {
  // 1) 전체 카드를 바탕으로 대분과 스케줄(100~500, B 등) 산출
  const schedule = useMemo<CategoryScheduleItem[]>(() => {
    return getCategorySchedule(cards);
  }, [cards]);

  // 2) 현재 열람 중인 카드의 대분과 코드 판별
  const currentCategoryCode = useMemo(() => {
    const currentCard = cards.find(
      (c) => c.id === activeCardId || c.callNumber === activeCardId
    );
    return currentCard ? getCategoryCodeForCard(currentCard.callNumber) : '';
  }, [cards, activeCardId]);

  // 3) 초기 선택 인덱스: 현재 열람 중인 분과(있으면 해당 분과, 없으면 0번)
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = schedule.findIndex((s) => s.code === currentCategoryCode);
    return idx >= 0 ? idx : 0;
  });

  // 4) 항목 선택 처리 함수
  const handleSelectCategory = (item: CategoryScheduleItem) => {
    if (item.hasCards && item.firstCardId) {
      onSelectCard(item.firstCardId);
      onClose();
    }
  };

  // 5) 키보드 방향키 및 Enter 인터랙션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % schedule.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + schedule.length) % schedule.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = schedule[selectedIndex];
        if (item && item.hasCards && item.firstCardId) {
          handleSelectCategory(item);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [schedule, selectedIndex]);

  // 총 등록 카드 수
  const totalCardCount = useMemo(() => {
    return schedule.reduce((sum, s) => sum + s.count, 0);
  }, [schedule]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 font-mono">
      <div className="w-full max-w-lg">
        <System7Window
          title="대주제 색인 일람표 (Classification Schedule)"
          onClose={onClose}
          className="shadow-[4px_4px_0px_#000]"
        >
          <div className="space-y-3">
            {/* 상단 안내바 */}
            <div className="text-xs text-gray-700 pb-2 border-b border-gray-300 flex justify-between items-center">
              <span>도서관 주분과 체계 • 총 {schedule.length}개 서가</span>
              <span className="text-[11px] text-gray-500">등록 장서: {totalCardCount}건</span>
            </div>

            {/* 도서관 십진분류표 판넬 리스트 */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {schedule.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const isCurrent = item.code === currentCategoryCode;
                const isDisabled = !item.hasCards;

                return (
                  <div
                    key={item.code}
                    onClick={() => {
                      setSelectedIndex(idx);
                      if (!isDisabled) {
                        handleSelectCategory(item);
                      }
                    }}
                    className={`p-2.5 border text-xs flex items-center justify-between transition-none select-none ${
                      isDisabled
                        ? isSelected
                          ? 'bg-gray-200 border-gray-400 text-gray-400 cursor-not-allowed'
                          : 'bg-[#fafafa] border-gray-200 text-gray-400 cursor-not-allowed'
                        : isSelected
                        ? 'bg-black text-white border-black cursor-pointer'
                        : isCurrent
                        ? 'bg-[#edf0f5] border-black font-semibold cursor-pointer hover:border-black'
                        : 'bg-white border-gray-300 cursor-pointer hover:border-black'
                    }`}
                  >
                    {/* 좌측: 분과 기호 및 명칭 */}
                    <div className="flex items-center space-x-2.5 truncate">
                      <span
                        className={`text-[11px] font-bold font-mono px-1.5 py-0.5 border ${
                          isSelected && !isDisabled
                            ? 'border-white bg-white/10 text-white'
                            : isDisabled
                            ? 'border-gray-300 bg-gray-100 text-gray-400'
                            : 'border-black bg-white text-black'
                        }`}
                      >
                        [{item.code}]
                      </span>
                      <span
                        className={`truncate ${
                          isDisabled ? 'text-gray-400' : 'font-medium'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    {/* 우측: 현재 위치 뱃지 및 건수 */}
                    <div className="flex items-center space-x-2 shrink-0 ml-3 text-[11px]">
                      {isCurrent && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold ${
                            isSelected && !isDisabled
                              ? 'bg-white text-black'
                              : 'bg-black text-white'
                          }`}
                        >
                          현재 서가
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 border font-bold text-[11px] ${
                          isDisabled
                            ? 'border-gray-200 bg-gray-100 text-gray-400'
                            : isSelected
                            ? 'border-white bg-white/20 text-white'
                            : 'border-black bg-[#f0f2f5] text-black shadow-[1px_1px_0px_#000]'
                        }`}
                      >
                        {item.count}건
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 하단 툴바 및 버튼 */}
            <div className="pt-2 border-t border-gray-300 flex justify-between items-center text-xs">
              <span className="text-[11px] text-gray-500">
                [↑/↓] 이동, [Enter/클릭] 서가 입장
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  type="button"
                  className="sys7-btn px-4 py-1 text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
                >
                  취소 (Esc)
                </button>
                <button
                  onClick={() => {
                    const item = schedule[selectedIndex];
                    if (item && item.hasCards) {
                      handleSelectCategory(item);
                    }
                  }}
                  disabled={!schedule[selectedIndex]?.hasCards}
                  type="button"
                  className={`sys7-btn px-4 py-1 text-xs font-bold ${
                    schedule[selectedIndex]?.hasCards
                      ? 'hover:bg-black hover:text-white cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  입장 (Enter)
                </button>
              </div>
            </div>
          </div>
        </System7Window>
      </div>
    </div>
  );
};
