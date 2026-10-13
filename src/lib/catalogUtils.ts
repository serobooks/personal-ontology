import { TopicCard, BacklinkItem, CardThread, CategoryScheduleItem } from '@/types/catalog';

/**
 * 카드의 필수 데이터 무결성을 검증합니다.
 */
export function validateCardIntegrity(card: TopicCard): boolean {
  if (!card) return false;
  return Boolean(
    card.id &&
    card.callNumber &&
    card.topic &&
    card.author &&
    Array.isArray(card.threads) &&
    card.threads.length > 0
  );
}

/**
 * 청구기호(CALL NUMBER)를 3자리 대주제 코드와 가지치기 식별자로 파싱합니다.
 * 형식: [3자리 주제코드]-[가지치기 식별자] (예: 101, 101-a, 101-a1)
 */
export function parseCallNumber(callNumber: string): { majorCode: string; branch: string } {
  if (!callNumber) return { majorCode: '', branch: '' };

  const firstHyphenIndex = callNumber.indexOf('-');
  if (firstHyphenIndex === -1) {
    return { majorCode: callNumber.trim(), branch: '' };
  }

  const majorCode = callNumber.slice(0, firstHyphenIndex).trim();
  const branch = callNumber.slice(firstHyphenIndex + 1).trim();
  return { majorCode, branch };
}

/**
 * 청구기호 간의 정렬 순서를 비교합니다.
 * 1) 3자리 대주제 코드(majorCode) 오름차순
 * 2) 동일 대주제 내에서는 가지치기 식별자 순서 (루트 -> a -> a1 -> a2 -> b ...)
 */
export function compareCallNumbers(a: string, b: string): number {
  const parsedA = parseCallNumber(a);
  const parsedB = parseCallNumber(b);

  // 1) 대주제 코드 비교
  if (parsedA.majorCode !== parsedB.majorCode) {
    return parsedA.majorCode.localeCompare(parsedB.majorCode, undefined, { numeric: true });
  }

  // 2) 동일 대주제 내에서 루트(가지치기 없음) 우선 처리
  if (!parsedA.branch && parsedB.branch) return -1;
  if (parsedA.branch && !parsedB.branch) return 1;
  if (!parsedA.branch && !parsedB.branch) return 0;

  // 3) 가지치기 식별자 자연 정렬 (a < a1 < a2 < b < b1 ...)
  return parsedA.branch.localeCompare(parsedB.branch, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * 특정 3자리 대주제 코드(예: '101')에 속한 모든 카드를 청구기호 순서로 반환합니다.
 */
export function getFamilyCards(majorCode: string, cards: TopicCard[]): TopicCard[] {
  return cards
    .filter((card) => parseCallNumber(card.callNumber).majorCode === majorCode)
    .sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));
}

/**
 * [→] 같은 대주제 계열 내에서 단상을 순서대로 다음 항목으로 전진시킵니다.
 */
export function getNextFamilyThread(
  currentCardId: string,
  currentThreadIndex: number,
  cards: TopicCard[]
): { nextCardId: string; nextThreadIndex: number } {
  if (cards.length === 0) return { nextCardId: currentCardId, nextThreadIndex: 0 };

  const currentCard = cards.find((c) => c.id === currentCardId) || cards[0];
  const { majorCode } = parseCallNumber(currentCard.callNumber);
  const familyCards = getFamilyCards(majorCode, cards);

  const cardIndex = familyCards.findIndex((c) => c.id === currentCard.id);
  const safeCardIndex = cardIndex >= 0 ? cardIndex : 0;
  const totalThreadsInCard = currentCard.threads.length;

  if (currentThreadIndex + 1 < totalThreadsInCard) {
    return {
      nextCardId: currentCard.id,
      nextThreadIndex: currentThreadIndex + 1,
    };
  }

  const nextCardIndex = (safeCardIndex + 1) % familyCards.length;
  const nextCard = familyCards[nextCardIndex];

  return {
    nextCardId: nextCard.id,
    nextThreadIndex: 0,
  };
}

/**
 * [←] 같은 대주제 계열 내에서 단상을 이전 항목으로 후진시킵니다.
 */
export function getPrevFamilyThread(
  currentCardId: string,
  currentThreadIndex: number,
  cards: TopicCard[]
): { prevCardId: string; prevThreadIndex: number } {
  if (cards.length === 0) return { prevCardId: currentCardId, prevThreadIndex: 0 };

  const currentCard = cards.find((c) => c.id === currentCardId) || cards[0];
  const { majorCode } = parseCallNumber(currentCard.callNumber);
  const familyCards = getFamilyCards(majorCode, cards);

  const cardIndex = familyCards.findIndex((c) => c.id === currentCard.id);
  const safeCardIndex = cardIndex >= 0 ? cardIndex : 0;

  if (currentThreadIndex > 0) {
    return {
      prevCardId: currentCard.id,
      prevThreadIndex: currentThreadIndex - 1,
    };
  }

  const prevCardIndex = (safeCardIndex - 1 + familyCards.length) % familyCards.length;
  const prevCard = familyCards[prevCardIndex];
  const lastThreadIdx = Math.max(0, prevCard.threads.length - 1);

  return {
    prevCardId: prevCard.id,
    prevThreadIndex: lastThreadIdx,
  };
}

/**
 * 하이픈 뒤에 a, 1 등이 붙는 가지치기 카드는 제외하고,
 * 세 자리 숫자로만 이루어진 대주제 카드 목록만 청구기호 순서로 반환합니다.
 */
export function getMainTopics(cards: TopicCard[]): TopicCard[] {
  return cards
    .filter((card) => {
      const { branch } = parseCallNumber(card.callNumber);
      return branch === '';
    })
    .sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));
}

/**
 * 특정 3자리 대주제 코드 계열에 속한 모든 카드의 총 메모(단상) 수를 계산합니다.
 */
export function getMajorThreadCount(majorCode: string, cards: TopicCard[]): number {
  return cards
    .filter((card) => parseCallNumber(card.callNumber).majorCode === majorCode)
    .reduce((sum, card) => sum + (card.threads?.length || 0), 0);
}

/**
 * 검색어를 바탕으로 카드의 제목, 청구기호, 단상 본문, 연계 장서 ID를 실시간 검색합니다.
 * @param query 검색어
 * @param cards 전체 카드 목록
 * @returns 일치하는 카드 목록 (청구기호 순 정렬)
 */
export function searchCards(query: string, cards: TopicCard[]): TopicCard[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [...cards].sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));
  }

  return cards
    .filter((card) => {
      const topicMatch = card.topic.toLowerCase().includes(trimmed);
      const callNumberMatch = card.callNumber.toLowerCase().includes(trimmed);
      const summaryMatch = card.summary ? card.summary.toLowerCase().includes(trimmed) : false;
      const tagsMatch = card.tags ? card.tags.some((t) => t.toLowerCase().includes(trimmed)) : false;
      const threadsMatch = card.threads.some((t) =>
        t.note.toLowerCase().includes(trimmed) ||
        (t.linkedTopicIds && t.linkedTopicIds.some((id) => id.toLowerCase().includes(trimmed)))
      );
      return topicMatch || callNumberMatch || summaryMatch || tagsMatch || threadsMatch;
    })
    .sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));
}

/**
 * 사용자가 '분류'를 명시하여 틀(구획)을 잡아둔 랜드마크 카드와 서지 카드를 추출합니다.
 * 1) classification에 슬래시('/')가 포함된 카드 (사용자 지정 소분류 랜드마크)
 * 2) 'B-'로 시작하는 서지 카드
 * 3) 하이픈 없는 순수 3자리 대주제 루트 카드
 */
export function getLandmarkCards(cards: TopicCard[]): TopicCard[] {
  return cards
    .filter((card) => {
      const isBook = card.callNumber.toUpperCase().startsWith('B-');
      const hasUserCategory = card.classification && card.classification.includes(' / ');
      const isRoot3Digit = /^\d{3}$/.test(card.callNumber.trim());
      return isBook || hasUserCategory || isRoot3Digit;
    })
    .sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));
}

/**
 * [↑ / ↓] 사유 랜드마크(허브) 단위로 징검다리 건너뛰기를 수행합니다.
 * 랜드마크가 2개 이상이면 랜드마크 목록을 순환하고, 없으면 3자리 대주제 코드로 점프합니다.
 */
export function getMajorJumpCardId(
  currentId: string,
  cards: TopicCard[],
  direction: 'next' | 'prev'
): string {
  if (cards.length === 0) return currentId;

  const currentCard = cards.find((c) => c.id === currentId) || cards[0];
  const landmarks = getLandmarkCards(cards);

  if (landmarks.length > 1) {
    // 1) 현재 카드가 랜드마크 중 하나인 경우
    const currentLandmarkIndex = landmarks.findIndex((l) => l.id === currentCard.id);
    if (currentLandmarkIndex !== -1) {
      const nextIndex =
        direction === 'next'
          ? (currentLandmarkIndex + 1) % landmarks.length
          : (currentLandmarkIndex - 1 + landmarks.length) % landmarks.length;
      return landmarks[nextIndex].id;
    }

    // 2) 현재 카드가 랜드마크 하위 가지에 있는 경우:
    // 청구기호 순서상 현재 카드 바로 앞이나 뒤의 랜드마크를 찾아 점프
    const sorted = [...landmarks].sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));
    if (direction === 'next') {
      const nextLandmark = sorted.find((l) => compareCallNumbers(l.callNumber, currentCard.callNumber) > 0);
      return nextLandmark ? nextLandmark.id : sorted[0].id;
    } else {
      const prevLandmark = [...sorted].reverse().find((l) => compareCallNumbers(l.callNumber, currentCard.callNumber) < 0);
      return prevLandmark ? prevLandmark.id : sorted[sorted.length - 1].id;
    }
  }

  // Fallback: 3자리 대주제 코드 점프
  const { majorCode: currentMajor } = parseCallNumber(currentCard.callNumber);
  const allMajors = Array.from(
    new Set(cards.map((c) => parseCallNumber(c.callNumber).majorCode))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (allMajors.length <= 1) return currentCard.id;

  const currentMajorIndex = allMajors.indexOf(currentMajor);
  const targetMajorIndex =
    direction === 'next'
      ? (currentMajorIndex + 1) % allMajors.length
      : (currentMajorIndex - 1 + allMajors.length) % allMajors.length;

  const targetMajor = allMajors[targetMajorIndex];
  const targetFamilyCards = cards
    .filter((c) => parseCallNumber(c.callNumber).majorCode === targetMajor)
    .sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));

  return targetFamilyCards[0]?.id || currentCard.id;
}

/**
 * 특정 카드를 본문 또는 threads에서 참조하고 있는 다른 카드들의 역링크를 탐색합니다.
 */
export function findBacklinks(targetId: string, cards: TopicCard[]): BacklinkItem[] {
  const backlinks: BacklinkItem[] = [];
  const targetCard = cards.find(
    (c) => c.id === targetId || c.callNumber.toLowerCase() === targetId.toLowerCase()
  );
  if (!targetCard) return backlinks;

  const targetIdentifiers = [targetCard.id.toLowerCase(), targetCard.callNumber.toLowerCase()];

  for (const card of cards) {
    if (card.id === targetCard.id) continue;

    for (const thread of card.threads) {
      const isReferencedInLinks = thread.linkedTopicIds?.some((link) =>
        targetIdentifiers.includes(link.trim().toLowerCase())
      );
      if (isReferencedInLinks) {
        backlinks.push({
          sourceCardId: card.id,
          sourceTopic: card.topic,
          sourceCallNumber: card.callNumber,
          threadDate: thread.date,
          threadSnippet: thread.note.length > 60 ? `${thread.note.slice(0, 60)}...` : thread.note,
        });
      }
    }
  }

  return backlinks;
}

/**
 * 현재 카드와 다른 무작위 카드의 ID를 반환합니다.
 */
export function getRandomCardId(currentId: string, cards: TopicCard[]): string {
  if (cards.length <= 1) return currentId;

  const candidateCards = cards.filter((c) => c.id !== currentId);
  const randomIndex = Math.floor(Math.random() * candidateCards.length);
  return candidateCards[randomIndex].id;
}

/**
 * 이전 또는 다음 방향으로 단순 순환하여 카드의 ID를 반환합니다.
 */
export function getNextCardId(
  currentId: string,
  cards: TopicCard[],
  direction: 'next' | 'prev'
): string {
  if (cards.length === 0) return currentId;

  const sortedCards = [...cards].sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));
  const currentIndex = sortedCards.findIndex((c) => c.id === currentId);
  if (currentIndex === -1) return sortedCards[0].id;

  if (direction === 'next') {
    const nextIndex = (currentIndex + 1) % sortedCards.length;
    return sortedCards[nextIndex].id;
  } else {
    const prevIndex = (currentIndex - 1 + sortedCards.length) % sortedCards.length;
    return sortedCards[prevIndex].id;
  }
}

/**
 * 연계 카드의 ID 또는 청구기호를 바탕으로 화면 표시 텍스트와 이동 대상 카드 ID를 도출합니다.
 * - 대상 카드의 청구기호가 'B-'(서지 서가)로 시작하는 경우: 본문 첫 줄(책 제목)을 가져와 [책제목]으로 표시.
 * - 그 외 일반 사유 카드를 참조하는 경우: 청구기호 그대로 [청구기호]로 표시.
 * - 대상 카드를 찾지 못한 경우 fallback: [linkedId]로 표시.
 *
 * @param linkedId 참조 중인 카드 ID 또는 청구기호
 * @param cards 전체 장서 카드 목록
 * @returns { displayText: string; targetCardId: string }
 */
export function resolveLinkedCardInfo(
  linkedId: string,
  cards: TopicCard[]
): { displayText: string; targetCardId: string } {
  if (!linkedId) {
    return { displayText: '', targetCardId: '' };
  }

  const targetCard = cards.find(
    (c) => c.id === linkedId || c.callNumber.toLowerCase() === linkedId.toLowerCase()
  );

  if (!targetCard) {
    return {
      displayText: `[${linkedId}]`,
      targetCardId: linkedId,
    };
  }

  const callNum = targetCard.callNumber.trim();

  // 'B-' (서지 서가)로 시작하는 카드인 경우: 책 제목(topic, 노션의 '메모' 항목)을 가져와 표시
  if (callNum.toUpperCase().startsWith('B-')) {
    const title = targetCard.topic?.trim() || callNum;
    return {
      displayText: `[${title}]`,
      targetCardId: targetCard.id,
    };
  }

  // 그 외 일반 사유 카드인 경우: 청구기호 그대로 표시
  return {
    displayText: `[${callNum}]`,
    targetCardId: targetCard.id,
  };
}

/**
 * 단상 본문 내용을 사서 인증 여부에 따라 마스킹하거나 원본 텍스트로 반환합니다.
 * - RESTRICTED 스탬프이고 미인증(isAuthenticated = false)인 경우:
 *   "사서 열람 권한이 필요한 구역입니다."
 * - 그 외 스탬프 또는 인증 완료 시:
 *   thread.note
 *
 * @param thread 검사할 단상 스레드 객체
 * @param isAuthenticated 사서 전역 인가 여부
 * @returns 렌더링할 본문 텍스트
 */
export function getThreadDisplayNote(
  thread: CardThread,
  isAuthenticated: boolean
): string {
  if (!thread) return '';
  if (thread.stampType === 'RESTRICTED' && !isAuthenticated) {
    return '사서 열람 권한이 필요한 구역입니다.';
  }
  return thread.note;
}

/**
 * 청구기호를 분석하여 사용자의 고유 5대 분과 및 서지 서고 분류명을 자동 도출합니다.
 * - 'B-' 로 시작: 'B- 서지 서고'
 * - '1' 로 시작: '100 언어와 번역'
 * - '2' 로 시작: '200 서사와 창작'
 * - '3' 로 시작: '300 인간과 관계'
 * - '4' 로 시작: '400 미학과 신앙'
 * - '5' 로 시작: '500 기계와 인간성'
 * - '6' 로 시작: '600 자연과 사유'
 * - 그 외: '기타 사유 서가'
 */
export function resolveClassification(callNumber: string): string {
  if (!callNumber) return '기타 사유 서가';

  const cleanCall = callNumber.trim().toUpperCase();

  if (cleanCall.startsWith('B-')) {
    return 'B- 서지 서가';
  }

  const firstChar = cleanCall.charAt(0);
  switch (firstChar) {
    case '1':
      return '100 언어와 번역';
    case '2':
      return '200 서사와 창작';
    case '3':
      return '300 인간과 관계';
    case '4':
      return '400 미학과 신앙';
    case '5':
      return '500 기계와 인간성';
    case '6':
      return '600 자연과 사유';
    default:
      return '기타 사유 서가';
  }
}

/**
 * 기본 7대 분과 체계 (도서관 십진분류표 판넬용)
 */
export const BASE_CATEGORIES: Array<{ code: string; name: string }> = [
  { code: '100', name: '언어와 번역' },
  { code: '200', name: '서사와 창작' },
  { code: '300', name: '인간과 관계' },
  { code: '400', name: '미학과 신앙' },
  { code: '500', name: '기계와 인간성' },
  { code: '600', name: '자연과 사유' },
  { code: 'B', name: '서지 서가' },
];

/**
 * 카드의 청구기호를 분석하여 해당 대분과 코드('100', '200', 'B' 등)를 반환합니다.
 */
export function getCategoryCodeForCard(callNumber: string): string {
  if (!callNumber) return 'ETC';
  const clean = callNumber.trim().toUpperCase();
  if (clean.startsWith('B')) return 'B';

  const firstChar = clean.charAt(0);
  if (/^[0-9]$/.test(firstChar)) {
    return `${firstChar}00`;
  }
  return 'ETC';
}

/**
 * 전체 카드를 대분과 체계(100~600, B)에 맞추어 집계하고,
 * 각 분과별 등록 메모 건수와 첫 번째 카드 ID를 포함한 십진분류표 스케줄을 반환합니다.
 * 향후 700번대 등 신규 분과가 추가되면 동적으로 목록에 확장됩니다.
 */
export function getCategorySchedule(cards: TopicCard[]): CategoryScheduleItem[] {
  // 1) 기본 7대 분과 목록 복사
  const categoryMap = new Map<string, { name: string; cards: TopicCard[] }>();

  BASE_CATEGORIES.forEach((cat) => {
    categoryMap.set(cat.code, { name: cat.name, cards: [] });
  });

  // 2) 전체 카드를 청구기호 순으로 정렬 후 대분과별로 분류
  const sortedCards = [...cards].sort((a, b) => compareCallNumbers(a.callNumber, b.callNumber));

  sortedCards.forEach((card) => {
    const code = getCategoryCodeForCard(card.callNumber);
    if (!categoryMap.has(code)) {
      // 신규 분과(예: 600번대 등) 동적 등록
      const rawClassification = resolveClassification(card.callNumber);
      const name = rawClassification.startsWith(code)
        ? rawClassification.replace(code, '').trim()
        : rawClassification;
      categoryMap.set(code, { name: name || '사유 분과', cards: [] });
    }
    categoryMap.get(code)!.cards.push(card);
  });

  // 3) 스케줄 배열로 변환
  const result: CategoryScheduleItem[] = [];

  categoryMap.forEach((val, code) => {
    const count = val.cards.length;
    const firstCardId = count > 0 ? val.cards[0].id : undefined;
    const fullName = code === 'B' ? 'B 서지 서가' : `${code} ${val.name}`;

    result.push({
      code,
      name: val.name,
      fullName,
      count,
      firstCardId,
      hasCards: count > 0,
    });
  });

  return result;
}

/**
 * 청구기호의 계층적 가지치기 구조를 한 글자씩 거슬러 올라가 직계 조상 청구기호 목록을 반환합니다.
 * 예:
 * '501-a4a3' -> ['501-a4a', '501-a4', '501-a', '501', '500']
 * '401' -> ['400']
 * 'B-1a' -> ['B-1', 'B']
 */
export function getAncestorCallNumbers(callNumber: string): string[] {
  if (!callNumber) return [];
  const ancestors: string[] = [];
  let current = callNumber.trim();

  // 하이픈 뒤의 가지치기 접미사를 하나씩 줄여나감
  while (current.includes('-')) {
    const lastHyphenIndex = current.lastIndexOf('-');
    const base = current.slice(0, lastHyphenIndex);
    const branch = current.slice(lastHyphenIndex + 1);

    if (branch.length > 1) {
      current = `${base}-${branch.slice(0, -1)}`;
      ancestors.push(current);
    } else {
      current = base;
      ancestors.push(current);
    }
  }

  // 3자리 순수 숫자인 경우 백의 자리 대분과(예: 501 -> 500)로 도출
  if (/^\d{3}$/.test(current) && !current.endsWith('00')) {
    const majorRoot = `${current[0]}00`;
    ancestors.push(majorRoot);
  } else if (current.toUpperCase().startsWith('B') && current.length > 1) {
    if (!ancestors.includes('B')) {
      ancestors.push('B');
    }
  }

  return ancestors;
}

/**
 * 카드의 청구기호와 전체 분류 맵을 바탕으로,
 * 1) 본인 분류가 있으면 본인 분류 반환
 * 2) 본인 분류가 비어있으면 가장 가까운 직계 조상(부모 -> 조부모 ...)의 분류를 상속
 * 3) 조상에도 분류가 없으면 대분과 명칭(예: '기계와 인간성', '미학과 신앙')을 반환
 */
export function resolveInheritedCategory(
  callNumber: string,
  categoryMap: Map<string, string>
): string {
  const cleanCall = (callNumber || '').trim();

  // 1) 본인 분류 검사
  const selfCategory = categoryMap.get(cleanCall);
  if (selfCategory && selfCategory.trim()) {
    return selfCategory.trim();
  }

  // 2) 직계 조상 역추적 탐색
  const ancestors = getAncestorCallNumbers(cleanCall);
  for (const ancestor of ancestors) {
    const inherited = categoryMap.get(ancestor);
    if (inherited && inherited.trim()) {
      return inherited.trim();
    }
  }

  // 3) 대분과 기본 명칭 fallback
  const rawClassification = resolveClassification(cleanCall);
  // '500 기계와 인간성' -> '기계와 인간성', 'B- 서지 서가' -> '서지 서가'
  const parts = rawClassification.split(/\s+/);
  if (parts.length > 1) {
    return parts.slice(1).join(' ').trim();
  }
  return rawClassification;
}


