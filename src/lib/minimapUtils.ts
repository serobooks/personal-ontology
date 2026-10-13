import { TopicCard } from '@/types/catalog';
import { parseCallNumber, compareCallNumbers } from './catalogUtils';

export interface OverviewNode {
  id: string;
  callNumber: string;
  depth: number;
  x: number;
  y: number;
  isCurrent: boolean;
}

export interface OverviewTunnel {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LibraryOverviewMapData {
  totalNotes: number;
  nodes: OverviewNode[];
  tunnels: OverviewTunnel[];
  currentDepth: number;
  maxDepth: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * 청구기호 문자열로부터 직속 상위(부모) 청구기호를 추출합니다.
 */
export function getParentCallNumber(callNumber: string): string | null {
  if (!callNumber) return null;

  const { majorCode, branch } = parseCallNumber(callNumber);
  if (!branch) return null;

  // 숫자가 아닌 대주제(예: 'B-1')는 부모 계층 연결을 두지 않음
  if (!/^\d+$/.test(majorCode)) {
    return null;
  }

  // branch가 1글자(예: 'a')인 경우 부모는 3자리 대주제 코드(루트)
  if (branch.length === 1) {
    return majorCode;
  }

  // branch가 2글자 이상인 경우 마지막 접미사를 뗀 것이 부모
  const parentBranch = branch.slice(0, -1);
  return `${majorCode}-${parentBranch}`;
}

/**
 * DB에 담긴 모든 메모를 조그마한 사각 도트로 매핑하고,
 * 깊이가 깊어질수록 오른쪽(X축)으로 뻗어나가는 가로 확장형 '서고 전체도' 데이터를 산출합니다.
 */
export function getLibraryOverviewMapData(
  currentCard: TopicCard,
  allCards: TopicCard[]
): LibraryOverviewMapData {
  if (!allCards || allCards.length === 0) {
    return {
      totalNotes: 0,
      nodes: [],
      tunnels: [],
      currentDepth: 0,
      maxDepth: 1,
      canvasWidth: 320,
      canvasHeight: 180,
    };
  }

  // 1. 전체 카드 정렬
  const sortedCards = [...allCards].sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));

  // 2. 전체 고유 대주제(행) 분류
  const majorCodes = Array.from(
    new Set(sortedCards.map((c) => parseCallNumber(c.callNumber).majorCode))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // 3. 카드별 깊이(depth) 계산 및 최대 깊이 도출
  const cardDepthMap = new Map<string, number>();
  let calculatedMaxDepth = 0;

  sortedCards.forEach((c) => {
    const { branch } = parseCallNumber(c.callNumber);
    const depth = branch ? branch.length : 0;
    cardDepthMap.set(c.id, depth);
    if (depth > calculatedMaxDepth) {
      calculatedMaxDepth = depth;
    }
  });

  const maxDepth = Math.max(calculatedMaxDepth, 3);

  // 4. 가로 전개형 캔버스 규격 산출
  // 깊이가 깊어질수록 X축(오른쪽)으로 길어짐
  const xStep = 56;
  const startX = 24;
  const canvasWidth = Math.max(340, startX + (maxDepth + 1) * xStep + 24);

  // 세로는 대주제 분과 수에 따라 자연스럽게 높이 배분
  const totalRows = Math.max(majorCodes.length, 4);
  const rowHeight = 32;
  const startY = 24;
  const canvasHeight = Math.max(180, startY + totalRows * rowHeight + 20);

  // 형제 오프셋을 위한 그룹 카운터
  const groupCounts: Record<string, number> = {};

  // 5. 노드 좌표 생성 (X축: 깊이, Y축: 대주제 및 형제 분기)
  const nodes: OverviewNode[] = sortedCards.map((card) => {
    const { majorCode } = parseCallNumber(card.callNumber);
    const depth = cardDepthMap.get(card.id) ?? 0;
    const isCurrent = card.id === currentCard.id || card.callNumber === currentCard.callNumber;

    // X 좌표: depth가 깊어질수록 오른쪽으로 진행
    const x = Math.round(startX + depth * xStep);

    // Y 좌표: 대주제 기본 Y + 형제 가지 오프셋
    const majorIndex = majorCodes.indexOf(majorCode);
    const baseY = startY + (majorIndex >= 0 ? majorIndex * rowHeight : 0);

    const groupKey = `${majorCode}-${depth}`;
    const siblingIndex = groupCounts[groupKey] ?? 0;
    groupCounts[groupKey] = siblingIndex + 1;

    let siblingYOffset = 0;
    if (siblingIndex > 0) {
      const sign = siblingIndex % 2 === 1 ? -1 : 1;
      const mag = Math.ceil(siblingIndex / 2) * 10;
      siblingYOffset = sign * mag;
    }

    const y = Math.round(Math.max(12, Math.min(canvasHeight - 12, baseY + siblingYOffset)));

    return {
      id: card.id,
      callNumber: card.callNumber,
      depth,
      x,
      y,
      isCurrent,
    };
  });

  // 6. 노드 간 부모-자식 연결선 생성
  const nodeMap = new Map<string, OverviewNode>();
  nodes.forEach((n) => nodeMap.set(n.callNumber, n));

  const tunnels: OverviewTunnel[] = [];
  nodes.forEach((childNode) => {
    const parentCall = getParentCallNumber(childNode.callNumber);
    if (parentCall) {
      const parentNode = nodeMap.get(parentCall);
      if (parentNode) {
        tunnels.push({
          x1: parentNode.x,
          y1: parentNode.y,
          x2: childNode.x,
          y2: childNode.y,
        });
      }
    }
  });

  const currentDepth = cardDepthMap.get(currentCard.id) ?? 0;

  return {
    totalNotes: allCards.length,
    nodes,
    tunnels,
    currentDepth,
    maxDepth,
    canvasWidth,
    canvasHeight,
  };
}
