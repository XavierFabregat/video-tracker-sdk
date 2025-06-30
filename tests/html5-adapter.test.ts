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
