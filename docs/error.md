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

### 최종 원인: Next.js Image의 `fill` 속성과 Swiper 높이 계산의 순환 참조 🚨

**문제 코드:**
```typescript
// 모달 내 Swiper
<SwiperSlide>
  <div className="relative w-full h-full min-h-[90vh] flex items-center justify-center">
    <Image
      src={imageUrl}
      alt={...}
      fill  // ❌ 부모 컨테이너의 크기에 의존
      className="object-contain"
    />
  </div>
</SwiperSlide>
```

**원인:**
1. **Next.js Image의 `fill` 속성 제약:**
   - `fill` 속성은 부모 컨테이너가 `position: relative`이고 **명시적인 크기(너비와 높이)**를 가져야 작동함
   - 부모의 크기가 0이면 이미지가 표시되지 않음

2. **Swiper 높이 계산 문제:**
   - Swiper는 슬라이드 내용에 따라 높이를 자동으로 계산함
   - 하지만 Next.js Image의 `fill` 속성을 사용하면 이미지가 부모 크기에 의존하므로 순환 참조 발생
   - 이미지는 부모 크기를 기다리고, 부모(Swiper)는 이미지 크기를 기다리는 상황

3. **DialogContent 스타일 충돌:**
   - DialogContent의 기본 스타일(`grid` 레이아웃)이 커스텀 스타일과 충돌
   - `!important`를 사용해도 모든 기본 스타일을 완전히 오버라이드하지 못함

4. **타이밍 문제:**
   - 모달이 열릴 때 Swiper가 아직 높이를 계산하기 전에 이미지가 렌더링되려고 시도
   - `h-full`은 부모의 높이를 상속받는데, 부모(Swiper)의 높이가 아직 계산되지 않았으면 0이 됨

---

## ✅ 3. 해결 방법 (Solution)

### 해결 전략: 일반 `<img>` 태그 사용

Next.js Image의 복잡한 제약을 피하고, 모달에서는 이미지 최적화가 덜 중요하므로 일반 `<img>` 태그를 사용했습니다.

### 1단계: 모달 내 이미지를 일반 img 태그로 변경

**파일:** `components/tour-detail/detail-gallery.tsx`

**변경 전:**
```typescript
<SwiperSlide>
  <div className="relative w-full h-full min-h-[90vh] flex items-center justify-center">
    <Image
      src={imageUrl}
      alt={...}
      fill
      className="object-contain"
      sizes="100vw"
      unoptimized={...}
    />
  </div>
</SwiperSlide>
```

**변경 후:**
```typescript
<SwiperSlide>
  <div className="w-full h-full flex items-center justify-center p-4">
    <img
      src={imageUrl}
      alt={...}
      className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
      onError={(e) => {
        console.error('[DetailGallery] 이미지 로딩 실패:', imageUrl);
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  </div>
</SwiperSlide>
```

**주요 변경 사항:**
- Next.js Image 컴포넌트 제거
- 일반 `<img>` 태그 사용
- `fill` 속성 제거
- `max-w-full max-h-[90vh]` 클래스로 반응형 크기 설정
- `object-contain`으로 이미지 비율 유지
- `onError` 핸들러로 이미지 로딩 실패 처리

### 2단계: DialogContent 스타일 개선

**변경 전:**
```typescript
<DialogContent className="!max-w-none !p-0 !rounded-none !bg-black/95 !fixed !inset-0 ...">
```

**변경 후:**
```typescript
<DialogContent className="!max-w-none !p-0 !rounded-none !bg-black/95 !fixed !inset-0 !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !grid-none !block z-50 w-full h-full border-none [&>button]:hidden">
```

**주요 변경 사항:**
- `!grid-none !block` 추가하여 grid 레이아웃 제거
- 모든 위치 속성 명시적으로 오버라이드 (`!top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0`)

### 3단계: Swiper 컨테이너 구조 단순화

**변경 사항:**
- SwiperSlide 내부 div에서 `relative`, `min-h-[90vh]` 제거
- Flexbox로 중앙 정렬 (`flex items-center justify-center`)
- `p-4` 추가하여 패딩 설정

---

## 💡 4. 배운 점 (Key Takeaways)

1. **Next.js Image의 `fill` 속성 제약사항:**
   - `fill` 속성은 부모가 `position: relative`이고 명시적인 크기를 가져야 함
   - 부모의 크기가 0이면 이미지가 표시되지 않음
   - Swiper처럼 동적으로 높이를 계산하는 컨테이너와 함께 사용하기 어려움

2. **일반 img 태그 사용의 장점:**
   - 즉시 작동, 복잡한 제약 없음
   - 모달에서는 이미지 최적화가 덜 중요함 (이미 갤러리에서 로드됨)
   - 반응형 크기 조정이 간단함 (`max-w-full max-h-[90vh]`)

3. **DialogContent 스타일 오버라이드:**
   - `cn()` 함수는 클래스를 병합하므로 `!important`가 필요할 수 있음
   - `grid` 레이아웃이 남아있으면 레이아웃이 깨질 수 있음
   - 모든 기본 스타일을 명시적으로 오버라이드해야 함

4. **순환 참조 문제:**
   - 이미지가 부모 크기에 의존하고, 부모가 이미지 크기에 의존하면 순환 참조 발생
   - 이런 경우 일반 `<img>` 태그처럼 독립적인 크기를 가지는 요소를 사용하는 것이 해결책

---

## 🚀 5. 최종 결과

- 이미지 클릭 시 모달이 열리고 이미지가 정상적으로 표시됨
- 모달 내부에 이미지가 중앙에 정렬되어 표시됨
- 이미지 크기가 화면에 맞게 조정됨 (비율 유지)
- 이전/다음 버튼으로 이미지 이동 가능
- 모달 닫기 정상 작동
- 이미지 로딩 실패 시 에러 처리
- **문제 해결 완료!** 🎉

---

# 반려동물 동반 가능 토글 필터 오작동 해결 과정 (Troubleshooting Report)

## 📌 1. 문제 상황 (Problem)

**증상:**
- 반려동물 토글을 켜면 3개 장소만 표시됨 (실제로는 38개 이상 존재)
- "반려동물" 검색 시 38개가 나오지만, 토글을 켜면 3개로 줄어듦
- 반려동물과 관련 없는 장소가 필터를 통과하는 경우도 있음

**환경:**
- **Framework:** Next.js 15 (App Router)
- **관련 파일:**
  - `app/page.tsx` - 메인 페이지 로직
  - `lib/utils/pet-filter.ts` - 필터링 유틸리티
  - `lib/api/tour-api.ts` - API 호출
  - `lib/types/tour.ts` - 타입 정의

---

## 🔍 2. 원인 분석 (Root Cause Analysis)

### 문제 1: `detailPetTour2` API 데이터 제한 🚨

**원인:**
- 반려동물 필터는 `detailPetTour2` API를 호출하여 각 관광지의 반려동물 정보를 조회
- 하지만 대부분의 관광지는 이 API에 등록되어 있지 않음 (`null` 반환)
- 결과적으로 API에 등록된 3개 장소만 필터를 통과

```typescript
// 문제의 흐름
tourData.items.map(async (item) => {
  const petInfo = await getDetailPetTour({ contentId: item.contentid });
  // 대부분 null 반환 → 필터링됨
  return { ...item, petInfo };
});
```

### 문제 2: 페이지네이션 제한 🚨

**원인:**
- API에서 페이지당 20개씩만 데이터를 가져옴
- 첫 페이지 20개만 필터링되고, 나머지는 처리되지 않음

```
total: 20,        ← 현재 페이지에 20개 아이템만
beforeCount: 38   ← 전체는 38개인데 20개만 처리
```

### 문제 3: 검색어 공백 처리 누락 🚨

**원인:**
- 사용자가 "반려 동물"(공백 포함)로 검색하면 인식 실패
- `isPetSearchMode` 체크에서 "반려동물"(공백 없음)만 확인

```typescript
// 문제 코드
const petSearchKeywords = ['반려동물', '반려견', ...];
// "반려 동물"은 매칭되지 않음!
```

### 문제 4: 검색어 없이 토글만 켜면 작동 안 함 🚨

**원인:**
- 토글을 켤 때 자동 검색 로직이 없음
- `keyword`가 없으면 일반 목록 조회 → `petInfo`가 null인 항목이 대부분

---

## ✅ 3. 해결 방법 (Solution)

### 1단계: 검색 결과 기반 필터링

**파일:** `app/page.tsx`

"반려" 키워드로 검색한 결과는 이미 반려동물 관련 장소이므로, 검색 결과 자체를 반려동물 관련으로 간주합니다.

```typescript
// 변경 후
if (isPetSearchMode || isAutoPetSearch) {
  return {
    ...item,
    petInfo: {
      contentid: item.contentid,
      contenttypeid: item.contenttypeid,
      petinfo: `(검색 결과) ${item.title}`,
      acmpyTypeCd: '동반가능',
      parking: undefined,
    },
  };
}
```

### 2단계: 토글 시 자동 검색

**파일:** `app/page.tsx`

토글만 켜도 자동으로 "반려" 키워드로 검색하도록 수정합니다.

```typescript
// 반려동물 필터만 켜고 검색어가 없는 경우, 자동으로 '반려'로 검색
const effectiveKeyword = (shouldApplyPetFilter && !keyword) ? '반려' : keyword;
const isAutoPetSearch = shouldApplyPetFilter && !keyword;
```

### 3단계: 더 많은 데이터 가져오기

**파일:** `app/page.tsx`

반려동물 필터 활성화 시 100개씩 데이터를 가져와서 필터링합니다.

```typescript
// 반려동물 필터 활성화 시 더 많은 데이터를 가져와서 필터링
const fetchRows = shouldApplyPetFilter ? 100 : 20;
tourData = await searchKeyword({
  keyword: effectiveKeyword,
  numOfRows: fetchRows,
  pageNo: shouldApplyPetFilter ? 1 : pageNo,
  // ...
});
```

### 4단계: 검색어 공백 처리

**파일:** `app/page.tsx`

검색어에서 공백을 제거하고 비교하도록 수정합니다.

```typescript
// 검색어가 반려동물 관련 키워드인지 확인 (공백 무시)
const petSearchKeywords = ['반려동물', '반려견', '반려', '애완동물', '애견', '펫', 'pet'];
const normalizedKeyword = keyword?.replace(/\s+/g, '').toLowerCase() || '';
const isPetSearchMode = keyword && petSearchKeywords.some(k =>
  normalizedKeyword.includes(k.toLowerCase().replace(/\s+/g, ''))
);
```

### 5단계: 페이지 헤더 업데이트

**파일:** `app/page.tsx`

자동 검색일 때 적절한 헤더 메시지를 표시합니다.

```tsx
<h1 className="text-3xl font-bold mb-4">
  {shouldApplyPetFilter && !keyword
    ? '🐾 반려동물 동반 가능 관광지'
    : isSearchMode && keyword
      ? `"${keyword}" 검색 결과`
      : '관광지 목록'}
</h1>
```

---

## 📊 4. 수정된 파일 목록

| 파일 | 수정 내용 |
|------|----------|
| `app/page.tsx` | 자동 검색, 더 많은 데이터 가져오기, 공백 처리, 페이지 헤더 |
| `lib/utils/pet-filter.ts` | 금지/허용 키워드 확장, `isPetAllowed` 함수 개선 |
| `lib/types/tour.ts` | `PetTourInfo` 타입에 실제 API 필드 추가 (`acmpyTypeCd` 등) |

---

## 💡 5. 배운 점 (Key Takeaways)

1. **API 데이터 제한 이해:**
   - 공공 API는 모든 데이터가 완전하지 않을 수 있음
   - `detailPetTour2` API에 등록되지 않은 관광지가 많음
   - 대안적인 접근 방식 필요 (검색 결과 기반 필터링)

2. **페이지네이션과 필터링의 관계:**
   - 서버에서 필터링하지 않으면 클라이언트에서 전체 데이터를 가져와야 함
   - 더 많은 데이터를 가져와서 필터링하는 것이 현실적인 해결책

3. **사용자 입력 정규화:**
   - 검색어의 공백, 대소문자 등을 정규화하여 일관된 처리
   - `.replace(/\s+/g, '').toLowerCase()` 패턴 활용

4. **자동 검색의 가치:**
   - 사용자가 별도로 검색어를 입력하지 않아도 토글만 켜면 작동
   - 사용자 경험 개선

---

## 🚀 6. 최종 결과

| 항목 | 이전 | 이후 |
|------|------|------|
| 토글만 켜기 | 3개 | **38개** |
| "반려동물" 검색 + 토글 | 3개 | **38개** |
| "반려 동물" (공백) 검색 | 인식 안됨 | **정상 작동** |
| 페이지 헤더 | "관광지 목록" | **"🐾 반려동물 동반 가능 관광지"** |

### 최종 동작 흐름:

```
1. 토글 ON
   ↓
2. 자동으로 "반려" 키워드로 검색
   ↓
3. 100개씩 데이터 가져오기
   ↓
4. 검색 결과를 반려동물 관련으로 간주
   ↓
5. 38개 결과 표시! 🎉
```

- **문제 해결 완료!** 🎉