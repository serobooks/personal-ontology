import { NextResponse } from 'next/server';
import { mockCards } from '@/data/mockCards';
import { transformNotionPagesToCards, extractTextFromNotionBlocks } from '@/lib/notionAdapter';
import { TopicCard } from '@/types/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  // 토큰이나 데이터베이스 ID가 없으면 기본 목데이터 반환
  if (!token || !databaseId) {
    return NextResponse.json({
      success: true,
      source: 'mock',
      cards: mockCards,
    });
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
        return NextResponse.json({
          success: false,
          source: 'mock_fallback',
          error: `Notion API responded with ${res.status}`,
          cards: mockCards,
        });
      }

      const data: any = await res.json();
      allRows = allRows.concat(data.results);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    // B- 서지 카드는 페이지 본문 블록(저자, 출간연도, 감상 등)을 가져와 주입
    await Promise.all(
      allRows.map(async (row) => {
        const callNumber =
          row.properties?.['청구기호']?.rich_text?.[0]?.plain_text?.trim() || '';
        if (callNumber.toUpperCase().startsWith('B-')) {
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
        }
      })
    );

    const cards: TopicCard[] = transformNotionPagesToCards(allRows);

    return NextResponse.json({
      success: true,
      source: 'notion',
      count: cards.length,
      cards: cards.length > 0 ? cards : mockCards,
    });
  } catch (error: any) {
    console.error('[Notion Route Error]', error);
    return NextResponse.json({
      success: false,
      source: 'mock_fallback',
      error: error?.message || 'Unknown error',
      cards: mockCards,
    });
  }
}
