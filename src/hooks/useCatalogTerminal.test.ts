import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCatalogTerminal } from './useCatalogTerminal';
import { mockCards } from '@/data/mockCards';

/**
 * 대주제 계열 내 단상 연속 순회 및 검색 모달 훅 테스트 (TDD - RED -> GREEN)
 */
describe('useCatalogTerminal 단말기 훅 검증', () => {
  it('ArrowRight를 연속해서 누르면 101의 단상 3개를 거쳐 101-a의 첫 단상으로 매끄럽게 넘어가야 한다', () => {
    const { result } = renderHook(() => useCatalogTerminal(mockCards));

    expect(result.current.activeCard.callNumber).toBe('101');
    expect(result.current.activeThreadIndex).toBe(0);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.activeThreadIndex).toBe(1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.activeThreadIndex).toBe(2);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.activeCard.callNumber).toBe('101-a');
    expect(result.current.activeThreadIndex).toBe(0);
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

  it('ArrowDown 키를 누를 때만 다른 대주제(201)로 건너뛰어야 한다', () => {
    const { result } = renderHook(() => useCatalogTerminal(mockCards));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });

    expect(result.current.activeCard.callNumber).toBe('201');
    expect(result.current.activeThreadIndex).toBe(0);
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
