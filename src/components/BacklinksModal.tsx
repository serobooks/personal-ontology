'use client';

import React from 'react';
import { BacklinkItem } from '@/types/catalog';
import { System7Window } from './System7Window';

interface BacklinksModalProps {
  currentTopic: string;
  backlinks: BacklinkItem[];
  onSelectCard: (id: string) => void;
  onClose: () => void;
}

/**
 * [B] 역링크(Backlinks) 팝업 창
 */
export const BacklinksModal: React.FC<BacklinksModalProps> = ({
  currentTopic,
  backlinks,
  onSelectCard,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 font-mono">
      <div className="w-full max-w-lg">
        <System7Window
          title="역링크 탐색기 (Incoming References)"
          onClose={onClose}
          className="shadow-[4px_4px_0px_#000]"
        >
          <div className="space-y-3 text-xs">
            <div className="pb-2 border-b border-gray-300">
              <div className="text-gray-500 text-[11px]">참조 대상 카드:</div>
              <div className="font-bold text-sm text-black truncate">{currentTopic}</div>
            </div>

            {backlinks.length === 0 ? (
              <div className="py-8 text-center text-gray-500 bg-[#f9f9f9] border border-dashed border-gray-300">
                <p>이 카드를 인용한 다른 장서 카드가 아직 없습니다.</p>
                <p className="text-[11px] mt-1 text-gray-400">
                  다른 카드 스레드에 이 카드의 ID를 연계 기록해 보세요.
                </p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                <div className="text-[11px] text-gray-600 font-semibold">
                  총 {backlinks.length}개의 스레드에서 본 카드를 참조하고 있습니다:
                </div>

                {backlinks.map((item, index) => (
                  <div
                    key={`${item.sourceCardId}-${index}`}
                    onClick={() => onSelectCard(item.sourceCardId)}
                    className="p-2.5 border border-black bg-[#fcfaf2] hover:bg-black hover:text-white cursor-pointer transition-none shadow-[2px_2px_0px_rgba(0,0,0,0.1)] group"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate">
                        [{item.sourceCallNumber}] {item.sourceTopic}
                      </span>
                      <span className="text-[10px] opacity-75 shrink-0 ml-2">
                        {item.threadDate}
                      </span>
                    </div>

                    <p className="mt-1.5 text-[11px] opacity-85 group-hover:text-gray-200 line-clamp-2">
                      &quot;{item.threadSnippet}&quot;
                    </p>

                    <div className="mt-2 text-right text-[10px] font-bold underline">
                      → 해당 카드로 이동
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-gray-300 flex justify-between items-center text-xs">
              <span className="text-[11px] text-gray-500">[Esc] 닫기</span>
              <button
                onClick={onClose}
                type="button"
                className="sys7-btn px-4 py-1 text-xs font-bold"
              >
                닫기 (Esc)
              </button>
            </div>
          </div>
        </System7Window>
      </div>
    </div>
  );
};
