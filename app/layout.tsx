import type { Metadata } from "next";
import { Jua, Noto_Sans_KR } from "next/font/google";
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

export const metadata: Metadata = {
  title: "뽀그네 게임 스튜디오",
  description: "친구들과 함께 즐기는 실시간 미니게임 모음",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${jua.variable} ${noto.variable}`}>
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
