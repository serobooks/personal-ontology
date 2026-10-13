import { describe, it, expect } from 'vitest';
import { metadata } from './layout';

describe('RootLayout 메타데이터', () => {
  it('브라우저 탭 타이틀이 "사적 온톨로지 • Personal Ontology"이어야 한다', () => {
    expect(metadata.title).toBe('사적 온톨로지 • Personal Ontology');
  });
});
