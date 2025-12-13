# 지역 필터 "전체" 버튼 오작동 해결 과정 (Troubleshooting Report)

## 📌 1. 문제 상황 (Problem)

**증상:**
- 지역 필터 드롭다운에서 특정 지역(예: 인천, 서울)을 선택하는 것은 정상 작동함.
- 하지만 다시 "전체"를 선택하려고 하면 클릭해도 아무런 반응이 없음 (URL 변화 없음, 화면 갱신 안 됨).
- "전체" 버튼이 먹통인 상태.

**환경:**
- **Framework:** Next.js 15 (App Router)
- **UI Library:** shadcn/ui (Select 컴포넌트)
- **State Management:** URL Query Parameters (`useSearchParams`, `useRouter`)

---

## 🔍 2. 원인 분석 (Root Cause Analysis)

### 1차 가설: Select 컴포넌트의 `value` 처리 문제
- **가설:** `value`가 변하지 않아서 `onValueChange` 이벤트가 발생하지 않는 것으로 추정.
- **확인:** `currentAreaCode`가 `null`일 때 `Select`의 `value`가 `'all'`로 설정되는데, 사용자가 다시 "전체"를 클릭해도 `value`는 여전히 `'all'`이므로 변화가 감지되지 않음.
- **조치:** `value`를 `currentAreaCode || ''`로 변경하여 상태 변화를 강제함.

### 2차 가설: Select Item의 빈 문자열(`""`) 거부 에러
- **가설:** `value`에 빈 문자열을 넣었더니 런타임 에러 발생.
- **에러 메시지:** `A <Select.Item /> must have a value prop that is not an empty string.`
- **조치:** `Select`의 `value`는 `currentAreaCode || 'all'`로 유지하되, `handleAreaCodeChange` 로직을 개선하기로 함.

### 3차 가설 (최종 원인): `updateFilters` 함수의 조건문 오류 🚨
- **가설:** `handleAreaCodeChange`는 정상적으로 호출되지만, URL 파라미터를 업데이트하는 `updateFilters` 함수 내부에서 "전체" 선택 시 로직이 실행되지 않음.
- **로그 분석:**
  ```javascript
  // "전체" 선택 시 로그
  ✅ "전체" 선택됨 → updateFilters 호출할 예정
  📍 updateFilters 호출됨: { areaCode: undefined, pageNo: 1 }
  // 하지만 아래 로그가 나오지 않음!
  // 📍 params.delete 실행: areaCode 제거
  ```
- **원인 코드:**
  ```typescript
  // 문제의 코드
  if (updates.areaCode !== undefined) { ... }
  ```
  - "전체"를 선택하면 `areaCode: undefined`를 전달함.
  - `undefined !== undefined`는 `false`가 되므로 `if` 블록 내부가 실행되지 않음.
  - 따라서 `params.delete('areaCode')`가 실행되지 않아 URL에서 `areaCode` 파라미터가 지워지지 않음.

---

## ✅ 3. 해결 방법 (Solution)

### 코드 수정: `updateFilters` 조건문 변경

`undefined` 값도 처리할 수 있도록 속성 존재 여부를 확인하는 방식으로 변경했습니다.

**변경 전:**
```typescript
if (updates.areaCode !== undefined) {
  // areaCode가 undefined면 이 블록이 실행되지 않음 ❌
  if (updates.areaCode && updates.areaCode !== 'all') {
    params.set('areaCode', updates.areaCode);
  } else {
    params.delete('areaCode');
  }
}
```

**변경 후:**
```typescript
if ('areaCode' in updates) {
  // updates 객체 안에 'areaCode' 키가 존재하기만 하면 실행됨 ✅
  if (updates.areaCode && updates.areaCode !== 'all') {
    params.set('areaCode', updates.areaCode);
  } else {
    // updates.areaCode가 undefined여도 여기로 들어와서 삭제 실행됨
    params.delete('areaCode');
  }
}
```

---

## 💡 4. 배운 점 (Key Takeaways)

1. **`undefined` 체크의 함정:**
   - 값이 `undefined`일 때도 로직을 처리해야 한다면 `value !== undefined` 대신 `key in object` 방식을 사용해야 함.
   
2. **로그 기반 디버깅의 중요성:**
   - 단순히 코드를 눈으로 보는 것보다 `console.log`를 통해 데이터의 흐름을 추적하는 것이 훨씬 빠르고 정확함.
   - 특히 조건문(`if`)이 예상대로 타는지 확인하는 로그가 결정적이었음.

3. **shadcn/ui Select의 동작 원리:**
   - 값이 변하지 않으면 `onValueChange`가 발생하지 않으므로, 초기화 로직에서는 `null`이나 `undefined` 처리가 중요함.

---

## 🚀 5. 최종 결과

- "전체" 버튼 클릭 시 `updateFilters` 함수가 정상적으로 `params.delete('areaCode')`를 실행함.
- URL에서 `areaCode` 파라미터가 제거됨 (`/?areaCode=1` → `/?`).
- 지역 필터가 정상적으로 초기화되어 모든 지역의 데이터를 보여줌.
- **문제 해결 완료!** 🎉

---

# 네이버 지도 Script 이벤트 핸들러 오류 해결 과정 (Troubleshooting Report)

## 📌 1. 문제 상황 (Problem)

**증상:**
- 서버 실행 시 런타임 에러 발생
- 네이버 지도 API 스크립트 로드가 정상적으로 작동하지 않음
- 지도가 표시되지 않거나 마커가 나타나지 않음

**에러 메시지:**
```
Runtime Error

Event handlers cannot be passed to Client Component props.
  <... src=... strategy=... onLoad={function onLoad}>
                                   ^^^^^^^^^^^^^^^^^

If you need interactivity, consider converting part of this to a Client Component.
```

**환경:**
- **Framework:** Next.js 15.5.7 (App Router, Turbopack)
- **문제 파일:** `app/layout.tsx`
- **관련 컴포넌트:** `components/naver-map-script.tsx`

---

## 🔍 2. 원인 분석 (Root Cause Analysis)

### 최종 원인: Server Component에서 Client Component로 이벤트 핸들러 전달 시도 🚨

**문제 코드:**
```typescript
// app/layout.tsx (Server Component)
export default function RootLayout({ children }) {
  const ncpClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  return (
    <body>
      {ncpClientId && (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${ncpClientId}`}
          strategy="afterInteractive"
          onLoad={() => {  // ❌ 이 부분이 문제!
            window.dispatchEvent(new Event('naver-maps-loaded'));
          }}
        />
      )}
    </body>
  );
}
```

**원인:**
1. `app/layout.tsx`는 Server Component입니다 (`metadata` export 존재)
2. Next.js 15에서는 Server Component에서 Client Component로 이벤트 핸들러(`onLoad`)를 직접 전달할 수 없습니다
3. `Script` 컴포넌트는 Client Component이므로, Server Component에서 `onLoad` prop을 전달하면 직렬화 오류 발생
4. 이미 `components/naver-map-script.tsx`라는 Client Component가 존재하지만 사용되지 않음

**추가 발견 사항:**
- `naver-map-script.tsx`의 URL 파라미터가 잘못됨 (`ncpClientId` 대신 `ncpKeyId` 사용해야 함 - PRD 명세)
- URL 도메인도 일치하지 않음 (`openapi.map.naver.com` vs `oapi.map.naver.com`)

---

## ✅ 3. 해결 방법 (Solution)

### 해결 전략: Client Component로 이벤트 핸들러 처리

Server Component에서 이벤트 핸들러를 전달하지 않고, 별도의 Client Component에서 처리하도록 변경했습니다.

### 1단계: NaverMapScript 컴포넌트 수정

**파일:** `components/naver-map-script.tsx`

**변경 전:**
```typescript
'use client';

import Script from 'next/script';

export default function NaverMapScript() {
  const ncpClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!ncpClientId) {
    return null;
  }

  return (
    <Script
      src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${ncpClientId}`}
      strategy="afterInteractive"
    />
  );
}
```

**변경 후:**
```typescript
'use client';

import Script from 'next/script';

export default function NaverMapScript() {
  const ncpClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!ncpClientId) {
    console.error(
      'NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다.'
    );
    return null;
  }

  return (
    <Script
      src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${ncpClientId}`}
      strategy="afterInteractive"
      onLoad={() => {
        // ✅ Client Component 내부에서 이벤트 핸들러 처리
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('naver-maps-loaded'));
        }
      }}
    />
  );
}
```

**주요 변경 사항:**
- `onLoad` 이벤트 핸들러 추가 (API 로드 완료 시 전역 이벤트 발생)
- URL 파라미터 수정: `ncpClientId` → `ncpKeyId` (PRD 명세 준수)
- URL 도메인 수정: `openapi.map.naver.com` → `oapi.map.naver.com`

### 2단계: layout.tsx 수정

**파일:** `app/layout.tsx`

**변경 전:**
```typescript
import Script from "next/script";

export default function RootLayout({ children }) {
  const ncpClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  return (
    <body>
      {ncpClientId && (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${ncpClientId}`}
          strategy="afterInteractive"
          onLoad={() => {  // ❌ Server Component에서 이벤트 핸들러 전달
            window.dispatchEvent(new Event('naver-maps-loaded'));
          }}
        />
      )}
    </body>
  );
}
```

**변경 후:**
```typescript
import NaverMapScript from "@/components/naver-map-script";

export default function RootLayout({ children }) {
  return (
    <body>
      <NaverMapScript />  {/* ✅ Client Component 사용 */}
    </body>
  );
}
```

**주요 변경 사항:**
- `Script` import 제거
- `NaverMapScript` 컴포넌트 import 추가
- 직접 Script 사용 코드 제거 및 `<NaverMapScript />` 컴포넌트로 교체
- `ncpClientId` 변수 제거 (컴포넌트 내부에서 처리)

---

## 💡 4. 배운 점 (Key Takeaways)

1. **Next.js 15의 Server/Client Component 제약사항:**
   - Server Component에서는 Client Component로 함수(이벤트 핸들러)를 직접 전달할 수 없음
   - 이벤트 핸들러가 필요한 경우 별도의 Client Component로 분리해야 함
   - `'use client'` 지시어를 사용하여 명시적으로 Client Component로 선언

2. **컴포넌트 분리의 중요성:**
   - 이미 존재하는 `NaverMapScript` 컴포넌트를 활용하여 문제 해결
   - 재사용 가능한 컴포넌트 구조가 디버깅과 유지보수를 용이하게 함

3. **PRD 명세 준수의 중요성:**
   - URL 파라미터가 `ncpKeyId`여야 한다는 PRD 명세를 확인하고 수정
   - 기존 코드와 명세 간의 불일치를 발견하고 수정

4. **에러 메시지의 명확성:**
   - Next.js 15의 에러 메시지가 매우 명확하여 원인 파악이 쉬웠음
   - "Event handlers cannot be passed to Client Component props" 메시지가 해결 방향을 제시

---

## 🚀 5. 최종 결과

- Server Component에서 이벤트 핸들러 전달 오류 해결
- NaverMapScript Client Component를 통해 Script 로드 및 이벤트 처리
- 기존 기능 유지 (API 로드 완료 시 전역 이벤트 발생)
- PRD 명세에 맞는 URL 파라미터 사용 (`ncpKeyId`)
- 네이버 지도 API가 정상적으로 로드되고 지도 및 마커가 표시됨
- **문제 해결 완료!** 🎉

---

# 관광지 상세페이지 404 오류 해결 과정 (Troubleshooting Report)

## 📌 1. 문제 상황 (Problem)

**증상:**
- 홈페이지에서 관광지 카드를 클릭하면 404 오류 발생
- 상세페이지로 이동하지 못하고 "Not Found" 페이지가 표시됨
- 브라우저 콘솔에 404 에러 메시지 표시

**에러 메시지:**
```
125472:1  Failed to load resource: the server responded with a status of 404 (Not Found)
```

**환경:**
- **Framework:** Next.js 15 (App Router)
- **문제 파일:** `app/places/[contentId]/page.tsx` (존재하지 않음)
- **관련 컴포넌트:** `components/tour-card.tsx`

---

## 🔍 2. 원인 분석 (Root Cause Analysis)

### 최종 원인: 상세페이지 라우트 파일이 존재하지 않음 🚨

**문제 코드:**
```typescript
// components/tour-card.tsx
<Link
  href={`/places/${tour.contentid}`}  // ❌ 이 경로에 해당하는 페이지가 없음
  className={...}
>
  {/* 카드 내용 */}
</Link>
```

**원인:**
1. `TourCard` 컴포넌트는 관광지 카드를 클릭하면 `/places/[contentId]` 경로로 링크를 생성함
   - 예: `/places/125472`
2. Next.js App Router에서는 동적 라우트를 위해 `app/places/[contentId]/page.tsx` 파일이 필요함
3. 하지만 해당 파일이 존재하지 않아서 Next.js가 페이지를 찾을 수 없음
4. 결과적으로 404 오류 발생

**추가 발견 사항:**
- `getDetailCommon()` API 함수는 이미 구현되어 있음 (`lib/api/tour-api.ts`)
- `TourDetail` 타입 정의도 이미 존재함 (`lib/types/tour.ts`)
- Phase 3 (상세페이지)는 TODO에 있으나 아직 구현되지 않은 상태
- Phase 2에서 카드 컴포넌트만 먼저 구현되어 링크는 생성되지만 대상 페이지가 없는 상황

---

## ✅ 3. 해결 방법 (Solution)

### 해결 전략: 임시 상세페이지 생성

Phase 3의 본격적인 구현 전까지 기본 정보를 표시하는 임시 페이지를 생성하여 404 오류를 해결했습니다.

### 구현 내용: `app/places/[contentId]/page.tsx` 파일 생성

**주요 기능:**
- Next.js 15 App Router 동적 라우팅 패턴 적용 (`await params`)
- `getDetailCommon()` API 호출로 기본 정보 가져오기
- 기본 레이아웃: 뒤로가기 버튼 + 기본 정보 섹션
- 에러 처리: API 실패 시 사용자 친화적인 에러 메시지

**표시할 정보:**
- 관광지명 (대제목)
- 관광 타입 뱃지
- 대표 이미지 (이미지 없을 때 처리)
- 주소 (MapPin 아이콘)
- 전화번호 (클릭 시 전화 연결, Phone 아이콘)
- 홈페이지 (새 탭에서 열림, Globe 아이콘)
- 개요 (긴 설명문)

**코드 구조:**
```typescript
// app/places/[contentId]/page.tsx
export default async function PlaceDetailPage({ params }: PageProps) {
  const { contentId } = await params;  // Next.js 15 패턴
  
  try {
    const detail = await getDetailCommon({ contentId });
    // 기본 정보 표시
  } catch (error) {
    // 에러 처리 UI
  }
}
```

**구현 세부사항:**
- Server Component로 구현 (Next.js 15 권장 패턴)
- 조건부 렌더링으로 정보 없는 항목 숨김 처리
- Next.js `Image` 컴포넌트로 이미지 최적화
- 반응형 디자인 적용 (모바일 우선)
- 임시 페이지임을 명시하는 안내 메시지 포함

---

## 💡 4. 배운 점 (Key Takeaways)

1. **Next.js App Router의 동적 라우팅:**
   - 동적 라우트는 `app/[param]/page.tsx` 형식의 파일 구조가 필요함
   - `[param]`은 폴더 이름으로, 해당 폴더 내에 `page.tsx` 파일이 있어야 함
   - Next.js 15에서는 `params`가 Promise이므로 `await params`로 받아야 함

2. **점진적 개발 시 주의사항:**
   - 한 컴포넌트에서 다른 페이지로 링크를 생성하는 경우, 대상 페이지가 존재하는지 확인 필요
   - 링크는 생성했지만 대상 페이지가 없는 경우 404 오류 발생
   - Phase별 개발 시 의존성을 고려하여 순서를 결정해야 함

3. **임시 페이지의 가치:**
   - 완전한 기능 구현 전까지도 사용자 경험을 위해 기본 페이지 제공이 중요
   - 임시 페이지로 기본 기능을 제공하고, 이후 점진적으로 확장 가능
   - 사용자에게 임시 버전임을 명시하면 기대치 관리에 도움

4. **에러 처리의 중요성:**
   - API 호출 실패, 잘못된 contentId 등의 경우를 대비한 에러 처리 필요
   - 사용자 친화적인 에러 메시지와 복구 경로(뒤로가기, 홈으로 돌아가기) 제공

---

## 🚀 5. 최종 결과

- 상세페이지 라우트 파일 생성 (`app/places/[contentId]/page.tsx`)
- 관광지 카드 클릭 시 404 오류 해결
- 기본 상세 정보 정상 표시 (이름, 이미지, 주소, 전화번호, 홈페이지, 개요)
- 뒤로가기 버튼으로 목록으로 복귀 가능
- 에러 발생 시 사용자 친화적 메시지 및 복구 경로 제공
- Phase 3에서 확장 가능한 구조로 설계
- **문제 해결 완료!** 🎉

---

# 상세페이지 홈페이지 링크 404 오류 및 전화번호 미표시 문제 해결 과정 (Troubleshooting Report)

## 📌 1. 문제 상황 (Problem)

**증상:**
- 상세페이지에서 홈페이지 링크를 클릭하면 404 오류 발생
- 전화번호가 표시되지 않음 (빈 공간만 보임)

**환경:**
- **Framework:** Next.js 15 (App Router)
- **문제 파일:** `components/tour-detail/detail-info.tsx`
- **관련 API:** 한국관광공사 API (`getDetailCommon`)

---

## 🔍 2. 원인 분석 (Root Cause Analysis)

### 문제 1: 홈페이지 URL 형식 불일치 🚨

**원인:**
- 한국관광공사 API의 `homepage` 필드는 다양한 형식으로 제공됨
  - 프로토콜이 없는 URL: `"www.example.com"` (프로토콜 없음)
  - 상대 경로: `"/path/to/page"` (상대 경로)
  - 빈 문자열: `""` (빈 값)
- 브라우저는 프로토콜이 없는 URL을 상대 경로로 해석하여 404 오류 발생
- 예: `www.example.com` → 브라우저가 현재 도메인 기준으로 해석 → `localhost:3000/www.example.com` → 404 오류

### 문제 2: 전화번호 빈 값 처리 누락 🚨

**원인:**
- API 응답의 `tel` 필드가 빈 문자열(`""`)이거나 공백(`" "`)일 수 있음
- JavaScript에서 빈 문자열은 `falsy`이지만, 조건문에서 `if (detail.tel)`로 체크할 때 공백만 있는 경우는 `truthy`로 판단됨
- 하지만 실제로는 공백만 있어서 화면에 아무것도 표시되지 않음

---

## ✅ 3. 해결 방법 (Solution)

### 해결 전략: URL 및 전화번호 정규화 함수 구현

데이터를 표시하기 전에 정규화하여 유효한 값만 표시하도록 했습니다.

### 1단계: 홈페이지 URL 정규화 함수 구현

**파일:** `components/tour-detail/detail-info.tsx`

**구현 내용:**
```typescript
const normalizeHomepageUrl = (url: string | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  
  const trimmedUrl = url.trim();
  
  // 이미 http:// 또는 https://로 시작하는 경우
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // 상대 경로인 경우 (예: /path/to/page) null 반환
  if (trimmedUrl.startsWith('/')) {
    return null;
  }
  
  // 프로토콜이 없는 경우 https:// 추가
  return `https://${trimmedUrl}`;
};
```

**주요 기능:**
- 빈 문자열 또는 공백만 있는 경우 `null` 반환 (표시하지 않음)
- 상대 경로인 경우 `null` 반환 (표시하지 않음)
- 프로토콜이 없는 경우 `https://` 자동 추가
- 이미 올바른 형식인 경우 그대로 반환

### 2단계: 전화번호 정규화 함수 구현

**파일:** `components/tour-detail/detail-info.tsx`

**구현 내용:**
```typescript
const normalizeTel = (tel: string | undefined): string | null => {
  if (!tel || tel.trim() === '') return null;
  return tel.trim();
};
```

**주요 기능:**
- 빈 문자열 또는 공백만 있는 경우 `null` 반환 (표시하지 않음)
- 유효한 전화번호인 경우 앞뒤 공백 제거 후 반환

### 3단계: 컴포넌트 로직 수정

**변경 전:**
```typescript
{detail.homepage && (
  <a href={detail.homepage}>...</a>
)}
{detail.tel && (
  <a href={`tel:${detail.tel}`}>...</a>
)}
```

**변경 후:**
```typescript
const normalizedHomepage = normalizeHomepageUrl(detail.homepage);
const normalizedTel = normalizeTel(detail.tel);

{normalizedHomepage && (
  <a href={normalizedHomepage}>...</a>
)}
{normalizedTel && (
  <a href={`tel:${normalizedTel}`}>...</a>
)}
```

---

## 💡 4. 배운 점 (Key Takeaways)

1. **API 데이터의 불일치성:**
   - 공공 API는 데이터 형식이 일관되지 않을 수 있음
   - 프로토콜이 없는 URL, 상대 경로, 빈 값 등 다양한 형식 처리 필요
   - 데이터를 표시하기 전에 정규화하는 것이 중요

2. **빈 값 처리의 중요성:**
   - JavaScript에서 빈 문자열(`""`)과 공백(`" "`)은 다르게 동작함
   - `trim()` 메서드를 사용하여 공백 제거 후 검증 필요
   - 조건부 렌더링 전에 데이터 정규화 필수

3. **URL 처리의 주의사항:**
   - 브라우저는 프로토콜이 없는 URL을 상대 경로로 해석함
   - 외부 URL은 반드시 프로토콜(`http://` 또는 `https://`) 포함 필요
   - 상대 경로와 절대 경로를 구분하여 처리해야 함

---

## 🚀 5. 최종 결과

- 홈페이지 링크 클릭 시 404 오류 해결
- 프로토콜이 없는 URL에 `https://` 자동 추가
- 상대 경로 및 유효하지 않은 URL은 표시하지 않음
- 전화번호 빈 값 및 공백 처리로 미표시 문제 해결
- 정규화 함수로 데이터 일관성 확보
- **문제 해결 완료!** 🎉

---

# 상세페이지 홈페이지 링크 about:blank#blocked 오류 해결 과정 (Troubleshooting Report)

## 📌 1. 문제 상황 (Problem)

**증상:**
- 상세페이지에서 홈페이지 링크를 클릭하면 브라우저 주소창에 `about:blank#blocked`가 표시됨
- 페이지가 전혀 표시되지 않음 (빈 화면)
- 브라우저가 링크를 차단함

**환경:**
- **Framework:** Next.js 15 (App Router)
- **문제 파일:** `components/tour-detail/detail-info.tsx`
- **브라우저:** Chrome, Edge 등 (보안 정책에 의해 차단)

---

## 🔍 2. 원인 분석 (Root Cause Analysis)

### 최종 원인: 유효하지 않은 URL 형식 🚨

**문제 코드:**
```typescript
// 이전 구현
const normalizeHomepageUrl = (url: string | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  
  const trimmedUrl = url.trim();
  
  // 프로토콜이 없는 경우 https:// 추가
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return `https://${trimmedUrl}`;  // ❌ 유효성 검증 없이 추가
  }
  
  return trimmedUrl;
};
```

**원인:**
1. 프로토콜이 없는 URL에 `https://`를 추가했지만, URL 자체가 유효하지 않은 경우가 있음
   - 예: `"invalid url!!!"` → `"https://invalid url!!!"` (유효하지 않은 URL)
   - 예: `"http://invalid url"` (공백 포함)
2. 브라우저는 유효하지 않은 URL을 차단하여 `about:blank#blocked`로 리다이렉트
3. `new URL()` 생성자로 유효성 검증을 하지 않아서 잘못된 URL이 그대로 사용됨

**추가 발견 사항:**
- 이미 프로토콜이 있는 URL도 유효성 검증이 필요함
- `http://invalid url` 같은 공백이 포함된 URL도 유효하지 않음

---

## ✅ 3. 해결 방법 (Solution)

### 해결 전략: URL 유효성 검증 추가

`new URL()` 생성자를 사용하여 URL 유효성을 검증하고, 유효하지 않은 URL은 표시하지 않도록 했습니다.

### 코드 수정: `normalizeHomepageUrl` 함수 개선

**파일:** `components/tour-detail/detail-info.tsx`

**변경 전:**
```typescript
const normalizeHomepageUrl = (url: string | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  
  const trimmedUrl = url.trim();
  
  // 프로토콜이 없는 경우 https:// 추가
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return `https://${trimmedUrl}`;  // ❌ 유효성 검증 없음
  }
  
  return trimmedUrl;
};
```

**변경 후:**
```typescript
const normalizeHomepageUrl = (url: string | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  
  const trimmedUrl = url.trim();
  
  // 이미 http:// 또는 https://로 시작하는 경우
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    try {
      // URL 유효성 검증
      new URL(trimmedUrl);
      return trimmedUrl;
    } catch {
      // 유효하지 않은 URL이면 null 반환
      return null;
    }
  }
  
  // 상대 경로인 경우 (예: /path/to/page) null 반환
  if (trimmedUrl.startsWith('/')) {
    return null;
  }
  
  // 프로토콜이 없는 경우 https:// 추가
  const normalizedUrl = `https://${trimmedUrl}`;
  
  try {
    // URL 유효성 검증
    new URL(normalizedUrl);
    return normalizedUrl;
  } catch {
    // 유효하지 않은 URL이면 null 반환
    return null;
  }
  };
```

**주요 변경 사항:**
- 프로토콜이 있는 URL도 `new URL()`로 유효성 검증
- 프로토콜을 추가한 후에도 `new URL()`로 유효성 검증
- 유효하지 않은 URL은 `null` 반환하여 표시하지 않음
- `try-catch`로 에러 처리하여 안전하게 처리

---

## 💡 4. 배운 점 (Key Takeaways)

1. **URL 유효성 검증의 중요성:**
   - 프로토콜만 추가하는 것으로는 충분하지 않음
   - `new URL()` 생성자를 사용하여 URL 형식 검증 필요
   - 유효하지 않은 URL은 브라우저가 차단하여 사용자 경험 저하

2. **브라우저 보안 정책:**
   - 브라우저는 유효하지 않은 URL을 `about:blank#blocked`로 차단
   - 공백이 포함된 URL, 특수 문자가 잘못 사용된 URL 등은 유효하지 않음
   - 사용자에게 오류를 보여주기보다는 유효하지 않은 링크를 표시하지 않는 것이 나음

3. **에러 처리 패턴:**
   - `new URL()`은 유효하지 않은 URL에 대해 예외를 발생시킴
   - `try-catch`로 예외를 처리하여 안전하게 처리
   - 유효하지 않은 경우 `null`을 반환하여 조건부 렌더링으로 숨김

---

## 🚀 5. 최종 결과

- 홈페이지 링크 클릭 시 `about:blank#blocked` 오류 해결
- 유효하지 않은 URL은 표시하지 않음
- 프로토콜이 있는 URL과 없는 URL 모두 유효성 검증
- 브라우저 보안 정책에 맞는 안전한 URL 처리
- 사용자 경험 개선 (유효하지 않은 링크 숨김)
- **문제 해결 완료!** 🎉

---

# 이미지 갤러리 모달 검은 화면 문제 해결 과정 (Troubleshooting Report)

## 📌 1. 문제 상황 (Problem)

**증상:**
- 이미지 갤러리 섹션은 정상 작동 (이미지가 표시됨)
- 이미지를 클릭하면 모달이 열림
- 모달 내부가 검은 화면으로만 표시됨 (이미지가 보이지 않음)

**환경:**
- **Framework:** Next.js 15 (App Router)
- **문제 파일:** `components/tour-detail/detail-gallery.tsx`
- **라이브러리:** Swiper, shadcn/ui Dialog
- **이미지 컴포넌트:** Next.js Image (fill 속성 사용)

---

## 🔍 2. 원인 분석 (Root Cause Analysis)

### 최종 원인: Next.js Image의 `fill` 속성과 Swiper 높이 계산의 순환 참조 및 스타일 충돌 🚨

**문제 코드:**
```tsx
// 모달 내 Swiper
<SwiperSlide>
  <div className="relative w-full h-full">
    <Image
      src={imageUrl}
      fill  // ❌ 부모 컨테이너 크기 필요
      className="object-contain" // ❌ Swiper 높이 계산 불가
    />
  </div>
</SwiperSlide>
```

**원인:**
1. **Next.js Image `fill` 속성과 Swiper 충돌:**
   - `fill` 속성은 부모 컨테이너의 명시적인 높이를 필요로 함
   - Swiper는 자식 콘텐츠의 높이에 따라 자신의 높이를 계산하려고 함
   - 순환 참조로 인해 높이가 0이 되어 보이지 않음

2. **DialogContent 스타일 충돌:**
   - `DialogContent`는 기본적으로 `grid` 레이아웃과 `max-width`를 가짐
   - 전체 화면 갤러리를 위해 이를 오버라이드해야 했으나 `!important` 없이는 적용되지 않음

---

## ✅ 3. 해결 방법 (Solution)

### 해결 전략: Dialog 스타일 강제 오버라이드 및 img 태그 사용

Next.js `Image` 컴포넌트의 `fill` 속성 대신 네이티브 `img` 태그를 사용하여 원본 비율을 유지하면서 화면에 맞게 표시하도록 변경했습니다. 또한 `DialogContent`의 스타일을 강제로 덮어씌워 전체 화면 레이아웃을 구현했습니다.

### 1단계: DialogContent 스타일 오버라이드

**파일:** `components/tour-detail/detail-gallery.tsx`

**코드:**
```tsx
<DialogContent className="!max-w-none !p-0 !rounded-none !bg-black/95 !fixed !inset-0 !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !grid-none !block z-50 w-full h-full border-none [&>button]:hidden">
```
- `!important` 접두사(`!`)를 사용하여 shadcn/ui 기본 스타일을 모두 무력화
- `!grid-none !block`: Grid 레이아웃 해제
- `!inset-0`: 전체 화면(full screen) 보장
- `[&>button]:hidden`: 기본 닫기 버튼 숨김 (커스텀 닫기 버튼 사용)

### 2단계: Swiper 내부 이미지 렌더링 방식 변경

**변경 전 (Next.js Image + fill):**
```tsx
<div className="relative w-full h-full">
  <Image src={imageUrl} fill className="object-contain" />
</div>
```

**변경 후 (Native img):**
```tsx
<div className="w-full h-full flex items-center justify-center p-4">
  <img
    src={imageUrl}
    alt={...}
    className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
  />
</div>
```
- 네이티브 `img` 태그 사용으로 `fill` 속성과 부모 높이 의존성 제거
- `max-w-full max-h-[90vh]`로 화면 내에 들어오도록 크기 제한
- `w-auto h-auto`로 원본 비율 유지
- `object-contain`으로 이미지가 잘리지 않도록 함

---

## 💡 4. 배운 점 (Key Takeaways)

1. **Next.js Image와 Swiper의 호환성:**
   - `fill` 속성을 가진 Next.js Image는 부모 높이가 명확해야 함
   - Swiper는 자식 콘텐츠 높이에 따라 크기가 결정됨 (기본적으로)
   - 이 둘을 함께 쓰면 크기 계산 순환 참조가 발생하여 0x0이 되기 쉬움
   - 전체 화면 갤러리처럼 동적 크기에서는 네이티브 `img` 태그가 더 다루기 쉬움

2. **shadcn/ui Dialog 커스터마이징:**
   - 기본적으로 모달 대화상자용이라 전체 화면 갤러리용으로는 스타일 충돌이 많음
   - Tailwind의 `!`(important) modifier를 사용하여 기본 스타일을 강력하게 덮어써야 할 때가 있음
   - 특히 `grid` 스타일과 `max-width` 제한을 해제하는 것이 핵심

---

## 🚀 5. 최종 결과

- 이미지를 클릭하면 검은 화면이 아닌 실제 이미지가 보임
- 이미지가 화면 크기에 맞춰 비율을 유지하며 표시됨
- 전체 화면 모달이 정상적으로 작동함
- **문제 해결 완료!** 🎉

---

# Donut Chart 툴팁 미표시 및 필터링 오작동 해결 과정 (Troubleshooting Report)

## 📌 1. 문제 상황 (Problem)

**증상 1 - 툴팁 미표시:**
- 통계 페이지의 Donut Chart (`TypeChart`) 조각에 마우스를 올렸을 때 툴팁이 뜨긴 하지만 내용이 비어있음.
- 타입명, 개수, 비율 등 중요한 정보가 표시되지 않음.

**증상 2 - 클릭 시 필터링 실패:**
- Donut Chart의 조각(특정 타입을 나타냄)을 클릭하면 메인 목록 페이지로 이동함.
- 하지만 선택한 타입으로 필터링되지 않고 "전체 목록"이 표시됨.
- 필터가 적용되지 않은 상태로 이동됨.

**환경:**
- **Framework:** Next.js 15 (App Router)
- **UI Library:** shadcn/ui (Chart 컴포넌트, recharts 기반)
- **Component:** `components/stats/type-chart.tsx`
- **Related Component:** `components/tour-filters.tsx`

---

## 🔍 2. 원인 분석 (Root Cause Analysis)

### 문제 1: shadcn/ui `ChartTooltipContent`의 동작 방식 오해
- **원인:**
  - `ChartTooltipContent` 컴포넌트는 `shadcn/ui`에서 제공하는 recharts 툴팁 래퍼임.
  - 이 컴포넌트는 내부적으로 `payload` 데이터를 기반으로 내용을 자동 렌더링하도록 설계되어 있음.
  - 하지만 우리는 커스텀 레이아웃(타입명, 개수, 비율)을 표시하기 위해 `ChartTooltipContent` 내부에 `children`으로 `div`와 텍스트를 전달했음.
  - `ChartTooltipContent`는 전달받은 `children`을 렌더링하지 않고 무시함. 결과적으로 빈 툴팁이 표시됨.

### 문제 2: URL 쿼리 파라미터 이름 불일치
- **원인:**
  - `TypeChart` 컴포넌트에서는 클릭 시 이동할 URL을 다음과 같이 생성함:
    ```typescript
    router.push(`/?contentTypeId=${data.contentTypeId}`) // 단수형 'Id'
    ```
  - 하지만 메인 페이지(`app/page.tsx`)와 필터 컴포넌트(`components/tour-filters.tsx`)는 다음과 같이 **복수형** 파라미터를 기대함:
    ```typescript
    const currentContentTypeIds = searchParams.get('contentTypeIds'); // 복수형 'Ids'
    ```
  - 파라미터 이름이 `contentTypeId`로 전달되니, 메인 페이지에서는 이를 인식하지 못하고(`undefined`), 기본값인 "전체 목록"을 보여줌.

---

## ✅ 3. 해결 방법 (Solution)

### 해결 1: 커스텀 툴팁 구현 (Wrapper 교체)
`ChartTooltipContent` 대신 동일한 스타일을 가진 일반 `div` 태그를 사용하여 커스텀 내용을 직접 렌더링했습니다.

**변경 전:**
```tsx
<ChartTooltip
  content={({ active, payload }) => {
    // ... 데이터 추출 로직 ...
    return (
      <ChartTooltipContent> {/* ❌ children을 렌더링하지 않음 */}
        <div className="space-y-2">
          ... 커스텀 내용 ...
        </div>
      </ChartTooltipContent>
    )
  }}
/>
```

**변경 후:**
```tsx
<ChartTooltip
  content={({ active, payload }) => {
    // ... 데이터 추출 로직 ...
    return (
      // ✅ ChartTooltipContent와 동일한 스타일의 div 사용
      <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
        <div className="space-y-2">
          ... 커스텀 내용 ...
        </div>
      </div>
    )
  }}
/>
```

### 해결 2: URL 파라미터 이름 수정
`TypeChart` 컴포넌트의 라우팅 코드를 수정하여 올바른 파라미터 이름(`contentTypeIds`)을 사용하도록 변경했습니다.

**변경 전:**
```typescript
router.push(`/?contentTypeId=${data.contentTypeId}`) // ❌ 단수형
```

**변경 후:**
```typescript
router.push(`/?contentTypeIds=${data.contentTypeId}`) // ✅ 복수형
```

---

## 💡 4. 배운 점 (Key Takeaways)

1. **라이브러리 컴포넌트의 제약사항 확인:**
   - `shadcn/ui`의 고수준 컴포넌트(`ChartTooltipContent`)가 항상 `children`을 렌더링한다고 가정하면 안 됨.
   - 데이터 기반 컴포넌트는 내부 로직에 의해 렌더링 내용이 결정될 수 있음.
   - 커스텀이 필요한 경우, 래퍼 컴포넌트 대신 하위 요소(HTML/Tailwind)를 직접 사용하는 것이 더 유연함.

2. **시스템 간 인터페이스 일치 (Contract):**
   - URL 쿼리 파라미터는 페이지 간의 중요한 인터페이스(Contract)임.
   - 페이지 A에서 페이지 B로 이동할 때, 페이지 B가 기대하는 파라미터 명세를 정확히 따라야 함.
   - 변수명 하나(`Id` vs `Ids`)의 차이가 기능 전체의 오작동을 유발할 수 있음.

---

## 🚀 5. 최종 결과

- **툴팁 정상화:** Donut Chart 조각에 마우스를 올리면 **타입명, 개수, 비율**이 정상적으로 표시됨.
- **필터링 정상화:** 차트 조각을 클릭하면 메인 목록으로 이동하며, 클릭한 **해당 타입으로 정확히 필터링**된 목록이 표시됨.
- **문제 해결 완료!** 🎉

---

# Bar Chart 툴팁 미표시 문제 해결 과정 (Troubleshooting Report)

## 📌 1. 문제 상황 (Problem)

**증상:**
- 통계 페이지의 Bar Chart (`RegionChart`) 막대에 마우스를 올렸을 때 툴팁이 전혀 표시되지 않음
- 지역명, 관광지 개수, 비율 등 중요한 정보를 확인할 수 없음
- Donut Chart (`TypeChart`)는 정상 작동하지만 Bar Chart만 문제 발생

**환경:**
- **Framework:** Next.js 15 (App Router)
- **UI Library:** shadcn/ui (Chart 컴포넌트, recharts 기반)
- **Component:** `components/stats/region-chart.tsx`
- **Related Component:** `components/ui/chart.tsx` (ChartTooltipContent)

---

## 🔍 2. 원인 분석 (Root Cause Analysis)

### 최종 원인: ChartTooltipContent에 props 전달 누락 및 이중 렌더링 로직 충돌 🚨

**문제 코드:**
```typescript
// components/stats/region-chart.tsx (이전 코드)
<ChartTooltip
  content={({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null
    }

    const data = payload[0].payload as ChartDataPoint
    return (
      <ChartTooltipContent>  // ❌ props를 전달하지 않음
        <div className="space-y-2">
          <div className="font-semibold">{data.label}</div>
          {/* ... 커스텀 내용 ... */}
        </div>
      </ChartTooltipContent>
    )
  }}
/>
```

**원인 분석:**

1. **ChartTooltipContent에 props 전달 누락:**
   - `ChartTooltip`의 `content` prop에 전달된 함수에서 `ChartTooltipContent`를 사용하지만, `active`, `payload`, `label` props를 전달하지 않음
   - `ChartTooltipContent`는 내부에서 `active`, `payload`를 사용하여 렌더링을 결정하는데, props가 없으면 제대로 작동하지 않음
   - `ChartTooltipContent`의 내부 로직 (line 167): `if (!active || !payload?.length) { return null }`이 항상 `true`가 되어 툴팁이 렌더링되지 않음

2. **이중 렌더링 로직 충돌:**
   - 커스텀 함수에서 `ChartTooltipContent` 내부에 커스텀 `div`를 `children`으로 전달
   - `ChartTooltipContent`는 자체적으로 `payload`를 기반으로 렌더링을 시도하므로 이중 처리 발생
   - `ChartTooltipContent`는 `children`을 무시하고 내부 로직에 따라 렌더링하려고 시도

3. **데이터 접근 방식 문제:**
   - `payload[0].payload`로 접근하지만, `ChartTooltipContent` 내부에서도 `payload`를 처리하므로 데이터 구조가 맞지 않을 수 있음
   - `formatter`의 5번째 인자 `payload`는 실제로 `item.payload`를 의미하는데, 이를 명확히 이해하지 못함

**추가 발견 사항:**
- Donut Chart (`TypeChart`)는 커스텀 `div`를 직접 반환하는 방식으로 구현되어 있어 정상 작동
- Bar Chart는 `ChartTooltipContent`를 사용하려고 했지만 props 전달 방식이 잘못됨

---

## ✅ 3. 해결 방법 (Solution)

### 해결 전략: ChartTooltipContent에 props 전달 + formatter 사용

`ChartTooltipContent`에 `active`, `payload`, `label`을 props로 전달하고, `labelFormatter`와 `formatter`를 사용하여 커스텀 내용을 표시하도록 수정했습니다.

### 코드 수정: ChartTooltip의 content prop 수정

**파일:** `components/stats/region-chart.tsx`

**변경 전:**
```typescript
<ChartTooltip
  content={({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null
    }

    const data = payload[0].payload as ChartDataPoint
    return (
      <ChartTooltipContent>  // ❌ props 전달 누락
        <div className="space-y-2">
          <div className="font-semibold">{data.label}</div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">관광지 개수:</span>
            <span className="font-mono font-medium">
              {formatNumber(data.value)}개
            </span>
          </div>
          {data.percentage !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">비율:</span>
              <span className="font-mono font-medium">
                {data.percentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </ChartTooltipContent>
    )
  }}
/>
```

**변경 후:**
```typescript
<ChartTooltip
  content={(props) => {
    // props가 없거나 active가 false면 null 반환
    if (!props || !props.active || !props.payload || props.payload.length === 0) {
      return null
    }

    // payload[0].payload에서 ChartDataPoint 추출
    const data = props.payload[0]?.payload as ChartDataPoint | undefined
    if (!data) {
      return null
    }

    // ChartTooltipContent에 모든 props 전달
    return (
      <ChartTooltipContent
        {...props}  // ✅ active, payload, label 등 모든 props 전달
        labelFormatter={(value, payload) => {
          // payload[0].payload에서 ChartDataPoint 추출
          const chartData = payload?.[0]?.payload as ChartDataPoint | undefined
          return chartData?.label || value || '알 수 없음'
        }}
        formatter={(value, name, item, index, payload) => {
          // formatter의 5번째 인자 payload는 item.payload를 의미
          // ChartDataPoint 타입 데이터 추출 (payload 우선, 없으면 item.payload 사용)
          const chartData = (payload as ChartDataPoint) || (item?.payload as ChartDataPoint)
          if (!chartData || chartData.value === undefined) {
            return null
          }

          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">관광지 개수:</span>
                <span className="font-mono font-medium">
                  {formatNumber(chartData.value)}개
                </span>
              </div>
              {chartData.percentage !== undefined && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">비율:</span>
                  <span className="font-mono font-medium">
                    {chartData.percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )
        }}
      />
    )
  }}
/>
```

**주요 변경 사항:**

1. **props 객체 전체 전달:**
   - `content` prop의 함수 시그니처를 `({ active, payload })`에서 `(props)`로 변경
   - `ChartTooltipContent`에 `{...props}`로 모든 props 전달 (`active`, `payload`, `label` 포함)

2. **labelFormatter 구현:**
   - 지역명을 툴팁 제목으로 표시하기 위한 `labelFormatter` 함수 추가
   - `payload[0].payload`에서 `ChartDataPoint` 추출하여 `label` 반환

3. **formatter 구현:**
   - 관광지 개수와 비율을 커스텀 JSX로 표시하기 위한 `formatter` 함수 추가
   - `formatter`의 5번째 인자 `payload`는 실제로 `item.payload`를 의미함을 명확히 함
   - 데이터 유효성 검사 추가 (`chartData`와 `value` 존재 여부 확인)

4. **데이터 접근 로직 개선:**
   - `payload`와 `item.payload` 모두 확인하여 안전하게 데이터 추출
   - Optional chaining과 타입 가드를 사용하여 안전성 향상

---

## 💡 4. 배운 점 (Key Takeaways)

1. **shadcn/ui ChartTooltipContent의 동작 원리:**
   - `ChartTooltipContent`는 `active`, `payload` props를 필수로 받아야 함
   - props가 없으면 내부 조건문에서 항상 `null`을 반환하여 툴팁이 표시되지 않음
   - `{...props}`로 모든 props를 전달해야 정상 작동함

2. **formatter와 labelFormatter의 역할:**
   - `labelFormatter`: 툴팁의 제목(라벨) 부분을 커스터마이징
   - `formatter`: 툴팁의 내용 부분을 커스터마이징 (JSX 반환 가능)
   - `formatter`의 5번째 인자 `payload`는 실제로 `item.payload`를 의미함

3. **컴포넌트 props 전달의 중요성:**
   - React 컴포넌트는 필요한 props를 모두 전달해야 정상 작동함
   - 특히 라이브러리 컴포넌트는 내부 로직이 복잡하므로 props 전달이 필수적
   - `{...props}` 스프레드 연산자를 사용하여 모든 props를 전달하는 것이 안전함

4. **데이터 접근 방식의 이해:**
   - recharts의 `payload` 구조를 정확히 이해해야 함
   - `payload[0].payload`는 실제 차트 데이터를 의미
   - `formatter`의 인자 순서와 의미를 정확히 파악해야 함

5. **Donut Chart와 Bar Chart의 차이:**
   - Donut Chart는 커스텀 `div`를 직접 반환하는 방식으로 구현되어 있음
   - Bar Chart는 `ChartTooltipContent`를 사용하여 일관된 스타일 유지
   - 두 방식 모두 유효하지만, `ChartTooltipContent` 사용 시 props 전달이 필수

---

## 🚀 5. 최종 결과

- **툴팁 정상화:** Bar Chart의 막대에 마우스를 올리면 **지역명, 관광지 개수, 비율**이 정상적으로 표시됨
- **일관된 스타일:** `ChartTooltipContent`를 사용하여 TypeChart와 일관된 툴팁 스타일 유지
- **데이터 정확성:** 표시된 데이터가 실제 데이터와 일치하며, 숫자 포맷팅도 올바르게 작동
- **안정성 향상:** 데이터 유효성 검사 추가로 에러 발생 가능성 감소
- **문제 해결 완료!** 🎉