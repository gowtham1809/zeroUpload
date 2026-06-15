import { useEffect } from 'react';
import { TABS, IMAGE_TABS } from '@/constants/routes';

export function useKeyboardShortcuts({
  setActiveTab,
  setActiveImageTab,
  setShortcutsOpen,
  shortcutsOpen,
  toggleTheme,
  onOpen,
  onRun,
  onReset,
  activeTab,
}) {
  useEffect(() => {
    const handler = (e) => {
      // Ignore when typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.target.isContentEditable) return;

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl combos
      if (ctrl) {
        if (key === 'o') { e.preventDefault(); onOpen?.(); return; }
        if (key === 'enter') { e.preventDefault(); onRun?.(); return; }
        if (key === 'z') { e.preventDefault(); onReset?.(); return; }
        return;
      }

      switch (key) {
        case '?':
          setShortcutsOpen(prev => !prev);
          break;
        case 'escape':
          if (shortcutsOpen) setShortcutsOpen(false);
          break;
        case 'v':
          setActiveTab(TABS.VIDEO);
          break;
        case 'i':
          setActiveTab(TABS.IMAGE);
          break;
        case 'a':
          setActiveTab(TABS.AUDIO);
          break;
        case 'h':
          setActiveTab(TABS.ABOUT);
          break;
        case 't':
          toggleTheme();
          break;
        // Image sub-tabs (only when on image tab)
        // case '1':
        //   if (activeTab === TABS.IMAGE) setActiveImageTab(IMAGE_TABS.FILTER);
        //   break;
        // case '2':
        //   if (activeTab === TABS.IMAGE) setActiveImageTab(IMAGE_TABS.CONVERT);
        //   break;
        // case '3':
        //   if (activeTab === TABS.IMAGE) setActiveImageTab(IMAGE_TABS.REMOVE_BG);
        //   break;
        // case '4':
        //   if (activeTab === TABS.IMAGE) setActiveImageTab(IMAGE_TABS.TOOLS);
        //   break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcutsOpen, activeTab, setActiveTab, setActiveImageTab,
      setShortcutsOpen, toggleTheme, onOpen, onRun, onReset]);
}
