import { TopicCard } from '@/types/catalog';

export interface SnippetSegment {
  text: string;
  isMatch: boolean;
}

export interface SearchSnippetResult {
  hasMatch: boolean;
  prefixEllipsis: boolean;
  segments: SnippetSegment[];
  displayText: string;
}

/**
 * 검색어를 기반으로 본문 텍스트에서 스니펫 및 하이라이트 세그먼트를 추출합니다.
 * @param text 대상 본문 문자열
 * @param query 검색어
 * @param contextChars 검색어 앞쪽으로 포함할 문맥 글자 수 (기본: 6글자)
 */
export function getSearchSnippet(
  text: string,
  query: string,
  contextChars: number = 6
): SearchSnippetResult {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || !text) {
    return {
      hasMatch: false,
      prefixEllipsis: false,
      segments: [{ text: text || '', isMatch: false }],
      displayText: text || '',
    };
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return {
      hasMatch: false,
      prefixEllipsis: false,
      segments: [{ text, isMatch: false }],
      displayText: text,
    };
  }

  const startIndex = Math.max(0, matchIndex - contextChars);
  const prefixEllipsis = startIndex > 0;

  // startIndex부터 끝까지 텍스트 슬라이싱
  const slicedText = text.slice(startIndex);
  const slicedLower = slicedText.toLowerCase();
  const slicedMatchIndex = slicedLower.indexOf(lowerQuery);
  const queryLen = trimmedQuery.length;

  const before = slicedText.slice(0, slicedMatchIndex);
  const match = slicedText.slice(slicedMatchIndex, slicedMatchIndex + queryLen);
  const after = slicedText.slice(slicedMatchIndex + queryLen);

  const segments: SnippetSegment[] = [];
  if (before) segments.push({ text: before, isMatch: false });
  segments.push({ text: match, isMatch: true });
  if (after) segments.push({ text: after, isMatch: false });

  return {
    hasMatch: true,
    prefixEllipsis,
    segments,
    displayText: (prefixEllipsis ? '…' : '') + slicedText,
  };
}

/**
 * 카드의 스레드 중 검색어와 일치하는 스레드의 note를 우선적으로 반환하거나 첫 번째 note를 반환합니다.
 */
export function getCardSearchText(card: TopicCard, query: string): string {
  const trimmed = query.trim().toLowerCase();
  if (trimmed && card.threads && card.threads.length > 0) {
    const matchingThread = card.threads.find((t) =>
      t.note.toLowerCase().includes(trimmed)
    );
    if (matchingThread) return matchingThread.note;
  }
  return card.threads?.[0]?.note || card.summary || card.topic;
}
