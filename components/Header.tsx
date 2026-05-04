"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion } from "motion/react";
import styles from "./Header.module.css";

const navItems = [
  { href: "/", label: "HOME" },
  { href: "/games", label: "GAMES" },
];

const DARK_ROUTES = [
  "/",
  "/games",
];

export default function Header() {
  const pathname = usePathname();
  const isDark = DARK_ROUTES.some(
    (r) => r === pathname || (r !== "/" && pathname.startsWith(r)),
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("themeDark", isDark);
    return () => {
      document.body.classList.remove("themeDark");
    };
  }, [isDark]);

  return (
    <motion.header
      className={styles.header}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} />
          <span className={styles.brandText}>뽀그네 게임 스튜디오</span>
        </Link>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="navActiveBg"
                    className={styles.navActiveBg}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}
