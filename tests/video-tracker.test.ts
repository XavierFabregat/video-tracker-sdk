import { VideoTracker } from '../src/video-tracker';
import { HTML5VideoAdapter } from '../src/adapters/html5-adapter';
import {
  VideoEventData,
  VideoEventType,
  VideoTrackerConfig,
} from '../src/types';

describe('VideoTracker', () => {
  let videoElement: HTMLVideoElement;
  let adapter: HTML5VideoAdapter;
  let tracker: VideoTracker;
  let mockOnEvent: jest.Mock;

  beforeEach(() => {
    videoElement = new HTMLVideoElement();
    adapter = new HTML5VideoAdapter(videoElement);

    // Mock the adapter methods
    jest.spyOn(adapter, 'addEventListener');
    jest.spyOn(adapter, 'removeEventListener');

    mockOnEvent = jest.fn();

    const config: VideoTrackerConfig = {
      onEvent: mockOnEvent,
      debug: false,
      autoTrack: true,
      progressInterval: 1,
    };

    tracker = new VideoTracker(adapter, config);
  });

  afterEach(() => {
    tracker.destroy();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default config when none provided', () => {
      const defaultTracker = new VideoTracker(adapter);
      expect(defaultTracker.getSessionId()).toBeDefined();
      expect(defaultTracker.getSessionId()).toMatch(/^session_/);
    });

    it('should use provided session ID', () => {
      const customSessionId = 'custom-session-123';
      const customTracker = new VideoTracker(adapter, {
        sessionId: customSessionId,
      });

      expect(customTracker.getSessionId()).toBe(customSessionId);
      customTracker.destroy();
    });

    it('should attach event listeners when autoTrack is enabled', () => {
      expect(adapter.addEventListener).toHaveBeenCalledWith(
        'play',
        expect.any(Function)
      );
      expect(adapter.addEventListener).toHaveBeenCalledWith(
        'pause',
        expect.any(Function)
      );
      expect(adapter.addEventListener).toHaveBeenCalledWith(
        'seeking',
        expect.any(Function)
      );
    });
  });

  describe('Event Tracking', () => {
    it('should emit play event when video plays', () => {
      const playHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'play')[1];

      playHandler();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.PLAY,
        data: expect.objectContaining({
          currentTime: 0,
          paused: true,
          sessionId: expect.any(String),
          timestamp: expect.any(Number),
        }),
      });
    });

    it('should emit pause event when video pauses', () => {
      const pauseHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'pause')[1];

      pauseHandler();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.PAUSE,
        data: expect.objectContaining({
          currentTime: 0,
          paused: true,
          sessionId: expect.any(String),
        }),
      });
    });

    it('should emit seek event with from and to times', () => {
      const seekingHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'seeking')[1];
      const seekedHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'seeked')[1];

      // Simulate seeking from time 10 to time 20
      videoElement.currentTime = 10;
      seekingHandler();

      videoElement.currentTime = 20;
      seekedHandler();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.SEEK,
        data: expect.objectContaining({
          fromTime: 10,
          toTime: 20,
        }),
      });
    });

    it('should emit error event with error details', () => {
      const errorHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'error')[1];

      const mockError = {
        target: {
          error: {
            code: 4,
            message: 'Media element load error',
          },
        },
        type: 'error',
      };

      errorHandler(mockError);

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.ERROR,
        data: expect.objectContaining({
          errorCode: 4,
          errorMessage: 'Media element load error',
          errorType: 'error',
        }),
      });
    });
  });

  describe('Manual Event Tracking', () => {
    it('should allow manual event tracking', () => {
      tracker.trackEvent(VideoEventType.PLAY, {
        customField: 'test',
      } as Partial<VideoEventData>);

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.PLAY,
        data: expect.objectContaining({
          customField: 'test',
          sessionId: expect.any(String),
        }),
      });
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const newOnEvent = jest.fn();
      tracker.updateConfig({ onEvent: newOnEvent });

      tracker.trackEvent(VideoEventType.PLAY);

      expect(newOnEvent).toHaveBeenCalled();
      expect(mockOnEvent).not.toHaveBeenCalled();
    });
  });

  describe('Debug Mode', () => {
    it('should log events when debug is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const debugTracker = new VideoTracker(adapter, {
        onEvent: mockOnEvent,
        debug: true,
      });

      debugTracker.trackEvent(VideoEventType.PLAY);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[VideoTracker]',
        expect.objectContaining({
          type: VideoEventType.PLAY,
          data: expect.any(Object),
        })
      );

      consoleSpy.mockRestore();
      debugTracker.destroy();
    });

    it('should not log events when debug is disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      tracker.trackEvent(VideoEventType.PLAY);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      tracker.destroy();

      expect(adapter.removeEventListener).toHaveBeenCalled();
      expect(clearInterval).toHaveBeenCalled();
    });
  });

  describe('Progress Tracking', () => {
    it('should set up progress tracking interval', () => {
      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        1000 // 1 second interval
      );
    });

    it('should clear existing timer when restarting progress tracking', () => {
      // Set up an existing timer on the tracker
      (tracker as any).progressTimer = 123; // Mock timer ID

      // Access the private method to test the clearInterval path
      (tracker as any).startProgressTracking();

      // Should have called clearInterval for the existing timer
      expect(clearInterval).toHaveBeenCalledWith(123);
    });

    it('should emit progress events during playback', () => {
      // Mock video playing state
      jest.spyOn(adapter, 'isPaused').mockReturnValue(false);
      jest.spyOn(adapter, 'isSeeking').mockReturnValue(false);
      jest.spyOn(adapter, 'getCurrentTime').mockReturnValue(30);
      jest.spyOn(adapter, 'getDuration').mockReturnValue(120);

      // Get the progress interval callback
      const progressCallback = (setInterval as jest.Mock).mock.calls[0][0];

      // Execute the callback
      progressCallback();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.PROGRESS,
        data: expect.objectContaining({
          currentTime: 30,
          duration: 120,
          percentComplete: 25, // 30/120 * 100
          bytesLoaded: 0,
          bytesTotal: 0,
        }),
      });
    });

    it('should not emit progress events when paused', () => {
      // Mock video paused state
      jest.spyOn(adapter, 'isPaused').mockReturnValue(true);
      jest.spyOn(adapter, 'isSeeking').mockReturnValue(false);

      // Get the progress interval callback
      const progressCallback = (setInterval as jest.Mock).mock.calls[0][0];

      // Clear previous calls
      mockOnEvent.mockClear();

      // Execute the callback
      progressCallback();

      expect(mockOnEvent).not.toHaveBeenCalled();
    });

    it('should not emit progress events when seeking', () => {
      // Mock video seeking state
      jest.spyOn(adapter, 'isPaused').mockReturnValue(false);
      jest.spyOn(adapter, 'isSeeking').mockReturnValue(true);

      // Get the progress interval callback
      const progressCallback = (setInterval as jest.Mock).mock.calls[0][0];

      // Clear previous calls
      mockOnEvent.mockClear();

      // Execute the callback
      progressCallback();

      expect(mockOnEvent).not.toHaveBeenCalled();
    });

    it('should emit quality change events when quality changes', () => {
      // Mock video playing state
      jest.spyOn(adapter, 'isPaused').mockReturnValue(false);
      jest.spyOn(adapter, 'isSeeking').mockReturnValue(false);
      jest.spyOn(adapter, 'getCurrentTime').mockReturnValue(30);
      jest.spyOn(adapter, 'getDuration').mockReturnValue(120);

      // First quality
      const quality1 = {
        width: 720,
        height: 480,
        bitrate: 1000,
        level: '480p',
      };
      jest.spyOn(adapter, 'getQuality').mockReturnValue(quality1);

      // Get the progress interval callback
      const progressCallback = (setInterval as jest.Mock).mock.calls[0][0];

      // Execute the callback (first time)
      progressCallback();

      // Change quality
      const quality2 = {
        width: 1920,
        height: 1080,
        bitrate: 5000,
        level: '1080p',
      };
      jest.spyOn(adapter, 'getQuality').mockReturnValue(quality2);

      // Execute the callback (second time)
      progressCallback();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.QUALITY_CHANGE,
        data: expect.objectContaining({
          previousQuality: quality1,
          currentQuality: quality2,
        }),
      });
    });

    it('should not emit quality change events when quality is the same', () => {
      // Mock video playing state
      jest.spyOn(adapter, 'isPaused').mockReturnValue(false);
      jest.spyOn(adapter, 'isSeeking').mockReturnValue(false);
      jest.spyOn(adapter, 'getCurrentTime').mockReturnValue(30);
      jest.spyOn(adapter, 'getDuration').mockReturnValue(120);

      // Same quality
      const quality = { width: 720, height: 480, bitrate: 1000, level: '480p' };
      jest.spyOn(adapter, 'getQuality').mockReturnValue(quality);

      // Get the progress interval callback
      const progressCallback = (setInterval as jest.Mock).mock.calls[0][0];

      // Execute the callback twice
      progressCallback();
      mockOnEvent.mockClear();
      progressCallback();

      // Should not have emitted quality change event
      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.PROGRESS,
        data: expect.anything(),
      });
      expect(mockOnEvent).not.toHaveBeenCalledWith({
        type: VideoEventType.QUALITY_CHANGE,
        data: expect.anything(),
      });
    });

    it('should handle null quality values correctly', () => {
      // Mock video playing state
      jest.spyOn(adapter, 'isPaused').mockReturnValue(false);
      jest.spyOn(adapter, 'isSeeking').mockReturnValue(false);
      jest.spyOn(adapter, 'getCurrentTime').mockReturnValue(30);
      jest.spyOn(adapter, 'getDuration').mockReturnValue(120);

      // Null quality
      jest.spyOn(adapter, 'getQuality').mockReturnValue(null);

      // Get the progress interval callback
      const progressCallback = (setInterval as jest.Mock).mock.calls[0][0];

      // Execute the callback
      progressCallback();

      // Should not crash or emit quality change event
      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.PROGRESS,
        data: expect.anything(),
      });
    });

    it('should update lastQuality when quality changes are detected', () => {
      // Mock video playing state
      jest.spyOn(adapter, 'isPaused').mockReturnValue(false);
      jest.spyOn(adapter, 'isSeeking').mockReturnValue(false);
      jest.spyOn(adapter, 'getCurrentTime').mockReturnValue(30);
      jest.spyOn(adapter, 'getDuration').mockReturnValue(120);

      // First quality
      const quality1 = {
        width: 720,
        height: 480,
        bitrate: 1000,
        level: '480p',
      };
      const quality2 = {
        width: 1920,
        height: 1080,
        bitrate: 5000,
        level: '1080p',
      };

      jest.spyOn(adapter, 'getQuality').mockReturnValue(quality1);

      // Get the progress interval callback
      const progressCallback = (setInterval as jest.Mock).mock.calls[0][0];

      // Execute the callback (first time) - this should set lastQuality
      progressCallback();

      // Change quality and execute again
      jest.spyOn(adapter, 'getQuality').mockReturnValue(quality2);
      progressCallback();

      // Should have emitted quality change event and updated lastQuality
      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.QUALITY_CHANGE,
        data: expect.objectContaining({
          previousQuality: quality1,
          currentQuality: quality2,
        }),
      });

      // Execute again with same quality - should not emit another quality change
      mockOnEvent.mockClear();
      progressCallback();

      const qualityChangeCalls = mockOnEvent.mock.calls.filter(
        (call) => call[0].type === VideoEventType.QUALITY_CHANGE
      );
      expect(qualityChangeCalls).toHaveLength(0);
    });

    it('should not emit progress events when duration is zero or invalid', () => {
      // Mock video playing state with zero duration
      jest.spyOn(adapter, 'isPaused').mockReturnValue(false);
      jest.spyOn(adapter, 'isSeeking').mockReturnValue(false);
      jest.spyOn(adapter, 'getCurrentTime').mockReturnValue(30);
      jest.spyOn(adapter, 'getDuration').mockReturnValue(0);
      jest.spyOn(adapter, 'getQuality').mockReturnValue(null); // Prevent quality change events

      // Get the progress interval callback
      const progressCallback = (setInterval as jest.Mock).mock.calls[0][0];

      // Clear previous calls
      mockOnEvent.mockClear();

      // Execute the callback
      progressCallback();

      // Should not emit progress event when duration is 0
      expect(mockOnEvent).not.toHaveBeenCalled();
    });
  });

  describe('Additional Event Tracking', () => {
    it('should emit volume change events', () => {
      const volumeChangeHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'volumechange')[1];

      volumeChangeHandler();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.VOLUME_CHANGE,
        data: expect.objectContaining({
          sessionId: expect.any(String),
          timestamp: expect.any(Number),
        }),
      });
    });

    it('should emit buffer start events', () => {
      const waitingHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'waiting')[1];

      waitingHandler();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.BUFFER_START,
        data: expect.objectContaining({
          bufferLength: expect.any(Number),
          bufferStart: expect.any(Number),
          bufferEnd: expect.any(Number),
          sessionId: expect.any(String),
          timestamp: expect.any(Number),
        }),
      });
    });

    it('should emit buffer end events', () => {
      const canplayHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'canplay')[1];

      canplayHandler();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.BUFFER_END,
        data: expect.objectContaining({
          bufferLength: expect.any(Number),
          bufferStart: expect.any(Number),
          bufferEnd: expect.any(Number),
          sessionId: expect.any(String),
          timestamp: expect.any(Number),
        }),
      });
    });

    it('should emit buffer events with HTML5 adapter buffer info', () => {
      // Mock buffer info for HTML5 adapter
      const mockBufferInfo = {
        bufferLength: 10,
        bufferStart: 0,
        bufferEnd: 10,
      };
      jest
        .spyOn(adapter, 'getCurrentBufferInfo')
        .mockReturnValue(mockBufferInfo);

      const waitingHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'waiting')[1];

      waitingHandler();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.BUFFER_START,
        data: expect.objectContaining({
          bufferLength: 10,
          bufferStart: 0,
          bufferEnd: 10,
        }),
      });
    });

    it('should emit ended events', () => {
      const endedHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'ended')[1];

      endedHandler();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.ENDED,
        data: expect.objectContaining({
          sessionId: expect.any(String),
          timestamp: expect.any(Number),
        }),
      });
    });

    it('should emit duration change events', () => {
      const durationChangeHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'durationchange')[1];

      durationChangeHandler();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.DURATION_CHANGE,
        data: expect.objectContaining({
          sessionId: expect.any(String),
          timestamp: expect.any(Number),
        }),
      });
    });

    it('should handle error events with missing error details', () => {
      const errorHandler = (
        adapter.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'error')[1];

      const mockError = {
        target: null,
        type: undefined,
      };

      errorHandler(mockError);

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.ERROR,
        data: expect.objectContaining({
          errorCode: 0,
          errorMessage: 'Unknown error',
          errorType: 'error',
        }),
      });
    });
  });

  describe('Fullscreen Event Handling', () => {
    it('should attach fullscreen event listeners for HTMLVideoElement', () => {
      // Create a new tracker with HTMLVideoElement
      const htmlVideoElement = new HTMLVideoElement();
      const htmlAdapter = new HTML5VideoAdapter(htmlVideoElement);

      // Mock document.addEventListener
      const mockDocumentAddEventListener = jest.fn();
      jest
        .spyOn(document, 'addEventListener')
        .mockImplementation(mockDocumentAddEventListener);

      const htmlTracker = new VideoTracker(htmlAdapter, {
        onEvent: mockOnEvent,
      });

      // Verify fullscreen event listeners were added
      expect(mockDocumentAddEventListener).toHaveBeenCalledWith(
        'fullscreenchange',
        expect.any(Function)
      );
      expect(mockDocumentAddEventListener).toHaveBeenCalledWith(
        'webkitfullscreenchange',
        expect.any(Function)
      );
      expect(mockDocumentAddEventListener).toHaveBeenCalledWith(
        'mozfullscreenchange',
        expect.any(Function)
      );
      expect(mockDocumentAddEventListener).toHaveBeenCalledWith(
        'MSFullscreenChange',
        expect.any(Function)
      );

      htmlTracker.destroy();

      // Restore original method
      jest.restoreAllMocks();
    });

    it('should emit fullscreen change events', () => {
      // Create a new tracker with HTMLVideoElement
      const htmlVideoElement = new HTMLVideoElement();
      const htmlAdapter = new HTML5VideoAdapter(htmlVideoElement);

      // Mock document.addEventListener
      let fullscreenHandler: Function;
      jest
        .spyOn(document, 'addEventListener')
        .mockImplementation((event, handler) => {
          if (event === 'fullscreenchange') {
            fullscreenHandler = handler as Function;
          }
        });

      const htmlTracker = new VideoTracker(htmlAdapter, {
        onEvent: mockOnEvent,
      });

      // Simulate fullscreen change
      fullscreenHandler!();

      expect(mockOnEvent).toHaveBeenCalledWith({
        type: VideoEventType.FULLSCREEN_CHANGE,
        data: expect.objectContaining({
          sessionId: expect.any(String),
          timestamp: expect.any(Number),
        }),
      });

      htmlTracker.destroy();

      // Restore original method
      jest.restoreAllMocks();
    });
  });

  describe('Destroy Method', () => {
    it('should remove fullscreen event listeners on destroy', () => {
      // Create a new tracker with HTMLVideoElement
      const htmlVideoElement = new HTMLVideoElement();
      const htmlAdapter = new HTML5VideoAdapter(htmlVideoElement);

      // Mock document methods
      const mockDocumentAddEventListener = jest.fn();
      const mockDocumentRemoveEventListener = jest.fn();
      jest
        .spyOn(document, 'addEventListener')
        .mockImplementation(mockDocumentAddEventListener);
      jest
        .spyOn(document, 'removeEventListener')
        .mockImplementation(mockDocumentRemoveEventListener);

      const htmlTracker = new VideoTracker(htmlAdapter, {
        onEvent: mockOnEvent,
      });

      // Destroy tracker
      htmlTracker.destroy();

      // Verify fullscreen event listeners were removed
      expect(mockDocumentRemoveEventListener).toHaveBeenCalledWith(
        'fullscreenchange',
        expect.any(Function)
      );
      expect(mockDocumentRemoveEventListener).toHaveBeenCalledWith(
        'webkitfullscreenchange',
        expect.any(Function)
      );
      expect(mockDocumentRemoveEventListener).toHaveBeenCalledWith(
        'mozfullscreenchange',
        expect.any(Function)
      );
      expect(mockDocumentRemoveEventListener).toHaveBeenCalledWith(
        'MSFullscreenChange',
        expect.any(Function)
      );

      // Restore original methods
      jest.restoreAllMocks();
    });
  });

  describe('qualitiesEqual method', () => {
    it('should return true when both qualities are null', () => {
      const tracker = new VideoTracker(adapter);

      // Access private method through type assertion
      const qualitiesEqual = (tracker as any).qualitiesEqual;

      expect(qualitiesEqual(null, null)).toBe(true);
    });

    it('should return false when one quality is null', () => {
      const tracker = new VideoTracker(adapter);
      const qualitiesEqual = (tracker as any).qualitiesEqual;

      const quality1 = {
        width: 1920,
        height: 1080,
        bitrate: 5000,
        level: '1080p',
      };

      expect(qualitiesEqual(quality1, null)).toBe(false);
      expect(qualitiesEqual(null, quality1)).toBe(false);
    });

    it('should return true when qualities are identical', () => {
      const tracker = new VideoTracker(adapter);
      const qualitiesEqual = (tracker as any).qualitiesEqual;

      const quality1 = {
        width: 1920,
        height: 1080,
        bitrate: 5000,
        level: '1080p',
      };
      const quality2 = {
        width: 1920,
        height: 1080,
        bitrate: 5000,
        level: '1080p',
      };

      expect(qualitiesEqual(quality1, quality2)).toBe(true);
    });

    it('should return false when qualities differ', () => {
      const tracker = new VideoTracker(adapter);
      const qualitiesEqual = (tracker as any).qualitiesEqual;

      const quality1 = {
        width: 1920,
        height: 1080,
        bitrate: 5000,
        level: '1080p',
      };
      const quality2 = {
        width: 1280,
        height: 720,
        bitrate: 3000,
        level: '720p',
      };

      expect(qualitiesEqual(quality1, quality2)).toBe(false);
    });

    it('should return false when width differs', () => {
      const tracker = new VideoTracker(adapter);
      const qualitiesEqual = (tracker as any).qualitiesEqual;

      const quality1 = {
        width: 1920,
        height: 1080,
        bitrate: 5000,
        level: '1080p',
      };
      const quality2 = {
        width: 1280,
        height: 1080,
        bitrate: 5000,
        level: '1080p',
      };

      expect(qualitiesEqual(quality1, quality2)).toBe(false);
    });

    it('should return false when height differs', () => {
      const tracker = new VideoTracker(adapter);
      const qualitiesEqual = (tracker as any).qualitiesEqual;

      const quality1 = {
        width: 1920,
        height: 1080,
        bitrate: 5000,
        level: '1080p',
      };
      const quality2 = {
        width: 1920,
        height: 720,
        bitrate: 5000,
        level: '1080p',
      };

      expect(qualitiesEqual(quality1, quality2)).toBe(false);
    });

    it('should return false when bitrate differs', () => {
      const tracker = new VideoTracker(adapter);
      const qualitiesEqual = (tracker as any).qualitiesEqual;

      const quality1 = {
        width: 1920,
        height: 1080,
        bitrate: 5000,
        level: '1080p',
      };
      const quality2 = {
        width: 1920,
        height: 1080,
        bitrate: 3000,
        level: '1080p',
      };

      expect(qualitiesEqual(quality1, quality2)).toBe(false);
    });
  });

  describe('private method coverage', () => {
    it('should clear existing timer when startProgressTracking is called multiple times', () => {
      jest.useFakeTimers();
      const tracker = new VideoTracker(adapter);
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      // Start progress tracking first
      (tracker as any).startProgressTracking();
      const firstTimer = (tracker as any).progressTimer;

      // Start again - should clear existing timer
      (tracker as any).startProgressTracking();

      expect(clearIntervalSpy).toHaveBeenCalledWith(firstTimer);
      expect((tracker as any).progressTimer).toBeDefined();

      clearIntervalSpy.mockRestore();
    });

    it('should log debug information when debug is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const tracker = new VideoTracker(adapter, { debug: true });

      tracker.trackEvent(VideoEventType.PLAY);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[VideoTracker]',
        expect.objectContaining({
          type: 'play',
          data: expect.any(Object),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should not emit progress events when duration is zero', () => {
      jest.useFakeTimers();
      // Mock adapter methods to return zero duration
      jest.spyOn(adapter, 'getDuration').mockReturnValue(0);
      jest.spyOn(adapter, 'getCurrentTime').mockReturnValue(5);
      jest.spyOn(adapter, 'isPaused').mockReturnValue(false);
      jest.spyOn(adapter, 'isSeeking').mockReturnValue(false);

      const tracker = new VideoTracker(adapter, {
        onEvent: mockOnEvent,
        progressInterval: 1,
      });

      // Trigger progress tracking
      (tracker as any).startProgressTracking();

      // Fast forward time to trigger interval
      jest.advanceTimersByTime(5000);

      // Should not emit progress events when duration is 0
      const progressEvents = mockOnEvent.mock.calls.filter(
        (call) => call[0].type === VideoEventType.PROGRESS
      );
      expect(progressEvents).toHaveLength(0);
    });

    it('should handle generateSessionId', () => {
      const tracker = new VideoTracker(adapter);

      const sessionId1 = (tracker as any).generateSessionId();
      const sessionId2 = (tracker as any).generateSessionId();

      expect(typeof sessionId1).toBe('string');
      expect(typeof sessionId2).toBe('string');
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1.length).toBeGreaterThan(0);
    });
  });
});
