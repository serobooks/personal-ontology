'use client';

import React from 'react';
import { TopicCard } from '@/types/catalog';
import { System7Window } from './System7Window';
import { getLibraryOverviewMapData } from '@/lib/minimapUtils';

interface MiniMapModalProps {
  isOpen: boolean;
  currentCard: TopicCard;
  allCards: TopicCard[];
  onClose: () => void;
  onSelectCard?: (id: string) => void;
}

/**
 * 서고 전체도 (Overview) 모달 팝업
 * - DB의 모든 메모를 조그마한 1비트 사각 도트(4x4px)로 시각화
 * - 가지치기 계층이 깊어질수록 오른쪽(X축)으로 확장되는 가로형 전개 구조
 * - 불필요한 메타데이터 없이, 오직 현재 카드의 깊이와 전체적인 구조를 정갈하게 조망
 */
export const MiniMapModal: React.FC<MiniMapModalProps> = ({
  isOpen,
  currentCard,
  allCards,
  onClose,
}) => {
  if (!isOpen) return null;

  const mapData = getLibraryOverviewMapData(currentCard, allCards);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="서고 전체도"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 font-mono select-none backdrop-blur-[0.5px]"
    >
      <div className="w-[420px] max-w-[95vw] animate-in fade-in zoom-in-95 duration-100">
        <System7Window
          title="서고 전체도 (Overview)"
          onClose={onClose}
          className="shadow-[5px_5px_0px_#000] border-2 border-black"
        >
          <div className="space-y-2 text-xs">
            {/* 가로 확장형 전체도 뷰어 영역 (오른쪽으로 스크롤 가능) */}
            <div
              data-testid="overview-map"
              className="relative w-full h-[220px] border-2 border-black bg-white overflow-auto shadow-[inset_1px_1px_0px_#888]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #000 0.5px, transparent 0.5px), radial-gradient(circle, #000 0.5px, #fff 0.5px)',
                backgroundSize: '12px 12px',
                backgroundPosition: '0 0, 6px 6px',
              }}
            >
              <svg
                className="block"
                width={mapData.canvasWidth}
                height={mapData.canvasHeight}
                viewBox={`0 0 ${mapData.canvasWidth} ${mapData.canvasHeight}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ shapeRendering: 'crispEdges' }}
              >
                {/* 노드 간 연결선 (오른쪽으로 뻗는 통로선) */}
                {mapData.tunnels.map((tunnel, idx) => (
                  <line
                    key={idx}
                    x1={tunnel.x1}
                    y1={tunnel.y1}
                    x2={tunnel.x2}
                    y2={tunnel.y2}
                    stroke="#000"
                    strokeWidth="1"
                  />
                ))}

                {/* 모든 메모의 조그마한 사각 도트들 */}
                {mapData.nodes.map((node) => {
                  if (node.isCurrent) {
                    return (
                      <g key={node.id} data-testid="current-location-marker">
                        {/* 현재 노드: 바깥 정적 테두리 (6x6) */}
                        <rect
                          x={node.x - 4}
                          y={node.y - 4}
                          width={8}
                          height={8}
                          fill="none"
                          stroke="#000"
                          strokeWidth="1"
                        />
                        {/* 현재 노드: 내부 꽉 찬 사각 (4x4) */}
                        <rect
                          x={node.x - 2}
                          y={node.y - 2}
                          width={4}
                          height={4}
                          fill="#000"
                        />
                      </g>
                    );
                  }

                  // 일반 메모: 아주 작은 빈 사각 도트 (4x4)
                  return (
                    <rect
                      key={node.id}
                      x={node.x - 2}
                      y={node.y - 2}
                      width={4}
                      height={4}
                      fill="#fff"
                      stroke="#000"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>
            </div>

            {/* 하단 상태 표시 바 및 닫기 버튼 (다른 팝업창과 동일한 규격) */}
            <div className="pt-2 border-t border-gray-300 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2 text-[11px] text-gray-700">
                <span className="flex items-center space-x-1">
                  <span className="inline-block w-2 h-2 bg-black" />
                  <span>현재 깊이: {mapData.currentDepth}단계</span>
                </span>
                <span className="text-gray-400">|</span>
                <span>총 {mapData.totalNotes}개 메모</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="sys7-btn px-4 py-1 text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
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
