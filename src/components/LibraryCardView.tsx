'use client';

import React from 'react';
import { TopicCard, CardThread, StampType } from '@/types/catalog';
import { resolveLinkedCardInfo, getThreadDisplayNote, resolveClassification } from '@/lib/catalogUtils';

interface LibraryCardViewProps {
  card: TopicCard;
  activeThread: CardThread;
  activeThreadIndex: number;
  totalThreads: number;
  onPrevThread: () => void;
  onNextThread: () => void;
  onSelectTopic: (topicId: string) => void;
  onOpenBacklinks: () => void;
  backlinkCount: number;
  allCards?: TopicCard[];
  isAuthenticated?: boolean;
}

/**
 * 5종 날짜 도장 스탬프 렌더링 헬퍼 (Type = Text 1:1 일체화)
 */
const renderStamp = (thread: CardThread) => {
  const stampClasses: Record<StampType, string> = {
    QUOTATION: 'stamp-quotation',
    QUOTE: 'stamp-quotation',
    UNFINISHED: 'stamp-unfinished',
    ESTABLISHED: 'stamp-established',
    SPECIMEN: 'stamp-specimen',
    RESTRICTED: 'stamp-restricted',
  };

  const displayText = thread.stampType === 'QUOTE' ? 'QUOTATION' : thread.stampType;

  return (
    <span className={`ink-stamp ${stampClasses[thread.stampType] || 'stamp-unfinished'}`}>
      {displayText}
    </span>
  );
};

/**
 * 도서관 장서 대출 카드 - 단 1장의 단상 집중형 뷰어
 * - 배경: Mac System 7과 일체감 있는 아주 옅은 쿨그레이 (#f5f7fa)
 * - 아날로그 도서 카드 느낌: 정갈한 고정폭 폰트 배치, 흑백 라인 및 붉은 헤더 괘선
 */
export const LibraryCardView: React.FC<LibraryCardViewProps> = ({
  card,
  activeThread,
  activeThreadIndex,
  totalThreads,
  onPrevThread,
  onNextThread,
  onSelectTopic,
  onOpenBacklinks,
  backlinkCount,
  allCards,
  isAuthenticated = false,
}) => {
  const isRestrictedMasked = activeThread.stampType === 'RESTRICTED' && !isAuthenticated;
  const displayNote = getThreadDisplayNote(activeThread, isAuthenticated);
  return (
    <div className="w-full max-w-2xl bg-[#f5f7fa] border-2 border-black shadow-[4px_4px_0px_#000000] p-6 sm:p-8 relative library-card-sheet font-mono">
      {/* 1. 카드 상단 헤더: 청구기호, 서지 정보, 역링크 */}
      <div className="border-b-2 border-red-600 pb-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* 청구기호(Call Number) 박스 */}
          <div className="border-2 border-black bg-white px-3 py-1.5 shadow-[2px_2px_0px_#000] inline-block">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              CALL NUMBER / 청구기호
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-black">
              {card.callNumber}
            </div>
          </div>

          {/* 분류 및 서가 정보 (좌측 청구기호 박스와 1:1 대칭 구조) */}
          <div className="text-right text-xs space-y-0.5">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              {card.callNumber.toUpperCase().startsWith('B-')
                ? 'BIBLIOGRAPHY'
                : 'CLASSIFICATION'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
              {card.classification || resolveClassification(card.callNumber)}
            </div>
            {/* 역링크 버튼 */}
            <div className="pt-0.5">
              <button
                onClick={onOpenBacklinks}
                type="button"
                className="inline-flex items-center space-x-1 border border-black bg-white px-2 py-0.5 text-[11px] font-bold shadow-[1px_1px_0px_#000] hover:bg-black hover:text-white transition-none cursor-pointer"
              >
                <span>🔗 역링크 (B):</span>
                <span className="underline">{backlinkCount}건 참조됨</span>
              </button>
            </div>
          </div>
        </div>

        {/* 서지 카드(B-)일 때만 큼직한 책 제목 헤더 렌더링 (빨간색 라벨 제거, 책 제목만 볼드 렌더링) */}
        {card.callNumber.toUpperCase().startsWith('B-') && (
          <div className="mt-4">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black mt-1">
              {card.topic}
            </h1>
          </div>
        )}
      </div>

      {/* 2. 카드 본문: 화면 중앙에 단 1장의 단상 카드 렌더링 */}
      <div className="my-5">
        {/* 단상 카드 상단 내비게이션 바 (불필요한 가로선 제거) */}
        <div className="flex items-center justify-end mb-2 text-xs">
          {/* 이전/다음 전환 미니 버튼 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onPrevThread}
              type="button"
              title="이전 카드 (←)"
              className="sys7-btn px-2 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer"
            >
              ← 이전
            </button>
            <button
              onClick={onNextThread}
              type="button"
              title="다음 단상 (→)"
              className="sys7-btn px-2 py-0.5 text-[11px] font-bold hover:bg-black hover:text-white cursor-pointer"
            >
              다음 →
            </button>
          </div>
        </div>

        {/* 단일 단상 카드 프레임 */}
        <div className="p-5 bg-white border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.2)] min-h-[160px] flex flex-col justify-between">
          <div>
            {/* 단상 헤더: 기록 일자 & 고무인 스탬프 */}
            <div className="flex items-center justify-between border-b border-dashed border-gray-300 pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  DATE STAMP
                </span>
                <span className="text-xs font-bold tracking-wider text-black">
                  {activeThread.date}
                </span>
              </div>
              <div>{renderStamp(activeThread)}</div>
            </div>

            {/* 단상 본문 내용 (단정하고 깊이감 있는 폰트, RESTRICTED 미인증 시 마스킹) */}
            {isRestrictedMasked ? (
              <div className="my-3 font-mono">
                {/* 1비트 핀스트라이프 패턴 상단 가로줄 */}
                <div className="h-1.5 w-full pinstripe-bar border-y border-black" />

                <div className="py-6 px-3 flex flex-col items-center justify-center text-center">
                  {/* 클래식 Mac 1비트 픽셀 자물쇠 비트맵 그래픽 */}
                  <div className="w-8 h-8 border border-black bg-[#f0f0f0] p-1 flex items-center justify-center shadow-[1px_1px_0px_#000]">
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      style={{ imageRendering: 'pixelated' }}
                    >
                      {/* 자물쇠 고리 */}
                      <path d="M5 2a3 3 0 0 1 6 0v3h-1V2a2 2 0 0 0-4 0v3H5V2z" fill="#000" />
                      {/* 자물쇠 몸통 */}
                      <rect x="3" y="5" width="10" height="9" fill="#000" />
                      <rect x="4" y="6" width="8" height="7" fill="#fff" />
                      {/* 열쇠 구멍 */}
                      <rect x="7" y="8" width="2" height="2" fill="#000" />
                      <rect x="7.5" y="10" width="1" height="2" fill="#000" />
                    </svg>
                  </div>

                  {/* 자물쇠와 블록처리된 줄 사이의 여유 있는 간격 */}
                  <div className="mt-3 inline-block bg-black text-white px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase">
                    [ CLASSIFIED / 열람 권한 필요 ]
                  </div>

                  <span className="mt-2 text-[10px] text-[#555555]">
                    상단 메뉴의 <strong>Admin</strong>에서 사서 암호를 인가받으십시오.
                  </span>
                </div>

                {/* 1비트 핀스트라이프 패턴 하단 가로줄 */}
                <div className="h-1.5 w-full pinstripe-bar border-y border-black" />
              </div>
            ) : (
              <p className="text-sm text-black leading-relaxed whitespace-pre-wrap font-sans py-2">
                {displayNote}
              </p>
            )}
          </div>

          {/* 연계 카드 링크 */}
          {activeThread.linkedTopicIds && activeThread.linkedTopicIds.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-gray-500 font-bold">연계 카드:</span>
              {activeThread.linkedTopicIds.map((linkedId) => {
                const info = resolveLinkedCardInfo(linkedId, allCards || []);
                return (
                  <button
                    key={linkedId}
                    type="button"
                    onClick={() => onSelectTopic(info.targetCardId)}
                    className="border border-black px-2 py-0.5 bg-[#f0f2f5] hover:bg-black hover:text-white transition-none font-mono font-semibold cursor-pointer shadow-[1px_1px_0px_#000]"
                  >
                    {info.displayText}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
