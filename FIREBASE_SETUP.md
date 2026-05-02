# Firebase 보안 및 비용 관리 가이드

> 이 문서는 뽁루마블의 Firebase Realtime Database를 안전하게 운영하기 위한 설정 가이드입니다.
> 모든 작업은 **Firebase Console 웹사이트**에서 진행되며, 코드 수정은 필요 없습니다.

---

## 📌 왜 이걸 해야 하나요?

현재 상태에서는 다음과 같은 위험이 있습니다.

1. **누구나 데이터를 쓰고 지울 수 있음**
   `firebase-config.js`의 API 키는 클라이언트(브라우저)에 노출되는 정보입니다. 이건 비밀이 아니라 "이 프로젝트가 어디인지" 알려주는 주소표일 뿐입니다.
   진짜 자물쇠는 **Realtime Database 보안 규칙**이며, 이게 없으면 누구든 데이터베이스 URL을 알아내 마음대로 게임 상태를 바꾸거나 전부 삭제할 수 있습니다.

2. **무료 한도(Spark 플랜)를 모르고 초과할 수 있음**
   누군가 악의적으로 또는 실수로 데이터를 폭주시키면 무료 한도(다운로드 10GB/월, DB 저장 1GB)를 넘어 서비스가 멈추거나, 유료 플랜이면 청구가 발생합니다.
   **사용량 알림**을 켜두면 80% 도달 시 이메일로 알려줍니다.

이 가이드를 끝까지 따라가면 두 가지 모두 해결됩니다. 약 **10~15분** 소요됩니다.

---

## 🚀 시작 전에

### 준비물
- Firebase 프로젝트 소유자(또는 편집자) 권한이 있는 Google 계정
- 본 프로젝트 ID: **`bbokrumarblev3`** (`firebase-config.js` 참고)

### Firebase Console 접속
1. 브라우저에서 https://console.firebase.google.com 접속
2. 구글 계정으로 로그인
3. 프로젝트 목록에서 **`bbokrumarblev3`** 클릭

> ⚠️ 만약 프로젝트가 안 보인다면 권한이 없는 계정입니다. 프로젝트 소유자(처음 만든 사람)에게 멤버로 초대해달라고 요청하세요. (프로젝트 설정 → 사용자 및 권한 → 멤버 추가)

---

## 🔐 STEP 1 — Realtime Database 보안 규칙 설정 (가장 중요)

### 1-1. 현재 규칙 확인하기

1. 좌측 메뉴에서 **빌드(Build) → Realtime Database** 클릭
2. 상단 탭 중 **규칙(Rules)** 클릭
3. 현재 표시된 JSON을 확인하세요. 보통 다음 중 하나입니다.

#### 케이스 A — 완전 개방 (가장 위험, 즉시 수정 필요)
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

#### 케이스 B — 만료 시간이 있는 테스트 모드
```json
{
  "rules": {
    ".read": "now < 1735689600000",
    ".write": "now < 1735689600000"
  }
}
```
> 이건 특정 날짜까지만 열려있는 모드입니다. 만료되면 갑자기 게임이 멈추니 어차피 바꿔야 합니다.

#### 케이스 C — 잠겨있는 상태
```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```
> 이러면 게임이 아예 동작하지 않습니다.

### 1-2. 새 규칙 적용하기

기존 내용을 **모두 지우고** 아래 내용으로 교체하세요.

```json
{
  "rules": {
    "game": {
      ".read": true,
      "state": {
        ".write": "newData.child('hostSecret').val() === 'bbokru_v3_secret_2024_1224'",
        ".validate": "newData.hasChild('hostSecret')"
      },
      "assets": {
        ".write": "newData.child('hostSecret').val() === 'bbokru_v3_secret_2024_1224'",
        ".validate": "newData.hasChild('hostSecret')"
      }
    },
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

**오른쪽 상단의 `게시(Publish)` 버튼을 꼭 누르세요.** 누르지 않으면 임시 저장 상태이고 실제로 적용되지 않습니다.

### 1-3. 규칙이 하는 일 (한 줄씩 설명)

| 줄 | 의미 |
|---|---|
| `"game": { ".read": true ... }` | `/game/*` 경로는 누구나 **읽기** 가능 → 뷰어방이 보드 상태를 받아올 수 있음 |
| `"state": { ".write": "..." }` | 게임 상태(말 위치 등)는 `hostSecret` 값이 일치할 때만 쓰기 허용 |
| `"assets": { ".write": "..." }` | 이미지(보드/말)도 마찬가지로 `hostSecret`이 일치할 때만 쓰기 허용 |
| `".validate": "newData.hasChild('hostSecret')"` | `hostSecret` 필드가 누락된 쓰기는 거부 |
| `"$other": { ".read": false, ".write": false }` | `/game` 외의 모든 경로는 차단 (방어선 강화) |

`hostSecret` 값(`bbokru_v3_secret_2024_1224`)은 [host-room.html](host-room.html)의 동기화 코드에서 자동으로 함께 전송됩니다. 즉, 정상적인 호스트 페이지에서는 그대로 작동하고, **외부에서 임의로 호출하는 요청은 거부**됩니다.

> ⚠️ **이게 완벽한 보안은 아닙니다.** `hostSecret` 값은 `host-room.html` 소스를 보면 누구나 알 수 있습니다. 이 규칙은 "URL 알아낸 무차별 봇" 정도를 막는 1차 방어선입니다.
> 더 강력한 보안이 필요하다면 **Firebase Authentication**(익명 로그인 또는 이메일 로그인)을 쓰는 게 정석이고, 그건 별도 작업입니다 (이 문서 마지막 "심화" 항목 참고).

### 1-4. 규칙이 잘 적용됐는지 테스트

게시 후 다음을 확인하세요.

#### 테스트 1: 호스트 페이지가 정상 동작하는가
1. `host-room.html`을 브라우저에서 열기 → 비밀번호 입력 → 입장
2. 말 하나를 보드 위로 드래그
3. **개발자 도구(F12) → Console 탭**에서 `✅ Firebase 상태 동기화 완료` 로그가 보이면 OK
4. ❌ 만약 `permission_denied` 오류가 보이면 규칙을 잘못 입력한 것 → 1-2 다시 확인

#### 테스트 2: 뷰어 페이지가 화면을 받아오는가
1. `viewer-room.html` 열기 → 호스트 페이지의 변경이 반영되는지 확인
2. 보드 이미지/말이 보이면 OK

#### 테스트 3: 외부에서 쓰기 차단 확인 (선택)
1. Firebase Console → Realtime Database → **데이터** 탭으로 이동
2. `game/state` 노드 옆 `+` 버튼 → 임의 키/값 추가 시도
3. **권한 거부 오류**가 뜨면 규칙이 잘 작동하는 것 (콘솔 화면에서는 관리자 권한으로 동작하므로 실제로는 추가될 수 있는데, 이건 정상입니다 — 콘솔 = 관리자 모드, 외부 = 규칙 적용)

---

## 💰 STEP 2 — 사용량 알림 설정

비용 폭주를 사전에 감지하는 보험입니다.

### 2-1. 무료 플랜(Spark) 사용자

Spark 플랜은 한도를 넘으면 **자동으로 차단**되며 청구되지 않습니다. 그래도 알림은 켜두는 게 좋습니다.

1. Firebase Console → 좌측 하단 **요금제** 또는 **사용량 및 결제**
2. **세부정보 및 설정(Details & settings)** 탭
3. **사용량(Usage)** 탭에서 다음 항목들을 확인할 수 있습니다.
   - **저장된 GB**: 1GB 한도
   - **다운로드된 GB**: 10GB/월 한도
   - **연결 수**: 100개 동시 한도
4. 한도 근처가 되면 화면에 경고가 표시됩니다. 정기적으로(주 1회 정도) 확인하세요.

### 2-2. 유료 플랜(Blaze) 사용자 — 예산 알림 필수

Blaze 플랜은 한도 초과 시 **자동 차단되지 않고 그대로 청구**됩니다. 반드시 예산 알림을 설정하세요.

1. Firebase Console → 좌측 하단 **요금제** → **세부정보 및 설정**
2. **결제 계정 관리(Manage billing account)** 클릭 → Google Cloud Console로 이동
3. 좌측 메뉴에서 **예산 및 알림(Budgets & alerts)** 클릭
4. **예산 만들기(Create budget)** 클릭
5. 다음 값으로 설정:

| 항목 | 권장값 |
|---|---|
| 이름 | `Bbokrumarble 월간 예산` |
| 범위(Scope) | `bbokrumarblev3` 프로젝트만 선택 |
| 금액 | 본인이 감당 가능한 금액 (예: $5/월) |
| 알림 임계값 | **50%, 80%, 100%, 120%** 모두 추가 |
| 이메일 수신 | 본인 이메일 (`lab@studioeon.com` 등) |

6. **저장**

이렇게 설정하면 비용이 50% 도달 시점에 미리 알림이 와서 대응할 수 있습니다.

### 2-3. Realtime Database 트래픽 모니터링

1. Firebase Console → **Realtime Database** → **사용량(Usage)** 탭
2. 다음 그래프를 확인할 수 있습니다.
   - **다운로드(GB)**: 클라이언트가 받아간 양 (뷰어 수에 비례)
   - **로드(Load)**: 동시 처리 부하
   - **저장된 데이터**: DB에 쌓인 데이터 양

**주의 신호:**
- 다운로드가 갑자기 평소의 5배 이상 → 누가 봇으로 하루종일 viewer-room.html을 열어두고 있을 수 있음
- 저장된 데이터가 100MB 넘게 쌓임 → 이미지가 base64로 누적되고 있다는 뜻 (현재 구조의 한계, STEP 3 참고)

---

## 🧹 STEP 3 — 추가 권장사항 (선택)

### 3-1. 오래된 게임 상태 정리

base64 이미지가 쌓이면 무거워집니다. 가끔 다음을 수행하세요.

1. Firebase Console → Realtime Database → **데이터** 탭
2. `/game/assets` 노드 위에 마우스 → `⋮` 메뉴 → **내보내기(Export)** 로 백업
3. 사용하지 않는 오래된 이미지가 있으면 해당 키만 삭제

### 3-2. 자동 백업 설정 (Blaze 플랜 한정)

1. Firebase Console → Realtime Database → **백업(Backups)** 탭
2. **자동 백업 사용** 체크 → 매일/매주 선택
3. 별도 비용이 발생하지만 만일의 사태 대비용

### 3-3. 데이터 위치(리전) 확인

`firebase-config.js` 보면 `asia-southeast1`(싱가포르)에 있습니다. 한국 사용자 기준으로는 무난합니다. 변경하려면 새 데이터베이스를 만들어야 해서 큰 작업이라 그대로 두는 게 좋습니다.

---

## 🆘 문제 해결 (FAQ)

### Q1. 규칙 적용 후 호스트 페이지에서 동기화가 안 돼요
**원인**: 규칙 JSON 오타 또는 `hostSecret` 값 불일치
**해결**:
1. Firebase Console → Realtime Database → 규칙 탭에서 입력한 JSON이 위 1-2번과 정확히 일치하는지 확인
2. [host-room.html:2060](host-room.html#L2060) 와 [host-room.html:2140](host-room.html#L2140) 의 `hostSecret` 값이 규칙의 값과 동일한지 확인 (현재: `bbokru_v3_secret_2024_1224`)
3. 둘이 다르면 한쪽을 맞춰야 함

### Q2. 뷰어 페이지에 데이터가 안 떠요
**원인**: `read` 규칙이 막혀있음
**해결**: 1-2번 규칙에서 `"game": { ".read": true ... }` 부분이 있는지 확인

### Q3. "permission_denied" 에러가 콘솔에 떠요
**원인**: 보안 규칙이 해당 작업을 거부함
**해결**:
1. F12 → Console 탭에서 어느 경로 쓰기가 거부됐는지 확인
2. 규칙의 해당 경로 부분이 누락됐거나 잘못됐을 가능성

### Q4. `hostSecret`을 바꾸고 싶어요
**해결**: 두 군데를 **동시에** 바꿔야 합니다.
1. [host-room.html](host-room.html) 내 `'bbokru_v3_secret_2024_1224'` 검색 → 새 값으로 모두 교체 (2군데)
2. Firebase Console → 규칙에서 같은 값을 새 값으로 교체 → 게시
> 이 둘이 어긋나면 동기화가 즉시 멈춥니다.

### Q5. 누가 데이터를 망가뜨렸어요. 복구할 수 있나요?
**해결**:
- 무료 플랜: 백업 기능이 없습니다. 미리 데이터를 수동 내보내기(Export)해두는 게 유일한 방법
- Blaze 플랜: 3-2번의 자동 백업에서 복구

---

## 🎓 심화 — 더 강한 보안 (선택)

현재 `hostSecret` 방식은 "소스 보면 보임"이라는 한계가 있습니다. 더 견고한 인증을 원한다면 **Firebase Authentication**을 도입할 수 있습니다.

### 옵션 A: 익명 로그인 (가장 간단)
- 호스트 페이지 진입 시 자동으로 익명 사용자 생성
- 보안 규칙에서 `auth != null` 조건으로 로그인된 사용자만 쓰기 허용
- **단점**: 호스트와 일반 방문자를 구분할 수 없음 (둘 다 익명 사용자)

### 옵션 B: 이메일 로그인
- 호스트만 사전 등록된 이메일로 로그인
- 보안 규칙에서 `auth.uid === '특정 UID'`로 호스트 식별
- **단점**: 호스트가 매번 로그인해야 함

### 옵션 C: Custom Claims (가장 강력)
- 백엔드(Firebase Functions)에서 호스트 토큰 발급
- 가장 안전하지만 백엔드 코드가 필요해 작업량 큼

도입을 결정하면 별도 코드 작업이 필요하므로 그때 다시 안내드릴 수 있습니다.

---

## ✅ 체크리스트

설정을 마쳤다면 아래를 확인하세요.

- [ ] Firebase Console에 접속해 `bbokrumarblev3` 프로젝트가 보인다
- [ ] Realtime Database → 규칙 탭에 위 1-2번의 JSON이 적용되고 게시됐다
- [ ] `host-room.html`에서 비밀번호 입력 후 말을 드래그하면 콘솔에 `✅ Firebase 상태 동기화 완료`가 뜬다
- [ ] `viewer-room.html`을 열면 호스트의 변경이 실시간 반영된다
- [ ] 사용량 페이지에 들어가 한도를 한 번 확인했다
- [ ] (Blaze 플랜이면) 예산 알림을 만들었다

모두 ✅ 면 비용·보안 큰 위험은 차단된 상태입니다.

---

## 📞 참고 자료

- Firebase 콘솔: https://console.firebase.google.com
- Realtime Database 보안 규칙 공식 문서: https://firebase.google.com/docs/database/security
- 가격 책정: https://firebase.google.com/pricing
- 사용량 한도: https://firebase.google.com/docs/database/usage/limits
