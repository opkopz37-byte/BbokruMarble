import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 기본 Cloudflare 어댑터 설정.
// 캐시/세션을 KV·R2에 붙이려면 incrementalCache, queue 등을 여기서 지정.
export default defineCloudflareConfig();
