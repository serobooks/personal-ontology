import { describe, it, expect } from 'vitest';
import { getSearchSnippet, getCardSearchText } from './searchSnippetUtils';
import { TopicCard } from '@/types/catalog';

describe('searchSnippetUtils - 검색 결과 스니펫 및 하이라이트 생성', () => {
  const sampleNote = '요즘 X를 보면 번역기를 돌린 게 훤히 보이는 외국인 계정이 많다.';

  it('검색어가 본문 중간에 있을 때 검색어 앞 약 6글자부터 스니펫을 생성하고 말줄임표 플래그를 설정해야 한다', () => {
    const query = '외국인';
    const result = getSearchSnippet(sampleNote, query, 6);

    expect(result.hasMatch).toBe(true);
    expect(result.prefixEllipsis).toBe(true);

    // segments 검증: [앞 텍스트, 매칭된 '외국인', 뒤 텍스트]
    const matchSegment = result.segments.find((s) => s.isMatch);
    expect(matchSegment).toBeDefined();
    expect(matchSegment?.text).toBe('외국인');

    // 검색어 앞글자 포함 여부 (약 6글자)
    const beforeText = result.segments[0].text;
    expect(beforeText).toContain('보이는');
  });

  it('검색어가 본문 서두에 있을 때 말줄임표(prefixEllipsis)가 false여야 한다', () => {
    const query = '요즘';
    const result = getSearchSnippet(sampleNote, query, 6);

    expect(result.hasMatch).toBe(true);
    expect(result.prefixEllipsis).toBe(false);
    expect(result.segments[0].text).toBe('요즘');
    expect(result.segments[0].isMatch).toBe(true);
  });

  it('검색어가 없거나 본문에 일치하지 않으면 원본 텍스트의 처음부터 반환해야 한다', () => {
    const emptyResult = getSearchSnippet(sampleNote, '', 6);
    expect(emptyResult.hasMatch).toBe(false);
    expect(emptyResult.prefixEllipsis).toBe(false);
    expect(emptyResult.segments[0].text).toBe(sampleNote);

    const noMatchResult = getSearchSnippet(sampleNote, '인공지능', 6);
    expect(noMatchResult.hasMatch).toBe(false);
    expect(noMatchResult.prefixEllipsis).toBe(false);
    expect(noMatchResult.segments[0].text).toBe(sampleNote);
  });

  it('대소문자를 무시하고 매칭하되 원본의 대소문자를 유지해야 한다', () => {
    const englishNote = 'Personal Ontology with Next.js and System 7 aesthetics.';
    const result = getSearchSnippet(englishNote, 'next.js', 6);

    expect(result.hasMatch).toBe(true);
    const matchSegment = result.segments.find((s) => s.isMatch);
    expect(matchSegment?.text).toBe('Next.js');
  });

  it('getCardSearchText는 검색어가 포함된 스레드의 note를 우선적으로 반환해야 한다', () => {
    const mockCard: TopicCard = {
      id: 'test-card-1',
      callNumber: '501-a1',
      topic: '기계와 인간성',
      author: 'Hailey',
      classification: '500 기계와 인간성',
      acquisitionDate: '2026-09-23',
      summary: '요약문입니다.',
      threads: [
        {
          id: 'th-1',
          date: '2026-09-22',
          stampType: 'UNFINISHED',
          note: '첫 번째 단상: 아무 내용 없음',
        },
        {
          id: 'th-2',
          date: '2026-09-23',
          stampType: 'ESTABLISHED',
          note: '두 번째 단상: 하이퍼텍스트의 역사와 발전',
        },
      ],
      tags: ['컴퓨터'],
    };

    // '하이퍼텍스트' 검색 시 두 번째 스레드의 note 선택
    const text = getCardSearchText(mockCard, '하이퍼텍스트');
    expect(text).toBe('두 번째 단상: 하이퍼텍스트의 역사와 발전');

    // 검색어 없을 시 첫 번째 스레드의 note 선택
    const defaultText = getCardSearchText(mockCard, '');
    expect(defaultText).toBe('첫 번째 단상: 아무 내용 없음');
  });
});
