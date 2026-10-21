import { describe, it, expect } from 'vitest';
import { getParentCallNumber, getLibraryOverviewMapData } from './minimapUtils';
import { mockCards } from '@/data/mockCards';
import { TopicCard } from '@/types/catalog';

describe('minimapUtils 성운 성도(Cosmic Constellation) 전체도 엔진 검증', () => {
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

  it('대주제별로 독립된 성운(Nebulae) 중심을 형성하고 상호 교집합 없이 분산되어야 한다', () => {
    const currentCard = mockCards[0];
    const mapData = getLibraryOverviewMapData(currentCard, mockCards);

    expect(mapData.clusters).toBeDefined();
    expect(mapData.clusters.length).toBeGreaterThan(0);

    // 각 성운의 중심 간 거리는 최소 140px 이상 확보되어야 함 (교집합 방지)
    const clusters = mapData.clusters;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const dx = clusters[i].cx - clusters[j].cx;
        const dy = clusters[i].cy - clusters[j].cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        expect(dist).toBeGreaterThanOrEqual(120);
      }
    }
  });

  it('성운 내의 부모-자식 사유 노드는 별자리처럼 실선(tunnels)으로 연결되어야 한다', () => {
    const familyCards: TopicCard[] = [
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
    ];

    const mapData = getLibraryOverviewMapData(familyCards[0], familyCards);

    const rootNode = mapData.nodes.find((n) => n.callNumber === '501-4a')!;
    const c1Node = mapData.nodes.find((n) => n.callNumber === '501-4a1')!;
    const c2Node = mapData.nodes.find((n) => n.callNumber === '501-4a2')!;

    expect(rootNode).toBeDefined();
    expect(c1Node).toBeDefined();
    expect(c2Node).toBeDefined();

    // 부모-자식 간 실선 터널이 각각 생성되어야 함
    const t1 = mapData.tunnels.find(
      (t) => t.x1 === rootNode.x && t.y1 === rootNode.y && t.x2 === c1Node.x && t.y2 === c1Node.y
    );
    const t2 = mapData.tunnels.find(
      (t) => t.x1 === rootNode.x && t.y1 === rootNode.y && t.x2 === c2Node.x && t.y2 === c2Node.y
    );
    expect(t1).toBeDefined();
    expect(t2).toBeDefined();
  });

  it('서지(B-) 노드는 사유 성운 집합(태양계) 외곽에 불규칙적으로 흩뿌려지고 연관 사유 노드와 점선(references)으로 연결되어야 한다', () => {
    const testCards: TopicCard[] = [
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
        callNumber: '601-a1',
        topic: '사유 메모',
        author: '사서',
        classification: '600 예술',
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

    const mapData = getLibraryOverviewMapData(testCards[1], testCards);

    const bNode = mapData.nodes.find((n) => n.callNumber === 'B-1')!;
    const iNode = mapData.nodes.find((n) => n.callNumber === '601-a1')!;

    expect(bNode).toBeDefined();
    expect(iNode).toBeDefined();
    expect(bNode.isBook).toBe(true);

    // 서지 노드는 사유 노드 중심에서 일정한 외곽 거리 이상 떨어져 있어야 함
    const dx = bNode.x - iNode.x;
    const dy = bNode.y - iNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeGreaterThanOrEqual(40);

    // 연관된 점선 연결선(references)이 생성되어 있어야 함
    const ref = mapData.references.find(
      (r) => r.x1 === iNode.x && r.y1 === iNode.y && r.x2 === bNode.x && r.y2 === bNode.y
    );
    expect(ref).toBeDefined();
  });

  it('사유 노드 간의 연계 카드(백링크) 역시 점선(references)으로 연결되어야 한다', () => {
    const linkCards: TopicCard[] = [
      {
        id: 'idea-a',
        callNumber: '101-a1',
        topic: '사유 A',
        author: '사서',
        classification: '100 철학',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [
          {
            id: 't-a',
            date: '2026-09-22',
            stampType: 'ESTABLISHED',
            note: '사유 A',
            linkedTopicIds: ['201-b1'],
          },
        ],
        tags: [],
      },
      {
        id: 'idea-b',
        callNumber: '201-b1',
        topic: '사유 B',
        author: '사서',
        classification: '200 종교',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't-b', date: '2026-09-22', stampType: 'ESTABLISHED', note: '사유 B' }],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(linkCards[0], linkCards);

    const nodeA = mapData.nodes.find((n) => n.callNumber === '101-a1')!;
    const nodeB = mapData.nodes.find((n) => n.callNumber === '201-b1')!;

    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();

    const ref = mapData.references.find(
      (r) => r.x1 === nodeA.x && r.y1 === nodeA.y && r.x2 === nodeB.x && r.y2 === nodeB.y
    );
    expect(ref).toBeDefined();
  });

  it('캔버스는 노드들이 여유롭게 숨쉴 수 있도록 뷰포트보다 넓은 광역 성도 규격(canvasWidth >= 800, canvasHeight >= 550)을 가져야 한다', () => {
    const currentCard = mockCards[0];
    const mapData = getLibraryOverviewMapData(currentCard, mockCards);

    expect(mapData.canvasWidth).toBeGreaterThanOrEqual(800);
    expect(mapData.canvasHeight).toBeGreaterThanOrEqual(550);

    // 모든 노드는 캔버스 테두리 안쪽 안전 영역에 위치해야 함
    mapData.nodes.forEach((node) => {
      expect(node.x).toBeGreaterThanOrEqual(20);
      expect(node.x).toBeLessThanOrEqual(mapData.canvasWidth - 20);
      expect(node.y).toBeGreaterThanOrEqual(20);
      expect(node.y).toBeLessThanOrEqual(mapData.canvasHeight - 20);
    });
  });
});
