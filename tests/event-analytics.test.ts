import { EventAnalytics } from '../src/utils/event-analytics';
import { VideoEvent, VideoEventType } from '../src/types';

// Helper function to create mock events
const createMockEvent = (
  type: VideoEventType,
  timestamp: number,
  overrides: any = {}
): VideoEvent => ({
  type,
  data: {
    timestamp,
    currentTime: 30,
    duration: 120,
    volume: 1,
    muted: false,
    paused: false,
    seeking: false,
    buffering: false,
    fullscreen: false,
    videoSrc: 'http://example.com/video.mp4',
    sessionId: 'test-session',
    ...overrides,
  },
});

describe('EventAnalytics', () => {
  let analytics: EventAnalytics;

  beforeEach(() => {
    analytics = new EventAnalytics();
  });

  describe('Constructor', () => {
    it('should initialize with empty state', () => {
      const result = analytics.getAnalytics();

      expect(result).toEqual({
        totalPlayTime: 0,
        totalPauseTime: 0,
        seekCount: 0,
        bufferCount: 0,
        averageBufferDuration: 0,
        completionRate: 0,
        engagementScore: 25, // Base score for no seeking
        qualityChanges: 0,
        errors: 0,
      });
    });
  });

  describe('Event Processing', () => {
    it('should add events and track them', () => {
      const playEvent = createMockEvent(VideoEventType.PLAY, 1000);
      const pauseEvent = createMockEvent(VideoEventType.PAUSE, 2000);

      analytics.addEvent(playEvent);
      analytics.addEvent(pauseEvent);

      const result = analytics.getAnalytics();
      expect(result.totalPlayTime).toBeGreaterThan(0);
    });

    it('should track seek events', () => {
      const seekEvent = createMockEvent(VideoEventType.SEEK, 1000);

      analytics.addEvent(seekEvent);

      const result = analytics.getAnalytics();
      expect(result.seekCount).toBe(1);
    });

    it('should track multiple seek events', () => {
      for (let i = 0; i < 5; i++) {
        const seekEvent = createMockEvent(VideoEventType.SEEK, 1000 + i * 1000);
        analytics.addEvent(seekEvent);
      }

      const result = analytics.getAnalytics();
      expect(result.seekCount).toBe(5);
    });

    it('should track buffer events', () => {
      const bufferStartEvent = createMockEvent(
        VideoEventType.BUFFER_START,
        1000
      );

      analytics.addEvent(bufferStartEvent);

      const result = analytics.getAnalytics();
      expect(result.bufferCount).toBe(1);
    });

    it('should track quality changes', () => {
      const qualityChangeEvent = createMockEvent(
        VideoEventType.QUALITY_CHANGE,
        1000
      );

      analytics.addEvent(qualityChangeEvent);

      const result = analytics.getAnalytics();
      expect(result.qualityChanges).toBe(1);
    });

    it('should track error events', () => {
      const errorEvent = createMockEvent(VideoEventType.ERROR, 1000);

      analytics.addEvent(errorEvent);

      const result = analytics.getAnalytics();
      expect(result.errors).toBe(1);
    });
  });

  describe('Play Time Calculation', () => {
    it('should calculate play time between play and pause events', () => {
      const playEvent = createMockEvent(VideoEventType.PLAY, 1000);
      const pauseEvent = createMockEvent(VideoEventType.PAUSE, 3000);

      analytics.addEvent(playEvent);
      analytics.addEvent(pauseEvent);

      const result = analytics.getAnalytics();
      expect(result.totalPlayTime).toBe(2000); // 3000 - 1000
    });

    it('should handle multiple play/pause cycles', () => {
      // First cycle: 2 seconds
      analytics.addEvent(createMockEvent(VideoEventType.PLAY, 1000));
      analytics.addEvent(createMockEvent(VideoEventType.PAUSE, 3000));

      // Second cycle: 3 seconds
      analytics.addEvent(createMockEvent(VideoEventType.PLAY, 4000));
      analytics.addEvent(createMockEvent(VideoEventType.PAUSE, 7000));

      const result = analytics.getAnalytics();
      expect(result.totalPlayTime).toBe(5000); // 2000 + 3000
    });

    it('should handle unmatched play events', () => {
      analytics.addEvent(createMockEvent(VideoEventType.PLAY, 1000));
      analytics.addEvent(createMockEvent(VideoEventType.PLAY, 2000));
      analytics.addEvent(createMockEvent(VideoEventType.PAUSE, 4000));

      const result = analytics.getAnalytics();
      expect(result.totalPlayTime).toBe(3000); // 4000 - 1000 (first play to pause)
    });

    it('should handle pause without play', () => {
      analytics.addEvent(createMockEvent(VideoEventType.PAUSE, 2000));

      const result = analytics.getAnalytics();
      expect(result.totalPlayTime).toBe(0);
    });
  });

  describe('Buffer Duration Tracking', () => {
    it('should track buffer duration', () => {
      const bufferStartEvent = createMockEvent(
        VideoEventType.BUFFER_START,
        1000
      );
      const bufferEndEvent = createMockEvent(VideoEventType.BUFFER_END, 3000);

      analytics.addEvent(bufferStartEvent);
      analytics.addEvent(bufferEndEvent);

      const result = analytics.getAnalytics();
      expect(result.averageBufferDuration).toBe(2000); // 3000 - 1000
    });

    it('should calculate average buffer duration for multiple events', () => {
      // First buffer: 2 seconds
      analytics.addEvent(createMockEvent(VideoEventType.BUFFER_START, 1000));
      analytics.addEvent(createMockEvent(VideoEventType.BUFFER_END, 3000));

      // Second buffer: 4 seconds
      analytics.addEvent(createMockEvent(VideoEventType.BUFFER_START, 5000));
      analytics.addEvent(createMockEvent(VideoEventType.BUFFER_END, 9000));

      const result = analytics.getAnalytics();
      expect(result.averageBufferDuration).toBe(3000); // (2000 + 4000) / 2
    });

    it('should handle buffer start without end', () => {
      analytics.addEvent(createMockEvent(VideoEventType.BUFFER_START, 1000));

      const result = analytics.getAnalytics();
      expect(result.averageBufferDuration).toBe(0);
    });

    it('should handle buffer end without start', () => {
      analytics.addEvent(createMockEvent(VideoEventType.BUFFER_END, 2000));

      const result = analytics.getAnalytics();
      expect(result.averageBufferDuration).toBe(0);
    });

    it('should return 0 when no buffer events', () => {
      const result = analytics.getAnalytics();
      expect(result.averageBufferDuration).toBe(0);
    });
  });

  describe('Completion Rate Calculation', () => {
    it('should calculate completion rate from last event', () => {
      const event = createMockEvent(VideoEventType.PROGRESS, 1000, {
        currentTime: 60,
        duration: 120,
      });

      analytics.addEvent(event);

      const result = analytics.getAnalytics();
      expect(result.completionRate).toBe(50); // 60/120 * 100
    });

    it('should handle zero duration', () => {
      const event = createMockEvent(VideoEventType.PROGRESS, 1000, {
        currentTime: 30,
        duration: 0,
      });

      analytics.addEvent(event);

      const result = analytics.getAnalytics();
      expect(result.completionRate).toBe(0);
    });

    it('should use the latest event for completion rate', () => {
      // First event at 25%
      analytics.addEvent(
        createMockEvent(VideoEventType.PROGRESS, 1000, {
          currentTime: 30,
          duration: 120,
        })
      );

      // Second event at 75%
      analytics.addEvent(
        createMockEvent(VideoEventType.PROGRESS, 2000, {
          currentTime: 90,
          duration: 120,
        })
      );

      const result = analytics.getAnalytics();
      expect(result.completionRate).toBe(75); // 90/120 * 100
    });

    it('should return 0 when no events', () => {
      const result = analytics.getAnalytics();
      expect(result.completionRate).toBe(0);
    });
  });

  describe('Engagement Score Calculation', () => {
    it('should calculate engagement score based on play time', () => {
      // Simulate 1 minute of play time
      analytics.addEvent(
        createMockEvent(VideoEventType.PLAY, 0, { currentTime: 0 })
      );
      analytics.addEvent(
        createMockEvent(VideoEventType.PAUSE, 60000, { currentTime: 0 })
      );

      const result = analytics.getAnalytics();
      // 1 minute * 10 points per minute (10) + base score (25) + no completion = 35 points
      expect(result.engagementScore).toBe(35);
    });

    it('should add completion bonus to engagement score', () => {
      // Simulate completion
      analytics.addEvent(createMockEvent(VideoEventType.PLAY, 0));
      analytics.addEvent(createMockEvent(VideoEventType.PAUSE, 60000));

      const endEvent = createMockEvent(VideoEventType.ENDED, 120000, {
        currentTime: 120,
        duration: 120,
      });
      analytics.addEvent(endEvent);

      const result = analytics.getAnalytics();
      // 1 minute play (10) + base score (25) + 100% completion (50) = 85
      expect(result.engagementScore).toBe(85);
    });

    it('should penalize excessive seeking', () => {
      // Add play time
      analytics.addEvent(
        createMockEvent(VideoEventType.PLAY, 0, { currentTime: 0 })
      );
      analytics.addEvent(
        createMockEvent(VideoEventType.PAUSE, 60000, { currentTime: 0 })
      );

      // Add many seek events (penalty)
      for (let i = 0; i < 20; i++) {
        analytics.addEvent(
          createMockEvent(VideoEventType.SEEK, 1000 + i * 100, {
            currentTime: 0,
          })
        );
      }

      const result = analytics.getAnalytics();
      // 1 minute play (10) + base score but penalized (25 - 20*2 = -15, max 0) = 10
      expect(result.engagementScore).toBe(10);
    });

    it('should cap engagement score at 100', () => {
      // Simulate 10 minutes of play time (would be 100 points)
      analytics.addEvent(createMockEvent(VideoEventType.PLAY, 0));
      analytics.addEvent(createMockEvent(VideoEventType.PAUSE, 600000)); // 10 minutes

      // Add completion bonus
      const endEvent = createMockEvent(VideoEventType.ENDED, 600000, {
        currentTime: 120,
        duration: 120,
      });
      analytics.addEvent(endEvent);

      const result = analytics.getAnalytics();
      expect(result.engagementScore).toBe(100); // Capped at 100
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all analytics data', () => {
      // Add various events
      analytics.addEvent(createMockEvent(VideoEventType.PLAY, 1000));
      analytics.addEvent(createMockEvent(VideoEventType.PAUSE, 3000));
      analytics.addEvent(createMockEvent(VideoEventType.SEEK, 4000));
      analytics.addEvent(createMockEvent(VideoEventType.BUFFER_START, 5000));
      analytics.addEvent(createMockEvent(VideoEventType.BUFFER_END, 7000));

      // Verify data exists
      let result = analytics.getAnalytics();
      expect(result.totalPlayTime).toBeGreaterThan(0);
      expect(result.seekCount).toBeGreaterThan(0);

      // Reset
      analytics.reset();

      // Verify everything is reset
      result = analytics.getAnalytics();
      expect(result).toEqual({
        totalPlayTime: 0,
        totalPauseTime: 0,
        seekCount: 0,
        bufferCount: 0,
        averageBufferDuration: 0,
        completionRate: 0,
        engagementScore: 25, // Base score for no seeking
        qualityChanges: 0,
        errors: 0,
      });
    });

    it('should allow adding events after reset', () => {
      // Add and reset
      analytics.addEvent(createMockEvent(VideoEventType.PLAY, 1000));
      analytics.reset();

      // Add new events
      analytics.addEvent(createMockEvent(VideoEventType.SEEK, 5000));

      const result = analytics.getAnalytics();
      expect(result.seekCount).toBe(1);
      expect(result.totalPlayTime).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle events with missing data', () => {
      const malformedEvent = {
        type: VideoEventType.PLAY,
        data: {
          timestamp: 1000,
          // Missing other required fields
        },
      } as VideoEvent;

      analytics.addEvent(malformedEvent);

      const result = analytics.getAnalytics();
      expect(result.completionRate).toBe(0);
    });

    it('should handle very large numbers', () => {
      const playEvent = createMockEvent(
        VideoEventType.PLAY,
        Number.MAX_SAFE_INTEGER - 1000
      );
      const pauseEvent = createMockEvent(
        VideoEventType.PAUSE,
        Number.MAX_SAFE_INTEGER
      );

      analytics.addEvent(playEvent);
      analytics.addEvent(pauseEvent);

      const result = analytics.getAnalytics();
      expect(result.totalPlayTime).toBe(1000);
    });

    it('should handle negative durations gracefully', () => {
      const event = createMockEvent(VideoEventType.PROGRESS, 1000, {
        currentTime: 60,
        duration: -10,
      });

      analytics.addEvent(event);

      const result = analytics.getAnalytics();
      expect(result.completionRate).toBe(0);
    });
  });
});
