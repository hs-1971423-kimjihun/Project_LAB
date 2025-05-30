// data/companyData.ts

export interface Company {
  id: string;
  name: string;
  address: string;
  city: string; // 예: "서울", "경기", "부산"
}

const companiesRawData: { name: string; address: string }[] = [
  { name: "ABL생명", address: "서울특별시 영등포구 의사당대로 147 (여의도동, 에이비엘타워)" },
  { name: "DB INC", address: "서울특별시 강남구 역삼로 205 (역삼동)" },
  { name: "DB금융투자(목동)", address: "서울특별시 양천구 목동동로 233 (목동)" },
  { name: "DB금융투자(죽전)", address: "경기도 용인시 수지구 죽전로 152 (죽전동)" },
  { name: "DB메탈", address: "경기도 포천시 소흘읍 이동교로 342" },
  { name: "DB하이텍", address: "경기도 안산시 단원구 성곡동 676" },
  { name: "GKL", address: "서울특별시 강남구 테헤란로 114 (역삼동)" },
  { name: "KB국민카드", address: "서울특별시 중구 남대문로 84 (중구)" },
  { name: "KG모빌리티", address: "경기도 평택시 고덕면 고덕국제화로 155" },
  { name: "Kistep", address: "충청북도 음성군 맹동면 과학로 15" },
  { name: "LX공사", address: "전라북도 전주시 덕진구 기지로 120 (중동, 한국국토정보공사 본사)" },
  { name: "NHN KCP", address: "경기도 성남시 분당구 대왕판교로 644번길 49 (삼평동)" },
  { name: "NH투자증권", address: "서울특별시 영등포구 여의나루로 4 (여의도동)" }, // + 
  { name: "NS홈쇼핑", address: "서울특별시 영등포구 여의도동 23-5" },
  { name: "PTKorea", address: "서울특별시 강남구 강남대로 298 (역삼동)" },
  { name: "고려대학교", address: "서울특별시 성북구 안암로 145 (안암동)" },
  { name: "동국대학교", address: "서울특별시 중구 필동로 1길 30 (필동)" },
  { name: "동신대학교", address: "전라남도 나주시 건재로 185" },
  { name: "신한대학교", address: "경기도 의정부시 호암로 95 (호암동)" },
  { name: "인하대학교", address: "인천광역시 미추홀구 인하로 100 (용현동)" },
  { name: "한양대학교", address: "서울특별시 성동구 왕십리로 222 (행당동)" },
  { name: "고대병원", address: "서울특별시 성북구 고려대로 73 (안암동)" },
  { name: "일산병원", address: "경기도 고양시 일산서구 주화로 100" },
  { name: "골프존", address: "서울특별시 강남구 테헤란로 534 (대치동)" },
  { name: "공정거래위원회", address: "세종특별자치시 한누리대로 402 (어진동)" },
  { name: "국민연금공단", address: "전라북도 전주시 덕진구 기지로 180" },
  { name: "부산시청", address: "부산광역시 연제구 중앙대로 1001" },
  { name: "서초구청", address: "서울특별시 서초구 남부순환로 2584 (서초동)" }, // 에서 이어짐
  { name: "안동시청", address: "경상북도 안동시 축제장길 252" },
  { name: "인천공항공사", address: "인천광역시 중구 공항로 424" },
  { name: "한국부동산원", address: "대구광역시 동구 동부로 94" },
  { name: "한국소비자원", address: "충청북도 음성군 맹동면 원중로 54" },
  { name: "한국지방재정공제회", address: "서울특별시 중구 세종대로 124" },
  { name: "한국지역난방공사", address: "경기도 성남시 분당구 판교역로 688" },
  { name: "교보AXA(DC)", address: "서울특별시 종로구 종로 1 (교보생명빌딩)" },
  { name: "교보AXA(DR)", address: "서울특별시 종로구 종로 1 (교보생명빌딩)" },
  { name: "하나자산신탁", address: "서울특별시 중구 을지로 66" },
  { name: "하나펀드서비스", address: "서울특별시 중구 을지로 66 (을지로2가, 하나금융그룹 명동사옥) 10층, 11층" },
  { name: "한국투자공사", address: "서울특별시 영등포구 여의나루로 4 (여의도동)" },
  { name: "현대해상", address: "서울특별시 종로구 종로 80 (종로2가)" },
  { name: "흥국생명", address: "서울특별시 중구 칠패로 4 (중림동)" },
  { name: "비상교육", address: "서울특별시 구로구 디지털로 33길 12 (구로동)" }, // + 
  { name: "한국화장품", address: "서울특별시 강남구 삼성로 96길 23" },
  { name: "트라이코코리아", address: "서울특별시 강남구 테헤란로 518" },
  { name: "노벨리스코리아", address: "경기도 평택시 포승읍 평택항로 184" },
  { name: "대웅제약", address: "서울특별시 동대문구 천호대로 447 (청량리동)" },
  { name: "두산중공업", address: "경상남도 창원시 성산구 두산볼바르 22" },
  { name: "동부건설", address: "서울특별시 중구 을지로 170 (을지로4가)" },
  { name: "원익IPS", address: "경기도 평택시 청북읍 백봉산단로 35" },
  { name: "원익머트리얼즈", address: "경기도 평택시 청북읍 기업도시로 17-26" },
  { name: "진화기술공사", address: "서울특별시 강남구 논현로 518" },
  { name: "피닉스다트", address: "경기도 화성시 향남읍 발안공단로 88" },
  { name: "한국조선해양기자재연구원", address: "부산광역시 강서구 과학산단1로 32" },
  { name: "금호타이어", address: "경기도 용인시 수지구 신수로 39" },
  { name: "유피케미칼", address: "충청북도 음성군 맹동면 두성로 187" },
  { name: "이노그리드", address: "서울특별시 구로구 디지털로 26길 61" }, // + 
  { name: "세영통신", address: "서울특별시 금천구 가산디지털1로 168" },
  { name: "신한DS", address: "서울특별시 중구 세종대로 9길 42" },
  { name: "우아한형제들", address: "서울특별시 송파구 위례성대로 2 (방이동)" },
  { name: "포크빌", address: "전라북도 고창군 공음면 학원농공단지길 5" },
  { name: "롯데정보통신", address: "서울특별시 금천구 가산디지털1로 9 (가산동)" },
  { name: "파라다이스", address: "부산광역시 해운대구 해운대해변로 296" },
  { name: "블랭크코퍼레이션", address: "서울특별시 강남구 테헤란로 108길 30" },
  { name: "블랭크코퍼레이션(studio)", address: "서울특별시 강남구 테헤란로 108길 30" },
  { name: "홈플러스", address: "서울특별시 강서구 공항대로 467" },
  { name: "비스트라코리아", address: "서울특별시 강남구 테헤란로 518" },
  { name: "학술정보원(Keris)", address: "대구광역시 북구 대학로 80" },
  { name: "대한지방행정공제회", address: "서울특별시 중구 세종대로 110" },
  { name: "스마트그리드사업단", address: "경기도 성남시 분당구 판교로 255번길 25" },
  { name: "교통정보센터(고양시)", address: "경기도 고양시 일산동구 중앙로 1036" },
  { name: "교통정보센터(김포시)", address: "경기도 김포시 사우중로 100" }, // + 
  { name: "교통정보센터(성남시청)", address: "경기도 성남시 중원구 성남대로 997" },
  { name: "교통정보센터(안성)", address: "경기도 안성시 시청길 25" },
  { name: "김포 교통정보센터", address: "경기도 김포시 사우중로 100" },
  { name: "성남 정보센터", address: "경기도 성남시 중원구 성남대로 997" },
];

const getCityFromAddress = (address: string): string => {
  if (address.startsWith("서울특별시")) return "서울";
  if (address.startsWith("부산광역시")) return "부산";
  if (address.startsWith("대구광역시")) return "대구";
  if (address.startsWith("인천광역시")) return "인천";
  // 광주, 대전, 울산은 제공된 데이터에 없어 생략
  if (address.startsWith("세종특별자치시")) return "세종";
  if (address.startsWith("경기도")) return "경기";
  // 강원특별자치도는 데이터에 없어 생략
  if (address.startsWith("충청북도")) return "충북";
  if (address.startsWith("충청남도")) return "충남"; // 데이터에 없음
  if (address.startsWith("전라북도")) return "전북"; // 현재 전북특별자치도
  if (address.startsWith("전라남도")) return "전남";
  if (address.startsWith("경상북도")) return "경북";
  if (address.startsWith("경상남도")) return "경남";
  // 제주특별자치도는 데이터에 없어 생략
  return "기타";
};

export const companies: Company[] = companiesRawData.map((company, index) => ({
  id: `company-${index + 1}`,
  name: company.name,
  address: company.address,
  city: getCityFromAddress(company.address),
}));

export const cities: string[] = Array.from(new Set(companies.map(c => c.city))).sort();
