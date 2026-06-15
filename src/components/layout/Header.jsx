import { useState, useEffect } from 'react';
import { TABS } from '@/constants/routes';
import styles from './Header.module.css';

const NAV_TABS = [
  { id: TABS.IMAGE, label: 'Image',         short: 'I' },
  { id: TABS.VIDEO, label: 'Video', short: 'V' },
  {id: TABS.AUDIO, label: 'Audio',         short: 'A' },
  { id: TABS.ABOUT, label: 'Help / About',         short: 'H' },
];

export default function Header({ activeTab, onTabChange, isDark, onToggleTheme, onOpenShortcuts }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>

        {/* Brand */}
        <a href="/" className={styles.brand} aria-label="ZeroUpload home">
          <div className={styles.logo}>
            <span className={styles.logoBracket}>[</span>
            <span className={styles.logoZero}>0</span>
            <span className={styles.logoBracket}>]</span>
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>ZeroUpload</span>
            <span className={styles.brandTag}>nothing leaves your device</span>
          </div>
        </a>

        {/* Nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.navTab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className={styles.tabLabel}>{tab.label}</span>
              <kbd className={styles.tabKey}>{tab.short}</kbd>
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Theme toggle */}
          <button
            className={styles.iconBtn}
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title="Toggle theme (T)"
          >
            {isDark ? (
              /* Sun icon */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              /* Moon icon */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {/* Shortcuts */}
          <button
            className={styles.iconBtn}
            onClick={onOpenShortcuts}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
            </svg>
          </button>

          {/* Privacy pill */}
          <div className={styles.privacyPill} title="All processing happens in your browser">
            <span className={styles.privacyDot} />
            <span>local</span>
          </div>
        </div>
      </div>
    </header>
  );
}
