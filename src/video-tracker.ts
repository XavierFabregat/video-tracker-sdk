import {
  VideoEvent,
  VideoEventType,
  VideoEventData,
  BaseEventData,
  SeekEventData,
  QualityChangeEventData,
  BufferEventData,
  ErrorEventData,
  ProgressEventData,
  VideoTrackerConfig,
  VideoPlayerAdapter,
  VideoQuality,
  MediaErrorEvent,
} from './types';
import { HTML5VideoAdapter } from './adapters/html5-adapter';

export class VideoTracker {
  private adapter: VideoPlayerAdapter;
  private config: Required<VideoTrackerConfig>;
  private progressTimer: number | null = null;
  private lastProgressTime = 0;
  private lastQuality: VideoQuality | null = null;
  private eventHandlers: Map<string, Function> = new Map();

  constructor(adapter: VideoPlayerAdapter, config: VideoTrackerConfig = {}) {
    this.adapter = adapter;
    this.config = {
      sessionId: config.sessionId || this.generateSessionId(),
      autoTrack: config.autoTrack ?? true,
      progressInterval: config.progressInterval ?? 10,
      onEvent: config.onEvent || (() => {}),
      debug: config.debug ?? false,
      metadata: config.metadata || {},
    };

    if (this.config.autoTrack) {
      this.attachEventListeners();
    }

    this.startProgressTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBaseEventData(): BaseEventData {
    return {
      timestamp: Date.now(),
      currentTime: this.adapter.getCurrentTime(),
      duration: this.adapter.getDuration(),
      volume: this.adapter.getVolume(),
      muted: this.adapter.isMuted(),
      paused: this.adapter.isPaused(),
      seeking: this.adapter.isSeeking(),
      buffering: this.adapter.isBuffering(),
      fullscreen: this.adapter.isFullscreen(),
      videoSrc: this.adapter.getVideoSrc(),
      sessionId: this.config.sessionId,
      ...this.config.metadata,
    };
  }

  private emitEvent(type: VideoEventType, data: VideoEventData): void {
    const event: VideoEvent = { type, data };

    if (this.config.debug) {
      console.log('[VideoTracker]', event);
    }

    this.config.onEvent(event);
  }

  private attachEventListeners(): void {
    // Play event
    const playHandler = () => {
      this.emitEvent(VideoEventType.PLAY, this.getBaseEventData());
    };
    this.adapter.addEventListener('play', playHandler);
    this.eventHandlers.set('play', playHandler);

    // Pause event
    const pauseHandler = () => {
      this.emitEvent(VideoEventType.PAUSE, this.getBaseEventData());
    };
    this.adapter.addEventListener('pause', pauseHandler);
    this.eventHandlers.set('pause', pauseHandler);

    // Seek events
    const seekingHandler = () => {
      this.lastProgressTime = this.adapter.getCurrentTime();
    };
    this.adapter.addEventListener('seeking', seekingHandler);
    this.eventHandlers.set('seeking', seekingHandler);

    const seekedHandler = () => {
      const seekData: SeekEventData = {
        ...this.getBaseEventData(),
        fromTime: this.lastProgressTime,
        toTime: this.adapter.getCurrentTime(),
      };
      this.emitEvent(VideoEventType.SEEK, seekData);
    };
    this.adapter.addEventListener('seeked', seekedHandler);
    this.eventHandlers.set('seeked', seekedHandler);

    // Buffer events
    const waitingHandler = () => {
      const bufferData: BufferEventData = {
        ...this.getBaseEventData(),
        bufferLength: 0,
        bufferStart: 0,
        bufferEnd: 0,
      };

      if (this.adapter instanceof HTML5VideoAdapter) {
        const bufferInfo = this.adapter.getCurrentBufferInfo();
        bufferData.bufferLength = bufferInfo.bufferLength;
        bufferData.bufferStart = bufferInfo.bufferStart;
        bufferData.bufferEnd = bufferInfo.bufferEnd;
      }

      this.emitEvent(VideoEventType.BUFFER_START, bufferData);
    };
    this.adapter.addEventListener('waiting', waitingHandler);
    this.eventHandlers.set('waiting', waitingHandler);

    const canplayHandler = () => {
      const bufferData: BufferEventData = {
        ...this.getBaseEventData(),
        bufferLength: 0,
        bufferStart: 0,
        bufferEnd: 0,
      };

      if (this.adapter instanceof HTML5VideoAdapter) {
        const bufferInfo = this.adapter.getCurrentBufferInfo();
        bufferData.bufferLength = bufferInfo.bufferLength;
        bufferData.bufferStart = bufferInfo.bufferStart;
        bufferData.bufferEnd = bufferInfo.bufferEnd;
      }

      this.emitEvent(VideoEventType.BUFFER_END, bufferData);
    };
    this.adapter.addEventListener('canplay', canplayHandler);
    this.eventHandlers.set('canplay', canplayHandler);

    // Volume change
    const volumeChangeHandler = () => {
      this.emitEvent(VideoEventType.VOLUME_CHANGE, this.getBaseEventData());
    };
    this.adapter.addEventListener('volumechange', volumeChangeHandler);
    this.eventHandlers.set('volumechange', volumeChangeHandler);

    // Fullscreen change (for HTML5)
    if (this.adapter.element instanceof HTMLVideoElement) {
      const fullscreenChangeHandler = () => {
        this.emitEvent(
          VideoEventType.FULLSCREEN_CHANGE,
          this.getBaseEventData()
        );
      };

      document.addEventListener('fullscreenchange', fullscreenChangeHandler);
      document.addEventListener(
        'webkitfullscreenchange',
        fullscreenChangeHandler
      );
      document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
      document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);

      this.eventHandlers.set('fullscreenchange', fullscreenChangeHandler);
    }

    // Error events
    const errorHandler = (event: MediaErrorEvent) => {
      const errorData: ErrorEventData = {
        ...this.getBaseEventData(),
        errorCode: event.target?.error?.code || 0,
        errorMessage: event.target?.error?.message || 'Unknown error',
        errorType: event.type || 'error',
      };
      this.emitEvent(VideoEventType.ERROR, errorData);
    };
    this.adapter.addEventListener('error', errorHandler);
    this.eventHandlers.set('error', errorHandler);

    // Ended event
    const endedHandler = () => {
      this.emitEvent(VideoEventType.ENDED, this.getBaseEventData());
    };
    this.adapter.addEventListener('ended', endedHandler);
    this.eventHandlers.set('ended', endedHandler);

    // Duration change
    const durationChangeHandler = () => {
      this.emitEvent(VideoEventType.DURATION_CHANGE, this.getBaseEventData());
    };
    this.adapter.addEventListener('durationchange', durationChangeHandler);
    this.eventHandlers.set('durationchange', durationChangeHandler);
  }

  private startProgressTracking(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
    }

    this.progressTimer = window.setInterval(() => {
      if (!this.adapter.isPaused() && !this.adapter.isSeeking()) {
        const currentTime = this.adapter.getCurrentTime();
        const duration = this.adapter.getDuration();

        if (duration > 0) {
          const progressData: ProgressEventData = {
            ...this.getBaseEventData(),
            percentComplete: (currentTime / duration) * 100,
            bytesLoaded: 0, // Would need to be implemented by specific adapters
            bytesTotal: 0, // Would need to be implemented by specific adapters
          };

          this.emitEvent(VideoEventType.PROGRESS, progressData);
        }

        // Check for quality changes
        const currentQuality = this.adapter.getQuality();
        if (
          currentQuality &&
          !this.qualitiesEqual(currentQuality, this.lastQuality)
        ) {
          const qualityData: QualityChangeEventData = {
            ...this.getBaseEventData(),
            previousQuality: this.lastQuality,
            currentQuality,
          };
          this.emitEvent(VideoEventType.QUALITY_CHANGE, qualityData);
          this.lastQuality = currentQuality;
        }
      }
    }, this.config.progressInterval * 1000);
  }

  private qualitiesEqual(
    q1: VideoQuality | null,
    q2: VideoQuality | null
  ): boolean {
    if (!q1 && !q2) return true;
    if (!q1 || !q2) return false;
    return (
      q1.width === q2.width &&
      q1.height === q2.height &&
      q1.bitrate === q2.bitrate
    );
  }

  public trackEvent(
    type: VideoEventType,
    customData?: Partial<VideoEventData>
  ): void {
    const baseData = this.getBaseEventData();
    const eventData = { ...baseData, ...customData };
    this.emitEvent(type, eventData);
  }

  public updateConfig(newConfig: Partial<VideoTrackerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getSessionId(): string {
    return this.config.sessionId;
  }

  public destroy(): void {
    // Clear progress timer
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }

    // Remove all event listeners
    this.eventHandlers.forEach((handler, event) => {
      if (event === 'fullscreenchange') {
        document.removeEventListener(
          'fullscreenchange',
          handler as EventListener
        );
        document.removeEventListener(
          'webkitfullscreenchange',
          handler as EventListener
        );
        document.removeEventListener(
          'mozfullscreenchange',
          handler as EventListener
        );
        document.removeEventListener(
          'MSFullscreenChange',
          handler as EventListener
        );
      } else {
        this.adapter.removeEventListener(event, handler);
      }
    });

    this.eventHandlers.clear();
  }
}
