import { ChefHat } from 'lucide-react';
import styles from './TopBar.module.css';

export default function TopBar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">
          <ChefHat size={20} />
        </span>
        Larder
      </div>
      <nav className={styles.nav} aria-label="Main">
        <a href="/" aria-current="page">
          Recipes
        </a>
      </nav>
      <button className={styles.avatar} aria-label="Account">
        MA
      </button>
    </header>
  );
}
