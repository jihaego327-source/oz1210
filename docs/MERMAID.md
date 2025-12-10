flowchart TB
    Start([사용자 접속]) --> Home[홈페이지 /]
    
    %% 홈페이지 섹션
    Home --> Filter{필터 사용?}
    Home --> Search{검색 사용?}
    Home --> ViewList[관광지 목록 보기]
    
    %% 필터 플로우
    Filter -->|지역 선택| AreaFilter[지역 필터<br/>시/도, 시/군/구]
    Filter -->|타입 선택| TypeFilter[관광 타입 필터<br/>관광지/문화시설/축제 등]
    AreaFilter --> APIArea[API: areaBasedList2]
    TypeFilter --> APIArea
    
    %% 검색 플로우
    Search -->|키워드 입력| SearchInput[검색창<br/>관광지명/주소/설명]
    SearchInput --> APISearch[API: searchKeyword2]
    
    %% API 호출 통합
    APIArea --> TourData[관광지 데이터 로드]
    APISearch --> TourData
    ViewList --> TourData
    
    %% 데이터 표시
    TourData --> DisplayOptions{표시 방식}
    DisplayOptions -->|리스트 뷰| ListView[목록 표시<br/>카드 형태]
    DisplayOptions -->|지도 뷰| MapView[네이버 지도<br/>마커 표시]
    
    %% 리스트-지도 연동
    ListView -.클릭/호버.-> MapView
    MapView -.마커 클릭.-> ListView
    
    %% 페이지네이션
    ListView --> Pagination[페이지네이션<br/>무한 스크롤]
    Pagination --> TourData
    
    %% 상세페이지 이동
    ListView -->|카드 클릭| DetailPage[상세페이지<br/>/places/contentId]
    MapView -->|마커 클릭| DetailPage
    
    %% 상세페이지 섹션
    DetailPage --> LoadDetail{상세 정보 로드}
    LoadDetail --> APICommon[API: detailCommon2<br/>기본 정보]
    LoadDetail --> APIIntro[API: detailIntro2<br/>운영 정보]
    LoadDetail --> APIImage[API: detailImage2<br/>이미지 갤러리]
    
    %% 상세 정보 표시
    APICommon --> BasicInfo[기본 정보 섹션<br/>제목/이미지/주소/전화/홈페이지]
    APIIntro --> OperInfo[운영 정보 섹션<br/>운영시간/휴무일/요금/주차]
    APIImage --> Gallery[이미지 갤러리<br/>슬라이드/전체화면]
    
    %% 지도 섹션
    DetailPage --> DetailMap[지도 섹션<br/>위치 표시]
    DetailMap --> NaverLink[길찾기<br/>네이버 지도 연동]
    
    %% 상호작용 기능
    BasicInfo --> Actions{사용자 액션}
    Actions -->|공유| Share[URL 복사<br/>클립보드 API]
    Share --> Toast[복사 완료<br/>토스트 메시지]
    
    Actions -->|북마크| BookmarkCheck{로그인 여부?}
    BookmarkCheck -->|Yes| SaveSupabase[(Supabase DB<br/>bookmarks 테이블)]
    BookmarkCheck -->|No| SaveLocal[localStorage<br/>임시 저장]
    SaveLocal -.로그인 후.-> SaveSupabase
    
    %% 북마크 페이지
    SaveSupabase --> BookmarkPage[북마크 페이지<br/>/bookmarks]
    BookmarkPage --> BookmarkList[북마크 목록<br/>정렬/삭제]
    BookmarkList -->|항목 클릭| DetailPage
    
    %% 네비게이션
    DetailPage -->|뒤로가기| Home
    BookmarkList -->|뒤로가기| Home
    
    %% 에러 처리
    TourData -.API 에러.-> ErrorHandle[에러 처리<br/>메시지 + 재시도]
    ErrorHandle --> Home
    
    %% 스타일링
    classDef apiClass fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef pageClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef actionClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dbClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px
    
    class APIArea,APISearch,APICommon,APIIntro,APIImage apiClass
    class Home,DetailPage,BookmarkPage pageClass
    class Filter,Search,Actions,Share,BookmarkCheck actionClass
    class SaveSupabase dbClass