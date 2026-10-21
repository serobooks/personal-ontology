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

    // 각 성운의 중심 간 거리는 최소 120px 이상 확보되어야 함 (교집합 방지)
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

  it('대주제 성운은 일의 자리가 아닌 백의 자리(100, 200, 500, 600 등)를 기준으로 러프하게 그룹화되어야 한다', () => {
    const sampleCards: TopicCard[] = [
      {
        id: 'c-501',
        callNumber: '501-1',
        topic: '단상 501',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c-502',
        callNumber: '502-1',
        topic: '단상 502',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c-211',
        callNumber: '211-1',
        topic: '소설 211',
        author: '사서',
        classification: '200 서사와 창작',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c-230',
        callNumber: '230-1',
        topic: '소설 230',
        author: '사서',
        classification: '200 서사와 창작',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(sampleCards[0], sampleCards);

    // 501, 502 -> '500' 하나의 성운으로 묶이고, 211, 230 -> '200' 하나의 성운으로 묶여 총 2개 성운이어야 함
    expect(mapData.clusters.length).toBe(2);
    const clusterCodes = mapData.clusters.map((c) => c.majorCode).sort();
    expect(clusterCodes).toEqual(['200', '500']);

    // 500 성운의 캡슐(envelope) 안에 501과 502 노드가 모두 포함되어야 함
    const cluster500 = mapData.clusters.find((c) => c.majorCode === '500')!;
    const node501 = mapData.nodes.find((n) => n.callNumber === '501-1')!;
    const node502 = mapData.nodes.find((n) => n.callNumber === '502-1')!;

    expect(node501.x).toBeGreaterThanOrEqual(cluster500.envelope.x);
    expect(node501.x).toBeLessThanOrEqual(cluster500.envelope.x + cluster500.envelope.width);
    expect(node502.x).toBeGreaterThanOrEqual(cluster500.envelope.x);
    expect(node502.x).toBeLessThanOrEqual(cluster500.envelope.x + cluster500.envelope.width);
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

    // 한 부모에서 2개 이상 갈라진 자식(형제)이므로 isBranch가 true여야 함
    expect(t1?.isBranch).toBe(true);
    expect(t2?.isBranch).toBe(true);
  });

  it('단일 직렬 심화(부모에게 자식이 1개만 이어지는 계보)는 isBranch가 false여야 한다', () => {
    const chainCards: TopicCard[] = [
      {
        id: 'c-root',
        callNumber: '501-1',
        topic: '직렬 루트',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c-child',
        callNumber: '501-1a',
        topic: '직렬 1차 자식',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c-grandchild',
        callNumber: '501-1a1',
        topic: '직렬 2차 손자',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(chainCards[0], chainCards);
    expect(mapData.tunnels.length).toBe(2);

    // 둘 다 단일 자식으로 이어지므로 isBranch는 false (직렬 심화선)
    mapData.tunnels.forEach((tunnel) => {
      expect(tunnel.isBranch).toBe(false);
    });
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
    expect(dist).toBeGreaterThanOrEqual(24);

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

  it('각 대주제 성운마다 소속 사유 노드들을 타이트하게 감싸는 맞춤형 캡슐(envelope)을 산출해야 한다', () => {
    const currentCard = mockCards[0];
    const mapData = getLibraryOverviewMapData(currentCard, mockCards);

    expect(mapData.clusters.length).toBeGreaterThan(0);

    mapData.clusters.forEach((cluster) => {
      expect(cluster.envelope).toBeDefined();
      expect(cluster.envelope.width).toBeGreaterThanOrEqual(24);
      expect(cluster.envelope.height).toBeGreaterThanOrEqual(24);

      // 소속 사유 노드들은 자신의 envelope 영역 내에 안전하게 감싸여 있어야 함
      const memberNodes = mapData.nodes.filter(
        (n) => !n.isBook && n.callNumber.startsWith(cluster.majorCode)
      );
      memberNodes.forEach((node) => {
        expect(node.x).toBeGreaterThanOrEqual(cluster.envelope.x);
        expect(node.x).toBeLessThanOrEqual(cluster.envelope.x + cluster.envelope.width);
        expect(node.y).toBeGreaterThanOrEqual(cluster.envelope.y);
        expect(node.y).toBeLessThanOrEqual(cluster.envelope.y + cluster.envelope.height);
      });
    });
  });

  it('서지 노트 및 사유 노트 아이콘은 대주제 숫자 레이블([200], [500] 등)과 겹치지 않아야 한다', () => {
    const currentCard = mockCards[0];
    const mapData = getLibraryOverviewMapData(currentCard, mockCards);

    mapData.clusters.forEach((cluster) => {
      const lx = cluster.labelX ?? cluster.envelope.x + 6;
      const ly = cluster.labelY ?? cluster.envelope.y - 4;

      // 레이블 텍스트의 폰트 및 바운딩 박스 영역
      mapData.nodes.forEach((node) => {
        const dx = Math.abs(node.x - (lx + 15));
        const dy = Math.abs(node.y - (ly - 4));
        // 노드 중심이 레이블 중심으로부터 충분한 거리(수평 20px 이상 또는 수직 12px 이상)를 두어야 함
        const isOverlapping = dx < 20 && dy < 12;
        expect(isOverlapping).toBe(false);
      });
    });
  });

  it('성단 내의 노드 간격은 과도하게 길어지지 않고 조밀하게(dense) 응집되어야 한다', () => {
    const currentCard = mockCards[0];
    const mapData = getLibraryOverviewMapData(currentCard, mockCards);

    // 터널(부모-자식 연결선)의 길이가 40px 이하로 조밀하게 유지되어야 함 (기존 67px 대비 대폭 축소)
    mapData.tunnels.forEach((tunnel) => {
      const length = Math.hypot(tunnel.x2 - tunnel.x1, tunnel.y2 - tunnel.y1);
      expect(length).toBeLessThanOrEqual(40);
    });
  });

  it('서지 노트가 상단에 위치하더라도 대주제 숫자 레이블([200] 등)의 텍스트 영역과 안전거리를 확보해야 한다', () => {
    const cards: TopicCard[] = [
      {
        id: 'c-201',
        callNumber: '201-1',
        topic: '공간 온톨로지',
        author: '사서',
        classification: '200 서사',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't1', date: '2026-09-22', stampType: 'QUOTATION', note: '', linkedTopicIds: ['B-top'] }],
        tags: [],
      },
      {
        id: 'B-top',
        callNumber: 'B-10',
        topic: '최상단 서지',
        author: '저자',
        classification: '서지',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(cards[0], cards);
    const bookNode = mapData.nodes.find((n) => n.isBook)!;
    const cluster200 = mapData.clusters.find((c) => c.majorCode === '200')!;

    const lx = cluster200.labelX ?? cluster200.envelope.x + 6;
    const ly = cluster200.labelY ?? cluster200.envelope.y - 4;

    const dx = Math.abs(bookNode.x - (lx + 15));
    const dy = Math.abs(bookNode.y - (ly - 4));
    const isOverlapping = dx < 22 && dy < 14;
    expect(isOverlapping).toBe(false);
  });

  it('단일 직렬 심화 계보는 지그재그 없이 부모와 자식이 일직선(colinear)으로 곧게 뻗어야 한다', () => {
    const chainCards: TopicCard[] = [
      {
        id: 'c-root',
        callNumber: '501-1',
        topic: '직렬 루트',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c-child',
        callNumber: '501-1a',
        topic: '직렬 1차 자식',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c-grandchild',
        callNumber: '501-1a1',
        topic: '직렬 2차 손자',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
    ];

    const mapData = getLibraryOverviewMapData(chainCards[0], chainCards);
    const n1 = mapData.nodes.find((n) => n.callNumber === '501-1')!;
    const n2 = mapData.nodes.find((n) => n.callNumber === '501-1a')!;
    const n3 = mapData.nodes.find((n) => n.callNumber === '501-1a1')!;

    // 세 점이 일직선상에 있는지 외적(Cross product)으로 검증 (오차 2px 이내)
    const crossProduct = Math.abs((n2.y - n1.y) * (n3.x - n2.x) - (n2.x - n1.x) * (n3.y - n2.y));
    expect(crossProduct).toBeLessThanOrEqual(2);
  });

  it('모든 서지 노트는 어떤 대성운 캡슐(envelope)의 내부에도 들어가지 않고 반드시 틀 바깥에 배치되어야 한다', () => {
    const currentCard = mockCards[0];
    const mapData = getLibraryOverviewMapData(currentCard, mockCards);

    const bookNodes = mapData.nodes.filter((n) => n.isBook);
    expect(bookNodes.length).toBeGreaterThan(0);

    bookNodes.forEach((bNode) => {
      mapData.clusters.forEach((cluster) => {
        const env = cluster.envelope;
        // 서지 노드가 캡슐의 경계 안쪽에 완벽히 갇혀있으면 안 됨
        const isInside =
          bNode.x >= env.x &&
          bNode.x <= env.x + env.width &&
          bNode.y >= env.y &&
          bNode.y <= env.y + env.height;
        expect(isInside).toBe(false);
      });
    });
  });
});


