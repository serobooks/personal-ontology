import { describe, it, expect } from 'vitest';
import { getParentCallNumber, getLibraryOverviewMapData } from './minimapUtils';
import { mockCards } from '@/data/mockCards';

describe('minimapUtils 서고 전체도 가로 확장형 유틸 검증', () => {
  it('청구기호에서 부모 청구기호를 올바르게 추출해야 한다', () => {
    expect(getParentCallNumber('101')).toBeNull();
    expect(getParentCallNumber('101-a')).toBe('101');
    expect(getParentCallNumber('101-a1')).toBe('101-a');
    expect(getParentCallNumber('101-a1a')).toBe('101-a1');
    expect(getParentCallNumber('B-1')).toBeNull();
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
      expect(branch2Node.x).toBeGreaterThan(branch1Node.x);
    }

    // 4. 연결선(tunnels)이 생성되어 있어야 함
    expect(mapData.tunnels.length).toBeGreaterThan(0);
  });
});
