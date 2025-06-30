import { VideoTrackerConfig } from './types';
import { VideoTracker } from './video-tracker';
export { VideoTracker } from './video-tracker';
export { VideoEventType, VideoEvent, VideoEventData, BaseEventData, SeekEventData, QualityChangeEventData, BufferEventData, ErrorEventData, ProgressEventData, VideoTrackerConfig, VideoPlayerAdapter, VideoQuality, PlayerType, } from './types';
export { HTML5VideoAdapter } from './adapters/html5-adapter';
export declare function createHTML5Tracker(videoElement: HTMLVideoElement, config?: VideoTrackerConfig): VideoTracker;
