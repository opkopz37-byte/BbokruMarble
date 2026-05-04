import type { Metadata, Viewport } from "next";
import { Jua, Noto_Sans_KR, Cormorant_Garamond, Allura, Noto_Serif_KR } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";
import ScrollButtons from "@/components/ScrollButtons";
import "./globals.css";

const jua = Jua({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-jua",
});

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-noto",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-allura",
});

const notoSerif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-serif",
});

export const metadata: Metadata = {
  title: "뽀그네 게임 스튜디오",
  description: "친구들과 함께 즐기는 실시간 미니게임 모음",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1310",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${jua.variable} ${noto.variable} ${cormorant.variable} ${allura.variable} ${notoSerif.variable}`}>
      <body>
        <SmoothScroll>
          <ScrollProgress />
          <Header />
          <main>{children}</main>
          <Footer />
          <ScrollButtons />
        </SmoothScroll>
      </body>
    </html>
  );
}
