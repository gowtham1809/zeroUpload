import { useState } from "react";
import ImageFilter from "./ImageFilter";
import ImageConvert from "./ImageConvert";
import RemoveBg from "./RemoveBg";
import ImageCropper from "./ImageCropper";
import ImageCompressor from "./ImageCompressor";
import ExifViewer from "./ExifViewer";
import ImageWatermark from "./ImageWatermark";
import styles from "./ImagePanel.module.css";

const TOOLS_MENU = [
  { id: "filter", label: "Filter", icon: "◑", desc: "Apply image filters" },
  {
    id: "convert",
    label: "Convert",
    icon: "⬡",
    desc: "Convert image formats",
  },
  {
    id: "remove-bg",
    label: "Remove BG",
    icon: "✦",
    desc: "Remove image background",
  },
  {
    id: "crop",
    label: "Cropper",
    icon: "⬜",
    desc: "Crop to any size or ratio",
  },
  { id: "compress", label: "Compressor", icon: "⬇", desc: "Reduce file size" },
  {
    id: "exif",
    label: "EXIF Viewer",
    icon: "◎",
    desc: "View or strip metadata",
  },
  {
    id: "watermark",
    label: "Watermark",
    icon: "⬡",
    desc: "Text overlay on image",
  },
];

export default function ImagePanel({ sharedFile, onRouteToFix }) {
  const [activeTool, setActiveTool] = useState("filter");

  return (
    <div className={styles.panel}>
      <div className={styles.toolsLayout}>
        <aside className={styles.toolsSidebar}>
          {TOOLS_MENU.map((tool) => (
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
        </aside>

        <div className={styles.toolArea} key={activeTool}>
          {activeTool === "filter" && (
            <ImageFilter sharedFile={sharedFile} onRouteToFix={onRouteToFix} />
          )}

          {activeTool === "convert" && (
            <ImageConvert sharedFile={sharedFile} onRouteToFix={onRouteToFix} />
          )}

          {activeTool === "remove-bg" && (
            <RemoveBg sharedFile={sharedFile} onRouteToFix={onRouteToFix} />
          )}

          {activeTool === "crop" && (
            <ImageCropper sharedFile={sharedFile} onRouteToFix={onRouteToFix} />
          )}

          {activeTool === "compress" && (
            <ImageCompressor
              sharedFile={sharedFile}
              onRouteToFix={onRouteToFix}
            />
          )}

          {activeTool === "exif" && <ExifViewer sharedFile={sharedFile} />}

          {activeTool === "watermark" && (
            <ImageWatermark
              sharedFile={sharedFile}
              onRouteToFix={onRouteToFix}
            />
          )}
        </div>
      </div>
    </div>
  );
}
