import { VideoTracker } from './video-tracker';
import { HTML5VideoAdapter } from './adapters/html5-adapter';
import { VideoTrackerConfig } from './types';

// Main VideoTracker class
export { VideoTracker } from './video-tracker';

// Video player adapters
export { HTML5VideoAdapter } from './adapters/html5-adapter';
export { VideoJSAdapter } from './adapters/videojs-adapter';
export { PlyrAdapter } from './adapters/plyr-adapter';
export { JWPlayerAdapter } from './adapters/jwplayer-adapter';
export { VimeoAdapter } from './adapters/vimeo-adapter';
export { YouTubeAdapter } from './adapters/youtube-adapter';

// Analytics utilities
export { EventAnalytics } from './utils/event-analytics';

// Types and interfaces
export * from './types';

// Helper function to create a tracker with HTML5 video
export function createHTML5Tracker(
  videoElement: HTMLVideoElement,
  config?: VideoTrackerConfig
): VideoTracker {
  const adapter = new HTML5VideoAdapter(videoElement);
  return new VideoTracker(adapter, config);
}
