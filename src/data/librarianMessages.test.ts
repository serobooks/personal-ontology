import { describe, it, expect } from 'vitest';
import { LIBRARIAN_MESSAGES, getRandomLibrarianMessage } from './librarianMessages';

describe('사서 S 대사 데이터 (librarianMessages)', () => {
  it('최소 10개 이상의 기본 대사 문구가 배열에 존재해야 한다', () => {
    expect(LIBRARIAN_MESSAGES).toBeDefined();
    expect(Array.isArray(LIBRARIAN_MESSAGES)).toBe(true);
    expect(LIBRARIAN_MESSAGES.length).toBeGreaterThanOrEqual(10);
  });

  it('getRandomLibrarianMessage 함수는 LIBRARIAN_MESSAGES 중 하나를 반환해야 한다', () => {
    const message = getRandomLibrarianMessage();
    expect(typeof message).toBe('string');
    expect(LIBRARIAN_MESSAGES).toContain(message);
  });
});
