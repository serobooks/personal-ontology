import { TopicCard } from '@/types/catalog';
import { parseCallNumber, compareCallNumbers } from './catalogUtils';

export interface OverviewNode {
  id: string;
  callNumber: string;
  depth: number;
  x: number;
  y: number;
  isCurrent: boolean;
  isBook?: boolean;
}

export interface OverviewNebula {
  majorCode: string;
  cx: number;
  cy: number;
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
  clusters: OverviewNebula[];
  tunnels: OverviewTunnel[];
  references: OverviewTunnel[];
  currentDepth: number;
  maxDepth: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * 3자리 십진분류 코드(100~600)의 내재적 계층 깊이를 산출합니다.
 */
export function getMajorCodeDepth(majorCode: string): number {
  if (!/^\d{3}$/.test(majorCode)) return 0;
  if (majorCode.endsWith('00')) return 0;
  if (majorCode.endsWith('0')) return 1;
  return 2;
}

/**
 * 청구기호 문자열로부터 직속 상위(부모) 청구기호를 추출합니다.
 */
export function getParentCallNumber(callNumber: string): string | null {
  if (!callNumber) return null;

  const trimmed = callNumber.trim();
  const { majorCode, branch } = parseCallNumber(trimmed);
  if (!branch) return null;

  if (!/^\d+$/.test(majorCode)) {
    return null;
  }

  // 1. 끝이 숫자인 경우: 끝의 연속된 숫자들을 제거
  if (/\d+$/.test(branch)) {
    const parentBranch = branch.replace(/\d+$/, '');
    if (!parentBranch) {
      return majorCode;
    }
    return `${majorCode}-${parentBranch}`;
  }

  // 2. 끝이 영문자인 경우: 끝의 연속된 영문자들을 제거
  if (/[a-zA-Z]+$/.test(branch)) {
    const parentBranch = branch.replace(/[a-zA-Z]+$/, '');
    if (!parentBranch) {
      return majorCode;
    }
    return `${majorCode}-${parentBranch}`;
  }

  return null;
}

/**
 * DB의 모든 메모를 자유로운 성운 성도(Cosmic Constellation)로 매핑합니다.
 * - 대주제별 성운(Nebulae): 겹치는 원형 경계선 없이 독립된 영역에 유기적으로 분산
 * - 사유 노트: 성운 안에서 부모-자식 관계에 따라 별자리처럼 실선(tunnels)으로 연결
 * - 서지 노트: 사유 성운 집합(태양계) 외곽에 불규칙적으로 흩뿌려지며, 연관 사유 노트와 점선(references)으로 연결
 * - 연계 카드(백링크): 사유-사유 간 상호 참조를 점선(references)으로 연결
 * - 광역 캔버스(920x600): 여유 있는 성간 거리를 제공하며 부드러운 뷰포트 패닝 지원
 */
export function getLibraryOverviewMapData(
  currentCard: TopicCard,
  allCards: TopicCard[]
): LibraryOverviewMapData {
  const canvasWidth = 920;
  const canvasHeight = 600;
  const centerX = Math.round(canvasWidth / 2);
  const centerY = Math.round(canvasHeight / 2);

  if (!allCards || allCards.length === 0) {
    return {
      totalNotes: 0,
      nodes: [],
      clusters: [],
      tunnels: [],
      references: [],
      currentDepth: 0,
      maxDepth: 1,
      canvasWidth,
      canvasHeight,
    };
  }

  // 1. 전체 카드 정렬
  const sortedCards = [...allCards].sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));

  // 2. 사유 카드(100~600)와 서지 카드(B-) 분리
  const ideaCards: TopicCard[] = [];
  const bookCards: TopicCard[] = [];

  sortedCards.forEach((c) => {
    const cleanCall = c.callNumber.trim().toUpperCase();
    if (cleanCall.startsWith('B-') || cleanCall === 'B') {
      bookCards.push(c);
    } else {
      ideaCards.push(c);
    }
  });

  // 3. 사유 카드별 대주제 고유 목록 및 깊이(depth) 계산
  const majorCodes = Array.from(
    new Set(ideaCards.map((c) => parseCallNumber(c.callNumber).majorCode))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const cardDepthMap = new Map<string, number>();
  let calculatedMaxDepth = 0;

  ideaCards.forEach((c) => {
    const { majorCode, branch } = parseCallNumber(c.callNumber);
    const baseDepth = getMajorCodeDepth(majorCode);
    const tokens = branch ? branch.match(/\d+|[a-zA-Z]+/g) : null;
    const branchDepth = tokens ? tokens.length : 0;
    const depth = baseDepth + branchDepth;

    cardDepthMap.set(c.id, depth);
    if (depth > calculatedMaxDepth) {
      calculatedMaxDepth = depth;
    }
  });

  bookCards.forEach((c) => {
    cardDepthMap.set(c.id, 0);
  });

  const maxDepth = Math.max(calculatedMaxDepth, 3);

  // 4. 대주제별 성운(Nebulae) 중심 좌표 산출 (서로 겹치지 않는 충분한 거리 확보)
  const clusters: OverviewNebula[] = [];
  const clusterCenterMap = new Map<string, { cx: number; cy: number }>();

  const numClusters = majorCodes.length;
  majorCodes.forEach((code, idx) => {
    let cx = centerX;
    let cy = centerY;

    if (numClusters === 1) {
      cx = centerX;
      cy = centerY;
    } else if (numClusters === 2) {
      cx = idx === 0 ? Math.round(centerX - 160) : Math.round(centerX + 160);
      cy = centerY;
    } else if (numClusters === 3) {
      const positions = [
        { cx: Math.round(centerX - 150), cy: Math.round(centerY - 90) },
        { cx: Math.round(centerX + 150), cy: Math.round(centerY - 90) },
        { cx: centerX, cy: Math.round(centerY + 140) },
      ];
      cx = positions[idx].cx;
      cy = positions[idx].cy;
    } else if (numClusters === 4) {
      const positions = [
        { cx: Math.round(centerX - 160), cy: Math.round(centerY - 100) },
        { cx: Math.round(centerX + 160), cy: Math.round(centerY - 100) },
        { cx: Math.round(centerX - 160), cy: Math.round(centerY + 100) },
        { cx: Math.round(centerX + 160), cy: Math.round(centerY + 100) },
      ];
      cx = positions[idx].cx;
      cy = positions[idx].cy;
    } else {
      // 5개 이상: 타원형 궤도 상에 고르게 분산 (거리 140px 이상 보장)
      const angle = (idx / numClusters) * 2 * Math.PI - Math.PI / 2;
      const rx = 240;
      const ry = 150;
      cx = Math.round(centerX + rx * Math.cos(angle));
      cy = Math.round(centerY + ry * Math.sin(angle));
    }

    clusters.push({ majorCode: code, cx, cy });
    clusterCenterMap.set(code, { cx, cy });
  });

  // 5. 각 성운 내 사유 노드 레이아웃 산출 (별자리 나뭇가지)
  const ideaNodes: OverviewNode[] = [];
  const cardsByMajor = new Map<string, TopicCard[]>();
  majorCodes.forEach((code) => cardsByMajor.set(code, []));
  ideaCards.forEach((c) => {
    const { majorCode } = parseCallNumber(c.callNumber);
    if (!cardsByMajor.has(majorCode)) {
      cardsByMajor.set(majorCode, []);
    }
    cardsByMajor.get(majorCode)!.push(c);
  });

  interface InternalTreeNode {
    card: TopicCard;
    children: InternalTreeNode[];
    depth: number;
    angle: number;
    x: number;
    y: number;
  }

  majorCodes.forEach((majorCode) => {
    const mCards = cardsByMajor.get(majorCode) || [];
    if (mCards.length === 0) return;

    const center = clusterCenterMap.get(majorCode) || { cx: centerX, cy: centerY };

    const treeNodeMap = new Map<string, InternalTreeNode>();
    mCards.forEach((card) => {
      treeNodeMap.set(card.callNumber, {
        card,
        children: [],
        depth: cardDepthMap.get(card.id) ?? 0,
        angle: 0,
        x: center.cx,
        y: center.cy,
      });
    });

    const roots: InternalTreeNode[] = [];
    mCards.forEach((card) => {
      const node = treeNodeMap.get(card.callNumber)!;
      const parentCall = getParentCallNumber(card.callNumber);
      if (parentCall && treeNodeMap.has(parentCall)) {
        treeNodeMap.get(parentCall)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    roots.sort((a, b) => compareCallNumbers(a.card.callNumber, b.card.callNumber));
    const sortChildren = (n: InternalTreeNode) => {
      n.children.sort((a, b) => compareCallNumbers(a.card.callNumber, b.card.callNumber));
      n.children.forEach(sortChildren);
    };
    roots.forEach(sortChildren);

    // 각 루트 및 자식 노드들에게 별자리 각도 분배
    const rootCount = roots.length;
    roots.forEach((root, rIdx) => {
      const baseAngle =
        rootCount === 1 ? 0 : (rIdx / rootCount) * 2 * Math.PI - Math.PI / 2;
      const angleSpan = (2 * Math.PI) / Math.max(rootCount, 1);

      const assignPositions = (
        n: InternalTreeNode,
        currentAngle: number,
        span: number
      ) => {
        n.angle = currentAngle;
        const dist = 18 + n.depth * 28;
        n.x = Math.round(center.cx + dist * Math.cos(currentAngle));
        n.y = Math.round(center.cy + dist * Math.sin(currentAngle));

        const childCount = n.children.length;
        if (childCount === 0) return;

        const subSpan = Math.min(span * 0.8, Math.PI * 0.55);
        const angleStep = childCount === 1 ? 0 : subSpan / (childCount - 1);
        const startChildAngle =
          childCount === 1 ? currentAngle : currentAngle - subSpan / 2;

        n.children.forEach((child, cIdx) => {
          const cAngle = childCount === 1 ? currentAngle : startChildAngle + cIdx * angleStep;
          assignPositions(child, cAngle, subSpan / Math.max(childCount, 1));
        });
      };

      assignPositions(root, baseAngle, angleSpan);
    });

    treeNodeMap.forEach((tNode) => {
      const card = tNode.card;
      const isCurrent = card.id === currentCard.id || card.callNumber === currentCard.callNumber;
      ideaNodes.push({
        id: card.id,
        callNumber: card.callNumber,
        depth: tNode.depth,
        x: tNode.x,
        y: tNode.y,
        isCurrent,
        isBook: false,
      });
    });
  });

  // 6. 서지 카드 노드 레이아웃 산출 (태양계 외곽에 불규칙 흩뿌림)
  const nodeLookup = new Map<string, OverviewNode>();
  ideaNodes.forEach((n) => {
    nodeLookup.set(n.id.toLowerCase(), n);
    nodeLookup.set(n.callNumber.toLowerCase(), n);
  });

  const bookNodes: OverviewNode[] = bookCards.map((bCard, bIdx) => {
    const isCurrent = bCard.id === currentCard.id || bCard.callNumber === currentCard.callNumber;

    // 해당 서지를 인용/참조하는 사유 카드 또는 서지가 참조하는 사유 카드 탐색
    const linkedCoords: { x: number; y: number }[] = [];
    bCard.threads?.forEach((t) => {
      t.linkedTopicIds?.forEach((targetId) => {
        const targetNode = nodeLookup.get(targetId.trim().toLowerCase());
        if (targetNode) {
          linkedCoords.push({ x: targetNode.x, y: targetNode.y });
        }
      });
    });

    allCards.forEach((other) => {
      if (other.id === bCard.id) return;
      other.threads?.forEach((t) => {
        if (
          t.linkedTopicIds?.some(
            (id) =>
              id.trim().toLowerCase() === bCard.id.toLowerCase() ||
              id.trim().toLowerCase() === bCard.callNumber.toLowerCase()
          )
        ) {
          const oNode = nodeLookup.get(other.id.toLowerCase());
          if (oNode) {
            linkedCoords.push({ x: oNode.x, y: oNode.y });
          }
        }
      });
    });

    let bx: number;
    let by: number;

    if (linkedCoords.length > 0) {
      // 연관 사유 노드들의 중심에서 바깥쪽으로 충분히 떨어진 외곽에 배치
      const avgX = linkedCoords.reduce((acc, c) => acc + c.x, 0) / linkedCoords.length;
      const avgY = linkedCoords.reduce((acc, c) => acc + c.y, 0) / linkedCoords.length;

      // 중심점(centerX, centerY)에서 avgX, avgY로 향하는 방사형 벡터
      const vdx = avgX - centerX;
      const vdy = avgY - centerY;
      const vLen = Math.sqrt(vdx * vdx + vdy * vdy) || 1;
      const udx = vdx / vLen;
      const udy = vdy / vLen;

      // 외곽으로 65~100px 밀어내고 약간의 수직 섭동(불규칙성) 부여
      const outDist = 70 + (bIdx % 4) * 12;
      const jitterAngle = ((bIdx % 5) - 2) * 0.25;
      const cosJ = Math.cos(jitterAngle);
      const sinJ = Math.sin(jitterAngle);
      const jdx = udx * cosJ - udy * sinJ;
      const jdy = udx * sinJ + udy * cosJ;

      bx = Math.round(avgX + outDist * jdx);
      by = Math.round(avgY + outDist * jdy);
    } else {
      // 독립 서지: 성간 외곽 타원 궤도 상에 불규칙 흩뿌림
      const outAngle = (bIdx / Math.max(bookCards.length, 1)) * 2 * Math.PI + 0.35;
      const rxOut = 380 + (bIdx % 3) * 18;
      const ryOut = 240 + (bIdx % 4) * 15;
      bx = Math.round(centerX + rxOut * Math.cos(outAngle));
      by = Math.round(centerY + ryOut * Math.sin(outAngle));
    }

    return {
      id: bCard.id,
      callNumber: bCard.callNumber,
      depth: 0,
      x: bx,
      y: by,
      isCurrent,
      isBook: true,
    };
  });

  const allRawNodes: OverviewNode[] = [...ideaNodes, ...bookNodes];

  // 7. 캔버스 테두리 안전 여백 클램프
  const margin = 28;
  const nodes: OverviewNode[] = allRawNodes.map((n) => ({
    ...n,
    x: Math.max(margin, Math.min(canvasWidth - margin, n.x)),
    y: Math.max(margin, Math.min(canvasHeight - margin, n.y)),
  }));

  const finalNodeMap = new Map<string, OverviewNode>();
  nodes.forEach((n) => finalNodeMap.set(n.callNumber, n));

  // 8. 동일 성운 내 부모-자식 별자리 터널(실선) 연결
  const tunnels: OverviewTunnel[] = [];
  nodes.forEach((childNode) => {
    if (childNode.isBook) return;
    const parentCall = getParentCallNumber(childNode.callNumber);
    if (parentCall) {
      const parentNode = finalNodeMap.get(parentCall);
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

  // 9. 성간 항로: 서지-사유 인용선 및 사유-사유 연계 카드(백링크) 점선 연결
  const references: OverviewTunnel[] = [];
  const addedRefKeys = new Set<string>();

  const fullLookup = new Map<string, OverviewNode>();
  nodes.forEach((n) => {
    fullLookup.set(n.id.toLowerCase(), n);
    fullLookup.set(n.callNumber.toLowerCase(), n);
  });

  allCards.forEach((sourceCard) => {
    const sourceNode =
      fullLookup.get(sourceCard.id.toLowerCase()) ||
      fullLookup.get(sourceCard.callNumber.toLowerCase());
    if (!sourceNode) return;

    sourceCard.threads?.forEach((thread) => {
      thread.linkedTopicIds?.forEach((targetIdentifier) => {
        const cleanTarget = targetIdentifier.trim().toLowerCase();
        const targetNode = fullLookup.get(cleanTarget);
        if (targetNode && targetNode.id !== sourceNode.id) {
          const refKey = `${sourceNode.id}->${targetNode.id}`;
          if (!addedRefKeys.has(refKey)) {
            addedRefKeys.add(refKey);
            references.push({
              x1: sourceNode.x,
              y1: sourceNode.y,
              x2: targetNode.x,
              y2: targetNode.y,
            });
          }
        }
      });
    });
  });

  const currentDepth = cardDepthMap.get(currentCard.id) ?? 0;

  return {
    totalNotes: allCards.length,
    nodes,
    clusters,
    tunnels,
    references,
    currentDepth,
    maxDepth,
    canvasWidth,
    canvasHeight,
  };
}
