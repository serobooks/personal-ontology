import { TopicCard } from '@/types/catalog';

/**
 * 클래식 도서관 장서 대출 카드 목업 데이터
 * - 청구기호 규칙: [3자리 주제코드]-[가지치기 식별자] (저자 기호 미사용)
 * - 101 계열: 연상 기억 및 하이퍼텍스트 계보
 * - 201 계열: 서고와 기억의 공간 온톨로지
 * - 301 계열: 사이버네틱스와 피드백 시스템
 */
export const mockCards: TopicCard[] = [
  // ================= 101 계열: 언어와 번역 =================
  {
    id: 'memex-memory',
    callNumber: '101',
    topic: '메멕스(Memex)와 기계적 연상 기억망',
    author: '수서사서 K (원작: V. Bush, 1945)',
    classification: '100 언어와 번역 / 인공연상장치',
    acquisitionDate: '1945-07-15',
    summary: '인간 두뇌의 연상 흔적(associative trail)을 기계식 마이크로필름 서고로 복제하려는 시도.',
    tags: ['연상기억', '마이크로필름', '하이퍼텍스트시초', '지식증폭'],
    threads: [
      {
        id: 'thread-m1',
        date: '1945-07-25',
        stampType: 'QUOTATION',
        note: '기존의 도서관 분류법은 일차원적 서가에 갇혀 있다. 인간의 두뇌는 사슬이 아닌 그물망으로 생각한다.',
        linkedTopicIds: ['ars-memoriae', 'B-1'],
      },
      {
        id: 'thread-m2',
        date: '1968-12-09',
        stampType: 'ESTABLISHED',
        note: '더글러스 엥겔바트의 NLS 데모가 공개되었다. 메멕스의 연상 흔적이 마우스 클릭과 모니터 창으로 실체화되었다.',
        linkedTopicIds: ['hypertext-xanadu'],
      },
      {
        id: 'thread-m3',
        date: '1984-01-24',
        stampType: 'UNFINISHED',
        note: '개인용 컴퓨터의 비트맵 그래픽 속에서 개인 온톨로지가 비로소 단말기 창으로 자리잡았다.',
        linkedTopicIds: ['cybernetics-feedback'],
      },
    ],
  },
  {
    id: 'hypertext-xanadu',
    callNumber: '101-a',
    topic: '프로젝트 재너두와 비선형 하이퍼텍스트',
    author: '하이퍼미디어 사서 N (원작: T. Nelson, 1965)',
    classification: '100 언어와 번역',
    acquisitionDate: '1965-08-24',
    summary: '단절되지 않는 양방향 링크(Bidirectional Link)와 문서 간 가역적 전송체계.',
    tags: ['하이퍼텍스트', '양방향링크', '문서그물망', '비선형사유'],
    threads: [
      {
        id: 'thread-x1',
        date: '1965-09-02',
        stampType: 'QUOTATION',
        note: '종이책의 비극은 텍스트가 강제적으로 일렬(sequential)로 늘어서 있다는 점이다. 진정한 사유는 다차원 교차점에 있다.',
        linkedTopicIds: ['memex-memory', 'babel-library'],
      },
      {
        id: 'thread-x2',
        date: '1988-06-11',
        stampType: 'ESTABLISHED',
        note: '링크는 반드시 역방향으로도 추적 가능해야 한다(역링크 Backlinks의 본질).',
        linkedTopicIds: ['memex-memory'],
      },
    ],
  },
  {
    id: 'web-hyperlink',
    callNumber: '101-a1',
    topic: '월드와이드웹과 단방향 링크의 한계',
    author: '망구조 분석사서 B (원작: T. Berners-Lee, 1989)',
    classification: '100 언어와 번역',
    acquisitionDate: '1989-03-12',
    summary: '단방향 링크를 택하여 세계를 연결했으나, 끊어진 링크(404)와 역링크 소실의 대가를 치렀다.',
    tags: ['WWW', '단방향링크', '404오류', '재너두의비판'],
    threads: [
      {
        id: 'thread-w1',
        date: '1991-08-06',
        stampType: 'ESTABLISHED',
        note: '단방향 링크의 단순성이 웹의 폭발적 성장을 낳았다. 그러나 문서 간의 상호 책임성은 사라졌다.',
        linkedTopicIds: ['hypertext-xanadu'],
      },
      {
        id: 'thread-w2',
        date: '1998-02-14',
        stampType: 'SPECIMEN',
        note: '이제 개인의 단말기에서 우리는 다시 끊어지지 않는 양방향 역링크를 복원한다.',
        linkedTopicIds: ['memex-memory'],
      },
    ],
  },
  {
    id: 'personal-computing',
    callNumber: '101-b',
    topic: '개인용 컴퓨터와 데스크톱 온톨로지',
    author: '계면공학 사서 J (원작: A. Kay, 1972)',
    classification: '100 언어와 번역',
    acquisitionDate: '1972-10-01',
    summary: '아이들을 위한 개인용 컴퓨터 다이내북 구상과 창(Window), 비트맵 인터페이스의 탄생.',
    tags: ['다이내북', '스몰토크', 'GUI', '개인사유도구'],
    threads: [
      {
        id: 'thread-p1',
        date: '1972-10-15',
        stampType: 'QUOTATION',
        note: '컴퓨터는 단순한 계산기가 아니라 모든 매체를 시뮬레이션할 수 있는 최초의 메타 매체(Metamedium)이다.',
        linkedTopicIds: ['memex-memory'],
      },
      {
        id: 'thread-p2',
        date: '1991-05-13',
        stampType: 'UNFINISHED',
        note: 'System 7의 윈도우와 디더링 배경 위에 개인의 사유를 장서 카드로 꽂아 넣는다.',
        linkedTopicIds: ['cybernetics-feedback'],
      },
    ],
  },

  // ================= 201 계열: 서사와 창작 =================
  {
    id: 'babel-library',
    callNumber: '201',
    topic: '바벨의 도서관과 무한 장서 우주',
    author: '장서점검관 B (원작: J. L. Borges, 1941)',
    classification: '200 서사와 창작 / 무한 장서 우주',
    acquisitionDate: '1941-11-03',
    summary: '25개 문자로 조합 가능한 모든 410쪽 책을 보관하는 육각형 진열실의 무한 미궁.',
    tags: ['무한서고', '조합론', '우주도서관', '모든책의목록'],
    threads: [
      {
        id: 'thread-b1',
        date: '1941-11-10',
        stampType: 'QUOTATION',
        note: '도서관은 무한한 구체이다. 그 중심은 모든 육각형 방이며 그 둘레는 접근 불가능하다.',
        linkedTopicIds: ['ars-memoriae'],
      },
      {
        id: 'thread-b2',
        date: '1979-05-18',
        stampType: 'RESTRICTED',
        note: '모든 진실과 거짓이 이미 인쇄되어 있다면, 독서란 노이즈 속에서 희미한 연관성을 낚아채는 검색 알고리즘이다.',
        linkedTopicIds: ['hypertext-xanadu', 'memex-memory'],
      },
    ],
  },
  {
    id: 'ars-memoriae',
    callNumber: '201-a',
    topic: '기억의 극장과 르네상스 기억술(Ars Memoriae)',
    author: '고문헌 보존사서 C (원작: G. Camillo, 1550)',
    classification: '200 서사와 창작',
    acquisitionDate: '1550-01-01',
    summary: '원형 극장 계단 위에 우주의 모든 지식과 형상을 배치하여 조망하는 지혜의 기계.',
    tags: ['기억술', '기억의궁전', '공간온톨로지', '정신단말기'],
    threads: [
      {
        id: 'thread-a1',
        date: '1550-02-14',
        stampType: 'RESTRICTED',
        note: '카밀로의 극장에서는 관객이 무대에 서고 모든 학문이 객석에 앉아 있다. 시선이 닿는 곳마다 카드가 펼쳐진다.',
        linkedTopicIds: ['babel-library'],
      },
      {
        id: 'thread-a2',
        date: '1966-10-04',
        stampType: 'ESTABLISHED',
        note: '기억의 극장은 고대 수사학의 유물이 아니라 오늘날 컴퓨터 인터페이스의 원형이다.',
        linkedTopicIds: ['memex-memory', 'cybernetics-feedback'],
      },
    ],
  },

  // ================= 301 계열: 인간과 관계 =================
  {
    id: 'cybernetics-feedback',
    callNumber: '301',
    topic: '사이버네틱스와 목적적 피드백 루프',
    author: '계측공학 사서 W (원작: N. Wiener, 1948)',
    classification: '300 인간과 관계 / 인공두뇌학',
    acquisitionDate: '1948-10-12',
    summary: '생체와 기계에서 일어나는 제어와 소통, 자기 교정(Self-correction)의 순환 회로망.',
    tags: ['피드백루프', '항상성', '인공두뇌', '시스템다이내믹스'],
    threads: [
      {
        id: 'thread-c1',
        date: '1948-11-01',
        stampType: 'QUOTATION',
        note: '출력의 일부를 다시 입력으로 되돌리는 피드백이야말로 엔트로피에 대항하는 생명과 자동 기계의 유일한 질서 수단이다.',
        linkedTopicIds: ['memex-memory'],
      },
      {
        id: 'thread-c2',
        date: '1972-03-15',
        stampType: 'UNFINISHED',
        note: '관찰자가 시스템 외부에서 시스템을 관찰할 수 있는가? 2차 사이버네틱스는 관찰자 또한 순환 회로의 일부임을 선언했다.',
        linkedTopicIds: ['babel-library'],
      },
    ],
  },
  {
    id: 'second-order-cybernetics',
    callNumber: '301-a',
    topic: '2차 사이버네틱스와 관찰자의 순환 루프',
    author: '인식론 사서 F (원작: H. von Foerster, 1974)',
    classification: '300 인간과 관계',
    acquisitionDate: '1974-06-20',
    summary: '관찰되는 시스템에서 관찰하는 시스템으로. 단말기를 조작하는 사용자 자신 또한 단말기에 의해 조작된다.',
    tags: ['2차사이버네틱스', '자기지유성', '재귀성', '관찰자의위치'],
    threads: [
      {
        id: 'thread-so1',
        date: '1974-07-01',
        stampType: 'SPECIMEN',
        note: '단말기를 응시하는 당신의 눈동자 또한 이 서고의 회로망 속에 기록되고 있다.',
        linkedTopicIds: ['cybernetics-feedback'],
      },
      {
        id: 'thread-so2',
        date: '1995-08-20',
        stampType: 'ESTABLISHED',
        note: '키보드의 화살표를 누를 때마다 장서가 바뀌고, 바뀐 장서는 다시 사용자의 생각을 재편성한다.',
        linkedTopicIds: ['hypertext-xanadu'],
      },
    ],
  },

  // ================= B 서지 서가: 인용 및 독서 갈무리 =================
  {
    id: 'book-crocodile-diary',
    callNumber: 'B-1',
    topic: '악어일기 (邱妙津)',
    author: '추먀오진 (邱妙津, 1994)',
    classification: 'B- 서지 서가',
    acquisitionDate: '1994-06-01',
    summary: '대만 퀴어 문학의 기념비적 서간체 소설. 고립된 존재의 사랑과 정체성 탐색.',
    tags: ['악어일기', '대만문학', '퀴어', '사랑과고립', '서간체'],
    threads: [
      {
        id: 'thread-b1-1',
        date: '1994-06-15',
        stampType: 'QUOTATION',
        note: '악어일기\n"나는 인간 세상에 들어갈 수 없는 악어다. 우리는 모두 가죽을 뒤집어쓰고 산다." 사랑이라는 절대적 상태에 대한 지독한 갈망과 소외의 기록.',
        linkedTopicIds: ['memex-memory', 'ars-memoriae'],
      },
      {
        id: 'thread-b1-2',
        date: '1994-07-20',
        stampType: 'RESTRICTED',
        note: '타인의 시선 앞에서 자신을 위장해야 하는 존재들의 은신처. 책은 고독한 영혼들의 연대망이다.',
        linkedTopicIds: ['babel-library'],
      },
    ],
  },
];

