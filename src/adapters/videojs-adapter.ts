import {
  VideoPlayerAdapter,
  PlayerType,
  VideoQuality,
  VideoJSPlayer,
} from '../types';

// Video.js adapter for the video tracker
export class VideoJSAdapter implements VideoPlayerAdapter {
  public readonly playerType = PlayerType.VIDEO_JS;
  public readonly element: VideoJSPlayer; // Video.js player instance
  private videoElement: HTMLVideoElement;

  constructor(videojsPlayer: VideoJSPlayer) {
    this.element = videojsPlayer;
    this.videoElement = videojsPlayer.el().querySelector('video');
  }

  getCurrentTime(): number {
    return this.element.currentTime() || 0;
  }

  getDuration(): number {
    return this.element.duration() || 0;
  }

  getVolume(): number {
    return this.element.volume();
  }

  isMuted(): boolean {
    return this.element.muted();
  }

  isPaused(): boolean {
    return this.element.paused();
  }

  isSeeking(): boolean {
    return this.videoElement?.seeking || false;
  }

  isBuffering(): boolean {
    const readyState = this.videoElement?.readyState || 0;
    return readyState < HTMLMediaElement.HAVE_FUTURE_DATA && !this.isPaused();
  }

  isFullscreen(): boolean {
    return this.element.isFullscreen();
  }

  getVideoSrc(): string {
    return this.element.currentSrc() || this.element.src() || '';
  }

  getQuality(): VideoQuality | null {
    // Video.js provides quality levels through plugins
    const qualityLevels = this.element.qualityLevels?.();
    if (qualityLevels && qualityLevels.length > 0) {
      const currentLevel = qualityLevels[0];
      return {
        width: currentLevel.width || 0,
        height: currentLevel.height || 0,
        bitrate: currentLevel.bitrate || 0,
        level: currentLevel.label || 'auto',
      };
    }

    // Fallback to video element dimensions
    if (this.videoElement?.videoWidth && this.videoElement?.videoHeight) {
      return {
        width: this.videoElement.videoWidth,
        height: this.videoElement.videoHeight,
        bitrate: 0,
        level: 'auto',
      };
    }

    return null;
  }

  addEventListener(event: string, handler: Function): void {
    this.element.on(event, handler);
  }

  removeEventListener(event: string, handler: Function): void {
    this.element.off(event, handler);
  }
}
