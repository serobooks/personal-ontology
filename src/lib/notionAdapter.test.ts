import { describe, it, expect } from 'vitest';
import { transformNotionPagesToCards } from './notionAdapter';

describe('notionAdapter - 노션 데이터베이스 레코드를 TopicCard로 변환', () => {
  it('기본 사유 카드 및 지정일 우선 로직이 올바르게 변환되어야 한다', () => {
    const rawPages = [
      {
        id: 'page-1',
        created_time: '2026-09-22T07:04:00.000Z',
        properties: {
          '메모': {
            type: 'title',
            title: [{ plain_text: '익명 게시판에서 활동하다가 문득 생각이 들었다.' }],
          },
          '청구기호': {
            type: 'rich_text',
            rich_text: [{ plain_text: '501-a4a1' }],
          },
          '스탬프': {
            type: 'select',
            select: { name: 'UNFINISHED' },
          },
          '지정일': {
            type: 'date',
            date: { start: '2024-05-18' }, // 지정일 우선 테스트
          },
          '연계 카드': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'B-1, 501-a4' }],
          },
          '기록일': {
            type: 'created_time',
            created_time: '2026-09-22T07:04:00.000Z',
          },
        },
      },
      {
        id: 'page-2',
        created_time: '2026-09-22T07:02:00.000Z',
        properties: {
          '메모': {
            type: 'title',
            title: [{ plain_text: '러브 머신(제임스 멀둔, 2026)' }],
          },
          '청구기호': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'B-1' }],
          },
          '스탬프': {
            type: 'select',
            select: null, // 비어있을 때 fallback 테스트
          },
          '지정일': {
            type: 'date',
            date: null,
          },
          '연계 카드': {
            type: 'rich_text',
            rich_text: [],
          },
          '기록일': {
            type: 'created_time',
            created_time: '2026-09-22T07:02:00.000Z',
          },
        },
      },
    ];

    const cards = transformNotionPagesToCards(rawPages as any);

    expect(cards).toHaveLength(2);

    // 1번 카드 검증 (사유 카드 + 지정일 우선 + 연계 카드 분리)
    const card1 = cards[0];
    expect(card1.callNumber).toBe('501-a4a1');
    expect(card1.classification).toBe('500 기계와 인간성');
    expect(card1.threads[0].date).toBe('2024-05-18'); // 지정일 최우선 적용
    expect(card1.threads[0].stampType).toBe('UNFINISHED');
    expect(card1.threads[0].linkedTopicIds).toEqual(['B-1', '501-a4']);
    expect(card1.threads[0].note).toBe('익명 게시판에서 활동하다가 문득 생각이 들었다.');

    // 2번 카드 검증 (B- 서지 카드 + 생성일 fallback + 기본 스탬프 UNFINISHED + 기본 분류 '서지 서가')
    const card2 = cards[1];
    expect(card2.callNumber).toBe('B-1');
    expect(card2.classification).toBe('서지 서가');
    expect(card2.topic).toBe('러브 머신(제임스 멀둔, 2026)');
    expect(card2.threads[0].date).toBe('2026-09-22'); // 지정일 없을 시 created_time 기준
    expect(card2.threads[0].stampType).toBe('UNFINISHED');
  });

  it('사용자가 노션의 "분류" 프로퍼티를 입력한 경우 대분과명과 결합되어 표기되고 topic으로 채택되어야 한다', () => {
    const rawPages = [
      {
        id: 'landmark-1',
        created_time: '2026-09-22T06:40:00.000Z',
        properties: {
          '메모': {
            type: 'title',
            title: [{ plain_text: '장난감이나 도구, 혹은 기계 같은 외부 대상이 정서적...' }],
          },
          '청구기호': {
            type: 'rich_text',
            rich_text: [{ plain_text: '501-a1' }],
          },
          '스탬프': {
            type: 'select',
            select: { name: 'QUOTATION' },
          },
          '분류': {
            type: 'rich_text',
            rich_text: [{ plain_text: '무생물에 공감하는 능력' }],
          },
        },
      },
    ];

    const cards = transformNotionPagesToCards(rawPages as any);
    expect(cards).toHaveLength(1);
    const card = cards[0];
    expect(card.classification).toBe('500 기계와 인간성 / 무생물에 공감하는 능력');
    expect(card.topic).toBe('무생물에 공감하는 능력');
  });

  it('하위 가지 카드는 분류를 입력하지 않아도 상위 조상의 분류를 상속받아 topic과 classification에 반영해야 한다', () => {
    const rawPages = [
      {
        id: 'parent-hub',
        created_time: '2026-09-22T07:02:00.000Z',
        properties: {
          '메모': {
            type: 'title',
            title: [{ plain_text: '마이클 세이먼이 개발한 소셜AI 앱은 소셜 네트워크의...' }],
          },
          '청구기호': {
            type: 'rich_text',
            rich_text: [{ plain_text: '501-a4' }],
          },
          '분류': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'AI 팔로워' }],
          },
        },
      },
      {
        id: 'child-branch-1',
        created_time: '2026-09-22T07:03:00.000Z',
        properties: {
          '메모': {
            type: 'title',
            title: [{ plain_text: '요즘 X를 보면 번역기를 돌린 게 훤히 보이는 외국인 계정이 많다.' }],
          },
          '청구기호': {
            type: 'rich_text',
            rich_text: [{ plain_text: '501-a4a' }],
          },
          // 분류 없음
        },
      },
      {
        id: 'grandchild-branch-2',
        created_time: '2026-09-22T07:04:00.000Z',
        properties: {
          '메모': {
            type: 'title',
            title: [{ plain_text: '익명 게시판에서 활동하다가 여기에 실제 인간은 나뿐인가 의심이 들었다.' }],
          },
          '청구기호': {
            type: 'rich_text',
            rich_text: [{ plain_text: '501-a4a1' }],
          },
          // 분류 없음
        },
      },
      {
        id: 'isolated-card',
        created_time: '2026-09-22T07:05:00.000Z',
        properties: {
          '메모': {
            type: 'title',
            title: [{ plain_text: '아름다움의 본질에 대한 고찰과 형식주의 미학의 태동.' }],
          },
          '청구기호': {
            type: 'rich_text',
            rich_text: [{ plain_text: '401' }],
          },
          // 분류 없음
        },
      },
    ];

    const cards = transformNotionPagesToCards(rawPages as any);
    expect(cards).toHaveLength(4);

    // 1) 501-a4: 본인 분류 유지
    const parent = cards.find((c) => c.callNumber === '501-a4')!;
    expect(parent.topic).toBe('AI 팔로워');
    expect(parent.classification).toBe('500 기계와 인간성 / AI 팔로워');

    // 2) 501-a4a: 부모 501-a4의 'AI 팔로워'를 상속받아 긴 본문 대신 짧은 랜드마크로 표기
    const child = cards.find((c) => c.callNumber === '501-a4a')!;
    expect(child.topic).toBe('AI 팔로워');
    expect(child.classification).toBe('500 기계와 인간성 / AI 팔로워');

    // 3) 501-a4a1: 조부모 501-a4의 'AI 팔로워'를 2단계 역추적 상속
    const grandchild = cards.find((c) => c.callNumber === '501-a4a1')!;
    expect(grandchild.topic).toBe('AI 팔로워');
    expect(grandchild.classification).toBe('500 기계와 인간성 / AI 팔로워');

    // 4) 401: 상위에 아무런 분류도 없으면 400 대분과명 '미학과 신앙' 상속
    const isolated = cards.find((c) => c.callNumber === '401')!;
    expect(isolated.topic).toBe('미학과 신앙');
    expect(isolated.classification).toBe('400 미학과 신앙');
  });

  it('B- 서지 카드에 "분류" 프로퍼티가 있으면 classification에 책의 카테고리(예: 인문 / AI)로 반영되어야 한다', () => {
    const rawPages = [
      {
        id: 'book-love-machine',
        created_time: '2026-09-22T05:39:00.000Z',
        properties: {
          '메모': {
            type: 'title',
            title: [{ plain_text: '러브 머신(제임스 멀둔, 2026)' }],
          },
          '청구기호': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'B-1' }],
          },
          '분류': {
            type: 'rich_text',
            rich_text: [{ plain_text: '인문 / AI' }],
          },
        },
      },
    ];

    const cards = transformNotionPagesToCards(rawPages as any);
    expect(cards).toHaveLength(1);
    const bookCard = cards[0];
    // 제목은 책 제목 그대로 유지
    expect(bookCard.topic).toBe('러브 머신(제임스 멀둔, 2026)');
    // 분류는 접두어 없이 사용자 입력 카테고리만 깔끔하게 반영
    expect(bookCard.classification).toBe('인문 / AI');
  });

  it('B- 서지 카드에 "분류" 프로퍼티가 없으면 기본값 "서지 서가"로 채워져야 한다', () => {
    const rawPages = [
      {
        id: 'book-empty-category',
        created_time: '2026-09-22T05:39:00.000Z',
        properties: {
          '메모': {
            type: 'title',
            title: [{ plain_text: '책 제목' }],
          },
          '청구기호': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'B-2' }],
          },
          // 분류 없음
        },
      },
    ];

    const cards = transformNotionPagesToCards(rawPages as any);
    expect(cards).toHaveLength(1);
    const bookCard = cards[0];
    expect(bookCard.classification).toBe('서지 서가');
  });

  it('B- 서지 카드에 page_content가 주어지면 topic에는 책 제목만 남고 threads[0].note에는 page_content가 반영되어야 한다', () => {
    const rawPages = [
      {
        id: 'book-love-machine',
        created_time: '2026-09-22T05:39:00.000Z',
        page_content: '제임스 멀둔, 2026\n디지털 플랫폼 노동과 자동화의 역설을 짚은 역작.',
        properties: {
          '메모': {
            type: 'title',
            title: [{ plain_text: '러브 머신' }],
          },
          '청구기호': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'B-1' }],
          },
        },
      },
    ];

    const cards = transformNotionPagesToCards(rawPages as any);
    expect(cards).toHaveLength(1);
    const bookCard = cards[0];

    // 큰 글씨 주제명에는 책 제목만!
    expect(bookCard.topic).toBe('러브 머신');
    // 네모난 단상 칸(note)에는 페이지 본문(저자, 연도, 감상)이 반영!
    expect(bookCard.threads[0].note).toBe('제임스 멀둔, 2026\n디지털 플랫폼 노동과 자동화의 역설을 짚은 역작.');
  });

  it('extractTextFromNotionBlocks는 다양한 블록 타입으로부터 줄바꿈 텍스트를 추출해야 한다', async () => {
    const { extractTextFromNotionBlocks } = await import('./notionAdapter');
    const sampleBlocks = [
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [{ plain_text: '제임스 멀둔, 2026' }],
        },
      },
      {
        type: 'quote',
        quote: {
          rich_text: [{ plain_text: '기술은 중립적이지 않다.' }],
        },
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ plain_text: '플랫폼 노동의 구조적 분석' }],
        },
      },
    ];

    const text = extractTextFromNotionBlocks(sampleBlocks);
    expect(text).toBe('제임스 멀둔, 2026\n기술은 중립적이지 않다.\n플랫폼 노동의 구조적 분석');
  });
});

