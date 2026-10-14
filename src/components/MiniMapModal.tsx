import React, { useRef, useEffect } from 'react';
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
 * - DB의 모든 메모를 조그마한 1비트 사각 도트(사유) 및 다이아몬드(서지)로 시각화
 * - 현재 노드를 기준으로 정중앙에 위치하고, 마우스를 살살 움직이면 즉각 패닝되는 시선 추적 조망 시스템
 * - 은은한 회색 점선으로 사유와 서지 간의 연계 그물망 표현
 */
export const MiniMapModal: React.FC<MiniMapModalProps> = ({
  isOpen,
  currentCard,
  allCards,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mapData = getLibraryOverviewMapData(currentCard, allCards);

  // 모달 오픈 시 현재 노드가 캔버스 정중앙에 오도록 자동 스크롤
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;
    const currentNode = mapData.nodes.find((n) => n.isCurrent);
    if (currentNode) {
      const targetX = Math.max(0, currentNode.x - container.clientWidth / 2);
      const targetY = Math.max(0, currentNode.y - container.clientHeight / 2);
      container.scrollLeft = targetX;
      container.scrollTop = targetY;
    }
  }, [isOpen, mapData]);

  // 마우스 커서 위치에 따른 즉각적인 시선 추적 조망 (Dynamic Mouse Panning)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseRatioX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const mouseRatioY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const maxScrollX = container.scrollWidth - container.clientWidth;
    const maxScrollY = container.scrollHeight - container.clientHeight;

    if (maxScrollX > 0) {
      container.scrollLeft = Math.round(mouseRatioX * maxScrollX);
    }
    if (maxScrollY > 0) {
      container.scrollTop = Math.round(mouseRatioY * maxScrollY);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="서고 전체도"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 font-mono select-none backdrop-blur-[0.5px]"
    >
      <div className="w-[620px] max-w-[95vw] animate-in fade-in zoom-in-95 duration-100">
        <System7Window
          title="서고 전체도 (Overview)"
          onClose={onClose}
          className="shadow-[5px_5px_0px_#000] border-2 border-black"
        >
          <div className="space-y-2 text-xs">
            {/* 가로로 확장된 시원한 전체도 뷰어 영역 (마우스 시선 추적 조망 지원) */}
            <div
              ref={containerRef}
              data-testid="overview-map"
              onMouseMove={handleMouseMove}
              className="relative w-full h-[300px] border-2 border-black bg-white overflow-auto shadow-[inset_1px_1px_0px_#888] cursor-crosshair"
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
                {/* 1. 사유 및 서지 연계카드 연결선 (은은한 회색 점선) */}
                {mapData.references?.map((ref, idx) => (
                  <line
                    key={`ref-${idx}`}
                    data-testid="reference-link"
                    x1={ref.x1}
                    y1={ref.y1}
                    x2={ref.x2}
                    y2={ref.y2}
                    stroke="#888"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                ))}

                {/* 2. 직속 부모-자식 나뭇가지 연결선 (단정한 검은 실선) */}
                {mapData.tunnels.map((tunnel, idx) => (
                  <line
                    key={`tunnel-${idx}`}
                    x1={tunnel.x1}
                    y1={tunnel.y1}
                    x2={tunnel.x2}
                    y2={tunnel.y2}
                    stroke="#000"
                    strokeWidth="1"
                  />
                ))}

                {/* 3. 모든 메모의 사각(사유) 및 다이아몬드(서지) 도트들 */}
                {mapData.nodes.map((node) => {
                  if (node.isBook) {
                    // B- 서지 카드: 다이아몬드(마름모) 도트
                    if (node.isCurrent) {
                      return (
                        <g key={node.id} data-testid="current-location-marker">
                          {/* 현재 서지: 바깥 정적 마름모 테두리 (10x10) */}
                          <polygon
                            points={`${node.x},${node.y - 5} ${node.x + 5},${node.y} ${node.x},${node.y + 5} ${node.x - 5},${node.y}`}
                            fill="none"
                            stroke="#000"
                            strokeWidth="1"
                          />
                          {/* 현재 서지: 내부 꽉 찬 마름모 (6x6) */}
                          <polygon
                            points={`${node.x},${node.y - 3} ${node.x + 3},${node.y} ${node.x},${node.y + 3} ${node.x - 3},${node.y}`}
                            fill="#000"
                          />
                        </g>
                      );
                    }

                    // 일반 서지: 빈 마름모 도트 (6x6)
                    return (
                      <polygon
                        key={node.id}
                        data-testid="book-marker"
                        points={`${node.x},${node.y - 3} ${node.x + 3},${node.y} ${node.x},${node.y + 3} ${node.x - 3},${node.y}`}
                        fill="#fff"
                        stroke="#000"
                        strokeWidth="1"
                      />
                    );
                  }

                  // 일반 사유 메모: 사각형 도트
                  if (node.isCurrent) {
                    return (
                      <g key={node.id} data-testid="current-location-marker">
                        {/* 현재 노드: 바깥 정적 테두리 (8x8) */}
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

            {/* 하단 상태 표시 바 및 닫기 버튼 (단정하게 1줄 유지) */}
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
