import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TopicCard, BacklinkItem, CardThread } from '@/types/catalog';
import {
  findBacklinks,
  getRandomCardId,
  getMajorJumpCardId,
  getNextFamilyThread,
  getPrevFamilyThread,
} from '@/lib/catalogUtils';

/**
 * 도서관 카드 단말기 인터랙션 및 키보드 단축키 관리 훅
 * - [← / →]: 현재 대주제 계열 내에서 모든 가지치기 카드의 단상들을 연속 탐색 (예: 101 -> 101-a -> 101-a1)
 * - [↑ / ↓]: 다른 3자리 대주제(101 <-> 201 <-> 301)로 건너뛰기
 * - [/]: 카드 검색(Search) 팝업 창 토글
 * - [Space]: 무작위 토픽 카드로 전환
 * - [Enter]: 대주제 색인 모달 창 토글
 * - [B]: 역링크 모달 창 토글
 * - [Esc]: 창 닫기 또는 첫 번째 홈 카드 0번 단상으로 복귀
 */
export function useCatalogTerminal(cards: TopicCard[]) {
  const [activeCardId, setActiveCardId] = useState<string>(() => cards[0]?.id ?? '');
  const [activeThreadIndex, setActiveThreadIndex] = useState<number>(0);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBacklinksOpen, setIsBacklinksOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const shuffleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 남아있는 셔플 타이머 정리
  useEffect(() => {
    return () => {
      if (shuffleTimerRef.current) {
        clearTimeout(shuffleTimerRef.current);
      }
    };
  }, []);

  // 현재 활성화된 카드 객체
  const activeCard = useMemo(() => {
    return (
      cards.find(
        (c) =>
          c.id === activeCardId ||
          c.callNumber.toLowerCase() === activeCardId.toLowerCase()
      ) || cards[0]
    );
  }, [cards, activeCardId]);

  // 카드 목록이 비동기(노션 API 등)로 갱신되었을 때 활성 카드 보정
  useEffect(() => {
    if (
      cards.length > 0 &&
      !cards.some(
        (c) =>
          c.id === activeCardId ||
          c.callNumber.toLowerCase() === activeCardId.toLowerCase()
      )
    ) {
      setActiveCardId(cards[0].id);
      setActiveThreadIndex(0);
    }
  }, [cards, activeCardId]);

  // 현재 카드의 전체 단상 수
  const totalThreads = activeCard?.threads?.length ?? 1;

  // 현재 활성화된 단일 단상 객체
  const activeThread: CardThread = useMemo(() => {
    if (!activeCard || !activeCard.threads || activeCard.threads.length === 0) {
      return {
        id: 'thread-empty',
        date: '1970-01-01',
        stampType: 'UNFINISHED',
        note: '기록된 단상이 없습니다.',
      };
    }
    const safeIndex = Math.min(Math.max(0, activeThreadIndex), activeCard.threads.length - 1);
    return activeCard.threads[safeIndex];
  }, [activeCard, activeThreadIndex]);

  // 현재 활성화된 카드의 역링크 목록
  const currentBacklinks: BacklinkItem[] = useMemo(() => {
    if (!activeCard) return [];
    return findBacklinks(activeCard.id, cards);
  }, [activeCard, cards]);

  // 모달 제어 함수들
  const toggleIndex = useCallback(() => {
    setIsIndexOpen((prev) => !prev);
    setIsSearchOpen(false);
    setIsBacklinksOpen(false);
    setIsAboutOpen(false);
    setIsHelpOpen(false);
    setIsAdminOpen(false);
    setIsMapOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
    setIsIndexOpen(false);
    setIsBacklinksOpen(false);
    setIsAboutOpen(false);
    setIsHelpOpen(false);
    setIsAdminOpen(false);
    setIsMapOpen(false);
  }, []);

  const toggleBacklinks = useCallback(() => {
    setIsBacklinksOpen((prev) => !prev);
    setIsIndexOpen(false);
    setIsSearchOpen(false);
    setIsAboutOpen(false);
    setIsHelpOpen(false);
    setIsAdminOpen(false);
    setIsMapOpen(false);
  }, []);

  const toggleAbout = useCallback(() => {
    setIsAboutOpen((prev) => !prev);
    setIsIndexOpen(false);
    setIsSearchOpen(false);
    setIsBacklinksOpen(false);
    setIsHelpOpen(false);
    setIsAdminOpen(false);
    setIsMapOpen(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setIsHelpOpen((prev) => !prev);
    setIsIndexOpen(false);
    setIsSearchOpen(false);
    setIsBacklinksOpen(false);
    setIsAboutOpen(false);
    setIsAdminOpen(false);
    setIsMapOpen(false);
  }, []);

  const toggleAdmin = useCallback(() => {
    setIsAdminOpen((prev) => !prev);
    setIsIndexOpen(false);
    setIsSearchOpen(false);
    setIsBacklinksOpen(false);
    setIsAboutOpen(false);
    setIsHelpOpen(false);
    setIsMapOpen(false);
  }, []);

  const toggleMap = useCallback(() => {
    setIsMapOpen((prev) => !prev);
    setIsIndexOpen(false);
    setIsSearchOpen(false);
    setIsBacklinksOpen(false);
    setIsAboutOpen(false);
    setIsHelpOpen(false);
    setIsAdminOpen(false);
  }, []);

  const closeAllModals = useCallback(() => {
    setIsIndexOpen(false);
    setIsSearchOpen(false);
    setIsBacklinksOpen(false);
    setIsAboutOpen(false);
    setIsHelpOpen(false);
    setIsAdminOpen(false);
    setIsMapOpen(false);
  }, []);

  // 카드 선택 (토픽 직접 변경 시 단상 인덱스는 0으로 초기화)
  const selectCard = useCallback(
    (idOrCallNumber: string) => {
      const target = cards.find(
        (c) =>
          c.id === idOrCallNumber ||
          c.callNumber.toLowerCase() === idOrCallNumber.toLowerCase()
      );
      setActiveCardId(target ? target.id : idOrCallNumber);
      setActiveThreadIndex(0);
      closeAllModals();
    },
    [cards, closeAllModals]
  );

  // [→] 같은 대주제 계열 내에서 단상 연속 다음 이동 (101-a, 101-a1 등으로 연속 전진)
  const nextThread = useCallback(() => {
    const { nextCardId, nextThreadIndex } = getNextFamilyThread(
      activeCardId,
      activeThreadIndex,
      cards
    );
    setActiveCardId(nextCardId);
    setActiveThreadIndex(nextThreadIndex);
  }, [activeCardId, activeThreadIndex, cards]);

  // [←] 같은 대주제 계열 내에서 단상 연속 이전 이동 (이전 가지치기 카드로 역진입)
  const prevThread = useCallback(() => {
    const { prevCardId, prevThreadIndex } = getPrevFamilyThread(
      activeCardId,
      activeThreadIndex,
      cards
    );
    setActiveCardId(prevCardId);
    setActiveThreadIndex(prevThreadIndex);
  }, [activeCardId, activeThreadIndex, cards]);

  // [↑ / ↓] 3자리 대주제 단위 건너뛰기
  const nextTopic = useCallback(() => {
    setActiveCardId((curr) => getMajorJumpCardId(curr, cards, 'next'));
    setActiveThreadIndex(0);
  }, [cards]);

  // [Space] 0.8초 셔플링 다이얼로그 후 무작위 카드로 전환
  const shuffleRandomCard = useCallback(() => {
    if (isShuffling) return;
    if (cards.length <= 1) return;

    setIsShuffling(true);
    closeAllModals();

    if (shuffleTimerRef.current) {
      clearTimeout(shuffleTimerRef.current);
    }

    shuffleTimerRef.current = setTimeout(() => {
      setActiveCardId((curr) => getRandomCardId(curr, cards));
      setActiveThreadIndex(0);
      setIsShuffling(false);
      shuffleTimerRef.current = null;
    }, 800);
  }, [cards, closeAllModals, isShuffling]);

  const prevTopic = useCallback(() => {
    setActiveCardId((curr) => getMajorJumpCardId(curr, cards, 'prev'));
    setActiveThreadIndex(0);
  }, [cards]);

  // 키보드 단축키 리스너 등록
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 텍스트 인풋 포커스 시 단축키 무시
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (
          isIndexOpen ||
          isSearchOpen ||
          isBacklinksOpen ||
          isAboutOpen ||
          isHelpOpen ||
          isAdminOpen ||
          isMapOpen
        ) {
          closeAllModals();
        } else {
          if (cards.length > 0) {
            setActiveCardId(cards[0].id);
            setActiveThreadIndex(0);
          }
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        toggleSearch();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        toggleIndex();
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleBacklinks();
        return;
      }

      // 서고 던전 오토맵 미니맵 단축키: 'M' 또는 'm'
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMap();
        return;
      }

      // 사서 전용 Admin 모달 단축키: 'L' 또는 'l'
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        toggleAdmin();
        return;
      }

      // 팝업이 열려 있거나 셔플 중인 상태에서는 이동 단축키 제한
      if (
        isIndexOpen ||
        isSearchOpen ||
        isBacklinksOpen ||
        isAboutOpen ||
        isHelpOpen ||
        isAdminOpen ||
        isMapOpen ||
        isShuffling
      ) {
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        shuffleRandomCard();
        return;
      }

      // [← / →]: 현재 대주제 계열 내에서 모든 가지치기 카드의 단상들을 연속 탐색
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextThread();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevThread();
        return;
      }

      // [↑ / ↓]: 3자리 대주제 단위 건너뛰기
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextTopic();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevTopic();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cards,
    isIndexOpen,
    isSearchOpen,
    isBacklinksOpen,
    isAboutOpen,
    isHelpOpen,
    isAdminOpen,
    closeAllModals,
    toggleIndex,
    toggleSearch,
    toggleBacklinks,
    toggleAbout,
    toggleHelp,
    toggleAdmin,
    toggleMap,
    nextThread,
    prevThread,
    nextTopic,
    prevTopic,
    shuffleRandomCard,
    isShuffling,
    isMapOpen,
  ]);

  return {
    activeCard,
    activeCardId,
    activeThreadIndex,
    activeThread,
    totalThreads,
    setActiveCardId: selectCard,
    setActiveThreadIndex,
    nextThread,
    prevThread,
    nextTopic,
    prevTopic,
    shuffleRandomCard,
    isShuffling,
    isMapOpen,
    toggleMap,
    currentBacklinks,
    isIndexOpen,
    isSearchOpen,
    isBacklinksOpen,
    isAboutOpen,
    isHelpOpen,
    isAdminOpen,
    toggleIndex,
    toggleSearch,
    toggleBacklinks,
    toggleAbout,
    toggleHelp,
    toggleAdmin,
    closeAllModals,
  };
}
