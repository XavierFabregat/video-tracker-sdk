import {
  VideoPlayerAdapter,
  PlayerType,
  VideoQuality,
  YouTubePlayer,
  YouTubePlayerState,
} from '../types';

/**
 * YouTube Player adapter for the video tracker
 * @see https://developers.google.com/youtube/iframe_api_reference
 */
export class YouTubeAdapter implements VideoPlayerAdapter {
  public readonly playerType = PlayerType.YOUTUBE;
  public readonly element: YouTubePlayer;

  constructor(youtubePlayer: YouTubePlayer) {
    this.element = youtubePlayer;
  }

  getCurrentTime(): number {
    return this.element.getCurrentTime() || 0;
  }

  getDuration(): number {
    return this.element.getDuration() || 0;
  }

  getVolume(): number {
    return this.element.getVolume() || 0;
  }

  isMuted(): boolean {
    return this.element.isMuted() || false;
  }

  isPaused(): boolean {
    const state = this.element.getPlayerState();
    return (
      state === YouTubePlayerState.PAUSED ||
      state === YouTubePlayerState.CUED ||
      state === YouTubePlayerState.ENDED
    );
  }

  isSeeking(): boolean {
    // YouTube doesn't provide a direct seeking state
    // This would need to be tracked via state changes
    return false;
  }

  isBuffering(): boolean {
    const state = this.element.getPlayerState();
    return state === YouTubePlayerState.BUFFERING;
  }

  isFullscreen(): boolean {
    // YouTube Player API doesn't provide direct fullscreen state
    // This would need to be tracked via document fullscreen APIs
    return (
      document.fullscreenElement !== null ||
      (document as any).webkitFullscreenElement !== null ||
      (document as any).mozFullScreenElement !== null ||
      (document as any).msFullscreenElement !== null
    );
  }

  getVideoSrc(): string {
    return this.element.getVideoUrl() || '';
  }

  getQuality(): VideoQuality | null {
    const quality = this.element.getPlaybackQuality();

    if (!quality) {
      return null;
    }

    // Map YouTube quality levels to dimensions
    const qualityMap: Record<string, { width: number; height: number }> = {
      hd2160: { width: 3840, height: 2160 }, // 4K
      hd1440: { width: 2560, height: 1440 }, // 1440p
      hd1080: { width: 1920, height: 1080 }, // 1080p
      hd720: { width: 1280, height: 720 }, // 720p
      large: { width: 854, height: 480 }, // 480p
      medium: { width: 640, height: 360 }, // 360p
      small: { width: 426, height: 240 }, // 240p
      tiny: { width: 256, height: 144 }, // 144p
      auto: { width: 0, height: 0 }, // Auto quality
    };

    const qualityInfo = qualityMap[quality];
    if (qualityInfo) {
      return {
        width: qualityInfo.width,
        height: qualityInfo.height,
        bitrate: 0,
        level: this.getQualityLabel(quality),
      };
    }

    return {
      width: 0,
      height: 0,
      bitrate: 0,
      level: quality,
    };
  }

  private getQualityLabel(quality: string): string {
    const labelMap: Record<string, string> = {
      hd2160: '4K',
      hd1440: '1440p',
      hd1080: '1080p',
      hd720: '720p',
      large: '480p',
      medium: '360p',
      small: '240p',
      tiny: '144p',
      auto: 'Auto',
    };

    return labelMap[quality] || quality;
  }

  addEventListener(event: string, handler: Function): void {
    this.element.addEventListener(event, handler);
  }

  removeEventListener(event: string, handler: Function): void {
    this.element.removeEventListener(event, handler);
  }
}
