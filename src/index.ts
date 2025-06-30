import { HTML5VideoAdapter } from './adapters/html5-adapter';
import { VideoTrackerConfig } from './types';
import { VideoTracker } from './video-tracker';

// Main exports
export { VideoTracker } from './video-tracker';

// Types
export {
  VideoEventType,
  VideoEvent,
  VideoEventData,
  BaseEventData,
  SeekEventData,
  QualityChangeEventData,
  BufferEventData,
  ErrorEventData,
  ProgressEventData,
  VideoTrackerConfig,
  VideoPlayerAdapter,
  VideoQuality,
  PlayerType,
} from './types';

// Adapters
export { HTML5VideoAdapter } from './adapters/html5-adapter';

// Helper function to create a tracker with HTML5 video
export function createHTML5Tracker(
  videoElement: HTMLVideoElement,
  config?: VideoTrackerConfig
): VideoTracker {
  const adapter = new HTML5VideoAdapter(videoElement);
  return new VideoTracker(adapter, config);
}
