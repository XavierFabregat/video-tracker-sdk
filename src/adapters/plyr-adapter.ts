import {
  VideoPlayerAdapter,
  PlayerType,
  VideoQuality,
  PlyrPlayer,
} from '../types';

/**
 * Plyr adapter for the video tracker
 * @see https://plyr.io/
 */
export class PlyrAdapter implements VideoPlayerAdapter {
  public readonly playerType = PlayerType.PLYR;
  public readonly element: PlyrPlayer;

  constructor(plyrPlayer: PlyrPlayer) {
    this.element = plyrPlayer;
  }

  getCurrentTime(): number {
    return this.element.currentTime || 0;
  }

  getDuration(): number {
    return this.element.duration || 0;
  }

  getVolume(): number {
    return this.element.volume || 0;
  }

  isMuted(): boolean {
    return this.element.muted || false;
  }

  isPaused(): boolean {
    return this.element.paused;
  }

  isSeeking(): boolean {
    return this.element.seeking || false;
  }

  isBuffering(): boolean {
    return this.element.buffering || false;
  }

  isFullscreen(): boolean {
    return this.element.fullscreen?.active || false;
  }

  getVideoSrc(): string {
    return this.element.source?.src || '';
  }

  getQuality(): VideoQuality | null {
    const quality = this.element.quality;

    if (!quality) {
      // Fallback to media element dimensions
      const media = this.element.media;
      if (media?.videoWidth && media?.videoHeight) {
        return {
          width: media.videoWidth,
          height: media.videoHeight,
          bitrate: 0,
          level: 'auto',
        };
      }
      return null;
    }

    // Map Plyr quality to our VideoQuality interface
    const qualityMap: Record<
      number,
      { width: number; height: number; label: string }
    > = {
      2160: { width: 3840, height: 2160, label: '4K' },
      1440: { width: 2560, height: 1440, label: '1440p' },
      1080: { width: 1920, height: 1080, label: '1080p' },
      720: { width: 1280, height: 720, label: '720p' },
      480: { width: 854, height: 480, label: '480p' },
      360: { width: 640, height: 360, label: '360p' },
      240: { width: 426, height: 240, label: '240p' },
    };

    const qualityInfo = qualityMap[quality];
    if (qualityInfo) {
      return {
        width: qualityInfo.width,
        height: qualityInfo.height,
        bitrate: 0,
        level: qualityInfo.label,
      };
    }

    return {
      width: 0,
      height: 0,
      bitrate: 0,
      level: quality.toString(),
    };
  }

  addEventListener(event: string, handler: Function): void {
    this.element.on(event, handler);
  }

  removeEventListener(event: string, handler: Function): void {
    this.element.off(event, handler);
  }
}
