import { VideoPlayerAdapter, PlayerType, VideoQuality } from '../types';

interface DocumentWithVendorFullscreen extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
}

interface HTMLVideoElementWithTracks extends HTMLVideoElement {
  videoTracks?: {
    length: number;
    [index: number]: { label?: string };
  };
}

export class HTML5VideoAdapter implements VideoPlayerAdapter {
  public readonly playerType = PlayerType.HTML5;
  public readonly element: HTMLVideoElement;

  constructor(videoElement: HTMLVideoElement) {
    this.element = videoElement;
  }

  getCurrentTime(): number {
    return this.element.currentTime;
  }

  getDuration(): number {
    return this.element.duration || 0;
  }

  getVolume(): number {
    return this.element.volume;
  }

  isMuted(): boolean {
    return this.element.muted;
  }

  isPaused(): boolean {
    return this.element.paused;
  }

  isSeeking(): boolean {
    return this.element.seeking;
  }

  isBuffering(): boolean {
    // Check if we're waiting for data
    return (
      this.element.readyState < HTMLMediaElement.HAVE_FUTURE_DATA &&
      !this.element.paused
    );
  }

  isFullscreen(): boolean {
    const doc = document as DocumentWithVendorFullscreen;
    return (
      doc.fullscreenElement === this.element ||
      doc.webkitFullscreenElement === this.element ||
      doc.mozFullScreenElement === this.element ||
      doc.msFullscreenElement === this.element
    );
  }

  getVideoSrc(): string {
    return this.element.currentSrc || this.element.src || '';
  }

  getQuality(): VideoQuality | null {
    // For HTML5 video, we try to get quality from the video track if available
    const videoTracks = (this.element as HTMLVideoElementWithTracks)
      .videoTracks;
    if (videoTracks && videoTracks.length > 0) {
      const track = videoTracks[0];
      return {
        width: this.element.videoWidth,
        height: this.element.videoHeight,
        bitrate: 0, // Not available in HTML5 video API
        level: track.label || 'auto',
      };
    }

    // Fallback to video dimensions
    if (this.element.videoWidth && this.element.videoHeight) {
      return {
        width: this.element.videoWidth,
        height: this.element.videoHeight,
        bitrate: 0,
        level: 'auto',
      };
    }

    return null;
  }

  addEventListener(event: string, handler: Function): void {
    this.element.addEventListener(event, handler as EventListener);
  }

  removeEventListener(event: string, handler: Function): void {
    this.element.removeEventListener(event, handler as EventListener);
  }

  // Helper method to get buffered time ranges
  getBufferedTimeRanges(): { start: number; end: number }[] {
    const buffered = this.element.buffered;
    const ranges: { start: number; end: number }[] = [];

    for (let i = 0; i < buffered.length; i++) {
      ranges.push({
        start: buffered.start(i),
        end: buffered.end(i),
      });
    }

    return ranges;
  }

  // Helper method to get the current buffer info
  getCurrentBufferInfo(): {
    bufferStart: number;
    bufferEnd: number;
    bufferLength: number;
  } {
    const currentTime = this.getCurrentTime();
    const buffered = this.element.buffered;

    let bufferStart = 0;
    let bufferEnd = 0;

    // Find the buffer range that contains the current time
    for (let i = 0; i < buffered.length; i++) {
      if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
        bufferStart = buffered.start(i);
        bufferEnd = buffered.end(i);
        break;
      }
    }

    return {
      bufferStart,
      bufferEnd,
      bufferLength: bufferEnd - bufferStart,
    };
  }
}
