import { useState } from 'react';
import { AUDIO_TOOLS } from '@/constants/routes';
import AudioTrimmer from './AudioTrimmer';
import AudioMerger from './AudioMerger';
import VolumeNormaliser from './VolumeNormaliser';
import WaveformVisualiser from './WaveformVisualiser';
import styles from '../video/VideoPanel.module.css';

const MAP = {
  [AUDIO_TOOLS.TRIM]: AudioTrimmer,
  [AUDIO_TOOLS.MERGE]: AudioMerger,
  [AUDIO_TOOLS.NORMALISE]: VolumeNormaliser,
  [AUDIO_TOOLS.WAVEFORM]: WaveformVisualiser,
};

const AUDIO_MENU = [
  { id: AUDIO_TOOLS.TRIM,      label: 'Audio Trimmer',     icon: '✂', desc: 'Cut to any length' },
  { id: AUDIO_TOOLS.MERGE,     label: 'Audio Merger',      icon: '⊕', desc: 'Combine two tracks' },
  { id: AUDIO_TOOLS.NORMALISE, label: 'Volume Normaliser', icon: '◈', desc: 'Consistent levels' },
  { id: AUDIO_TOOLS.WAVEFORM,  label: 'Waveform Viewer',   icon: '〜', desc: 'Visualise audio' },
];

export default function AudioPanel({
  initialTool = AUDIO_TOOLS.TRIM,
  sharedFile,
  onRouteToFix,
}) {
  const [activeTool, setActiveTool] = useState(initialTool);
  const Component = MAP[activeTool] || AudioTrimmer;
  return (
    <div className={styles.panel}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <nav className={styles.toolNav}>
          {/* <div className={styles.navLabel}>audio tools</div> */}

          {AUDIO_MENU.map((tool) => (
            <button
              key={tool.id}
              className={`${styles.toolBtn} ${
                activeTool === tool.id ? styles.toolActive : ""
              }`}
              onClick={() => setActiveTool(tool.id)}
            >
              <span className={styles.toolIcon}>{tool.icon}</span>

              <div className={styles.toolText}>
                <span className={styles.toolLabel}>{tool.label}</span>
                <span className={styles.toolDesc}>{tool.desc}</span>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Tool Area */}
      <div className={styles.toolArea}>
        <div className={styles.toolEnter} key={activeTool}>
          <Component sharedFile={sharedFile} onRouteToFix={onRouteToFix} />
        </div>
      </div>
    </div>
  );
}