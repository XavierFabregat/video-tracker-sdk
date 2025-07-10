import { HTML5VideoAdapter } from '../src/adapters/html5-adapter';
import { PlayerType } from '../src/types';

describe('HTML5VideoAdapter', () => {
  let videoElement: HTMLVideoElement;
  let adapter: HTML5VideoAdapter;

  beforeEach(() => {
    videoElement = new HTMLVideoElement();
    adapter = new HTML5VideoAdapter(videoElement);
  });

  describe('Constructor', () => {
    it('should initialize with correct player type', () => {
      expect(adapter.playerType).toBe(PlayerType.HTML5);
    });

    it('should store video element reference', () => {
      expect(adapter.element).toBe(videoElement);
    });
  });

  describe('Video Properties', () => {
    it('should get current time', () => {
      videoElement.currentTime = 25.5;
      expect(adapter.getCurrentTime()).toBe(25.5);
    });

    it('should get duration', () => {
      Object.defineProperty(videoElement, 'duration', {
        value: 120,
        writable: true,
      });
      expect(adapter.getDuration()).toBe(120);
    });

    it('should return 0 for duration when NaN', () => {
      Object.defineProperty(videoElement, 'duration', {
        value: NaN,
        writable: true,
      });
      expect(adapter.getDuration()).toBe(0);
    });

    it('should get volume', () => {
      videoElement.volume = 0.8;
      expect(adapter.getVolume()).toBe(0.8);
    });

    it('should get muted state', () => {
      videoElement.muted = true;
      expect(adapter.isMuted()).toBe(true);
    });

    it('should get paused state', () => {
      Object.defineProperty(videoElement, 'paused', {
        value: false,
        writable: true,
      });
      expect(adapter.isPaused()).toBe(false);
    });

    it('should get seeking state', () => {
      Object.defineProperty(videoElement, 'seeking', {
        value: true,
        writable: true,
      });
      expect(adapter.isSeeking()).toBe(true);
    });

    it('should get video source', () => {
      Object.defineProperty(videoElement, 'currentSrc', {
        value: 'http://example.com/video.mp4',
        writable: true,
      });
      expect(adapter.getVideoSrc()).toBe('http://example.com/video.mp4');
    });
  });

  describe('Buffering Detection', () => {
    it('should detect buffering when readyState is low and not paused', () => {
      Object.defineProperty(videoElement, 'readyState', {
        value: HTMLMediaElement.HAVE_CURRENT_DATA,
        writable: true,
      });
      Object.defineProperty(videoElement, 'paused', {
        value: false,
        writable: true,
      });
      expect(adapter.isBuffering()).toBe(true);
    });

    it('should not detect buffering when paused', () => {
      Object.defineProperty(videoElement, 'readyState', {
        value: HTMLMediaElement.HAVE_CURRENT_DATA,
        writable: true,
      });
      Object.defineProperty(videoElement, 'paused', {
        value: true,
        writable: true,
      });
      expect(adapter.isBuffering()).toBe(false);
    });

    it('should not detect buffering when readyState is sufficient', () => {
      Object.defineProperty(videoElement, 'readyState', {
        value: HTMLMediaElement.HAVE_ENOUGH_DATA,
        writable: true,
      });
      Object.defineProperty(videoElement, 'paused', {
        value: false,
        writable: true,
      });
      expect(adapter.isBuffering()).toBe(false);
    });
  });

  describe('Quality Information', () => {
    it('should get video quality from dimensions', () => {
      Object.defineProperty(videoElement, 'videoWidth', {
        value: 1920,
        writable: true,
      });
      Object.defineProperty(videoElement, 'videoHeight', {
        value: 1080,
        writable: true,
      });

      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 1920,
        height: 1080,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should return null when no dimensions available', () => {
      Object.defineProperty(videoElement, 'videoWidth', {
        value: 0,
        writable: true,
      });
      Object.defineProperty(videoElement, 'videoHeight', {
        value: 0,
        writable: true,
      });

      expect(adapter.getQuality()).toBeNull();
    });

    it('should get quality info from video tracks when available', () => {
      Object.defineProperty(videoElement, 'videoWidth', {
        value: 1920,
        writable: true,
      });
      Object.defineProperty(videoElement, 'videoHeight', {
        value: 1080,
        writable: true,
      });

      // Add video tracks
      Object.defineProperty(videoElement, 'videoTracks', {
        value: {
          length: 1,
          0: { label: '1080p' },
        },
        writable: true,
      });

      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 1920,
        height: 1080,
        bitrate: 0,
        level: '1080p',
      });
    });

    it('should use auto level when video track has no label', () => {
      Object.defineProperty(videoElement, 'videoWidth', {
        value: 720,
        writable: true,
      });
      Object.defineProperty(videoElement, 'videoHeight', {
        value: 480,
        writable: true,
      });

      // Add video tracks without label
      Object.defineProperty(videoElement, 'videoTracks', {
        value: {
          length: 1,
          0: {}, // No label
        },
        writable: true,
      });

      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 720,
        height: 480,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should fall back to dimensions when video tracks array is empty', () => {
      Object.defineProperty(videoElement, 'videoWidth', {
        value: 640,
        writable: true,
      });
      Object.defineProperty(videoElement, 'videoHeight', {
        value: 360,
        writable: true,
      });

      // Add empty video tracks
      Object.defineProperty(videoElement, 'videoTracks', {
        value: {
          length: 0,
        },
        writable: true,
      });

      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 640,
        height: 360,
        bitrate: 0,
        level: 'auto',
      });
    });
  });

  describe('Buffer Information', () => {
    it('should get current buffer info', () => {
      Object.defineProperty(videoElement, 'currentTime', {
        value: 25,
        writable: true,
      });
      Object.defineProperty(videoElement, 'buffered', {
        value: {
          length: 1,
          start: () => 20,
          end: () => 40,
        },
        writable: true,
      });

      const bufferInfo = adapter.getCurrentBufferInfo();

      expect(bufferInfo).toEqual({
        bufferStart: 20,
        bufferEnd: 40,
        bufferLength: 20,
      });
    });

    it('should return empty buffer info when no buffer contains current time', () => {
      Object.defineProperty(videoElement, 'currentTime', {
        value: 50,
        writable: true,
      });
      Object.defineProperty(videoElement, 'buffered', {
        value: {
          length: 1,
          start: () => 20,
          end: () => 40,
        },
        writable: true,
      });

      const bufferInfo = adapter.getCurrentBufferInfo();

      expect(bufferInfo).toEqual({
        bufferStart: 0,
        bufferEnd: 0,
        bufferLength: 0,
      });
    });
  });

  describe('Fullscreen Detection', () => {
    it('should detect fullscreen using standard API', () => {
      // Mock standard fullscreen API
      Object.defineProperty(document, 'fullscreenElement', {
        value: videoElement,
        writable: true,
      });

      expect(adapter.isFullscreen()).toBe(true);
    });

    it('should detect fullscreen using webkit prefix', () => {
      // Mock webkit fullscreen API
      Object.defineProperty(document, 'webkitFullscreenElement', {
        value: videoElement,
        writable: true,
      });

      expect(adapter.isFullscreen()).toBe(true);
    });

    it('should detect fullscreen using moz prefix', () => {
      // Mock moz fullscreen API
      Object.defineProperty(document, 'mozFullScreenElement', {
        value: videoElement,
        writable: true,
      });

      expect(adapter.isFullscreen()).toBe(true);
    });

    it('should detect fullscreen using ms prefix', () => {
      // Mock ms fullscreen API
      Object.defineProperty(document, 'msFullscreenElement', {
        value: videoElement,
        writable: true,
      });

      expect(adapter.isFullscreen()).toBe(true);
    });

    it('should return false when not in fullscreen', () => {
      // Ensure no fullscreen elements are set
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
      });

      expect(adapter.isFullscreen()).toBe(false);
    });
  });

  describe('Video Source', () => {
    it('should get video source from currentSrc', () => {
      Object.defineProperty(videoElement, 'currentSrc', {
        value: 'http://example.com/video.mp4',
        writable: true,
      });
      Object.defineProperty(videoElement, 'src', {
        value: 'http://example.com/fallback.mp4',
        writable: true,
      });

      expect(adapter.getVideoSrc()).toBe('http://example.com/video.mp4');
    });

    it('should fallback to src when currentSrc is empty', () => {
      Object.defineProperty(videoElement, 'currentSrc', {
        value: '',
        writable: true,
      });
      Object.defineProperty(videoElement, 'src', {
        value: 'http://example.com/fallback.mp4',
        writable: true,
      });

      expect(adapter.getVideoSrc()).toBe('http://example.com/fallback.mp4');
    });

    it('should return empty string when both sources are empty', () => {
      Object.defineProperty(videoElement, 'currentSrc', {
        value: '',
        writable: true,
      });
      Object.defineProperty(videoElement, 'src', {
        value: '',
        writable: true,
      });

      expect(adapter.getVideoSrc()).toBe('');
    });
  });

  describe('Buffered Time Ranges', () => {
    it('should get buffered time ranges', () => {
      Object.defineProperty(videoElement, 'buffered', {
        value: {
          length: 2,
          start: (index: number) => [0, 30][index],
          end: (index: number) => [20, 50][index],
        },
        writable: true,
      });

      const ranges = adapter.getBufferedTimeRanges();

      expect(ranges).toEqual([
        { start: 0, end: 20 },
        { start: 30, end: 50 },
      ]);
    });

    it('should return empty array when no buffered ranges', () => {
      Object.defineProperty(videoElement, 'buffered', {
        value: {
          length: 0,
          start: () => 0,
          end: () => 0,
        },
        writable: true,
      });

      const ranges = adapter.getBufferedTimeRanges();

      expect(ranges).toEqual([]);
    });
  });

  describe('Event Handling', () => {
    it('should add event listener', () => {
      const handler = jest.fn();
      adapter.addEventListener('play', handler);

      expect(videoElement.addEventListener).toHaveBeenCalledWith(
        'play',
        handler
      );
    });

    it('should remove event listener', () => {
      const handler = jest.fn();
      adapter.removeEventListener('pause', handler);

      expect(videoElement.removeEventListener).toHaveBeenCalledWith(
        'pause',
        handler
      );
    });
  });
});
