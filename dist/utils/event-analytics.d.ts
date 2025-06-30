import { VideoEvent } from '../types';
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
export declare class EventAnalytics {
    private events;
    private playStartTime;
    private pauseStartTime;
    private bufferStartTime;
    private bufferDurations;
    addEvent(event: VideoEvent): void;
    private updateTimers;
    getAnalytics(): AnalyticsData;
    reset(): void;
}
