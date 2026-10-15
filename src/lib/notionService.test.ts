import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchNotionCards } from './notionService';
import { mockCards } from '@/data/mockCards';

describe('notionService - 서버사이드 노션 카드 조회 서비스', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('환경변수가 없을 때는 mockCards를 반환해야 한다', async () => {
    delete process.env.NOTION_TOKEN;
    delete process.env.NOTION_DATABASE_ID;

    const result = await fetchNotionCards();
    expect(result.success).toBe(true);
    expect(result.source).toBe('mock');
    expect(result.cards).toEqual(mockCards);
  });

  it('노션 API 호출 실패 시 mockCards로 폴백해야 한다', async () => {
    process.env.NOTION_TOKEN = 'fake-token';
    process.env.NOTION_DATABASE_ID = 'fake-db';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const result = await fetchNotionCards();
    expect(result.success).toBe(false);
    expect(result.source).toBe('mock_fallback');
    expect(result.cards).toEqual(mockCards);
  });
});
