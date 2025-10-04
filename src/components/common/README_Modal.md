# Modal Utils - React 버전

기존 JS/CSS로 작성된 모달 유틸리티를 React JSX 컴포넌트로 변환한 버전입니다.

## 파일 구조

```
src/
├── components/common/
│   ├── ModalUtil.jsx          # 메인 모달 컴포넌트 및 훅
│   └── ModalExample.jsx       # 사용 예제 컴포넌트
└── styles/common/
    └── modalUtil.css          # 모달 스타일
```

## 주요 기능

- ✅ 성공 모달 (애니메이션 포함)
- ❌ 에러 모달 (흔들기 애니메이션)
- ⚠️ 경고 모달 (펄스 애니메이션)
- ℹ️ 정보 모달
- ❓ 확인 모달 (취소/확인 버튼)
- ⏳ 로딩 모달 (스피너 포함)

## 사용 방법

### 1. useModal 훅 사용 (권장)

```jsx
import React from "react";
import { Modal, useModal } from "./components/common/ModalUtil";

const MyComponent = () => {
  const {
    modalState,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showLoading,
  } = useModal();

  const handleSuccess = () => {
    showSuccess("작업이 완료되었습니다!", "성공", () => {
      console.log("성공 콜백 실행");
    });
  };

  const handleConfirm = () => {
    showConfirm(
      "확인",
      "정말로 삭제하시겠습니까?",
      () => console.log("확인됨"),
      () => console.log("취소됨")
    );
  };

  return (
    <div>
      <button onClick={handleSuccess}>성공 모달</button>
      <button onClick={handleConfirm}>확인 모달</button>

      {/* 모달 컴포넌트 */}
      <Modal
        show={modalState.show}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        onClose={hideModal}
      />
    </div>
  );
};
```

### 2. ModalUtils 클래스 사용 (기존 코드 호환성)

```jsx
import { ModalUtils } from "./components/common/ModalUtil";

// 먼저 useModal 훅의 메서드들을 ModalUtils에 연결
const MyApp = () => {
  const modalMethods = useModal();

  React.useEffect(() => {
    ModalUtils.setModalRef(modalMethods);
  }, [modalMethods]);

  // 이제 기존 방식으로 사용 가능
  const handleClick = () => {
    ModalUtils.showSuccess("성공!", "완료", () => {
      console.log("성공 콜백");
    });
  };
};
```

## API 레퍼런스

### useModal 훅

#### 반환값

- `modalState`: 현재 모달 상태
- `showModal(config)`: 커스텀 모달 표시
- `hideModal()`: 모달 숨기기
- `showSuccess(message, title, callback)`: 성공 모달
- `showError(message, title, callback)`: 에러 모달
- `showWarning(message, title, callback)`: 경고 모달
- `showInfo(message, title, callback)`: 정보 모달
- `showConfirm(title, message, onConfirm, onCancel)`: 확인 모달
- `showLoading(message, title)`: 로딩 모달

### Modal 컴포넌트 Props

| Prop        | Type     | Default | Description         |
| ----------- | -------- | ------- | ------------------- |
| show        | boolean  | false   | 모달 표시 여부      |
| type        | string   | 'info'  | 모달 타입           |
| title       | string   | ''      | 모달 제목           |
| message     | string   | ''      | 모달 메시지         |
| confirmText | string   | '확인'  | 확인 버튼 텍스트    |
| cancelText  | string   | '취소'  | 취소 버튼 텍스트    |
| showCancel  | boolean  | false   | 취소 버튼 표시 여부 |
| onConfirm   | function | null    | 확인 콜백           |
| onCancel    | function | null    | 취소 콜백           |
| onClose     | function | null    | 모달 닫기 콜백      |

### 모달 타입

- `success`: 성공 모달 (회전 애니메이션)
- `error`: 에러 모달 (흔들기 애니메이션)
- `warning`: 경고 모달 (펄스 애니메이션)
- `info`: 정보 모달
- `confirm`: 확인 모달 (바운스 애니메이션)
- `loading`: 로딩 모달 (스피너)

## 특징

1. **애니메이션**: 각 모달 타입별 고유한 애니메이션 효과
2. **접근성**: ESC 키 지원, 포커스 관리
3. **반응형**: 모바일 친화적 디자인
4. **유연성**: 커스텀 설정 가능
5. **호환성**: 기존 ModalUtils 클래스와 호환

## 마이그레이션 가이드

기존 JS 버전에서 React 버전으로 마이그레이션:

1. `ModalUtil.jsx`와 `modalUtil.css` 파일을 프로젝트에 추가
2. 기존 `ModalUtils` 호출 코드는 그대로 유지 가능
3. 새로운 컴포넌트에서는 `useModal` 훅 사용 권장
4. 각 페이지/컴포넌트에 `<Modal>` 컴포넌트 추가

## 예제

자세한 사용 예제는 `ModalExample.jsx` 파일을 참조하세요.
