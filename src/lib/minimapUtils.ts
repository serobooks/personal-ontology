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
  references: OverviewTunnel[];
  currentDepth: number;
  maxDepth: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * 3자리 십진분류 코드(100~600)의 내재적 계층 깊이를 산출합니다.
 * - 200: 대분과 (0단계, 1층)
 * - 210: 중분과 (1단계, 2층)
 * - 211: 소분과/특정 작품 (2단계, 3층)
 */
export function getMajorCodeDepth(majorCode: string): number {
  if (!/^\d{3}$/.test(majorCode)) return 0;
  if (majorCode.endsWith('00')) return 0;
  if (majorCode.endsWith('0')) return 1;
  return 2;
}

/**
 * 청구기호 문자열로부터 직속 상위(부모) 청구기호를 추출합니다.
 * - 규칙: 모든 청구기호는 반드시 숫자로 끝나며, 하이픈(-) 뒤의 자식 노드는 [알파벳 1자리 + 숫자 1자리 이상]을 한 묶음으로 취급합니다.
 * - 하이픈 뒤에 붙는 마지막 [영문자 1자리 + 숫자 1자리 이상] 패턴(/[a-zA-Z]\d+$/)을 잘라낸 앞부분 문자열을 부모 ID로 반환합니다.
 * - 잘라낸 앞부분이 하이픈으로 끝나면(예: '501-a4' -> '501-'), 최상위 루트 노드로 간주하여 부모가 없습니다(null).
 * - 예:
 *   501-a4 -> null (최상위 루트 노드)
 *   501-a4a1 -> '501-a4'
 *   501-a4a2 -> '501-a4'
 *   501-a4a3 -> '501-a4'
 *   501-a4a1b1 -> '501-a4a1'
 */
export function getParentCallNumber(callNumber: string): string | null {
  if (!callNumber) return null;

  const trimmed = callNumber.trim();
  const { majorCode, branch } = parseCallNumber(trimmed);
  if (!branch) return null;

  // 숫자가 아닌 대주제(예: 'B-1')는 부모 계층 연결을 두지 않음
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
 * DB에 담긴 모든 메모를 매핑하여 가로 확장형 '서고 전체도' 데이터를 산출합니다.
 * - 100~600번대 사유 카드: 십진분류 자릿수(200=1층, 210=2층, 211=3층)와 사유 가지치기에 따라 오른쪽(X축)으로 확장
 * - B- 서지 카드: 사유 트리 하단에 가로 5열 책장 격자(Bookshelf Grid)로 단정하게 바둑판식 배열
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
      references: [],
      currentDepth: 0,
      maxDepth: 1,
      canvasWidth: 320,
      canvasHeight: 180,
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

  // 서지 카드는 기본 깊이 0
  bookCards.forEach((c) => {
    cardDepthMap.set(c.id, 0);
  });

  const maxDepth = Math.max(calculatedMaxDepth, 3);

  // 4. 사유 노드 레이아웃 산출 (부모 기준 수평 나뭇가지 정렬: Parent-anchored Tree)
  const xStep = 56;
  const startX = 24;
  const startY = 24;

  // 대주제별로 사유 카드 그룹화
  const cardsByMajor = new Map<string, TopicCard[]>();
  majorCodes.forEach((code) => cardsByMajor.set(code, []));
  ideaCards.forEach((c) => {
    const { majorCode } = parseCallNumber(c.callNumber);
    if (!cardsByMajor.has(majorCode)) {
      cardsByMajor.set(majorCode, []);
    }
    cardsByMajor.get(majorCode)!.push(c);
  });

  let currentGlobalY = startY;
  const ideaNodes: OverviewNode[] = [];
  const spinePairs: [string, string][] = [];

  majorCodes.forEach((majorCode) => {
    const mCards = cardsByMajor.get(majorCode) || [];
    if (mCards.length === 0) return;

    // 1) 대주제 내부 부모-자식 트리 구조화
    interface InternalTreeNode {
      card: TopicCard;
      children: InternalTreeNode[];
      y: number;
    }

    const treeNodeMap = new Map<string, InternalTreeNode>();
    mCards.forEach((card) => {
      treeNodeMap.set(card.callNumber, { card, children: [], y: 0 });
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

    // 2) 청구기호 순으로 정렬
    roots.sort((a, b) => compareCallNumbers(a.card.callNumber, b.card.callNumber));
    const sortChildren = (n: InternalTreeNode) => {
      n.children.sort((a, b) => compareCallNumbers(a.card.callNumber, b.card.callNumber));
      n.children.forEach(sortChildren);
    };
    roots.forEach(sortChildren);

    // 동일 대주제 내 복수 최상위 형제 노드들 간 수직 척추선(Spine line) 연결 대상 수집
    if (roots.length > 1) {
      for (let i = 0; i < roots.length - 1; i++) {
        spinePairs.push([roots[i].card.callNumber, roots[i + 1].card.callNumber]);
      }
    }

    // 3) 부모 기준 Y좌표 할당 (자식들의 정중앙에 부모가 위치하도록 배치)
    const slotStep = 18;
    const assignY = (n: InternalTreeNode) => {
      if (n.children.length === 0) {
        n.y = currentGlobalY;
        currentGlobalY += slotStep;
      } else {
        n.children.forEach(assignY);
        const firstChildY = n.children[0].y;
        const lastChildY = n.children[n.children.length - 1].y;
        n.y = Math.round((firstChildY + lastChildY) / 2);
      }
    };

    roots.forEach((root) => {
      assignY(root);
      currentGlobalY += 8; // 서브트리 간 구분 여백
    });

    currentGlobalY += 12; // 대주제 간 여백

    // 4) OverviewNode 배열에 추가
    treeNodeMap.forEach((tNode) => {
      const card = tNode.card;
      const depth = cardDepthMap.get(card.id) ?? 0;
      const x = Math.round(startX + depth * xStep);
      const isCurrent = card.id === currentCard.id || card.callNumber === currentCard.callNumber;

      ideaNodes.push({
        id: card.id,
        callNumber: card.callNumber,
        depth,
        x,
        y: tNode.y,
        isCurrent,
        isBook: false,
      });
    });
  });

  // 사유 카드 영역의 최대 Y 좌표 계산
  const maxIdeaY = ideaNodes.length > 0
    ? Math.max(...ideaNodes.map((n) => n.y))
    : startY;

  // 5. 서지 카드 노드 레이아웃 산출 (하단 5열 책장 격자 영역)
  const bStartY = ideaCards.length > 0 ? maxIdeaY + 36 : startY;

  const bookNodes: OverviewNode[] = bookCards.map((card, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    const x = startX + col * 18; // 18px 간격의 조밀한 책장 그리드
    const y = bStartY + row * 16; // 16px 단 간격
    const isCurrent = card.id === currentCard.id || card.callNumber === currentCard.callNumber;

    return {
      id: card.id,
      callNumber: card.callNumber,
      depth: 0,
      x,
      y,
      isCurrent,
      isBook: true,
    };
  });

  const nodes: OverviewNode[] = [...ideaNodes, ...bookNodes];

  // 6. 노드 간 부모-자식 연결선(터널) 생성
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

  // 동일 대주제 최상위 형제 노드 간 수직 척추선(Spine line) 추가
  spinePairs.forEach(([call1, call2]) => {
    const node1 = nodeMap.get(call1);
    const node2 = nodeMap.get(call2);
    if (node1 && node2) {
      tunnels.push({
        x1: node1.x,
        y1: node1.y,
        x2: node2.x,
        y2: node2.y,
      });
    }
  });

  // 7. 연계 카드(인용/참조) 연결선 생성
  const references: OverviewTunnel[] = [];
  const addedRefKeys = new Set<string>();

  // ID 및 청구기호로 노드를 찾을 수 있는 룩업 맵 구축
  const nodeLookup = new Map<string, OverviewNode>();
  nodes.forEach((n) => {
    nodeLookup.set(n.id.toLowerCase(), n);
    nodeLookup.set(n.callNumber.toLowerCase(), n);
  });

  allCards.forEach((sourceCard) => {
    const sourceNode =
      nodeLookup.get(sourceCard.id.toLowerCase()) ||
      nodeLookup.get(sourceCard.callNumber.toLowerCase());
    if (!sourceNode) return;

    sourceCard.threads?.forEach((thread) => {
      thread.linkedTopicIds?.forEach((targetIdentifier) => {
        const cleanTarget = targetIdentifier.trim().toLowerCase();
        const targetNode = nodeLookup.get(cleanTarget);
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

  // 8. 가로 전개형 캔버스 규격 산출
  const maxNodeX = nodes.length > 0 ? Math.max(...nodes.map((n) => n.x)) : 0;
  const maxNodeY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.y)) : 0;

  const canvasWidth = Math.max(340, startX + (maxDepth + 1) * xStep + 24, maxNodeX + 32);
  const canvasHeight = Math.max(180, maxNodeY + 24);

  const currentDepth = cardDepthMap.get(currentCard.id) ?? 0;

  return {
    totalNotes: allCards.length,
    nodes,
    tunnels,
    references,
    currentDepth,
    maxDepth,
    canvasWidth,
    canvasHeight,
  };
}
