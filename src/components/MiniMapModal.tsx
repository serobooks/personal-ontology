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
 * - 대주제별 성운(Nebulae)이 교집합이나 인위적 경계 없이 광활한 성도 위에 자유롭게 분산
 * - 사유 노트는 부모-자식 별자리 실선으로, 연계 및 서지 카드는 점선으로 연결
 * - 서지 카드는 태양계 외곽의 성간 공간에 불규칙적으로 흩뿌려짐
 * - 스크롤바 없이 마우스 상하좌우 이동에 따라 시선이 부드럽게 창 안의 조망 범위를 확장하는 뷰포트 패닝
 * - 깜빡임이나 장식적 애니메이션이 일절 배제된 순수 1비트 정적 미학
 */
export const MiniMapModal: React.FC<MiniMapModalProps> = ({
  isOpen,
  currentCard,
  allCards,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mapData = getLibraryOverviewMapData(currentCard, allCards);

  // 모달 오픈 시 현재 노드가 뷰포트 정중앙에 오도록 초기 스크롤 설정
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

  // 마우스 상하좌우 이동에 따른 부드러운 뷰포트 카메라 패닝 (스크롤바를 대체하는 시선 추적 조망)
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
            {/* 시원스럽게 펼쳐진 광역 성도 뷰포트 (스크롤바 없이 마우스 이동으로 조망) */}
            <div
              ref={containerRef}
              data-testid="overview-map"
              onMouseMove={handleMouseMove}
              className="relative w-full h-[320px] border-2 border-black bg-white overflow-hidden shadow-[inset_1px_1px_0px_#888] cursor-crosshair [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
                {/* 1. 대주제 성운 위치 라벨 (원형 경계선 없이 단정한 비트맵 텍스트만 표시) */}
                {mapData.clusters.map((cluster) => (
                  <text
                    key={`nebula-${cluster.majorCode}`}
                    x={cluster.cx}
                    y={cluster.cy - 14}
                    fill="#aaa"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    [{cluster.majorCode}]
                  </text>
                ))}

                {/* 2. 성간 및 연계 카드 참조선 (단정한 1비트 회색 점선) */}
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

                {/* 3. 직속 부모-자식 별자리 터널 (단정한 1비트 검은 실선) */}
                {mapData.tunnels.map((tunnel, idx) => (
                  <line
                    key={`tunnel-${idx}`}
                    data-testid="tunnel-link"
                    x1={tunnel.x1}
                    y1={tunnel.y1}
                    x2={tunnel.x2}
                    y2={tunnel.y2}
                    stroke="#000"
                    strokeWidth="1"
                  />
                ))}

                {/* 4. 모든 메모의 사각(사유) 및 이중 원(서지) 도트들 */}
                {mapData.nodes.map((node) => {
                  if (node.isBook) {
                    // B- 서지 카드: 스타일 2 이중 원(Celestial Bullseye ⊙)
                    if (node.isCurrent) {
                      return (
                        <g key={node.id} data-testid="current-location-marker">
                          {/* 현재 서지: 바깥 정적 사각 타겟팅 프레임 (10x10) */}
                          <rect
                            x={node.x - 5}
                            y={node.y - 5}
                            width={10}
                            height={10}
                            fill="none"
                            stroke="#000"
                            strokeWidth="1"
                          />
                          {/* 내부 이중 원: 외곽 원 (지름 7px, r=3.5) */}
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={3.5}
                            fill="#fff"
                            stroke="#000"
                            strokeWidth="1"
                          />
                          {/* 중심 1비트 검은 점 (2x2 픽셀) */}
                          <rect
                            x={node.x - 1}
                            y={node.y - 1}
                            width={2}
                            height={2}
                            fill="#000"
                          />
                        </g>
                      );
                    }

                    // 일반 서지: 이중 원 도트 ⊙ (지름 7px)
                    return (
                      <g key={node.id} data-testid="book-marker">
                        {/* 외곽 원: 지름 7px, r=3.5 */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={3.5}
                          fill="#fff"
                          stroke="#000"
                          strokeWidth="1"
                        />
                        {/* 중심 1비트 검은 점 (2x2 픽셀) */}
                        <rect
                          x={node.x - 1}
                          y={node.y - 1}
                          width={2}
                          height={2}
                          fill="#000"
                        />
                      </g>
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

                  // 일반 사유 메모: 아주 작은 빈 사각 도트 (4x4)
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
