import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCatalogTerminal } from './useCatalogTerminal';
import { mockCards } from '@/data/mockCards';

/**
 * 상하(부모·자식 계층) 및 좌우(형제·이웃) 이동 체계와 단축키 모달 훅 검증 (TDD)
 */
describe('useCatalogTerminal 단말기 훅 검증', () => {
  it('최상위 루트(101)에서 ArrowRight를 누르면 자식(101-a)을 건너뛰고 다음 루트 이웃(201)으로 이동하며, ArrowLeft로 다시 101로 복귀해야 한다', () => {
    const { result } = renderHook(() => useCatalogTerminal(mockCards));

    expect(result.current.activeCard.callNumber).toBe('101');
    expect(result.current.navigationInfo.parentCard).toBeNull();
    expect(result.current.navigationInfo.childCard?.callNumber).toBe('101-a');
    expect(result.current.navigationInfo.nextNeighborCard?.callNumber).toBe('201');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.activeCard.callNumber).toBe('201');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });
    expect(result.current.activeCard.callNumber).toBe('101');
  });

  it('/ 키를 누르면 검색 모달(isSearchOpen)이 토글되어야 한다', () => {
    const { result } = renderHook(() => useCatalogTerminal(mockCards));
    expect(result.current.isSearchOpen).toBe(false);

    // '/' 키 입력 -> 검색창 열림
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    });
    expect(result.current.isSearchOpen).toBe(true);

    // Escape 누르면 검색창 닫힘
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(result.current.isSearchOpen).toBe(false);
  });

  it('ArrowDown 키를 누르면 하위 카드(101 -> 101-a -> 101-a1)로 내려가고, 최하위 카드에서는 더 이상 점프하지 않고 멈춰야 한다', () => {
    const { result } = renderHook(() => useCatalogTerminal(mockCards));

    expect(result.current.activeCard.callNumber).toBe('101');

    // 1단계 하위 진입: 101 -> 101-a
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    expect(result.current.activeCard.callNumber).toBe('101-a');

    // 101-a에서 오른쪽(ArrowRight)을 누르면 자식 101-a1이 아니라 형제 101-b로 이동해야 함
    expect(result.current.navigationInfo.nextNeighborCard?.callNumber).toBe('101-b');

    // 2단계 하위 진입: 101-a -> 101-a1
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    expect(result.current.activeCard.callNumber).toBe('101-a1');
    expect(result.current.navigationInfo.childCard).toBeNull();

    // 최하위 노드(101-a1)에서 ArrowDown을 한 번 더 눌러도 다른 카드로 점프하지 않고 그대로 머물러야 함
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    expect(result.current.activeCard.callNumber).toBe('101-a1');

    // ArrowUp을 누르면 다시 상위 카드인 101-a로 올라가야 함
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });
    expect(result.current.activeCard.callNumber).toBe('101-a');
  });

  it('Space 키를 누르면 0.8초(800ms) 동안 isShuffling이 true가 되고, 완료 후 새 카드로 전환되어야 한다', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useCatalogTerminal(mockCards));
      const initialCardId = result.current.activeCardId;

      expect(result.current.isShuffling).toBe(false);

      // Space 입력 시 즉시 셔플링 상태로 진입하고 카드는 아직 변경되지 않음
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      });

      expect(result.current.isShuffling).toBe(true);
      expect(result.current.activeCardId).toBe(initialCardId);

      // 400ms 경과: 여전히 셔플링 중
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(result.current.isShuffling).toBe(true);
      expect(result.current.activeCardId).toBe(initialCardId);

      // 800ms 경과: 셔플링 종료 및 무작위 카드로 전환
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(result.current.isShuffling).toBe(false);
      expect(result.current.activeCardId).not.toBe(initialCardId);
      expect(result.current.activeThreadIndex).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('셔플링 진행 중에는 중복으로 Space를 눌러도 셔플이 중복 재시작되지 않아야 한다', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useCatalogTerminal(mockCards));
      const initialCardId = result.current.activeCardId;

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      });
      expect(result.current.isShuffling).toBe(true);

      // 셔플링 도중 400ms 시점에 다시 Space 누름
      act(() => {
        vi.advanceTimersByTime(400);
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      });
      expect(result.current.isShuffling).toBe(true);

      // 원래 800ms 시점(추가 400ms 후)에 정상 종료되어야 함
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(result.current.isShuffling).toBe(false);
      expect(result.current.activeCardId).not.toBe(initialCardId);
    } finally {
      vi.useRealTimers();
    }
  });

  it('m 또는 M 키를 누르면 미니맵 모달(isMapOpen)이 토글되어야 한다', () => {
    const { result } = renderHook(() => useCatalogTerminal(mockCards));
    expect(result.current.isMapOpen).toBe(false);

    // 'm' 키 입력 -> 미니맵 열림
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
    });
    expect(result.current.isMapOpen).toBe(true);

    // Escape 누르면 미니맵 닫힘
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(result.current.isMapOpen).toBe(false);

    // 'M' 대문자 키 입력 -> 미니맵 열림
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'M' }));
    });
    expect(result.current.isMapOpen).toBe(true);
  });
});
