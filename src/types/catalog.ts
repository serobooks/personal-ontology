/**
 * 도서관 장서 대출 카드 및 카탈로그 시스템 타입 정의
 */

/**
 * 날짜 도장(Ink Stamp) 유형
 */
export type StampType =
  | 'QUOTATION'    // 문헌 인용 (올리브 그린 / 03번 파선 / -1.5deg)
  | 'QUOTE'        // 구 QUOTE 하위 호환
  | 'UNFINISHED'   // 자생적 사유 / 기본 상태 (인디고 블루 / 01번 실선 / +2.0deg / 기본값)
  | 'ESTABLISHED'  // 작품에 쓰여서 확립된 사유 (버건디 레드 / 02번 더블 이중선 / -2.0deg)
  | 'SPECIMEN'     // 어휘, 단어 채집 (앤틱 앰버 / 01번 실선 / +1.5deg)
  | 'RESTRICTED';  // 사서 열람 권한 필요 (딥 바이올렛 / 12번 낡고 번진 고무인 질감 / -2.5deg / Admin 인증 대상)

/**
 * 장서 카드 내 단상 스레드 항목
 */
export interface CardThread {
  id: string;
  date: string;               // YYYY-MM-DD 형식
  stampType: StampType;       // 날짜 도장 종류
  stampText?: string;         // 도장에 찍힐 추가 문구
  note: string;               // 단상/메모 본문
  linkedTopicIds?: string[];  // 참조/언급된 타 토픽 ID 목록
}

/**
 * 단일 도서관 장서 대출 카드
 */
export interface TopicCard {
  id: string;                 // 고유 슬러그 (예: 'memex-memory')
  callNumber: string;         // 청구기호 (예: '025.04-B97m')
  topic: string;              // 서명 / 주제명
  author: string;             // 기록자 / 사서
  classification: string;     // 십진분류 / 분과명
  acquisitionDate: string;    // 수서일
  summary: string;            // 카드 개요
  threads: CardThread[];      // 날짜 도장이 찍힌 단상 스레드들
  tags: string[];             // 색인 태그
}

/**
 * 역링크 항목 (현재 카드를 언급한 타 카드 정보)
 */
export interface BacklinkItem {
  sourceCardId: string;       // 인용한 원본 카드 ID
  sourceTopic: string;        // 인용한 원본 카드 주제명
  sourceCallNumber: string;   // 인용한 원본 카드 청구기호
  threadDate: string;         // 인용된 스레드 날짜
  threadSnippet: string;      // 인용된 스레드 요약/발췌
}

/**
 * 도서관 십진분류표 대분과 스케줄 항목
 */
export interface CategoryScheduleItem {
  code: string;               // 대분과 코드 ('100', '200', '300', '400', '500', '600', 'B')
  name: string;               // 대분과 명칭 ('언어와 번역', '서사와 창작', '서지 서가' 등)
  fullName: string;           // '100 언어와 번역', 'B 서지 서가'
  count: number;              // 해당 분과에 속한 메모(카드) 건수
  firstCardId?: string;       // 해당 분과의 첫 번째 카드 ID
  hasCards: boolean;          // 카드가 존재하는지 여부 (count > 0)
}
