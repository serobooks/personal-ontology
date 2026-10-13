'use client';

import React from 'react';
import { System7Window } from './System7Window';

interface AboutModalProps {
  onClose: () => void;
}

/**
 * [About] 서고 및 사서 소개 팝업 창
 * - 사적 온톨로지 철학 및 서가 안내
 * - 사서 송해영 소개, 주요 역서 및 프로젝트 목록
 */
export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="서고 및 사서 소개 (Archive & Librarian)"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 font-mono select-none"
    >
      <div className="w-full max-w-lg">
        <System7Window
          title="서고 및 사서 소개 (Archive & Librarian)"
          onClose={onClose}
          className="shadow-[4px_4px_0px_#000]"
        >
          <div className="space-y-3.5 text-xs">
            {/* 1. 서고 소개: 사적 온톨로지 */}
            <div className="space-y-1.5 text-black pb-3 border-b border-black">
              <div className="font-bold text-xs bg-black text-white px-1.5 py-0.5 inline-block">
                사적 온톨로지
              </div>
              <p className="text-[11px] leading-relaxed font-sans text-gray-800">
                이곳은 니클라스 루만의 체텔카스텐(Zettelkasten) 분류 체계와 Mac System 7의 1비트 미학을 바탕으로 구축된 개인 사유 수장고입니다. 모든 카드는 청구기호와 하이퍼텍스트 링크를 통해 유기적으로 얽혀 있습니다. 키보드 방향키, 색인, 전체도, 랜덤 카드를 통해 서가 사이를 자유롭게 거닐어 보세요.
              </p>
            </div>

            {/* 2. 사서 프로필 소개 (사진 없이 검은색 칸 타이틀 적용) */}
            <div className="space-y-1.5 text-black">
              <div className="font-bold text-xs bg-black text-white px-1.5 py-0.5 inline-block">
                사서 - 송해영
              </div>
              <p className="text-[11px] text-gray-700 leading-relaxed font-sans">
                번역도 하고 뜨개질도 하고 소설도 쓰고 고양이 밥도 주고 타로도 보고 바이브 코딩도 하고 ｴﾄｾﾄﾗ
              </p>

            </div>



            {/* 3. 역서 및 프로젝트 목록 박스 */}
            <div className="bg-white p-3 border-2 border-black shadow-[2px_2px_0px_#000] space-y-2.5 font-mono">
              {/* 역서 섹션 */}
              <div className="space-y-1">
                <div className="font-bold text-[11px] text-black border-b border-black pb-0.5">
                  ○ 역서 (Translations)
                </div>
                <ul className="text-[11px] text-gray-800 space-y-0.5 pl-1">
                  <li>{'- <내 증상에도 이름이 있나요?>'}</li>
                  <li>{'- <사랑과 차별과 우정과 LGBTQ+>'}</li>
                  <li>{'- <60분 만에 읽는 탄소중립>'}</li>
                  <li>{'- <남몰래 거리 두는 관계의 기술> 등'}</li>
                </ul>

              </div>

              {/* 소프트웨어 & 웹 도구 섹션 (점선 구분선 제거) */}
              <div className="space-y-1 pt-1">
                <div className="font-bold text-[11px] text-black border-b border-black pb-0.5">
                  ○ 소프트웨어 &amp; 웹 도구 (Projects)
                </div>
                <ul className="text-[11px] text-gray-800 space-y-1 pl-1">
                  <li>
                    <span className="font-bold text-black">- Dear Master</span> : AI 타로 리딩 피드백 사이트
                  </li>
                  <li>
                    <span className="font-bold text-black">- 타테요미</span> : 세로쓰기 PDF 전용 윈도우 뷰어
                  </li>
                </ul>
              </div>
            </div>

            {/* 4. 연락처 및 채널 정보 */}
            <div className="bg-[#f0f0f0] p-2 border border-black text-[11px] space-y-0.5 font-mono">
              <div>
                <span className="font-bold text-black">Mail:</span>{' '}
                <a
                  href="mailto:serobooks@gmail.com"
                  className="underline hover:bg-black hover:text-white px-0.5"
                >
                  serobooks@gmail.com
                </a>
              </div>
              <div>
                <span className="font-bold text-black">Blog:</span>{' '}
                <a
                  href="https://brunch.co.kr/@serobooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:bg-black hover:text-white px-0.5"
                >
                  brunch.co.kr/@serobooks
                </a>
              </div>
            </div>

            {/* 5. 하단 닫기 버튼 */}
            <div className="pt-2 border-t border-gray-300 flex justify-end">
              <button
                onClick={onClose}
                type="button"
                className="sys7-btn px-4 py-1 text-xs font-bold hover:bg-black hover:text-white cursor-pointer"
              >
                닫기 (Esc)
              </button>
            </div>
          </div>
        </System7Window>
      </div>
    </div>
  );
};
