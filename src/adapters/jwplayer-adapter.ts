import {
  VideoPlayerAdapter,
  PlayerType,
  VideoQuality,
  JWPlayer,
} from '../types';

/**
 * JW Player adapter for the video tracker
 * @see https://www.jwplayer.com/
 */
export class JWPlayerAdapter implements VideoPlayerAdapter {
  public readonly playerType = PlayerType.JW_PLAYER;
  public readonly element: JWPlayer;

  constructor(jwPlayer: JWPlayer) {
    this.element = jwPlayer;
  }

  getCurrentTime(): number {
    return this.element.getPosition() || 0;
  }

  getDuration(): number {
    return this.element.getDuration() || 0;
  }

  getVolume(): number {
    return this.element.getVolume() || 0;
  }

  isMuted(): boolean {
    return this.element.getMute() || false;
  }

  isPaused(): boolean {
    const state = this.element.getState();
    return state === 'paused' || state === 'idle';
  }

  isSeeking(): boolean {
    // JW Player doesn't have a direct seeking state
    // This would need to be tracked via state changes
    return false;
  }

  isBuffering(): boolean {
    const state = this.element.getState();
    return state === 'buffering' || state === 'loading';
  }

  isFullscreen(): boolean {
    return this.element.getFullscreen() || false;
  }

  getVideoSrc(): string {
    const playlistItem = this.element.getPlaylistItem();
    return playlistItem?.file || '';
  }

  getQuality(): VideoQuality | null {
    try {
      const qualityLevels = this.element.getQualityLevels();
      const currentQuality = this.element.getCurrentQuality();

      if (qualityLevels && qualityLevels.length > 0 && currentQuality >= 0) {
        const quality = qualityLevels[currentQuality];
        if (quality) {
          return {
            width: quality.width || 0,
            height: quality.height || 0,
            bitrate: 0,
            level: quality.label || 'auto',
          };
        }
      }

      return null;
    } catch {
      // JW Player might not have quality levels available
      return null;
    }
  }

  addEventListener(event: string, handler: Function): void {
    this.element.on(event, handler);
  }

  removeEventListener(event: string, handler: Function): void {
    this.element.off(event, handler);
  }
}
