import { useState } from "react";
import { VIDEO_TOOLS } from "@/constants/routes";

import ExtractAudio from "./ExtractAudio";
import GrabFrame from "./GrabFrame";
import Transcode from "./Transcode";
import VideoTrimmer from "./VideoTrimmer";
import VideoCompressor from "./VideoCompressor";
import GifMaker from "./GifMaker";
import ThumbnailGenerator from "./ThumbnailGenerator";
import VideoWatermark from "./VideoWatermark";

import styles from "./VideoPanel.module.css";

const VIDEO_MENU = [
  {
    id: VIDEO_TOOLS.EXTRACT_AUDIO,
    label: "Extract Audio",
    icon: "♫",
    desc: "MP3 / WAV from video",
  },
  {
    id: VIDEO_TOOLS.GRAB_FRAME,
    label: "Grab Frame",
    icon: "◻",
    desc: "PNG at any timestamp",
  },
  {
    id: VIDEO_TOOLS.TRANSCODE,
    label: "Transcode",
    icon: "⇄",
    desc: "MP4 ↔ WebM",
  },
  {
    id: VIDEO_TOOLS.TRIM,
    label: "Video Trimmer",
    icon: "✂",
    desc: "Cut to in/out points",
  },
  {
    id: VIDEO_TOOLS.COMPRESS,
    label: "Video Compressor",
    icon: "⬇",
    desc: "Reduce file size",
  },
  {
    id: VIDEO_TOOLS.GIF,
    label: "GIF Maker",
    icon: "◉",
    desc: "Max 10 sec clip",
  },
  {
    id: VIDEO_TOOLS.THUMBNAIL,
    label: "Thumbnail Generator",
    icon: "⊞",
    desc: "Multi-frame preview",
  },
  {
    id: VIDEO_TOOLS.WATERMARK,
    label: "Add Watermark",
    icon: "⬡",
    desc: "Text or image overlay",
  },
];

const TOOL_MAP = {
  [VIDEO_TOOLS.EXTRACT_AUDIO]: ExtractAudio,
  [VIDEO_TOOLS.GRAB_FRAME]: GrabFrame,
  [VIDEO_TOOLS.TRANSCODE]: Transcode,
  [VIDEO_TOOLS.TRIM]: VideoTrimmer,
  [VIDEO_TOOLS.COMPRESS]: VideoCompressor,
  [VIDEO_TOOLS.GIF]: GifMaker,
  [VIDEO_TOOLS.THUMBNAIL]: ThumbnailGenerator,
  [VIDEO_TOOLS.WATERMARK]: VideoWatermark,
};

export default function VideoPanel({
  initialTool = VIDEO_TOOLS.EXTRACT_AUDIO,
  sharedFile = null,
  onRouteToFix,
}) {
  const [activeTool, setActiveTool] = useState(initialTool);

  const ActiveComponent = TOOL_MAP[activeTool];

  return (
    <div className={styles.panel}>
      <aside className={styles.sidebar}>
        <nav className={styles.toolNav}>
          {/* <div className={styles.navLabel}>video tools</div> */}

          {VIDEO_MENU.map((tool) => (
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

      <div className={styles.toolArea}>
        {ActiveComponent && (
          <div className={styles.toolEnter} key={activeTool}>
            <ActiveComponent
              sharedFile={sharedFile}
              onRouteToFix={onRouteToFix}
            />
          </div>
        )}
      </div>
    </div>
  );
}
