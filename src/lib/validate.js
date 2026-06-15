import { LIMITS } from '@/constants/limits';
import { formatBytes, formatDuration } from '@/lib/format';
import { MESSAGES } from '@/constants/messages';

export function validateVideoFile(file, tool = null) {
  if (!file) return null;
  if (file.size > LIMITS.video.hard) {
    return MESSAGES.FILE_TOO_LARGE_VIDEO(formatBytes(file.size), tool !== 'compress' ? 'compress' : null);
  }
  if (file.size > LIMITS.video.warn) {
    return MESSAGES.FILE_WARN_LARGE(formatBytes(file.size));
  }
  return null;
}

export function validateAudioFile(file) {
  if (!file) return null;
  if (file.size > LIMITS.audio.hard) {
    return MESSAGES.FILE_TOO_LARGE_AUDIO(formatBytes(file.size));
  }
  if (file.size > LIMITS.audio.warn) {
    return MESSAGES.FILE_WARN_LARGE(formatBytes(file.size));
  }
  return null;
}

export function validateImageFile(file, tool = null) {
  if (!file) return null;
  if (tool === 'remove-bg' && file.size > LIMITS.image.removeBg) {
    return MESSAGES.FILE_TOO_LARGE_REMOVE_BG(formatBytes(file.size));
  }
  if (file.size > LIMITS.image.hard) {
    return MESSAGES.FILE_TOO_LARGE_IMAGE(formatBytes(file.size), tool !== 'compress' ? 'compress' : null);
  }
  if (file.size > LIMITS.image.warn) {
    return MESSAGES.FILE_WARN_LARGE(formatBytes(file.size));
  }
  return null;
}

export function validateGifDuration(durationSeconds) {
  if (durationSeconds > LIMITS.video.gif_secs) {
    return MESSAGES.VIDEO_TOO_LONG_GIF(formatDuration(durationSeconds));
  }
  return null;
}

export function checkLowMemory() {
  if (typeof navigator !== 'undefined' && navigator.deviceMemory && navigator.deviceMemory < 4) {
    return MESSAGES.LOW_MEMORY;
  }
  return null;
}
