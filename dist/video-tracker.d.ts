import { VideoEventType, VideoEventData, VideoTrackerConfig, VideoPlayerAdapter } from './types';
export declare class VideoTracker {
    private adapter;
    private config;
    private progressTimer;
    private lastProgressTime;
    private lastQuality;
    private eventHandlers;
    constructor(adapter: VideoPlayerAdapter, config?: VideoTrackerConfig);
    private generateSessionId;
    private getBaseEventData;
    private emitEvent;
    private attachEventListeners;
    private startProgressTracking;
    private qualitiesEqual;
    trackEvent(type: VideoEventType, customData?: Partial<VideoEventData>): void;
    updateConfig(newConfig: Partial<VideoTrackerConfig>): void;
    getSessionId(): string;
    destroy(): void;
}
