import { useState, useCallback } from 'react';
import Header from './Header';
import Footer from './Footer';
import ShortcutsOverlay from './ShortcutsOverlay';
import AboutPage from '@/components/shared/AboutPage';
import VideoPanel from '@/components/video/VideoPanel';
import ImagePanel from '@/components/image/ImagePanel';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TABS, IMAGE_TABS } from '@/constants/routes';
import styles from './AppShell.module.css';
import AudioPanel from '../audio/AudioPanel';

export default function AppShell() {
  const [activeTab, setActiveTab]           = useState(TABS.VIDEO);
  const [activeImageTab, setActiveImageTab] = useState(IMAGE_TABS.FILTER);
  const [shortcutsOpen, setShortcutsOpen]   = useState(false);
  const [sharedFile, setSharedFile]         = useState(null);

  const { toggle: toggleTheme, isDark } = useTheme();

  const routeToFix = useCallback((tab, tool) => {
    setActiveTab(tab);
    if (tab === TABS.IMAGE && tool) setActiveImageTab(tool);
  }, []);

  useKeyboardShortcuts({
    activeTab,
    setActiveTab,
    setActiveImageTab,
    setShortcutsOpen,
    shortcutsOpen,
    toggleTheme,
  });

  return (
    <div className={styles.shell}>
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <main className={styles.main}>
        <div className={styles.container}>
          {activeTab === TABS.VIDEO && (
            <div className={styles.panelEnter} key="video">
              <VideoPanel sharedFile={sharedFile} onRouteToFix={routeToFix} />
            </div>
          )}
          {activeTab === TABS.AUDIO && (
            <div className={styles.panelEnter} key="audio">
              <AudioPanel sharedFile={sharedFile} onRouteToFix={routeToFix} />
            </div>
          )}
          {activeTab === TABS.IMAGE && (
            <div className={styles.panelEnter} key="image">
              <ImagePanel
                activeTab={activeImageTab}
                sharedFile={sharedFile}
                onRouteToFix={routeToFix}
              />
            </div>
          )}
          {activeTab === TABS.ABOUT && (
            <div className={styles.panelEnter} key="about">
              <AboutPage />
            </div>
          )}
        </div>
      </main>

      <Footer />
      <ShortcutsOverlay
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
