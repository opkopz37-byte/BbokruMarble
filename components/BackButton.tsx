import Link from "next/link";
import styles from "./BackButton.module.css";

type Props = {
  href: string;
  label?: string;
};

export default function BackButton({ href, label = "뒤로" }: Props) {
  return (
    <Link href={href} className={styles.btn}>
      <span className={styles.arrow} aria-hidden>←</span>
      <span>{label}</span>
    </Link>
  );
}
