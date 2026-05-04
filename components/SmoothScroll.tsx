"use client";

import { useEffect, useRef, useState } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import { usePathname } from "next/navigation";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const lenisRef = useRef<LenisRef | null>(null);
  // 모바일/터치 디바이스에서는 Lenis가 네이티브 모멘텀 스크롤을 가로채면서
  // 입력 → 화면 반영 사이 lag이 생기고 버벅인다. 데스크톱에서만 smooth scroll 적용.
  const [enableLenis, setEnableLenis] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const isNarrow = window.innerWidth < 1024;
    setEnableLenis(!isCoarsePointer && !isNarrow);
  }, []);

  // Reset scroll to top instantly on route change
  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  if (!enableLenis) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        // 더 빠릿한 응답성: lerp 높이고 duration 줄임 (이전 0.1 / 1.2 → 0.16 / 0.85)
        lerp: 0.16,
        duration: 0.85,
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
