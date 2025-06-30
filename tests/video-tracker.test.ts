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
  });
});
