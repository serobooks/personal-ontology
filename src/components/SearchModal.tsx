'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TopicCard } from '@/types/catalog';
import { searchCards } from '@/lib/catalogUtils';
import { getSearchSnippet, getCardSearchText } from '@/lib/searchSnippetUtils';
import { System7Window } from './System7Window';

interface SearchModalProps {
  cards: TopicCard[];
  onSelectCard: (id: string) => void;
  onClose: () => void;
}

/**
 * 클래식 Mac System 7 감성의 장서 검색 모달 (Find Card...)
 * - 입력창 자동 포커스
 * - 제목, 청구기호, 단상 본문, 연계 장서 실시간 필터링
 * - 검색어 하이라이트 및 앞뒤 문맥 스니펫 노출 (2안 방식)
 * - 방향키(↑/↓) 탐색 및 Enter 선택
 * - 0건 매칭 시 [ 0 CARDS FOUND ] 안내
 */
export const SearchModal: React.FC<SearchModalProps> = ({
  cards,
  onSelectCard,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 모달 마운트 시 검색 입력창에 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const hasQuery = query.trim().length > 0;

  // 실시간 검색 결과 리스트 (검색어가 없을 때는 빈 결과 유지)
  const filteredCards = useMemo(() => {
    if (!hasQuery) return [];
    return searchCards(query, cards);
  }, [query, hasQuery, cards]);

  // 검색어가 바뀌면 선택 인덱스 및 스크롤 초기화
  useEffect(() => {
    setSelectedIndex(0);
    itemRefs.current = [];
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [query]);

  // 키보드로 선택 항목 변경 시 스크롤 위치 동기화
  // 아래로 내려갈 때는 선택된 항목이 보이는 항목 중 최하단에 위치하도록 스크롤
  useEffect(() => {
    const container = listContainerRef.current;
    const item = itemRefs.current[selectedIndex];
    if (!container || !item) return;

    const itemTop = item.offsetTop - container.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;

    if (itemBottom > viewBottom) {
      // 아래로 내려가 뷰포트 하단을 벗어남 -> 하단에 맞춤
      container.scrollTop = itemBottom - container.clientHeight;
    } else if (itemTop < viewTop) {
      // 위로 올라가 뷰포트 상단을 벗어남 -> 상단에 맞춤
      container.scrollTop = itemTop;
    }
  }, [selectedIndex]);

  // 키보드 방향키 및 Enter/Escape 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasQuery) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredCards.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredCards.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredCards.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCards.length > 0 && filteredCards[selectedIndex]) {
        onSelectCard(filteredCards[selectedIndex].id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-mono select-none">
      <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-100">
        <System7Window
          title="카드 검색 (Find Card)"
          onClose={onClose}
          className="shadow-[4px_4px_0px_#000]"
        >
          <div className="space-y-3">
            {/* 검색 입력 필드 영역 */}
            <div className="space-y-1">
              <label htmlFor="search-input" className="text-[11px] font-bold text-gray-700 block">
                장서 검색 (제목, 청구기호, 단상 본문 키워드):
              </label>
              <div className="relative">
                <input
                  id="search-input"
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="예: 바벨, 하이퍼텍스트, 101-a..."
                  className="w-full border-2 border-black bg-white px-2 py-1.5 text-xs text-black font-mono shadow-[inset_1px_1px_0px_#888] focus:outline-none focus:ring-1 focus:ring-black"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-black font-bold px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* 실시간 필터링 결과 리스트 */}
            <div className="border border-black bg-[#fbfbfb]">
              <div className="bg-[#e6e6e6] border-b border-black px-2 py-1 flex justify-between items-center text-[10px] text-gray-600 font-bold min-h-[25px]">
                {hasQuery ? (
                  <>
                    <span>검색 결과: {filteredCards.length}건</span>
                    {filteredCards.length > 0 && <span>[↑/↓] 이동, [Enter] 열기</span>}
                  </>
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>

              <div
                ref={listContainerRef}
                className="max-h-56 min-h-[140px] overflow-y-auto p-1 space-y-1"
              >
                {!hasQuery ? null : filteredCards.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500 font-mono tracking-wider">
                    [ 0 CARDS FOUND ]
                  </div>
                ) : (
                  filteredCards.map((card, idx) => {
                    const isSelected = idx === selectedIndex;
                    const noteText = getCardSearchText(card, query);
                    const snippet = getSearchSnippet(noteText, query, 6);

                    return (
                      <div
                        key={card.id}
                        ref={(el) => {
                          itemRefs.current[idx] = el;
                        }}
                        onClick={() => onSelectCard(card.id)}
                        className={`p-1.5 border cursor-pointer text-xs flex items-center justify-between transition-none ${
                          isSelected
                            ? 'bg-black text-white border-black'
                            : 'bg-white border-gray-300 hover:border-black'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate w-full">
                          <span
                            className={`text-[10px] font-bold px-1 border shrink-0 ${
                              isSelected
                                ? 'border-white text-white bg-white/20'
                                : 'border-black text-black bg-[#f0f0f0]'
                            }`}
                          >
                            {card.callNumber}
                          </span>
                          <span className="truncate text-xs font-mono">
                            {snippet.prefixEllipsis && (
                              <span className="opacity-60 mr-0.5">…</span>
                            )}
                            {snippet.segments.map((segment, sIdx) =>
                              segment.isMatch ? (
                                <mark
                                  key={sIdx}
                                  className={`bg-transparent font-bold ${
                                    isSelected
                                      ? 'text-yellow-300 underline'
                                      : 'text-black bg-yellow-200 px-0.5 underline'
                                  }`}
                                >
                                  {segment.text}
                                </mark>
                              ) : (
                                <span key={sIdx}>{segment.text}</span>
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 하단 조작 버튼 */}
            <div className="pt-2 border-t border-gray-300 flex justify-end items-center gap-2 text-xs">
              <button
                onClick={onClose}
                type="button"
                className="sys7-btn px-4 py-1 text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
              >
                취소 (Esc)
              </button>
              <button
                onClick={() => {
                  if (hasQuery && filteredCards[selectedIndex]) {
                    onSelectCard(filteredCards[selectedIndex].id);
                  }
                }}
                disabled={!hasQuery || filteredCards.length === 0}
                type="button"
                className="sys7-btn px-4 py-1 text-xs font-bold hover:bg-black hover:text-white disabled:opacity-40 cursor-pointer"
              >
                이동 (Enter)
              </button>
            </div>
          </div>
        </System7Window>
      </div>
    </div>
  );
};

