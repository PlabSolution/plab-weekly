/* PLAB 주간업무보고 서비스 워커
 * - 화면(HTML)은 항상 네트워크 우선 → 새로 배포한 index.html이 바로 반영됨. 오프라인일 때만 저장본 표시
 * - 아이콘·매니페스트만 캐시
 * - 보고서 데이터(Apps Script)·구글 로그인·폰트 등 다른 주소 요청은 건드리지 않음 (보고서 내용은 기기에 저장하지 않음)
 */
const CACHE = 'plab-weekly-v1';
const SHELL = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // Apps Script·구글 로그인·폰트는 브라우저가 그대로 처리

  if (req.mode === 'navigate') {                           // 화면: 네트워크 우선
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); return res; })
        .catch(() => caches.match('./'))
    );
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));   // 아이콘 등: 캐시 우선
});
