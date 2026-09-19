// app/components/Breadcrumbs.tsx
import Link from 'next/link';
import styles from './Breadcrumbs.module.css';

type Breadcrumb = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ crumbs }: { crumbs: Breadcrumb[] }) {
  return (
    <nav aria-label="breadcrumb" className={styles.container}>
      <ol className={styles.list}>
        {crumbs.map((crumb, index) => (
          <li key={index} className={styles.item}>
            {crumb.href ? (
              <Link href={crumb.href} className={styles.link}>
                {crumb.label}
              </Link>
            ) : (
              <span className={styles.currentPage}>{crumb.label}</span>
            )}
            {index < crumbs.length - 1 && <span className={styles.separator}>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
