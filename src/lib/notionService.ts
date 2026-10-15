import { mockCards } from '@/data/mockCards';
import { transformNotionPagesToCards, extractTextFromNotionBlocks } from '@/lib/notionAdapter';
import { TopicCard } from '@/types/catalog';

export interface FetchNotionCardsResult {
  success: boolean;
  source: 'notion' | 'mock' | 'mock_fallback';
  cards: TopicCard[];
  count?: number;
  error?: string;
}

/**
 * 노션 데이터베이스에서 카드 목록을 조회합니다.
 * 토큰이 없거나 조회 실패 시 mockCards로 안전하게 폴백합니다.
 */
export async function fetchNotionCards(): Promise<FetchNotionCardsResult> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    return {
      success: true,
      source: 'mock',
      cards: mockCards,
    };
  }

  try {
    let allRows: any[] = [];
    let cursor: string | undefined = undefined;

    do {
      const res: Response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 100,
          start_cursor: cursor,
        }),
        cache: 'no-store',
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Notion API Error]', res.status, errorText);
        return {
          success: false,
          source: 'mock_fallback',
          error: `Notion API responded with ${res.status}`,
          cards: mockCards,
        };
      }

      const data: any = await res.json();
      allRows = allRows.concat(data.results);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    // 각 노션 페이지의 본문 블록(서지의 상세정보 또는 단상의 추가 줄바꿈/불릿 글)을 가져와 주입
    await Promise.all(
      allRows.map(async (row) => {
        try {
          const blocksRes: Response = await fetch(
            `https://api.notion.com/v1/blocks/${row.id}/children`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Notion-Version': '2022-06-28',
              },
              cache: 'no-store',
            }
          );
          if (blocksRes.ok) {
            const blocksData: any = await blocksRes.json();
            row.page_content = extractTextFromNotionBlocks(blocksData.results || []);
          }
        } catch (e) {
          console.error(`[Notion Blocks Error for ${row.id}]`, e);
        }
      })
    );

    const cards: TopicCard[] = transformNotionPagesToCards(allRows);

    return {
      success: true,
      source: 'notion',
      count: cards.length,
      cards: cards.length > 0 ? cards : mockCards,
    };
  } catch (error: any) {
    console.error('[Notion Fetch Error]', error);
    return {
      success: false,
      source: 'mock_fallback',
      error: error?.message || 'Unknown error',
      cards: mockCards,
    };
  }
}
