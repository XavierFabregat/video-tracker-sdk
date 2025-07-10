import { VideoJSAdapter } from '../src/adapters/videojs-adapter';
import { PlayerType } from '../src/types';

// Mock VideoJS player
const createMockVideoJSPlayer = (overrides = {}) =>
  ({
    currentTime: jest.fn(() => 30),
    duration: jest.fn(() => 120),
    volume: jest.fn(() => 0.8),
    muted: jest.fn(() => false),
    paused: jest.fn(() => false),
    isFullscreen: jest.fn(() => false),
    currentSrc: jest.fn(() => 'http://example.com/video.mp4'),
    src: jest.fn(() => 'http://example.com/video.mp4'),
    on: jest.fn(),
    off: jest.fn(),
    el: jest.fn(() => ({
      querySelector: jest.fn(
        () =>
          ({
            seeking: false,
            readyState: 4,
            videoWidth: 1920,
            videoHeight: 1080,
          } as HTMLVideoElement)
      ),
    })),
    qualityLevels: jest.fn(() => ({
      length: 2,
      selectedIndex: 1,
      0: {
        width: 1920,
        height: 1080,
        bitrate: 5000000,
        label: '1080p',
      },
      1: {
        width: 1920,
        height: 1080,
        bitrate: 5000000,
        label: '1080p',
      },
    })),
    ...overrides,
  } as any);

describe('VideoJSAdapter', () => {
  let mockPlayer: any;
  let adapter: VideoJSAdapter;

  beforeEach(() => {
    mockPlayer = createMockVideoJSPlayer();
    adapter = new VideoJSAdapter(mockPlayer);
  });

  describe('Constructor', () => {
    it('should initialize with correct player type', () => {
      expect(adapter.playerType).toBe(PlayerType.VIDEO_JS);
    });

    it('should store player reference', () => {
      expect(adapter.element).toBe(mockPlayer);
    });

    it('should get video element from player on construction', () => {
      // Create a new adapter to test constructor behavior
      const querySelectorMock = jest.fn(
        () =>
          ({
            seeking: false,
            readyState: 4,
            videoWidth: 1920,
            videoHeight: 1080,
          } as HTMLVideoElement)
      );

      const newMockPlayer = createMockVideoJSPlayer({
        el: jest.fn(() => ({
          querySelector: querySelectorMock,
        })),
      });

      new VideoJSAdapter(newMockPlayer);

      expect(newMockPlayer.el).toHaveBeenCalled();
      expect(querySelectorMock).toHaveBeenCalledWith('video');
    });
  });

  describe('Video Properties', () => {
    it('should get current time', () => {
      expect(adapter.getCurrentTime()).toBe(30);
      expect(mockPlayer.currentTime).toHaveBeenCalled();
    });

    it('should return 0 when currentTime returns null', () => {
      mockPlayer.currentTime.mockReturnValue(null);
      expect(adapter.getCurrentTime()).toBe(0);
    });

    it('should get duration', () => {
      expect(adapter.getDuration()).toBe(120);
      expect(mockPlayer.duration).toHaveBeenCalled();
    });

    it('should return 0 when duration returns null', () => {
      mockPlayer.duration.mockReturnValue(null);
      expect(adapter.getDuration()).toBe(0);
    });

    it('should get volume', () => {
      expect(adapter.getVolume()).toBe(0.8);
      expect(mockPlayer.volume).toHaveBeenCalled();
    });

    it('should get muted state', () => {
      expect(adapter.isMuted()).toBe(false);
      expect(mockPlayer.muted).toHaveBeenCalled();
    });

    it('should get paused state', () => {
      expect(adapter.isPaused()).toBe(false);
      expect(mockPlayer.paused).toHaveBeenCalled();
    });

    it('should get fullscreen state', () => {
      expect(adapter.isFullscreen()).toBe(false);
      expect(mockPlayer.isFullscreen).toHaveBeenCalled();
    });

    it('should get video source from currentSrc', () => {
      expect(adapter.getVideoSrc()).toBe('http://example.com/video.mp4');
      expect(mockPlayer.currentSrc).toHaveBeenCalled();
    });

    it('should fallback to src when currentSrc is empty', () => {
      mockPlayer.currentSrc.mockReturnValue('');
      expect(adapter.getVideoSrc()).toBe('http://example.com/video.mp4');
      expect(mockPlayer.src).toHaveBeenCalled();
    });

    it('should return empty string when both sources are empty', () => {
      mockPlayer.currentSrc.mockReturnValue('');
      mockPlayer.src.mockReturnValue('');
      expect(adapter.getVideoSrc()).toBe('');
    });
  });

  describe('Seeking Detection', () => {
    it('should detect seeking from video element', () => {
      const mockVideoElement = { seeking: true };
      mockPlayer.el.mockReturnValue({
        querySelector: jest.fn(() => mockVideoElement),
      });

      const newAdapter = new VideoJSAdapter(mockPlayer);
      expect(newAdapter.isSeeking()).toBe(true);
    });

    it('should return false when video element is null', () => {
      mockPlayer.el.mockReturnValue({
        querySelector: jest.fn(() => null),
      });

      const newAdapter = new VideoJSAdapter(mockPlayer);
      expect(newAdapter.isSeeking()).toBe(false);
    });

    it('should return false when video element has no seeking property', () => {
      mockPlayer.el.mockReturnValue({
        querySelector: jest.fn(() => ({})),
      });

      const newAdapter = new VideoJSAdapter(mockPlayer);
      expect(newAdapter.isSeeking()).toBe(false);
    });
  });

  describe('Buffering Detection', () => {
    it('should detect buffering when readyState is low and not paused', () => {
      const mockVideoElement = {
        readyState: 2, // HAVE_CURRENT_DATA
      };
      mockPlayer.el.mockReturnValue({
        querySelector: jest.fn(() => mockVideoElement),
      });
      mockPlayer.paused.mockReturnValue(false);

      const newAdapter = new VideoJSAdapter(mockPlayer);
      expect(newAdapter.isBuffering()).toBe(true);
    });

    it('should not detect buffering when paused', () => {
      const mockVideoElement = { readyState: 2 };
      mockPlayer.el.mockReturnValue({
        querySelector: jest.fn(() => mockVideoElement),
      });
      mockPlayer.paused.mockReturnValue(true);

      const newAdapter = new VideoJSAdapter(mockPlayer);
      expect(newAdapter.isBuffering()).toBe(false);
    });

    it('should not detect buffering when readyState is sufficient', () => {
      const mockVideoElement = { readyState: 4 }; // HAVE_ENOUGH_DATA
      mockPlayer.el.mockReturnValue({
        querySelector: jest.fn(() => mockVideoElement),
      });
      mockPlayer.paused.mockReturnValue(false);

      const newAdapter = new VideoJSAdapter(mockPlayer);
      expect(newAdapter.isBuffering()).toBe(false);
    });

    it('should handle null video element', () => {
      // Create a new mock player that returns null for querySelector
      const mockPlayerWithNullVideo = createMockVideoJSPlayer({
        el: jest.fn(() => ({
          querySelector: jest.fn(() => null),
        })),
        paused: jest.fn(() => true), // Set paused to true so isBuffering returns false
      });

      const newAdapter = new VideoJSAdapter(mockPlayerWithNullVideo);
      expect(newAdapter.isBuffering()).toBe(false);
    });
  });

  describe('Quality Information', () => {
    it('should get quality from quality levels plugin', () => {
      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 1920,
        height: 1080,
        bitrate: 5000000,
        level: '1080p',
      });
    });

    it('should handle missing quality levels plugin', () => {
      mockPlayer.qualityLevels.mockReturnValue(undefined);

      const mockVideoElement = {
        videoWidth: 1280,
        videoHeight: 720,
      };
      mockPlayer.el.mockReturnValue({
        querySelector: jest.fn(() => mockVideoElement),
      });

      const newAdapter = new VideoJSAdapter(mockPlayer);
      const quality = newAdapter.getQuality();

      expect(quality).toEqual({
        width: 1280,
        height: 720,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should handle empty quality levels', () => {
      mockPlayer.qualityLevels.mockReturnValue({ length: 0 });

      const mockVideoElement = {
        videoWidth: 640,
        videoHeight: 480,
      };
      mockPlayer.el.mockReturnValue({
        querySelector: jest.fn(() => mockVideoElement),
      });

      const newAdapter = new VideoJSAdapter(mockPlayer);
      const quality = newAdapter.getQuality();

      expect(quality).toEqual({
        width: 640,
        height: 480,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should return null when no video dimensions available', () => {
      mockPlayer.qualityLevels.mockReturnValue(undefined);

      const mockVideoElement = {
        videoWidth: 0,
        videoHeight: 0,
      };
      mockPlayer.el.mockReturnValue({
        querySelector: jest.fn(() => mockVideoElement),
      });

      const newAdapter = new VideoJSAdapter(mockPlayer);
      expect(newAdapter.getQuality()).toBeNull();
    });

    it('should handle null video element', () => {
      mockPlayer.qualityLevels.mockReturnValue(undefined);
      mockPlayer.el.mockReturnValue({
        querySelector: jest.fn(() => null),
      });

      const newAdapter = new VideoJSAdapter(mockPlayer);
      expect(newAdapter.getQuality()).toBeNull();
    });

    it('should handle quality level without all properties', () => {
      mockPlayer.qualityLevels.mockReturnValue({
        length: 1,
        selectedIndex: 0,
        0: {
          // Missing some properties
          width: 720,
        },
      });

      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 720,
        height: 0,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should handle when qualityLevels method does not exist', () => {
      // Remove qualityLevels method entirely
      const mockPlayerWithoutQuality = createMockVideoJSPlayer({
        qualityLevels: undefined,
      });

      const mockVideoElement = {
        videoWidth: 1280,
        videoHeight: 720,
      };
      mockPlayerWithoutQuality.el.mockReturnValue({
        querySelector: jest.fn(() => mockVideoElement as HTMLVideoElement),
      });

      const newAdapter = new VideoJSAdapter(mockPlayerWithoutQuality);
      const quality = newAdapter.getQuality();

      expect(quality).toEqual({
        width: 1280,
        height: 720,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should handle when both quality sources fail', () => {
      // Remove qualityLevels method and video dimensions
      const mockPlayerWithoutQuality = createMockVideoJSPlayer({
        qualityLevels: undefined,
      });

      const mockVideoElement = {
        videoWidth: 0,
        videoHeight: 0,
      };
      mockPlayerWithoutQuality.el.mockReturnValue({
        querySelector: jest.fn(() => mockVideoElement as HTMLVideoElement),
      });

      const newAdapter = new VideoJSAdapter(mockPlayerWithoutQuality);
      const quality = newAdapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should handle when quality level is null or undefined', () => {
      const mockVideoElement = {
        videoWidth: 640,
        videoHeight: 480,
      };

      const mockPlayerWithNullLevel = createMockVideoJSPlayer({
        qualityLevels: jest.fn(() => ({
          length: 1,
          selectedIndex: 0,
          0: null, // Null quality level
        })),
        el: jest.fn(() => ({
          querySelector: jest.fn(() => mockVideoElement as HTMLVideoElement),
        })),
      });

      const newAdapter = new VideoJSAdapter(mockPlayerWithNullLevel);
      const quality = newAdapter.getQuality();

      // Should fall back to video element dimensions when quality level is null
      expect(quality).toEqual({
        width: 640,
        height: 480,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should return null when quality level is null and video element has no dimensions', () => {
      const mockVideoElement = {
        videoWidth: 0,
        videoHeight: 0,
      };

      const mockPlayerWithNullLevel = createMockVideoJSPlayer({
        qualityLevels: jest.fn(() => ({
          length: 1,
          selectedIndex: 0,
          0: null, // Null quality level
        })),
        el: jest.fn(() => ({
          querySelector: jest.fn(() => mockVideoElement as HTMLVideoElement),
        })),
      });

      const newAdapter = new VideoJSAdapter(mockPlayerWithNullLevel);
      const quality = newAdapter.getQuality();

      // Should return null when no quality source is available
      expect(quality).toBeNull();
    });
  });

  describe('Event Handling', () => {
    it('should add event listener', () => {
      const handler = jest.fn();
      adapter.addEventListener('play', handler);

      expect(mockPlayer.on).toHaveBeenCalledWith('play', handler);
    });

    it('should remove event listener', () => {
      const handler = jest.fn();
      adapter.removeEventListener('pause', handler);

      expect(mockPlayer.off).toHaveBeenCalledWith('pause', handler);
    });
  });

  describe('getQuality', () => {
    it('should return quality data when quality levels are available', () => {
      const mockQualityLevels = [
        {
          width: 1920,
          height: 1080,
          bitrate: 5000000,
          label: '1080p',
        },
      ];

      const mockPlayer = {
        qualityLevels: jest.fn(() => mockQualityLevels),
        el: () => ({
          querySelector: () => ({
            videoWidth: 1920,
            videoHeight: 1080,
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 1920,
        height: 1080,
        bitrate: 5000000,
        level: '1080p',
      });
    });

    it('should handle empty quality levels array', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => []),
        el: () => ({
          querySelector: () => ({
            videoWidth: 1920,
            videoHeight: 1080,
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 1920,
        height: 1080,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should handle quality levels with falsy current level', () => {
      const mockQualityLevels = [null]; // Array with falsy element

      const mockPlayer = {
        qualityLevels: jest.fn(() => mockQualityLevels),
        el: () => ({
          querySelector: () => ({
            videoWidth: 1920,
            videoHeight: 1080,
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 1920,
        height: 1080,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should return null when video element is null', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => []),
        el: () => ({
          querySelector: () => null, // No video element found
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should return null when video element has no dimensions', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => []),
        el: () => ({
          querySelector: () => ({
            videoWidth: 0,
            videoHeight: 0,
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should return null when no quality levels plugin and no video element', () => {
      const mockPlayer = {
        qualityLevels: undefined,
        el: () => ({
          querySelector: () => null,
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });
  });

  describe('getVideoSrc', () => {
    it('should return currentSrc when available', () => {
      const currentSrc = 'http://example.com/video.mp4';
      const mockPlayer = createMockVideoJSPlayer({
        currentSrc: jest.fn(() => currentSrc),
        src: jest.fn(() => 'fallback.mp4'),
      });

      const adapter = new VideoJSAdapter(mockPlayer);
      const src = adapter.getVideoSrc();

      expect(src).toBe(currentSrc);
    });

    it('should return src when currentSrc is empty', () => {
      const srcValue = 'http://example.com/fallback.mp4';
      const mockPlayer = createMockVideoJSPlayer({
        currentSrc: jest.fn(() => ''),
        src: jest.fn(() => srcValue),
      });

      const adapter = new VideoJSAdapter(mockPlayer);
      const src = adapter.getVideoSrc();

      expect(src).toBe(srcValue);
    });

    it('should return empty string when both currentSrc and src are empty', () => {
      const mockPlayer = createMockVideoJSPlayer({
        currentSrc: jest.fn(() => ''),
        src: jest.fn(() => ''),
      });

      const adapter = new VideoJSAdapter(mockPlayer);
      const src = adapter.getVideoSrc();

      expect(src).toBe('');
    });

    it('should return src when currentSrc is null', () => {
      const srcValue = 'http://example.com/fallback.mp4';
      const mockPlayer = createMockVideoJSPlayer({
        currentSrc: jest.fn(() => null),
        src: jest.fn(() => srcValue),
      });

      const adapter = new VideoJSAdapter(mockPlayer);
      const src = adapter.getVideoSrc();

      expect(src).toBe(srcValue);
    });
  });

  describe('getQuality - additional branch coverage', () => {
    it('should fallback to video element when quality levels exist but currentLevel is falsy and video has only width', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => [null]), // Array with null element
        el: () => ({
          querySelector: () => ({
            videoWidth: 1920,
            videoHeight: 0, // No height
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should fallback to video element when quality levels exist but currentLevel is falsy and video has only height', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => [undefined]), // Array with undefined element
        el: () => ({
          querySelector: () => ({
            videoWidth: 0, // No width
            videoHeight: 1080,
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should handle quality levels with missing properties', () => {
      const mockQualityLevels = [
        {
          // Missing width, height, bitrate, label
        },
      ];

      const mockPlayer = {
        qualityLevels: jest.fn(() => mockQualityLevels),
        el: () => ({
          querySelector: () => ({
            videoWidth: 1920,
            videoHeight: 1080,
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 0,
        height: 0,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should return null when video element has undefined width', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => []), // Empty array to go to fallback
        el: () => ({
          querySelector: () => ({
            videoWidth: undefined, // Undefined width
            videoHeight: 1080,
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should return null when video element has undefined height', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => []), // Empty array to go to fallback
        el: () => ({
          querySelector: () => ({
            videoWidth: 1920,
            videoHeight: undefined, // Undefined height
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should return null when video element has null width', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => []), // Empty array to go to fallback
        el: () => ({
          querySelector: () => ({
            videoWidth: null, // Null width
            videoHeight: 1080,
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should return null when video element is null during quality fallback', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => []), // Empty array to trigger fallback
        el: () => ({
          querySelector: () => null, // Video element is null
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      // Force videoElement to be null
      (adapter as any).videoElement = null;

      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should return null when videoWidth is truthy but videoHeight is falsy', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => []), // Empty array to trigger fallback
        el: () => ({
          querySelector: () => ({
            videoWidth: 1920, // Truthy
            videoHeight: 0, // Falsy
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should return null when videoWidth is falsy but videoHeight is truthy', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => []), // Empty array to trigger fallback
        el: () => ({
          querySelector: () => ({
            videoWidth: 0, // Falsy
            videoHeight: 1080, // Truthy
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toBeNull();
    });

    it('should return quality from video element when both width and height are truthy', () => {
      const mockPlayer = {
        qualityLevels: jest.fn(() => []), // Empty array to trigger fallback
        el: () => ({
          querySelector: () => ({
            videoWidth: 1920, // Truthy
            videoHeight: 1080, // Truthy
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 1920,
        height: 1080,
        bitrate: 0,
        level: 'auto',
      });
    });

    it('should handle videoElement with non-zero dimensions', () => {
      const mockVideoElement = {
        videoWidth: 1920,
        videoHeight: 1080,
      };

      const mockPlayer = {
        qualityLevels: jest.fn(() => []), // Empty array to trigger fallback
        el: () => ({
          querySelector: () => mockVideoElement,
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const quality = adapter.getQuality();

      expect(quality).toEqual({
        width: 1920,
        height: 1080,
        bitrate: 0,
        level: 'auto',
      });
    });
  });

  describe('isBuffering', () => {
    it('should return true when video element is null and not paused', () => {
      const mockPlayer = {
        el: () => ({
          querySelector: () => null,
        }),
        paused: jest.fn(() => false),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const isBuffering = adapter.isBuffering();

      expect(isBuffering).toBe(true);
    });

    it('should return false when video element is null but paused', () => {
      const mockPlayer = {
        el: () => ({
          querySelector: () => null,
        }),
        paused: jest.fn(() => true),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const isBuffering = adapter.isBuffering();

      expect(isBuffering).toBe(false);
    });

    it('should return true when ready state is low and not paused', () => {
      const mockPlayer = {
        el: () => ({
          querySelector: () => ({
            readyState: HTMLMediaElement.HAVE_CURRENT_DATA, // Less than HAVE_FUTURE_DATA
          }),
        }),
        paused: jest.fn(() => false),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const isBuffering = adapter.isBuffering();

      expect(isBuffering).toBe(true);
    });

    it('should return false when ready state is low but paused', () => {
      const mockPlayer = {
        el: () => ({
          querySelector: () => ({
            readyState: HTMLMediaElement.HAVE_CURRENT_DATA,
          }),
        }),
        paused: jest.fn(() => true),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const isBuffering = adapter.isBuffering();

      expect(isBuffering).toBe(false);
    });
  });

  describe('isSeeking', () => {
    it('should return false when video element is null', () => {
      const mockPlayer = {
        el: () => ({
          querySelector: () => null,
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const isSeeking = adapter.isSeeking();

      expect(isSeeking).toBe(false);
    });

    it('should return true when video element is seeking', () => {
      const mockPlayer = {
        el: () => ({
          querySelector: () => ({
            seeking: true,
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const isSeeking = adapter.isSeeking();

      expect(isSeeking).toBe(true);
    });

    it('should return false when video element is not seeking', () => {
      const mockPlayer = {
        el: () => ({
          querySelector: () => ({
            seeking: false,
          }),
        }),
      };

      const adapter = new VideoJSAdapter(mockPlayer as any);
      const isSeeking = adapter.isSeeking();

      expect(isSeeking).toBe(false);
    });
  });
});
