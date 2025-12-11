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