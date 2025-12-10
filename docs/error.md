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
