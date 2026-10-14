import { describe, it, expect } from 'vitest';
import { getParentCallNumber, getLibraryOverviewMapData } from './minimapUtils';
import { mockCards } from '@/data/mockCards';
import { TopicCard } from '@/types/catalog';

describe('minimapUtils 서고 전체도 가로 확장형 유틸 검증', () => {
  it('루만식 교대 청구기호 체계(숫자 ➔ 영문 ➔ 숫자 ➔ 영문)에 따라 부모 청구기호를 올바르게 추출해야 한다', () => {
    // 1) 단독 십진분류 카드 및 서지 카드는 부모 없음
    expect(getParentCallNumber('501')).toBeNull();
    expect(getParentCallNumber('211')).toBeNull();
    expect(getParentCallNumber('B-1')).toBeNull();
    expect(getParentCallNumber('B-2')).toBeNull();

    // 2) 하이픈 뒤 첫 번째 숫자/기호 -> 부모는 대주제 번호
    expect(getParentCallNumber('501-1')).toBe('501');
    expect(getParentCallNumber('501-2')).toBe('501');
    expect(getParentCallNumber('501-3')).toBe('501');
    expect(getParentCallNumber('501-4')).toBe('501');
    expect(getParentCallNumber('211-1')).toBe('211');

    // 3) 숫자가 두 자리 이상인 경우에도 올바르게 부모 추출
    expect(getParentCallNumber('501-12')).toBe('501');
    expect(getParentCallNumber('501-100')).toBe('501');

    // 4) 영문이 붙은 자식 노드 -> 끝의 영문자 제거
    expect(getParentCallNumber('501-1a')).toBe('501-1');
    expect(getParentCallNumber('501-1b')).toBe('501-1');
    expect(getParentCallNumber('501-4a')).toBe('501-4');
    expect(getParentCallNumber('501-3a')).toBe('501-3');
    expect(getParentCallNumber('301-1a')).toBe('301-1');

    // 5) 영문 뒤에 숫자가 붙은 자식의 자식 노드 -> 끝의 숫자 제거
    expect(getParentCallNumber('501-3a1')).toBe('501-3a');
    expect(getParentCallNumber('501-4a1')).toBe('501-4a');
    expect(getParentCallNumber('501-4a12')).toBe('501-4a');

    // 6) 5단계 직렬 심화 체인 (사용자 실제 데이터)
    expect(getParentCallNumber('501-4a1a')).toBe('501-4a1');
    expect(getParentCallNumber('501-4a1a1')).toBe('501-4a1a');

    // 7) 기존 영문 시작 레거시 호환
    expect(getParentCallNumber('101-a')).toBe('101');
    expect(getParentCallNumber('101-a1')).toBe('101-a');
  });

  it('동일 계층 자식 카드(4a1, 4a2, 4a3)는 동일한 깊이(X좌표)를 가지며 부모(501-4a)와 터널로 연결되어야 한다', () => {
    const sampleCards: TopicCard[] = [
      {
        id: 'c-root',
        callNumber: '501-4a',
        topic: 'AI 팔로워',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't1', date: '2026-09-22', stampType: 'ESTABLISHED', note: '루트' }],
        tags: [],
      },
      {
        id: 'c-child-1',
        callNumber: '501-4a1',
        topic: 'AI 팔로워 1쪽',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't2', date: '2026-09-22', stampType: 'UNFINISHED', note: '1쪽' }],
        tags: [],
      },
      {
        id: 'c-child-2',
        callNumber: '501-4a2',
        topic: 'AI 팔로워 2쪽',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't3', date: '2026-09-22', stampType: 'UNFINISHED', note: '2쪽' }],
        tags: [],
      },
      {
        id: 'c-child-3',
        callNumber: '501-4a3',
        topic: 'AI 팔로워 3쪽',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't4', date: '2026-09-22', stampType: 'UNFINISHED', note: '3쪽' }],
        tags: [],
      },
      {
        id: 'c-subchild-1',
        callNumber: '501-4a1a',
        topic: 'AI 팔로워 1쪽의 a 가지',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't5', date: '2026-09-22', stampType: 'UNFINISHED', note: '하위 가지' }],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(sampleCards[0], sampleCards);

    const rootNode = mapData.nodes.find((n) => n.callNumber === '501-4a')!;
    const c1Node = mapData.nodes.find((n) => n.callNumber === '501-4a1')!;
    const c2Node = mapData.nodes.find((n) => n.callNumber === '501-4a2')!;
    const c3Node = mapData.nodes.find((n) => n.callNumber === '501-4a3')!;
    const subNode = mapData.nodes.find((n) => n.callNumber === '501-4a1a')!;

    expect(rootNode).toBeDefined();
    expect(c1Node).toBeDefined();
    expect(c2Node).toBeDefined();
    expect(c3Node).toBeDefined();
    expect(subNode).toBeDefined();

    // c1, c2, c3는 동일한 깊이(depth)와 동일한 X좌표를 가져야 함
    expect(c1Node.depth).toBe(c2Node.depth);
    expect(c2Node.depth).toBe(c3Node.depth);
    expect(c1Node.x).toBe(c2Node.x);
    expect(c2Node.x).toBe(c3Node.x);

    // 자식 노드는 루트 노드보다 오른쪽(X좌표 증가)에 위치해야 함
    expect(c1Node.x).toBeGreaterThan(rootNode.x);

    // 더 깊은 하위 노드는 c1보다 오른쪽에 위치해야 함
    expect(subNode.x).toBeGreaterThan(c1Node.x);

    // 부모(501-4a)와 자식들(c1, c2, c3) 간의 연결선이 생성되어 있어야 함
    const rootTunnels = mapData.tunnels.filter(
      (t) => t.x1 === rootNode.x && t.y1 === rootNode.y
    );
    expect(rootTunnels.length).toBe(3);

    // c1과 subNode 간의 연결선이 존재해야 함
    const subTunnel = mapData.tunnels.find(
      (t) => t.x1 === c1Node.x && t.y1 === c1Node.y && t.x2 === subNode.x && t.y2 === subNode.y
    );
    expect(subTunnel).toBeDefined();
  });

  it('루만식 직렬 심화 체인(501-4 -> 501-4a -> 501-4a1 -> 501-4a1a -> 501-4a1a1)은 한 줄로 깊어지며 각각 터널로 직렬 연결되어야 한다', () => {
    const chainCards: TopicCard[] = [
      {
        id: 'c-4',
        callNumber: '501-4',
        topic: 'AI 팔로워',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't1', date: '2026-09-22', stampType: 'ESTABLISHED', note: '기본 단상' }],
        tags: [],
      },
      {
        id: 'c-4a',
        callNumber: '501-4a',
        topic: 'AI 팔로워 심화 1',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't2', date: '2026-09-22', stampType: 'UNFINISHED', note: '심화 1' }],
        tags: [],
      },
      {
        id: 'c-4a1',
        callNumber: '501-4a1',
        topic: 'AI 팔로워 심화 2',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't3', date: '2026-09-22', stampType: 'UNFINISHED', note: '심화 2' }],
        tags: [],
      },
      {
        id: 'c-4a1a',
        callNumber: '501-4a1a',
        topic: 'AI 팔로워 심화 3',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't4', date: '2026-09-22', stampType: 'UNFINISHED', note: '심화 3' }],
        tags: [],
      },
      {
        id: 'c-4a1a1',
        callNumber: '501-4a1a1',
        topic: 'AI 팔로워 심화 4',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't5', date: '2026-09-22', stampType: 'UNFINISHED', note: '심화 4' }],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(chainCards[0], chainCards);

    const n4 = mapData.nodes.find((n) => n.callNumber === '501-4')!;
    const n4a = mapData.nodes.find((n) => n.callNumber === '501-4a')!;
    const n4a1 = mapData.nodes.find((n) => n.callNumber === '501-4a1')!;
    const n4a1a = mapData.nodes.find((n) => n.callNumber === '501-4a1a')!;
    const n4a1a1 = mapData.nodes.find((n) => n.callNumber === '501-4a1a1')!;

    // 1. 깊이가 차례대로 깊어져야 함
    expect(n4a.depth).toBeGreaterThan(n4.depth);
    expect(n4a1.depth).toBeGreaterThan(n4a.depth);
    expect(n4a1a.depth).toBeGreaterThan(n4a1.depth);
    expect(n4a1a1.depth).toBeGreaterThan(n4a1a.depth);

    // 2. X 좌표가 차례대로 오른쪽으로 나아가야 함
    expect(n4a.x).toBeGreaterThan(n4.x);
    expect(n4a1.x).toBeGreaterThan(n4a.x);
    expect(n4a1a.x).toBeGreaterThan(n4a1.x);
    expect(n4a1a1.x).toBeGreaterThan(n4a1a.x);

    // 3. 자식이 1개씩 직렬로 붙었으므로 모두 같은 높이(수평선)에 일렬 배치되어야 함
    expect(n4a.y).toBe(n4.y);
    expect(n4a1.y).toBe(n4a.y);
    expect(n4a1a.y).toBe(n4a1.y);
    expect(n4a1a1.y).toBe(n4a1a.y);

    // 4. 터널이 직렬로 4개 연결되어야 함 (4 -> 4a -> 4a1 -> 4a1a -> 4a1a1)
    expect(mapData.tunnels.length).toBe(4);
  });

  it('메모가 늘어날수록 오른쪽(X축 증가)으로 뻗어나가는 가로형 전체도 데이터를 생성해야 한다', () => {
    const currentCard = mockCards.find((c) => c.callNumber === '101-a1') || mockCards[0];
    const mapData = getLibraryOverviewMapData(currentCard, mockCards);

    // 1. 모든 메모가 노드로 포함되어야 함
    expect(mapData.totalNotes).toBe(mockCards.length);
    expect(mapData.nodes.length).toBe(mockCards.length);

    // 2. 현재 카드 노드는 isCurrent가 true여야 함
    const currentNode = mapData.nodes.find((n) => n.id === currentCard.id);
    expect(currentNode).toBeDefined();
    expect(currentNode?.isCurrent).toBe(true);

    // 3. 깊이가 깊어질수록 X 좌표가 오른쪽으로 증가해야 함 (가로 전개형 구조)
    const rootNode = mapData.nodes.find((n) => n.callNumber === '101');
    const branch1Node = mapData.nodes.find((n) => n.callNumber === '101-a');
    const branch2Node = mapData.nodes.find((n) => n.callNumber === '101-a1');

    expect(rootNode).toBeDefined();
    expect(branch1Node).toBeDefined();
    expect(branch2Node).toBeDefined();

    if (rootNode && branch1Node && branch2Node) {
      expect(branch1Node.x).toBeGreaterThan(rootNode.x);
      expect(branch2Node.x).toBeGreaterThan(rootNode.x);
    }

    // 4. 연결선(tunnels)이 생성되어 있어야 함
    expect(mapData.tunnels.length).toBeGreaterThan(0);
  });

  it('십진분류 번호(200 -> 210 -> 211)와 사유 가지치기에 따른 계층 깊이를 올바르게 계산해야 한다', () => {
    const classificationCards: TopicCard[] = [
      {
        id: 'c-200',
        callNumber: '200',
        topic: '서사와 창작',
        author: '사서',
        classification: '200 서사와 창작',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't-200', date: '2026-09-22', stampType: 'ESTABLISHED', note: '대분과' }],
        tags: [],
      },
      {
        id: 'c-210',
        callNumber: '210',
        topic: '소설',
        author: '사서',
        classification: '200 서사와 창작',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't-210', date: '2026-09-22', stampType: 'ESTABLISHED', note: '중분과' }],
        tags: [],
      },
      {
        id: 'c-211',
        callNumber: '211',
        topic: '고양이 목에 크로커스',
        author: '사서',
        classification: '200 서사와 창작',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't-211', date: '2026-09-22', stampType: 'ESTABLISHED', note: '작품' }],
        tags: [],
      },
      {
        id: 'c-211-1',
        callNumber: '211-1',
        topic: '고양이 목에 크로커스 - 1 사유',
        author: '사서',
        classification: '200 서사와 창작',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't-2111', date: '2026-09-22', stampType: 'ESTABLISHED', note: '사유 1계통' }],
        tags: [],
      },
      {
        id: 'c-211-1a',
        callNumber: '211-1a',
        topic: '고양이 목에 크로커스 - 1a 심화',
        author: '사서',
        classification: '200 서사와 창작',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't-2111a', date: '2026-09-22', stampType: 'ESTABLISHED', note: '심화' }],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(classificationCards[0], classificationCards);

    const n200 = mapData.nodes.find((n) => n.callNumber === '200')!;
    const n210 = mapData.nodes.find((n) => n.callNumber === '210')!;
    const n211 = mapData.nodes.find((n) => n.callNumber === '211')!;
    const n2111 = mapData.nodes.find((n) => n.callNumber === '211-1')!;
    const n2111a = mapData.nodes.find((n) => n.callNumber === '211-1a')!;

    // 200(1층: depth 0) -> 210(2층: depth 1) -> 211(3층: depth 2)
    expect(n200.depth).toBe(0);
    expect(n210.depth).toBe(1);
    expect(n211.depth).toBe(2);

    // 211-1(4층: depth 3) -> 211-1a(5층: depth 4)
    expect(n2111.depth).toBe(3);
    expect(n2111a.depth).toBe(4);

    // X좌표가 계층 순서대로 오른쪽으로 전개되어야 함
    expect(n210.x).toBeGreaterThan(n200.x);
    expect(n211.x).toBeGreaterThan(n210.x);
    expect(n2111.x).toBeGreaterThan(n211.x);
    expect(n2111a.x).toBeGreaterThan(n2111.x);
  });

  it('B- 서지 카드는 가로 5열 책장 격자(Bookshelf Grid)로 단정하게 배치되고 isBook 플래그를 가져야 한다', () => {
    // 12권의 B- 서지 카드 생성
    const bookCards: TopicCard[] = Array.from({ length: 12 }, (_, i) => ({
      id: `book-${i + 1}`,
      callNumber: `B-${i + 1}`,
      topic: `도서 ${i + 1}`,
      author: '저자',
      classification: 'B- 서지 서가',
      acquisitionDate: '2026-09-22',
      summary: '',
      threads: [{ id: `tb-${i + 1}`, date: '2026-09-22', stampType: 'QUOTATION', note: '본문' }],
      tags: [],
    }));

    const mapData = getLibraryOverviewMapData(bookCards[0], bookCards);

    // 1. 모든 B- 노드는 isBook이 true여야 함
    expect(mapData.nodes.every((n) => n.isBook === true)).toBe(true);

    // 2. 가로 5개씩 줄바꿈 검증
    const b1 = mapData.nodes.find((n) => n.callNumber === 'B-1')!;
    const b2 = mapData.nodes.find((n) => n.callNumber === 'B-2')!;
    const b5 = mapData.nodes.find((n) => n.callNumber === 'B-5')!;
    const b6 = mapData.nodes.find((n) => n.callNumber === 'B-6')!;
    const b11 = mapData.nodes.find((n) => n.callNumber === 'B-11')!;

    // 1열~5열은 동일한 Y 좌표 (1단 서가)
    expect(b1.y).toBe(b2.y);
    expect(b1.y).toBe(b5.y);
    expect(b2.x).toBeGreaterThan(b1.x);

    // 6번째 책(B-6)은 1번째 책과 동일한 X 좌표(col 0), 아랫줄 Y 좌표 (2단 서가)
    expect(b6.x).toBe(b1.x);
    expect(b6.y).toBeGreaterThan(b1.y);

    // 11번째 책(B-11)은 3단 서가 (col 0, Y 좌표 증가)
    expect(b11.x).toBe(b1.x);
    expect(b11.y).toBeGreaterThan(b6.y);
  });

  it('서로 다른 부모를 가진 자식 노드들은 각자의 부모 Y좌표 주위에 정렬되어 선이 교차하지 않아야 한다', () => {
    const multiBranchCards: TopicCard[] = [
      // 부모 A와 자식 2개
      {
        id: 'c-1a',
        callNumber: '501-1a',
        topic: '부모 A',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't1', date: '2026-09-22', stampType: 'ESTABLISHED', note: '부모 A' }],
        tags: [],
      },
      {
        id: 'c-1a1',
        callNumber: '501-1a1',
        topic: '자식 A-1',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't2', date: '2026-09-22', stampType: 'ESTABLISHED', note: '자식 A-1' }],
        tags: [],
      },
      {
        id: 'c-1a2',
        callNumber: '501-1a2',
        topic: '자식 A-2',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't3', date: '2026-09-22', stampType: 'ESTABLISHED', note: '자식 A-2' }],
        tags: [],
      },
      // 부모 B와 자식 2개
      {
        id: 'c-4a',
        callNumber: '501-4a',
        topic: '부모 B',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't4', date: '2026-09-22', stampType: 'ESTABLISHED', note: '부모 B' }],
        tags: [],
      },
      {
        id: 'c-4a1',
        callNumber: '501-4a1',
        topic: '자식 B-1',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't5', date: '2026-09-22', stampType: 'ESTABLISHED', note: '자식 B-1' }],
        tags: [],
      },
      {
        id: 'c-4a2',
        callNumber: '501-4a2',
        topic: '자식 B-2',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't6', date: '2026-09-22', stampType: 'ESTABLISHED', note: '자식 B-2' }],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(multiBranchCards[0], multiBranchCards);

    const n1a = mapData.nodes.find((n) => n.callNumber === '501-1a')!;
    const n1a1 = mapData.nodes.find((n) => n.callNumber === '501-1a1')!;
    const n1a2 = mapData.nodes.find((n) => n.callNumber === '501-1a2')!;

    const n4a = mapData.nodes.find((n) => n.callNumber === '501-4a')!;
    const n4a1 = mapData.nodes.find((n) => n.callNumber === '501-4a1')!;
    const n4a2 = mapData.nodes.find((n) => n.callNumber === '501-4a2')!;

    // 1. 부모 A 서브트리의 모든 노드는 부모 B 서브트리의 모든 노드보다 위에(Y좌표 작게) 위치해야 함 (교차 방지)
    const maxA1SubtreeY = Math.max(n1a.y, n1a1.y, n1a2.y);
    const minA4SubtreeY = Math.min(n4a.y, n4a1.y, n4a2.y);
    expect(maxA1SubtreeY).toBeLessThan(minA4SubtreeY);

    // 2. 부모 A의 자식들은 부모 A의 Y좌표 주변에 위치
    const avgA1ChildrenY = (n1a1.y + n1a2.y) / 2;
    expect(Math.abs(avgA1ChildrenY - n1a.y)).toBeLessThanOrEqual(5);

    // 3. 부모 B의 자식들은 부모 B의 Y좌표 주변에 위치
    const avgA4ChildrenY = (n4a1.y + n4a2.y) / 2;
    expect(Math.abs(avgA4ChildrenY - n4a.y)).toBeLessThanOrEqual(5);
  });

  it('사유 카드가 서지 카드(B-1 등)를 연계카드로 참조할 때 references에 연결선이 생성되어야 한다', () => {
    const referenceCards: TopicCard[] = [
      {
        id: 'book-1',
        callNumber: 'B-1',
        topic: '참고도서 1',
        author: '저자',
        classification: 'B- 서지 서가',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 'tb1', date: '2026-09-22', stampType: 'QUOTATION', note: '도서' }],
        tags: [],
      },
      {
        id: 'idea-1',
        callNumber: '501-a1',
        topic: '사유 메모',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [
          {
            id: 'ti1',
            date: '2026-09-22',
            stampType: 'ESTABLISHED',
            note: '사유',
            linkedTopicIds: ['B-1'],
          },
        ],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(referenceCards[1], referenceCards);

    expect(mapData.references).toBeDefined();
    expect(mapData.references.length).toBe(1);

    const ideaNode = mapData.nodes.find((n) => n.callNumber === '501-a1')!;
    const bookNode = mapData.nodes.find((n) => n.callNumber === 'B-1')!;

    expect(mapData.references[0].x1).toBe(ideaNode.x);
    expect(mapData.references[0].y1).toBe(ideaNode.y);
    expect(mapData.references[0].x2).toBe(bookNode.x);
    expect(mapData.references[0].y2).toBe(bookNode.y);
  });

  it('동일한 대주제 번호를 공유하는 최상위 형제 노드들(501-1, 501-2, 501-3, 501-4) 사이에 수직 척추선(Spine line)이 연결되어야 한다', () => {
    const siblingCards: TopicCard[] = [
      {
        id: 'c-1',
        callNumber: '501-1',
        topic: '단상 1',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't1', date: '2026-09-22', stampType: 'ESTABLISHED', note: '1' }],
        tags: [],
      },
      {
        id: 'c-2',
        callNumber: '501-2',
        topic: '단상 2',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't2', date: '2026-09-22', stampType: 'ESTABLISHED', note: '2' }],
        tags: [],
      },
      {
        id: 'c-3',
        callNumber: '501-3',
        topic: '단상 3',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't3', date: '2026-09-22', stampType: 'ESTABLISHED', note: '3' }],
        tags: [],
      },
      {
        id: 'c-4',
        callNumber: '501-4',
        topic: '단상 4',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't4', date: '2026-09-22', stampType: 'ESTABLISHED', note: '4' }],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(siblingCards[0], siblingCards);

    const n1 = mapData.nodes.find((n) => n.callNumber === '501-1')!;
    const n2 = mapData.nodes.find((n) => n.callNumber === '501-2')!;
    const n3 = mapData.nodes.find((n) => n.callNumber === '501-3')!;
    const n4 = mapData.nodes.find((n) => n.callNumber === '501-4')!;

    // 1. 모든 형제 노드는 동일한 X좌표를 가져야 함
    expect(n1.x).toBe(n2.x);
    expect(n2.x).toBe(n3.x);
    expect(n3.x).toBe(n4.x);

    // 2. 형제 노드들 사이에 순차적으로 3개의 수직 연결선(Spine line, x1 === x2)이 tunnels에 존재해야 함
    const spine12 = mapData.tunnels.find(
      (t) => t.x1 === n1.x && t.y1 === n1.y && t.x2 === n2.x && t.y2 === n2.y
    );
    const spine23 = mapData.tunnels.find(
      (t) => t.x1 === n2.x && t.y1 === n2.y && t.x2 === n3.x && t.y2 === n3.y
    );
    const spine34 = mapData.tunnels.find(
      (t) => t.x1 === n3.x && t.y1 === n3.y && t.x2 === n4.x && t.y2 === n4.y
    );

    expect(spine12).toBeDefined();
    expect(spine23).toBeDefined();
    expect(spine34).toBeDefined();
    expect(mapData.tunnels.length).toBe(3);
  });
});
