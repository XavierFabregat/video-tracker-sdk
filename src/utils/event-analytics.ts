import { VideoEvent, VideoEventType } from '../types';

export interface AnalyticsData {
  totalPlayTime: number;
  totalPauseTime: number;
  seekCount: number;
  bufferCount: number;
  averageBufferDuration: number;
  completionRate: number;
  engagementScore: number;
  qualityChanges: number;
  errors: number;
}

export class EventAnalytics {
  private events: VideoEvent[] = [];
  private playStartTime: number | null = null;
  private pauseStartTime: number | null = null;
  private bufferStartTime: number | null = null;
  private bufferDurations: number[] = [];

  public addEvent(event: VideoEvent): void {
    this.events.push(event);
    this.updateTimers(event);
  }

  private updateTimers(event: VideoEvent): void {
    const now = event.data.timestamp;

    switch (event.type) {
      case VideoEventType.PLAY:
        if (this.pauseStartTime) {
          this.pauseStartTime = null;
        }
        this.playStartTime = now;
        break;

      case VideoEventType.PAUSE:
        if (this.playStartTime) {
          this.playStartTime = null;
        }
        this.pauseStartTime = now;
        break;

      case VideoEventType.BUFFER_START:
        this.bufferStartTime = now;
        break;

      case VideoEventType.BUFFER_END:
        if (this.bufferStartTime) {
          this.bufferDurations.push(now - this.bufferStartTime);
          this.bufferStartTime = null;
        }
        break;
    }
  }

  public getAnalytics(): AnalyticsData {
    const playEvents = this.events.filter(
      (e) => e.type === VideoEventType.PLAY
    );
    const pauseEvents = this.events.filter(
      (e) => e.type === VideoEventType.PAUSE
    );
    const seekEvents = this.events.filter(
      (e) => e.type === VideoEventType.SEEK
    );
    const bufferStartEvents = this.events.filter(
      (e) => e.type === VideoEventType.BUFFER_START
    );
    const qualityChangeEvents = this.events.filter(
      (e) => e.type === VideoEventType.QUALITY_CHANGE
    );
    const errorEvents = this.events.filter(
      (e) => e.type === VideoEventType.ERROR
    );

    // Calculate total play and pause times
    let totalPlayTime = 0;
    let totalPauseTime = 0;

    for (let i = 0; i < Math.min(playEvents.length, pauseEvents.length); i++) {
      if (pauseEvents[i] && playEvents[i]) {
        totalPlayTime +=
          pauseEvents[i].data.timestamp - playEvents[i].data.timestamp;
      }
    }

    // Calculate completion rate
    const lastEvent = this.events[this.events.length - 1];
    const completionRate =
      lastEvent?.data.duration > 0
        ? (lastEvent.data.currentTime / lastEvent.data.duration) * 100
        : 0;

    // Calculate engagement score (simplified)
    const engagementScore = Math.min(
      100,
      (totalPlayTime / 1000 / 60) * 10 + // 10 points per minute watched
        (completionRate / 100) * 50 + // 50 points for completion
        Math.max(0, 25 - seekEvents.length * 2) // Penalty for excessive seeking
    );

    return {
      totalPlayTime,
      totalPauseTime,
      seekCount: seekEvents.length,
      bufferCount: bufferStartEvents.length,
      averageBufferDuration:
        this.bufferDurations.length > 0
          ? this.bufferDurations.reduce((a, b) => a + b, 0) /
            this.bufferDurations.length
          : 0,
      completionRate,
      engagementScore,
      qualityChanges: qualityChangeEvents.length,
      errors: errorEvents.length,
    };
  }

  public reset(): void {
    this.events = [];
    this.playStartTime = null;
    this.pauseStartTime = null;
    this.bufferStartTime = null;
    this.bufferDurations = [];
  }
}
