import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { metadata } from './layout';

describe('RootLayout 메타데이터 (SEO / Open Graph / 파비콘)', () => {
  it('public/og-image.png 파일이 실제로 존재해야 한다', () => {
    const ogImagePath = join(process.cwd(), 'public', 'og-image.png');
    expect(existsSync(ogImagePath)).toBe(true);
  });

  it('고전 도서관(🏛️) 파비콘(src/app/icon.svg)이 존재하고 기본 Vercel favicon.ico는 제거되어야 한다', () => {
    const iconSvgPath = join(process.cwd(), 'src', 'app', 'icon.svg');
    const oldFaviconPath = join(process.cwd(), 'src', 'app', 'favicon.ico');

    expect(existsSync(iconSvgPath)).toBe(true);
    expect(readFileSync(iconSvgPath, 'utf-8')).toContain('🏛️');
    expect(existsSync(oldFaviconPath)).toBe(false);
  });

  it('openGraph 메타데이터에 /og-image.png 이미지(1200x630)와 사이트 정보가 설정되어야 한다', () => {
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph?.title).toBe('사적 온톨로지 • Personal Ontology');
    expect(metadata.openGraph?.description).toBe(
      '스크롤 피드를 넘어 단 1장의 대출 카드에 몰입하는 클래식 Mac System 7 감성의 장서 단말기'
    );
    expect(metadata.openGraph?.images).toEqual([
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '사적 온톨로지 • Personal Ontology',
      },
    ]);
  });

  it('twitter 카드 메타데이터에 summary_large_image와 /og-image.png가 설정되어야 한다', () => {
    expect(metadata.twitter).toBeDefined();
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: '사적 온톨로지 • Personal Ontology',
      description: '스크롤 피드를 넘어 단 1장의 대출 카드에 몰입하는 클래식 Mac System 7 감성의 장서 단말기',
      images: ['/og-image.png'],
    });
  });
});

