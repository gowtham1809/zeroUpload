import { useState, useCallback, createContext, useContext } from 'react';
import { TABS, IMAGE_TABS } from '@/constants/routes';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Navigation
  const [activeTab, setActiveTab]         = useState(TABS.VIDEO);
  const [activeImageTab, setActiveImageTab] = useState(IMAGE_TABS.FILTER);
  const [activeVideoTool, setActiveVideoTool] = useState(null);
  const [activeAudioTool, setActiveAudioTool] = useState(null);

  // Shared file — drops once, carries across tools
  const [sharedFile, setSharedFile]       = useState(null);

  // Theme
  const [theme, setTheme]                 = useState('dark');

  // Shortcuts overlay
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Processing history (session only)
  const [history, setHistory]             = useState([]);

  // Route user to a fix tool with same file
  const routeToFix = useCallback((tab, tool) => {
    setActiveTab(tab);
    if (tool) {
      if (tab === TABS.VIDEO) setActiveVideoTool(tool);
      if (tab === TABS.AUDIO) setActiveAudioTool(tool);
      if (tab === TABS.IMAGE) setActiveImageTab(tool);
    }
  }, []);

  // Add to processing history
  const addHistory = useCallback((entry) => {
    setHistory(prev => [
      { ...entry, id: Date.now(), timestamp: new Date() },
      ...prev.slice(0, 49), // keep last 50
    ]);
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('zu-theme', next); } catch {}
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab,
      activeImageTab, setActiveImageTab,
      activeVideoTool, setActiveVideoTool,
      activeAudioTool, setActiveAudioTool,
      sharedFile, setSharedFile,
      theme, toggleTheme,
      shortcutsOpen, setShortcutsOpen,
      history, addHistory,
      routeToFix,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
