import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <p className={styles.brand}>뽀그네 게임 스튜디오 ®</p>
          <p className={styles.tagline}>
            친구들과 함께 즐기는 실시간 미니게임 모음
          </p>
        </div>
        <div className={styles.right}>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>HOME</Link>
            <Link href="/games" className={styles.navLink}>GAMES</Link>
          </nav>
          <p className={styles.copy}>© {year} BBOGRENE GAME STUDIO</p>
        </div>
      </div>
    </footer>
  );
}
