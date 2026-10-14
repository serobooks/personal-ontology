import { describe, it, expect } from 'vitest';
import { mockCards } from '@/data/mockCards';
import {
  findBacklinks,
  getRandomCardId,
  validateCardIntegrity,
  parseCallNumber,
  compareCallNumbers,
  getMainTopics,
  getMajorThreadCount,
  getNextFamilyThread,
  getPrevFamilyThread,
  getMajorJumpCardId,
  searchCards,
  resolveLinkedCardInfo,
  getThreadDisplayNote,
  resolveClassification,
  getLandmarkCards,
  getCategorySchedule,
  getAncestorCallNumbers,
  resolveInheritedCategory,
} from '@/lib/catalogUtils';
import { TopicCard, CardThread, CategoryScheduleItem } from '@/types/catalog';

/**
 * 도서관 장서 청구기호 및 검색 유틸리티 종합 검증
 */
describe('도서관 장서 온톨로지 카탈로그 유틸리티 및 검색 검증', () => {
  it('목업 카드는 유효한 청구기호 형식([3자리]-[가지치기] 또는 [B-번호])을 따라야 한다', () => {
    const callNumberRegex = /^(\d{3}(-[a-z0-9]+)?|B-\d+)$/;

    mockCards.forEach((card) => {
      expect(validateCardIntegrity(card)).toBe(true);
      expect(card.callNumber).toMatch(callNumberRegex);
    });
  });

  it('searchCards: 제목, 청구기호, 단상 본문 텍스트를 실시간으로 검색해야 한다', () => {
    // 1) 빈 검색어는 전체 카드 반환
    expect(searchCards('', mockCards).length).toBe(mockCards.length);

    // 2) 청구기호로 검색
    const byCallNumber = searchCards('101-a', mockCards);
    expect(byCallNumber.some((c) => c.callNumber === '101-a')).toBe(true);

    // 3) 주제 제목으로 검색 (예: '바벨')
    const byTopic = searchCards('바벨', mockCards);
    expect(byTopic.length).toBeGreaterThanOrEqual(1);
    expect(byTopic[0].topic).toContain('바벨');

    // 4) 단상 본문 메모 내용으로 검색 (예: '마이크로필름')
    const byThreadNote = searchCards('마이크로필름', mockCards);
    expect(byThreadNote.length).toBeGreaterThanOrEqual(1);
    expect(byThreadNote[0].callNumber).toBe('101');

    // 5) 일치 결과가 없을 때 빈 배열 반환
    const noResult = searchCards('우주정거장999', mockCards);
    expect(noResult.length).toBe(0);
  });

  it('parseCallNumber: 청구기호를 3자리 대주제와 가지치기 식별자로 파싱해야 한다', () => {
    expect(parseCallNumber('101')).toEqual({ majorCode: '101', branch: '' });
    expect(parseCallNumber('101-a')).toEqual({ majorCode: '101', branch: 'a' });
    expect(parseCallNumber('101-a1')).toEqual({ majorCode: '101', branch: 'a1' });
  });

  it('compareCallNumbers: 3자리 코드 우선 및 가지치기 계층 순으로 정렬해야 한다', () => {
    const rawList = ['101-b', '201', '101', '101-a1', '301', '101-a', '201-a'];
    const sorted = [...rawList].sort(compareCallNumbers);

    expect(sorted).toEqual([
      '101',
      '101-a',
      '101-a1',
      '101-b',
      '201',
      '201-a',
      '301',
    ]);
  });

  it('getNextFamilyThread: 101 카드의 단상 3개를 다 보면 다음 가지치기 카드(101-a)의 첫 단상으로 넘어가야 한다', () => {
    const card101 = mockCards.find((c) => c.callNumber === '101')!;
    const card101a = mockCards.find((c) => c.callNumber === '101-a')!;

    let res = getNextFamilyThread(card101.id, 0, mockCards);
    expect(res).toEqual({ nextCardId: card101.id, nextThreadIndex: 1 });

    res = getNextFamilyThread(card101.id, 2, mockCards);
    expect(res).toEqual({ nextCardId: card101a.id, nextThreadIndex: 0 });
  });

  it('getMainTopics: 세 자리 대주제 카드만 반환해야 한다', () => {
    const mainTopics = getMainTopics(mockCards);
    expect(mainTopics.map((c) => c.callNumber)).toEqual(['101', '201', '301']);
  });

  it('getMajorThreadCount: 해당 대주제 계열의 총 메모 수를 정확히 계산해야 한다', () => {
    expect(getMajorThreadCount('101', mockCards)).toBe(9);
    expect(getMajorThreadCount('201', mockCards)).toBe(4);
  });

  it('resolveLinkedCardInfo: B- 서지 카드는 책 제목(topic)을, 일반 카드는 청구기호를 [이름] 형태로 치환해야 한다', () => {
    const dummyCards: TopicCard[] = [
      {
        id: 'book-crocodile',
        callNumber: 'B-1',
        topic: '악어일기',
        author: '추먀오진',
        classification: '소설 / 대만문학',
        acquisitionDate: '1994-06-01',
        summary: '소설',
        tags: ['악어일기'],
        threads: [
          {
            id: 't-b1',
            date: '1994-06-01',
            stampType: 'RESTRICTED',
            note: '추먀오진, 1994\n나는 인간 세상에 들어갈 수 없는 악어다.',
          },
        ],
      },
      {
        id: 'ars-memoriae',
        callNumber: '201-a',
        topic: '기억의 극장',
        author: '카밀로',
        classification: '201 형이상학',
        acquisitionDate: '1550-01-01',
        summary: '기억술',
        tags: ['기억'],
        threads: [
          {
            id: 't-201a',
            date: '1550-01-01',
            stampType: 'ESTABLISHED',
            note: '기억의 방에 배치한다.',
          },
        ],
      },
    ];

    // 1) B-1 서지 카드 참조 시: 책 제목(topic)인 [악어일기] 반환 (본문의 저자/연도 대신)
    const bResult = resolveLinkedCardInfo('B-1', dummyCards);
    expect(bResult.displayText).toBe('[악어일기]');
    expect(bResult.targetCardId).toBe('book-crocodile');

    // 2) ID로 참조할 때도 B- 카드라면 책 제목인 [악어일기] 반환
    const bResultById = resolveLinkedCardInfo('book-crocodile', dummyCards);
    expect(bResultById.displayText).toBe('[악어일기]');
    expect(bResultById.targetCardId).toBe('book-crocodile');

    // 3) 일반 사유 카드 참조 시: 청구기호 그대로 [201-a] 반환
    const generalResult = resolveLinkedCardInfo('ars-memoriae', dummyCards);
    expect(generalResult.displayText).toBe('[201-a]');
    expect(generalResult.targetCardId).toBe('ars-memoriae');

    // 4) 없는 카드 참조 시: fallback
    const fallbackResult = resolveLinkedCardInfo('999-z', dummyCards);
    expect(fallbackResult.displayText).toBe('[999-z]');
    expect(fallbackResult.targetCardId).toBe('999-z');
  });

  it('getThreadDisplayNote: RESTRICTED 스탬프이고 미인증일 때 마스킹 문구를, 인증 완료 시 본문을 반환해야 한다', () => {
    const restrictedThread: CardThread = {
      id: 't-restricted',
      date: '1984-01-01',
      stampType: 'RESTRICTED',
      note: '극비 온톨로지 설계도 본문 내용입니다.',
    };

    const quoteThread: CardThread = {
      id: 't-quote',
      date: '1994-06-15',
      stampType: 'QUOTATION',
      note: '악어일기 인용구 내용입니다.',
    };

    // 1) RESTRICTED + 미인증: 마스킹 텍스트
    const masked = getThreadDisplayNote(restrictedThread, false);
    expect(masked).toBe('사서 열람 권한이 필요한 구역입니다.');

    // 2) RESTRICTED + 인증 완료: 원본 본문 노출
    const unmasked = getThreadDisplayNote(restrictedThread, true);
    expect(unmasked).toBe('극비 온톨로지 설계도 본문 내용입니다.');

    // 3) QUOTE 등 일반 스탬프: 미인증이어도 원본 노출
    const normal = getThreadDisplayNote(quoteThread, false);
    expect(normal).toBe('악어일기 인용구 내용입니다.');
  });

  it('resolveClassification: 청구기호 앞자리를 분석하여 사용자의 5대 분과 및 서지 서가를 자동 도출해야 한다', () => {
    expect(resolveClassification('B-1')).toBe('B- 서지 서가');
    expect(resolveClassification('b-crocodile')).toBe('B- 서지 서가');
    expect(resolveClassification('101')).toBe('100 언어와 번역');
    expect(resolveClassification('101-a')).toBe('100 언어와 번역');
    expect(resolveClassification('201')).toBe('200 서사와 창작');
    expect(resolveClassification('301-1')).toBe('300 인간과 관계');
    expect(resolveClassification('405')).toBe('400 미학과 신앙');
    expect(resolveClassification('520-b')).toBe('500 기계와 인간성');
    expect(resolveClassification('601')).toBe('600 자연과 사유');
    expect(resolveClassification('620-b')).toBe('600 자연과 사유');
    expect(resolveClassification('999')).toBe('기타 사유 서가');
  });

  it('findBacklinks: 카드 ID 뿐만 아니라 청구기호(callNumber)로 참조된 역링크도 정확하게 탐색해야 한다', () => {
    const testCards: TopicCard[] = [
      {
        id: 'notion-page-book',
        callNumber: 'B-1',
        topic: '러브 머신',
        author: '사서',
        classification: 'B- 서지 서가',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [{ id: 't1', date: '2026-09-22', stampType: 'UNFINISHED', note: '러브 머신' }],
        tags: [],
      },
      {
        id: 'notion-page-quote-1',
        callNumber: '501-a1',
        topic: 'AI와 정서적 애착',
        author: '사서',
        classification: '500 기계와 인간성',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [
          {
            id: 't2',
            date: '2026-09-22',
            stampType: 'QUOTATION',
            note: '기계에 애착을 갖는다.',
            linkedTopicIds: ['B-1'],
          },
        ],
        tags: [],
      },
    ];

    const backlinks = findBacklinks('notion-page-book', testCards);
    expect(backlinks).toHaveLength(1);
    expect(backlinks[0].sourceCallNumber).toBe('501-a1');

    const backlinksByCall = findBacklinks('B-1', testCards);
    expect(backlinksByCall).toHaveLength(1);
    expect(backlinksByCall[0].sourceCallNumber).toBe('501-a1');
  });

  it('getLandmarkCards: 사용자가 "분류"를 지정한 카드 및 서지 카드를 랜드마크로 추출해야 한다', () => {
    const mixedCards: TopicCard[] = [
      {
        id: 'c1',
        callNumber: '501-a1',
        topic: '무생물에 공감하는 능력',
        author: '사서',
        classification: '500 기계와 인간성 / 무생물에 공감하는 능력',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c2',
        callNumber: '501-a1a',
        topic: '돌에 공감하는 마음',
        author: '사서',
        classification: '500 기계와 인간성', // 분류 미지정
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c3',
        callNumber: '501-a2',
        topic: '디지털 동반자라는 안전지대',
        author: '사서',
        classification: '500 기계와 인간성 / 디지털 동반자라는 안전지대',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c4',
        callNumber: 'B-1',
        topic: '러브 머신',
        author: '사서',
        classification: 'B- 서지 서가',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
    ];

    const landmarks = getLandmarkCards(mixedCards);
    expect(landmarks).toHaveLength(3); // c1, c3, c4
    expect(landmarks.map((l: TopicCard) => l.callNumber)).toEqual(['501-a1', '501-a2', 'B-1']);

    // 랜드마크 간 점프 검증
    // c1(501-a1)에서 다음 점프 -> c3(501-a2)
    const nextJump = getMajorJumpCardId('c1', mixedCards, 'next');
    expect(nextJump).toBe('c3');

    // c2(501-a1a, 가지 카드)에서 다음 점프 -> c3(501-a2)
    const nextJumpFromBranch = getMajorJumpCardId('c2', mixedCards, 'next');
    expect(nextJumpFromBranch).toBe('c3');
  });

  it('getCategorySchedule: 도서관 십진분류표처럼 기본 대분과(100~600, B) 목록과 카드 건수를 정확히 집계해야 한다', () => {
    // 1) 빈 카드 목록일 때도 기본 7대 분과가 0건으로 유지되어야 함
    const emptySchedule = getCategorySchedule([]);
    expect(emptySchedule).toHaveLength(7);
    expect(emptySchedule.map((s) => s.code)).toEqual(['100', '200', '300', '400', '500', '600', 'B']);
    expect(emptySchedule.every((s) => s.count === 0 && !s.hasCards)).toBe(true);

    // 2) 500번대 카드 2개, B-1 카드 1개가 있을 때
    const sampleCards: TopicCard[] = [
      {
        id: 'c1',
        callNumber: '501-a1',
        topic: '무생물에 공감하는 능력',
        author: '사서',
        classification: '500 기계와 인간성 / 무생물에 공감하는 능력',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c2',
        callNumber: '501-a2',
        topic: '디지털 동반자라는 안전지대',
        author: '사서',
        classification: '500 기계와 인간성 / 디지털 동반자라는 안전지대',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
      {
        id: 'c3',
        callNumber: 'B-1',
        topic: '러브 머신',
        author: '사서',
        classification: 'B- 서지 서가',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
    ];

    const schedule = getCategorySchedule(sampleCards);
    expect(schedule).toHaveLength(7);

    const cat100 = schedule.find((s) => s.code === '100');
    expect(cat100?.count).toBe(0);
    expect(cat100?.hasCards).toBe(false);
    expect(cat100?.fullName).toBe('100 언어와 번역');

    const cat500 = schedule.find((s) => s.code === '500');
    expect(cat500?.count).toBe(2);
    expect(cat500?.hasCards).toBe(true);
    expect(cat500?.firstCardId).toBe('c1');
    expect(cat500?.fullName).toBe('500 기계와 인간성');

    const cat600 = schedule.find((s) => s.code === '600');
    expect(cat600?.count).toBe(0);
    expect(cat600?.hasCards).toBe(false);
    expect(cat600?.fullName).toBe('600 자연과 사유');

    const catB = schedule.find((s) => s.code === 'B');
    expect(catB?.count).toBe(1);
    expect(catB?.hasCards).toBe(true);
    expect(catB?.firstCardId).toBe('c3');
    expect(catB?.fullName).toBe('B 서지 서가');

    // 3) 향후 700번대 등 미등록 신규 분과 카드가 추가되었을 때 동적으로 대분과가 확장되어야 함
    const extendedCards: TopicCard[] = [
      ...sampleCards,
      {
        id: 'c4',
        callNumber: '701-a',
        topic: '새로운 700번대 사유',
        author: '사서',
        classification: '700 미래와 진화',
        acquisitionDate: '2026-09-22',
        summary: '',
        threads: [],
        tags: [],
      },
    ];

    const extendedSchedule = getCategorySchedule(extendedCards);
    expect(extendedSchedule).toHaveLength(8);
    const cat700 = extendedSchedule.find((s) => s.code === '700');
    expect(cat700?.count).toBe(1);
    expect(cat700?.firstCardId).toBe('c4');
  });

  it('getAncestorCallNumbers: 루만식 교대 청구기호 체계(숫자 ➔ 영문 ➔ 숫자 ➔ 영문) 단위로 직계 조상 목록을 산출해야 한다', () => {
    // 5단계 직렬 체인: 501-4a1a1 -> 501-4a1a -> 501-4a1 -> 501-4a -> 501-4 -> 501 -> 500
    expect(getAncestorCallNumbers('501-4a1a1')).toEqual([
      '501-4a1a',
      '501-4a1',
      '501-4a',
      '501-4',
      '501',
      '500',
    ]);

    // 501-1a -> 501-1 -> 501 -> 500
    expect(getAncestorCallNumbers('501-1a')).toEqual([
      '501-1',
      '501',
      '500',
    ]);

    // 211-1 -> 211 -> 210 -> 200
    expect(getAncestorCallNumbers('211-1')).toEqual([
      '211',
      '210',
      '200',
    ]);

    // 401 -> 400
    expect(getAncestorCallNumbers('401')).toEqual(['400']);

    // B-1 -> B
    expect(getAncestorCallNumbers('B-1')).toEqual(['B']);
  });

  it('resolveInheritedCategory: 분류가 비어있으면 가장 가까운 상위 조상의 분류를 상속하고, 없으면 대분과명을 반환해야 한다', () => {
    const categoryMap = new Map<string, string>([
      ['501-a4', 'AI 팔로워'],
      ['501-a1', '무생물에 공감하는 능력'],
    ]);

    // 1) 본인에게 분류가 있는 경우 본인 분류 반환
    expect(resolveInheritedCategory('501-a4', categoryMap)).toBe('AI 팔로워');

    // 2) 501-a4a3에는 없지만 조상 501-a4에 'AI 팔로워'가 있으므로 상속
    expect(resolveInheritedCategory('501-a4a3', categoryMap)).toBe('AI 팔로워');
    expect(resolveInheritedCategory('501-a4a', categoryMap)).toBe('AI 팔로워');

    // 3) 501-a1a는 조상 501-a1의 '무생물에 공감하는 능력'을 상속
    expect(resolveInheritedCategory('501-a1a', categoryMap)).toBe('무생물에 공감하는 능력');

    // 4) 401 처럼 상위에 아무런 분류도 등록되지 않은 경우: 400 대분과명 '미학과 신앙' 반환
    expect(resolveInheritedCategory('401', categoryMap)).toBe('미학과 신앙');

    // 5) 501-b (상위에 500번대 등록된 커스텀 분류가 없는 경우): 500 대분과명 '기계와 인간성' 반환
    expect(resolveInheritedCategory('501-b', categoryMap)).toBe('기계와 인간성');

    // 6) 601-b: 600 대분과명 '자연과 사유' 반환
    expect(resolveInheritedCategory('601-b', categoryMap)).toBe('자연과 사유');
  });
});


