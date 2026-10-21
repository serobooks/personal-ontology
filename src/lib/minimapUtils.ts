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

export interface NebulaEnvelope {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

export interface OverviewNebula {
  majorCode: string;
  cx: number;
  cy: number;
  envelope: NebulaEnvelope;
  labelX?: number;
  labelY?: number;
}

export interface OverviewTunnel {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isBranch?: boolean;
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
 * 청구기호의 대주제 번호(예: '501', '211')로부터 백의 자리 대분과 코드(예: '500', '200')를 산출합니다.
 */
export function getCenturyCode(majorCode: string): string {
  if (!majorCode) return '000';
  const firstChar = majorCode.trim().charAt(0);
  if (/^\d$/.test(firstChar)) {
    return `${firstChar}00`;
  }
  return majorCode;
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

  if (/\d+$/.test(branch)) {
    const parentBranch = branch.replace(/\d+$/, '');
    if (!parentBranch) {
      return majorCode;
    }
    return `${majorCode}-${parentBranch}`;
  }

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
 * DB의 모든 메모를 백의 자리(100, 200, 500, 600 등) 대성운(Nebulae)으로 매핑합니다.
 * - 백의 자리 대분과 기준으로 성운을 크게 묶어, 501과 502 등이 하나의 웅장한 [500] 성운 안에 포진
 * - 각 대성운은 실제 소속 사유 노드들을 타이트하게 감싸는 맞춤형 캡슐(Envelope)을 가짐
 * - 사유 노트: 성운 안에서 부모-자식 관계에 따라 별자리처럼 실선(tunnels)으로 연결
 * - 서지 노트: 대성운 군집 외곽에 불규칙 흩뿌려지며, 연관 사유 노트와 점선(references)으로 연결
 * - 압축된 광역 캔버스(760x480): 여유 있는 성간 거리를 유지하되 뷰포트 패닝 시 휑하지 않고 밀도 높은 탐색 경험 제공
 */
export function getLibraryOverviewMapData(
  currentCard: TopicCard,
  allCards: TopicCard[]
): LibraryOverviewMapData {
  const canvasWidth = 760;
  const canvasHeight = 480;
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

  // 3. 백의 자리 기준 대성운 코드 고유 목록 및 깊이(depth) 계산
  const centuryCodes = Array.from(
    new Set(ideaCards.map((c) => getCenturyCode(parseCallNumber(c.callNumber).majorCode)))
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

  // 4. 백의 자리 대성운 중심 좌표 산출 (중앙 공간 활용 및 상호 겹침 방지)
  const clusterCenterMap = new Map<string, { cx: number; cy: number }>();

  const numClusters = centuryCodes.length;
  centuryCodes.forEach((code, idx) => {
    let cx = centerX;
    let cy = centerY;

    if (numClusters === 1) {
      cx = centerX;
      cy = centerY;
    } else if (numClusters === 2) {
      cx = idx === 0 ? Math.round(centerX - 130) : Math.round(centerX + 130);
      cy = centerY;
    } else if (numClusters === 3) {
      const positions = [
        { cx: Math.round(centerX - 120), cy: Math.round(centerY - 75) },
        { cx: Math.round(centerX + 120), cy: Math.round(centerY - 75) },
        { cx: centerX, cy: Math.round(centerY + 85) },
      ];
      cx = positions[idx].cx;
      cy = positions[idx].cy;
    } else if (numClusters === 4) {
      const positions = [
        { cx: Math.round(centerX - 130), cy: Math.round(centerY - 75) },
        { cx: Math.round(centerX + 130), cy: Math.round(centerY - 75) },
        { cx: Math.round(centerX - 130), cy: Math.round(centerY + 75) },
        { cx: Math.round(centerX + 130), cy: Math.round(centerY + 75) },
      ];
      cx = positions[idx].cx;
      cy = positions[idx].cy;
    } else if (numClusters === 5) {
      // 5개: 중앙(centerX, centerY)의 여유 공간을 적극 활용하여 상호 140px 이상 거리 확보
      const positions = [
        { cx: Math.round(centerX - 140), cy: Math.round(centerY - 80) }, // 좌상
        { cx: Math.round(centerX + 140), cy: Math.round(centerY - 80) }, // 우상
        { cx: centerX, cy: centerY },                                    // 중앙 성단 (중앙 공간 활용)
        { cx: Math.round(centerX - 140), cy: Math.round(centerY + 80) }, // 좌하
        { cx: Math.round(centerX + 140), cy: Math.round(centerY + 80) }, // 우하
      ];
      cx = positions[idx].cx;
      cy = positions[idx].cy;
    } else if (numClusters === 6) {
      // 6개: 2행 3열 그리드 분산
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      cx = Math.round(centerX + (col - 1) * 160);
      cy = Math.round(centerY + (row === 0 ? -75 : 75));
    } else {
      // 7개 이상: 중앙 1개 + 주변 분산 배치
      if (idx === 0) {
        cx = centerX;
        cy = centerY;
      } else {
        const angle = ((idx - 1) / (numClusters - 1)) * 2 * Math.PI - Math.PI / 2;
        const rx = 180;
        const ry = 110;
        cx = Math.round(centerX + rx * Math.cos(angle));
        cy = Math.round(centerY + ry * Math.sin(angle));
      }
    }

    clusterCenterMap.set(code, { cx, cy });
  });

  // 5. 각 대성운 내 사유 노드 레이아웃 산출 (백의 자리 단위로 묶음)
  const ideaNodes: OverviewNode[] = [];
  const cardsByCentury = new Map<string, TopicCard[]>();
  centuryCodes.forEach((code) => cardsByCentury.set(code, []));
  ideaCards.forEach((c) => {
    const centuryCode = getCenturyCode(parseCallNumber(c.callNumber).majorCode);
    if (!cardsByCentury.has(centuryCode)) {
      cardsByCentury.set(centuryCode, []);
    }
    cardsByCentury.get(centuryCode)!.push(c);
  });

  interface InternalTreeNode {
    card: TopicCard;
    children: InternalTreeNode[];
    depth: number;
    angle: number;
    x: number;
    y: number;
  }

  centuryCodes.forEach((centuryCode) => {
    const mCards = cardsByCentury.get(centuryCode) || [];
    if (mCards.length === 0) return;

    const center = clusterCenterMap.get(centuryCode) || { cx: centerX, cy: centerY };

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
        // 조밀한 별자리 응집도: 노드 간격이 과도하게 멀어지지 않도록 축소
        const dist = 10 + n.depth * 13;
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

  // 6. 각 백의 자리 대성운별 맞춤형 캡슐(Envelope) 및 레이블 산출
  const clusters: OverviewNebula[] = [];
  centuryCodes.forEach((centuryCode) => {
    const center = clusterCenterMap.get(centuryCode) || { cx: centerX, cy: centerY };
    const memberNodes = ideaNodes.filter(
      (n) => getCenturyCode(parseCallNumber(n.callNumber).majorCode) === centuryCode
    );

    let envelope: NebulaEnvelope;
    if (memberNodes.length === 0) {
      envelope = {
        x: center.cx - 16,
        y: center.cy - 16,
        width: 32,
        height: 32,
        rx: 16,
      };
    } else if (memberNodes.length === 1) {
      const n = memberNodes[0];
      envelope = {
        x: n.x - 16,
        y: n.y - 16,
        width: 32,
        height: 32,
        rx: 16,
      };
    } else {
      const xs = memberNodes.map((n) => n.x);
      const ys = memberNodes.map((n) => n.y);
      const pad = 14;
      const minX = Math.min(...xs) - pad;
      const maxX = Math.max(...xs) + pad;
      const minY = Math.min(...ys) - pad;
      const maxY = Math.max(...ys) + pad;
      const width = maxX - minX;
      const height = maxY - minY;
      const rx = Math.min(14, Math.round(width / 2), Math.round(height / 2));

      envelope = {
        x: minX,
        y: minY,
        width,
        height,
        rx,
      };
    }

    const labelX = envelope.x + 6;
    // 캔버스 상단 여백에 따라 캡슐 외곽 또는 내부 상단으로 배치
    const labelY = envelope.y > 18 ? envelope.y - 4 : envelope.y + 11;

    clusters.push({
      majorCode: centuryCode,
      cx: center.cx,
      cy: center.cy,
      envelope,
      labelX,
      labelY,
    });
  });

  // 7. 서지 카드 노드 레이아웃 산출 (태양계 외곽 불규칙 흩뿌림)
  const nodeLookup = new Map<string, OverviewNode>();
  ideaNodes.forEach((n) => {
    nodeLookup.set(n.id.toLowerCase(), n);
    nodeLookup.set(n.callNumber.toLowerCase(), n);
  });

  const bookNodes: OverviewNode[] = bookCards.map((bCard, bIdx) => {
    const isCurrent = bCard.id === currentCard.id || bCard.callNumber === currentCard.callNumber;

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
      const avgX = linkedCoords.reduce((acc, c) => acc + c.x, 0) / linkedCoords.length;
      const avgY = linkedCoords.reduce((acc, c) => acc + c.y, 0) / linkedCoords.length;

      const vdx = avgX - centerX;
      const vdy = avgY - centerY;
      const vLen = Math.sqrt(vdx * vdx + vdy * vdy) || 1;
      const udx = vdx / vLen;
      const udy = vdy / vLen;

      // 성단 외곽 적정 거리로 배치 (너무 멀리 동떨어지지 않도록 축소)
      const outDist = 28 + (bIdx % 4) * 6;
      const jitterAngle = ((bIdx % 5) - 2) * 0.22;
      const cosJ = Math.cos(jitterAngle);
      const sinJ = Math.sin(jitterAngle);
      const jdx = udx * cosJ - udy * sinJ;
      const jdy = udx * sinJ + udy * cosJ;

      bx = Math.round(avgX + outDist * jdx);
      by = Math.round(avgY + outDist * jdy);
    } else {
      const outAngle = (bIdx / Math.max(bookCards.length, 1)) * 2 * Math.PI + 0.35;
      const rxOut = 220 + (bIdx % 3) * 12;
      const ryOut = 140 + (bIdx % 4) * 10;
      bx = Math.round(centerX + rxOut * Math.cos(outAngle));
      by = Math.round(centerY + ryOut * Math.sin(outAngle));
    }

    // 서지 노드가 대주제 숫자 레이블([200], [500] 등) 텍스트와 겹치지 않도록 회피
    clusters.forEach((cls) => {
      const lx = cls.labelX ?? cls.envelope.x + 6;
      const ly = cls.labelY ?? cls.envelope.y - 4;
      const labelCenterX = lx + 15;
      const labelCenterY = ly - 4;
      const dx = bx - labelCenterX;
      const dy = by - labelCenterY;
      if (Math.abs(dx) < 26 && Math.abs(dy) < 16) {
        // 레이블과 겹치면 상단 또는 안전한 방향으로 밀어냄
        if (dy < 0) {
          by = labelCenterY - 18;
        } else {
          by = labelCenterY + 18;
        }
      }
    });

    // 서지 노드는 어떤 대주제 성운 캡슐(envelope)의 틀 안에도 들어가지 않고 반드시 바깥에 배치
    clusters.forEach((cls) => {
      const env = cls.envelope;
      const pad = 14;
      const left = env.x - pad;
      const right = env.x + env.width + pad;
      const top = env.y - pad;
      const bottom = env.y + env.height + pad;

      if (bx >= left && bx <= right && by >= top && by <= bottom) {
        // 캡슐 영역 내부에 위치하면 가장 가까운 바깥쪽으로 밀어냄
        const distToLeft = Math.abs(bx - left);
        const distToRight = Math.abs(right - bx);
        const distToTop = Math.abs(by - top);
        const distToBottom = Math.abs(bottom - by);
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

        if (minDist === distToLeft) {
          bx = left - 6;
        } else if (minDist === distToRight) {
          bx = right + 6;
        } else if (minDist === distToTop) {
          by = top - 6;
        } else {
          by = bottom + 6;
        }
      }
    });

    // 기존 사유 노드들과 너무 가깝지 않도록 최소 16px 안전거리 확보
    ideaNodes.forEach((iNode) => {
      const dx = bx - iNode.x;
      const dy = by - iNode.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 16 && dist > 0) {
        bx = Math.round(iNode.x + (dx / dist) * 18);
        by = Math.round(iNode.y + (dy / dist) * 18);
      }
    });

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

  // 8. 캔버스 테두리 안전 여백 클램프
  const margin = 20;
  const nodes: OverviewNode[] = allRawNodes.map((n) => ({
    ...n,
    x: Math.max(margin, Math.min(canvasWidth - margin, n.x)),
    y: Math.max(margin, Math.min(canvasHeight - margin, n.y)),
  }));

  const finalNodeMap = new Map<string, OverviewNode>();
  nodes.forEach((n) => finalNodeMap.set(n.callNumber, n));

  // 9. 동일 성운 내 부모-자식 별자리 터널(실선) 연결
  const tunnels: OverviewTunnel[] = [];

  // 각 부모별 직속 자식 수 집계 (직렬 심화 vs 형제 분기 구분)
  const parentToChildrenCount = new Map<string, number>();
  nodes.forEach((childNode) => {
    if (childNode.isBook) return;
    const parentCall = getParentCallNumber(childNode.callNumber);
    if (parentCall) {
      parentToChildrenCount.set(parentCall, (parentToChildrenCount.get(parentCall) || 0) + 1);
    }
  });

  nodes.forEach((childNode) => {
    if (childNode.isBook) return;
    const parentCall = getParentCallNumber(childNode.callNumber);
    if (parentCall) {
      const parentNode = finalNodeMap.get(parentCall);
      if (parentNode) {
        const isBranch = (parentToChildrenCount.get(parentCall) || 0) >= 2;
        tunnels.push({
          x1: parentNode.x,
          y1: parentNode.y,
          x2: childNode.x,
          y2: childNode.y,
          isBranch,
        });
      }
    }
  });

  // 10. 성간 항로: 서지-사유 인용선 및 사유-사유 연계 카드(백링크) 점선 연결
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
