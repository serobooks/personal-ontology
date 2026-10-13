import { TopicCard, CardThread, StampType } from '@/types/catalog';
import { resolveClassification, resolveInheritedCategory } from './catalogUtils';

export interface NotionRawPage {
  id: string;
  created_time: string;
  properties: Record<string, any>;
  page_content?: string;
}

/**
 * 노션 블록 객체 목록에서 텍스트를 추출하여 줄바꿈 문자열로 결합합니다.
 */
export function extractTextFromNotionBlocks(blocks: any[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map((block) => {
      const type = block?.type;
      if (!type) return '';
      const textArray = block[type]?.rich_text;
      if (Array.isArray(textArray)) {
        return textArray.map((t: any) => t?.plain_text || '').join('');
      }
      return '';
    })
    .filter((line) => line.length > 0)
    .join('\n');
}

const VALID_STAMPS: StampType[] = [
  'QUOTATION',
  'QUOTE',
  'UNFINISHED',
  'ESTABLISHED',
  'SPECIMEN',
  'RESTRICTED',
];

/**
 * 노션 원시 페이지 객체 목록을 TopicCard 목록으로 정규화 변환합니다.
 * - 하위 가지 카드는 상위 조상의 '분류'를 역추적 상속받아 긴 본문 대신 랜드마크 주제명을 표기합니다.
 */
export function transformNotionPagesToCards(pages: NotionRawPage[]): TopicCard[] {
  if (!Array.isArray(pages)) return [];

  // 1단계: 전체 페이지에서 명시적으로 입력된 '분류' 맵 구축 (청구기호 -> 사용자 분류명)
  const categoryMap = new Map<string, string>();
  pages.forEach((page) => {
    const props = page.properties || {};
    const callNum =
      props['청구기호']?.rich_text?.[0]?.plain_text?.trim() || `CARD-${page.id.slice(0, 6)}`;
    const categoryProp = props['분류'];
    let userCat = '';
    if (categoryProp) {
      if (categoryProp.type === 'select') {
        userCat = categoryProp.select?.name?.trim() || '';
      } else if (categoryProp.type === 'rich_text') {
        userCat = categoryProp.rich_text?.[0]?.plain_text?.trim() || '';
      }
    }
    if (userCat) {
      categoryMap.set(callNum, userCat);
    }
  });

  return pages.map((page) => {
    const props = page.properties || {};

    // 1. 메모 (Title)
    const memoTitle = props['메모']?.title?.[0]?.plain_text?.trim() || '';

    // 2. 청구기호 (Text)
    const callNumber =
      props['청구기호']?.rich_text?.[0]?.plain_text?.trim() || `CARD-${page.id.slice(0, 6)}`;

    // 3. 스탬프 (Select)
    const stampName = props['스탬프']?.select?.name?.toUpperCase()?.trim();
    const stampType: StampType = VALID_STAMPS.includes(stampName as StampType)
      ? (stampName as StampType)
      : 'UNFINISHED';

    // 4. 지정일 우선 로직 (Date vs Created time)
    const customDate = props['지정일']?.date?.start;
    const fallbackDate = page.created_time
      ? page.created_time.split('T')[0]
      : new Date().toISOString().split('T')[0];
    const recordDate = customDate ? customDate.split('T')[0] : fallbackDate;

    // 5. 연계 카드 (Text 또는 Relation)
    let linkedTopicIds: string[] = [];
    if (props['연계 카드']?.rich_text) {
      const rawText = props['연계 카드']?.rich_text?.[0]?.plain_text?.trim() || '';
      if (rawText) {
        linkedTopicIds = rawText
          .split(/[,;\s]+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
      }
    } else if (props['연계 카드']?.relation) {
      linkedTopicIds = props['연계 카드'].relation.map((r: { id: string }) => r.id);
    }

    // 6. 분류 처리 (상위 조상 역추적 상속 적용)
    const majorClassification = resolveClassification(callNumber);
    const isBook = callNumber.toUpperCase().startsWith('B-');

    // 상위 조상의 분류 또는 대분과 기본명 상속
    const inheritedCategory = resolveInheritedCategory(callNumber, categoryMap);
    const selfCategory = categoryMap.get(callNumber);

    let classification = majorClassification;
    let topic = memoTitle;

    if (isBook) {
      // 서지 카드: 사용자가 입력한 분류(예: '인문 / AI')가 있으면 그 값만 단독 노출, 없으면 기본값 '서지 서가' fallback
      classification = selfCategory ? selfCategory : '서지 서가';
      topic = memoTitle;
    } else {
      // 사유 카드: 상속받은 분류가 대분과명 자체와 같으면 대분과명만, 세부 랜드마크면 결합
      const isPureMajorName = majorClassification.includes(inheritedCategory);
      classification = isPureMajorName
        ? majorClassification
        : `${majorClassification} / ${inheritedCategory}`;
      topic = inheritedCategory;
    }

    const pageContent = page.page_content?.trim();
    const noteText = isBook
      ? (pageContent || memoTitle)
      : memoTitle;

    const thread: CardThread = {
      id: `thread-${page.id}`,
      date: recordDate,
      stampType,
      note: noteText,
      linkedTopicIds,
    };

    const summaryText = isBook && pageContent ? pageContent : memoTitle;

    return {
      id: page.id,
      callNumber,
      topic: topic || callNumber,
      author: '사서 Hailey',
      classification,
      acquisitionDate: recordDate,
      summary: summaryText.slice(0, 100),
      threads: [thread],
      tags: [classification],
    };
  });
}
