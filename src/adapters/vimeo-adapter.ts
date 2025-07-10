import {
  VideoPlayerAdapter,
  PlayerType,
  VideoQuality,
  VimeoPlayer,
} from '../types';

/**
 * Vimeo Player adapter for the video tracker
 * @see https://developer.vimeo.com/player/sdk
 */
export class VimeoAdapter implements VideoPlayerAdapter {
  public readonly playerType = PlayerType.VIMEO;
  public readonly element: VimeoPlayer;

  // Cache for async values to provide synchronous access
  private _currentTime = 0;
  private _duration = 0;
  private _volume = 0;
  private _muted = false;
  private _paused = true;
  private _fullscreen = false;
  private _videoUrl = '';
  private _quality: VideoQuality | null = null;

  constructor(vimeoPlayer: VimeoPlayer) {
    this.element = vimeoPlayer;
    this.initializeCache();
  }

  /**
   * Initialize cached values from the async Vimeo API
   */
  private async initializeCache(): Promise<void> {
    try {
      this._currentTime = await this.element.getCurrentTime();
      this._duration = await this.element.getDuration();
      this._volume = await this.element.getVolume();
      this._muted = await this.element.getMuted();
      this._paused = await this.element.getPaused();
      this._fullscreen = await this.element.getFullscreen();
      this._videoUrl = await this.element.getVideoUrl();

      // Set up listeners to keep cache updated
      this.element.on('timeupdate', async () => {
        this._currentTime = await this.element.getCurrentTime();
      });

      this.element.on('volumechange', async () => {
        this._volume = await this.element.getVolume();
        this._muted = await this.element.getMuted();
      });

      this.element.on('play', async () => {
        this._paused = await this.element.getPaused();
      });

      this.element.on('pause', async () => {
        this._paused = await this.element.getPaused();
      });

      this.element.on('fullscreenchange', async () => {
        this._fullscreen = await this.element.getFullscreen();
      });

      // Parse quality from video URL or set default
      const qualityStr = await this.element.getVideoQuality();
      this._quality = this.parseQuality(qualityStr);
    } catch (error) {
      console.warn('Error initializing Vimeo adapter cache:', error);
    }
  }

  private parseQuality(qualityStr: string): VideoQuality | null {
    const qualityMap: Record<string, { width: number; height: number }> = {
      '4K': { width: 3840, height: 2160 },
      '2K': { width: 2560, height: 1440 },
      '1080p': { width: 1920, height: 1080 },
      '720p': { width: 1280, height: 720 },
      '540p': { width: 960, height: 540 },
      '360p': { width: 640, height: 360 },
      '240p': { width: 426, height: 240 },
    };

    const quality = qualityMap[qualityStr];
    if (quality) {
      return {
        width: quality.width,
        height: quality.height,
        bitrate: 0,
        level: qualityStr,
      };
    }

    return {
      width: 0,
      height: 0,
      bitrate: 0,
      level: qualityStr || 'auto',
    };
  }

  getCurrentTime(): number {
    return this._currentTime;
  }

  getDuration(): number {
    return this._duration;
  }

  getVolume(): number {
    return this._volume;
  }

  isMuted(): boolean {
    return this._muted;
  }

  isPaused(): boolean {
    return this._paused;
  }

  isSeeking(): boolean {
    // Vimeo doesn't provide a direct seeking state
    // This would need to be tracked via events
    return false;
  }

  isBuffering(): boolean {
    // Vimeo doesn't provide a direct buffering state
    // This would need to be tracked via events
    return false;
  }

  isFullscreen(): boolean {
    return this._fullscreen;
  }

  getVideoSrc(): string {
    return this._videoUrl;
  }

  getQuality(): VideoQuality | null {
    return this._quality;
  }

  addEventListener(event: string, handler: Function): void {
    this.element.on(event, handler);
  }

  removeEventListener(event: string, handler: Function): void {
    this.element.off(event, handler);
  }
}
