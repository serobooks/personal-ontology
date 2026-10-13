import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '사적 온톨로지 • Personal Ontology',
  description: '스크롤 피드를 넘어 단 1장의 대출 카드에 몰입하는 클래식 Mac System 7 감성의 장서 단말기',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="h-full w-full select-none overflow-hidden m-0 p-0">
        {children}
        {/* 아날로그 빈티지 고무인 스탬프 질감 SVG 필터 (12번 DISTRESSED RUBBER) */}
        <svg
          className="sr-only"
          aria-hidden="true"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        >
          <filter id="distressed-rubber" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      </body>
    </html>
  );
}
