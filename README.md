# PLAB 주간업무보고

사내 주간업무보고 작성·열람 화면입니다.

```
[GitHub Pages]  index.html ── 구글 로그인 ──▶ [Apps Script]  Code.gs ──▶ [구글 시트] 사람별 파일·주차별 탭
   화면(이 레포)                                API 서버 (토큰 검증)          원본 저장소
                                                     └─▶ [슬랙] 금 15시 리마인드 · 월 9시 요약
```

- **화면**: 이 레포의 `index.html` 하나. 로그인한 사람은 본인 보고서를 작성하고, 모든 사람의 보고서를 열람합니다.
- **서버**: Apps Script(`Code.gs`)가 로그인 토큰을 검증한 뒤 시트를 읽고 씁니다. 편집은 로그인한 본인 파일에만 됩니다.
- **원본**: 구글 시트. 웹이 안 될 때는 시트에서 직접 작성해도 웹에서 그대로 읽힙니다.

> ⚠️ `Code.gs`·`appsscript.json`은 이 레포에 올리지 마세요. 구성원 이메일·슬랙 ID·폴더 ID가 들어 있습니다. Apps Script 편집기에만 둡니다. (`.gitignore`에 등록되어 있음)
> `index.html`에 들어가는 Apps Script URL과 OAuth 클라이언트 ID는 공개돼도 되는 값입니다. 서버가 회사 계정 로그인을 확인하지 못하면 아무 데이터도 주지 않습니다.

---

## 설치 순서

### 1. 로그인용 OAuth 클라이언트 ID 발급 (Google Cloud, 처음 한 번)
1. https://console.cloud.google.com → 상단 프로젝트 선택 → **새 프로젝트** (예: `plab-weekly`)
2. **API 및 서비스 → OAuth 동의 화면** → 사용자 유형 **내부** → 앱 이름 `PLAB 주간업무보고`, 지원 이메일 입력 → 저장
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - **승인된 JavaScript 원본**에 화면 주소의 도메인 부분만 추가
     - `https://<깃허브아이디>.github.io` (경로 `/plab-weekly/`는 넣지 않음)
     - 맞춤 도메인을 쓰면 그 주소도 (예: `https://weekly.plab.life`)
   - 리디렉션 URI는 비워 둠
4. 만들어진 **클라이언트 ID**(`….apps.googleusercontent.com`) 복사

### 2. Apps Script 서버 만들기
> 스크립트를 만들고 배포하는 계정이 **서버 계정**이 됩니다. 이 계정은 6명 시트 파일 모두에 **편집자** 권한이 있어야 합니다. 운영기획팀 계정을 권장합니다.

1. https://script.google.com → **새 프로젝트** → 이름 `PLAB 주간업무보고 API`
2. `Code.gs` 내용 전체를 붙여넣기 (CONFIG에 폴더 ID·이메일·슬랙 ID가 들어 있는지 확인)
3. **프로젝트 설정(⚙)** → "appsscript.json 매니페스트 파일 표시" 체크 → `appsscript.json` 내용으로 교체
4. 같은 화면 **스크립트 속성**에 추가

   | 속성 | 값 |
   |---|---|
   | `GOOGLE_CLIENT_ID` | 1단계에서 복사한 클라이언트 ID |
   | `SLACK_WEBHOOK_URL` | 알림 채널의 Incoming Webhook 주소 |
   | `WEBAPP_URL` | 화면 주소 (예: `https://<깃허브아이디>.github.io/plab-weekly/`) |

5. 함수 선택 → `checkSetup` 실행 (첫 실행 시 권한 승인) → 로그에서 6명 모두 파일 이름이 나오는지 확인

### 3. Apps Script 배포
1. **배포 → 새 배포 → 유형 선택(⚙) → 웹 앱**
2. 실행 사용자: **나** / 액세스 권한: **모든 사용자**
   - GitHub Pages에서 호출하려면 "모든 사용자"여야 합니다. 대신 서버가 모든 요청의 구글 로그인 토큰을 검사해 `plabsolution.com` 계정만 통과시킵니다.
   - 선택지에 "모든 사용자"가 없으면 Workspace 관리 콘솔에서 Apps Script 웹앱 공유 제한이 걸린 것입니다. 관리자에게 허용을 요청하세요.
3. **웹 앱 URL**(`https://script.google.com/macros/s/…/exec`) 복사
4. 브라우저로 그 URL을 열면 `{"ok":true, ...}`가 보이면 정상

### 4. GitHub 레포·Pages
1. GitHub에서 새 레포 만들기 (예: `plab-weekly`). 무료 플랜에서 Pages를 쓰려면 **Public** 이어야 합니다 (Private + Pages는 유료 플랜).
2. 이 폴더의 `index.html`, `README.md`, `.gitignore` 업로드
3. `index.html` 상단의 설정 두 줄 채우기
   ```js
   window.PLAB_CONFIG = {
     APPS_SCRIPT_URL: "https://script.google.com/macros/s/…/exec",
     GOOGLE_CLIENT_ID: "….apps.googleusercontent.com",
     DOMAIN: "plabsolution.com"
   };
   ```
4. 레포 **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `/ (root)` → Save
5. 1~2분 뒤 `https://<깃허브아이디>.github.io/plab-weekly/` 접속
6. (선택) 맞춤 도메인: Settings → Pages → Custom domain에 `weekly.plab.life` 입력, DNS에 `weekly` CNAME → `<깃허브아이디>.github.io` 추가, **Enforce HTTPS** 체크. 1단계 OAuth 클라이언트의 JavaScript 원본과 `WEBAPP_URL`도 이 주소로 맞추세요.

### 5. 슬랙 트리거
Apps Script 편집기에서 순서대로 실행
1. `testSlackWebhook` → 채널에 테스트 메시지 확인
2. `previewSlackMessages` → 금요일·월요일 메시지 문구를 로그로 확인 (전송 안 함)
3. `installTriggers` → 금 15시 미제출 리마인드, 월 9시 지난주 요약 등록 (끄려면 `removeTriggers`)

### 6. 테스트
1. 화면 주소 접속 → "Google 계정으로 로그인" → 회사 계정 선택
2. 내 이름이 열리고 "이번 주 보고서 만들기" → 누르면 시트 맨 앞에 `2026년 10월 3주차` 같은 탭 생성, 지난주 '이번주 과업'이 '지난주 과업'(0%)으로 이월
3. 진행률·금액 입력 후 저장 → 시트 값 확인 → 사이드바 점이 초록(제출)으로
4. 다른 사람 이름 클릭 → 읽기 전용, **전체 현황**에서 KPI·팀별 진행률 확인
5. 개인 Gmail로 로그인 → 거절되는지 확인
6. 시트에서 직접 한 칸 고친 뒤 웹에서 새로고침 없이 저장 → 충돌 안내가 뜨면 정상

화면만 미리 보고 싶으면 주소 끝에 `?demo`를 붙이거나 `index.html`을 컴퓨터에서 바로 열면 샘플 데이터로 동작합니다.

---

## 수정·업데이트
- **화면 수정**: `index.html` 고쳐서 push → 1~2분 뒤 반영
- **서버 수정**: Apps Script 편집기에서 고친 뒤 **배포 → 배포 관리 → ✏️ → 버전: 새 버전 → 배포**. 이렇게 하면 URL이 그대로 유지됩니다. "새 배포"를 만들면 URL이 바뀌니 주의하세요.
- **구성원 변경**: `Code.gs`의 `CONFIG.MEMBERS` 수정 후 새 버전 배포

## 알아둘 점
- 로그인은 1시간마다 갱신되며, 보통 자동으로 다시 로그인됩니다. 저장하지 않은 입력은 다시 로그인해도 화면에 남아 있습니다.
- 웹에서는 서버 계정 권한으로 시트를 읽고 쓰므로, 구성원 각자의 드라이브 권한과 무관하게 **열람은 전원, 편집은 본인만**입니다. 드라이브에서 시트를 직접 여는 것은 드라이브 권한을 따릅니다.
- 사이드바 제출 상태·전체 현황은 2분간 캐시됩니다. 시트에서 직접 고친 내용은 최대 2분 뒤 반영됩니다.
