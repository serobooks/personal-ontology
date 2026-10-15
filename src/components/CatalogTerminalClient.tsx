'use client';

import React, { useState, useEffect } from 'react';
import { TopicCard } from '@/types/catalog';
import { useCatalogTerminal } from '@/hooks/useCatalogTerminal';
import { TopMenuBar } from '@/components/TopMenuBar';
import { System7Window } from '@/components/System7Window';
import { LibraryCardView } from '@/components/LibraryCardView';
import { LibrarianWidget } from '@/components/LibrarianWidget';
import { BottomShortcutBar } from '@/components/BottomShortcutBar';
import { IndexModal } from '@/components/IndexModal';
import { SearchModal } from '@/components/SearchModal';
import { BacklinksModal } from '@/components/BacklinksModal';
import { AboutModal } from '@/components/AboutModal';
import { HelpModal } from '@/components/HelpModal';
import { AdminModal } from '@/components/AdminModal';
import { ShuffleModal } from '@/components/ShuffleModal';
import { MiniMapModal } from '@/components/MiniMapModal';
import { useAdminClearance } from '@/hooks/useAdminClearance';

interface CatalogTerminalClientProps {
  initialCards: TopicCard[];
  initialSource?: string;
}

export default function CatalogTerminalClient({
  initialCards,
  initialSource = 'notion',
}: CatalogTerminalClientProps) {
  const { isAuthenticated, login, logout } = useAdminClearance();
  const [cards, setCards] = useState<TopicCard[]>(initialCards);
  const [dataSource, setDataSource] = useState<string>(initialSource);

  useEffect(() => {
    let isMounted = true;
    async function refreshNotionCards() {
      try {
        const res = await fetch('/api/notion');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.cards) && data.cards.length > 0) {
          setCards(data.cards);
          setDataSource(data.source || 'notion');
        }
      } catch (err) {
        console.error('Failed to refresh Notion cards:', err);
      }
    }

    // 초기 카드가 비어있었던 경우에만 즉시 fetch
    if (!initialCards || initialCards.length === 0) {
      refreshNotionCards();
    }

    return () => {
      isMounted = false;
    };
  }, [initialCards]);

  const {
    activeCard,
    activeCardId,
    activeThreadIndex,
    activeThread,
    totalThreads,
    setActiveCardId,
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
  } = useCatalogTerminal(cards);

  const isAnyModalOpen =
    isIndexOpen ||
    isSearchOpen ||
    isBacklinksOpen ||
    isAboutOpen ||
    isHelpOpen ||
    isAdminOpen ||
    isMapOpen ||
    isShuffling;

  return (
    <div className="relative w-screen h-screen flex flex-col justify-between overflow-hidden">
      {/* 1. Top Bar: System 7 데스크톱 메뉴 바 */}
      <TopMenuBar
        onOpenAbout={toggleAbout}
        onOpenIndex={toggleIndex}
        onOpenSearch={toggleSearch}
        onOpenHelp={toggleHelp}
        onOpenAdmin={toggleAdmin}
        onOpenMap={toggleMap}
        isAboutOpen={isAboutOpen}
        isIndexOpen={isIndexOpen}
        isSearchOpen={isSearchOpen}
        isHelpOpen={isHelpOpen}
        isAdminOpen={isAdminOpen}
        isMapOpen={isMapOpen}
        isAdminAuthenticated={isAuthenticated}
      />

      {/* 2. Center View: 화면 중앙에 단 1장의 단상 카드만 단정하게 렌더링 */}
      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 pb-12 overflow-y-auto">
        <div className="w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
          <System7Window
            title={`[장서카드] ${activeCard.callNumber} • ${activeCard.topic}`}
            width="w-full"
            className="shadow-[6px_6px_0px_rgba(0,0,0,0.85)] border-2 border-black"
          >
            <div className="p-1 sm:p-2 bg-[#e6e9ed] flex justify-center">
              <LibraryCardView
                card={activeCard}
                activeThread={activeThread}
                activeThreadIndex={activeThreadIndex}
                totalThreads={totalThreads}
                onPrevThread={prevThread}
                onNextThread={nextThread}
                onSelectTopic={setActiveCardId}
                onOpenBacklinks={toggleBacklinks}
                backlinkCount={currentBacklinks.length}
                allCards={cards}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </System7Window>
        </div>
      </main>

      {/* 3. Bottom Right Widget: 사서 도트 이미지 위젯 */}
      <LibrarianWidget currentTopic={`[${activeCard.callNumber}] ${activeCard.topic}`} />

      {/* 4. Bottom Bar: 확정된 조작 단축키 안내 바 */}
      <BottomShortcutBar
        onPrevThread={prevThread}
        onNextThread={nextThread}
        onPrevTopic={prevTopic}
        onNextTopic={nextTopic}
        onRandom={shuffleRandomCard}
        onToggleSearch={toggleSearch}
        onToggleBacklinks={toggleBacklinks}
        onToggleMap={toggleMap}
        onEscape={() => {
          const key = new KeyboardEvent('keydown', { key: 'Escape' });
          window.dispatchEvent(key);
        }}
        isModalOpen={isAnyModalOpen}
      />

      {/* 5. Sub Windows & Modals */}
      {isShuffling && <ShuffleModal isOpen={isShuffling} />}

      {isIndexOpen && (
        <IndexModal
          cards={cards}
          activeCardId={activeCardId}
          onSelectCard={setActiveCardId}
          onClose={closeAllModals}
        />
      )}

      {isSearchOpen && (
        <SearchModal
          cards={cards}
          onSelectCard={setActiveCardId}
          onClose={closeAllModals}
        />
      )}

      {isBacklinksOpen && (
        <BacklinksModal
          currentTopic={`[${activeCard.callNumber}] ${activeCard.topic}`}
          backlinks={currentBacklinks}
          onSelectCard={setActiveCardId}
          onClose={closeAllModals}
        />
      )}

      {isMapOpen && (
        <MiniMapModal
          isOpen={isMapOpen}
          currentCard={activeCard}
          allCards={cards}
          onSelectCard={setActiveCardId}
          onClose={closeAllModals}
        />
      )}

      {isAboutOpen && <AboutModal onClose={closeAllModals} />}

      {isHelpOpen && <HelpModal onClose={closeAllModals} />}

      {isAdminOpen && (
        <AdminModal
          isOpen={isAdminOpen}
          onClose={closeAllModals}
          isAuthenticated={isAuthenticated}
          onLogin={login}
          onLogout={logout}
        />
      )}
    </div>
  );
}
