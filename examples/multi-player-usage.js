/**
 * Multi-Player Usage Example
 *
 * This example demonstrates how to use the Video Tracker SDK with
 * different video player libraries (HTML5, Video.js, Plyr, JW Player, Vimeo, YouTube).
 *
 * Note: This example assumes you have the respective player libraries loaded.
 * The global variables (videojs, Plyr, jwplayer, Vimeo, YT, gtag) are expected
 * to be available from their respective libraries.
 */

/* eslint-disable no-undef */

import {
  VideoTracker,
  HTML5VideoAdapter,
  VideoJSAdapter,
  PlyrAdapter,
  JWPlayerAdapter,
  VimeoAdapter,
  YouTubeAdapter,
  createHTML5Tracker,
  VideoEventType,
} from '../dist/index.js';

// Common event handler for all players
function handleVideoEvent(event) {
  console.log(`[${event.data.sessionId}] ${event.type}:`, {
    currentTime: event.data.currentTime,
    duration: event.data.duration,
    quality: event.data.quality,
    playerType: event.data.playerType,
  });
}

// Example 1: HTML5 Video Player
function setupHTML5Player() {
  const videoElement = document.getElementById('html5-video');

  // Method 1: Using the helper function
  const tracker1 = createHTML5Tracker(videoElement, {
    onEvent: handleVideoEvent,
    debug: true,
    sessionId: 'html5-session-1',
  });

  // Method 2: Using adapter directly
  const adapter = new HTML5VideoAdapter(videoElement);
  const tracker2 = new VideoTracker(adapter, {
    onEvent: handleVideoEvent,
    progressInterval: 5, // Report progress every 5 seconds
    sessionId: 'html5-session-2',
  });

  return [tracker1, tracker2];
}

// Example 2: Video.js Player
function setupVideoJSPlayer() {
  // Assuming you have videojs initialized
  const player = videojs('videojs-player');

  const adapter = new VideoJSAdapter(player);
  const tracker = new VideoTracker(adapter, {
    onEvent: handleVideoEvent,
    autoTrack: true,
    sessionId: 'videojs-session',
  });

  return tracker;
}

// Example 3: Plyr Player
function setupPlyrPlayer() {
  // Assuming you have Plyr initialized
  const player = new Plyr('#plyr-player');

  const adapter = new PlyrAdapter(player);
  const tracker = new VideoTracker(adapter, {
    onEvent: handleVideoEvent,
    progressInterval: 10,
    sessionId: 'plyr-session',
  });

  return tracker;
}

// Example 4: JW Player
function setupJWPlayer() {
  // Assuming you have JW Player initialized
  const player = jwplayer('jwplayer-container');

  const adapter = new JWPlayerAdapter(player);
  const tracker = new VideoTracker(adapter, {
    onEvent: handleVideoEvent,
    sessionId: 'jwplayer-session',
  });

  return tracker;
}

// Example 5: Vimeo Player
function setupVimeoPlayer() {
  // Assuming you have Vimeo Player initialized
  const player = new Vimeo.Player('vimeo-player');

  const adapter = new VimeoAdapter(player);
  const tracker = new VideoTracker(adapter, {
    onEvent: handleVideoEvent,
    sessionId: 'vimeo-session',
  });

  return tracker;
}

// Example 6: YouTube Player
function setupYouTubePlayer() {
  // Assuming you have YouTube Player initialized
  const player = new YT.Player('youtube-player', {
    videoId: 'dQw4w9WgXcQ',
    events: {
      onReady: onPlayerReady,
    },
  });

  function onPlayerReady(event) {
    const adapter = new YouTubeAdapter(event.target);
    const tracker = new VideoTracker(adapter, {
      onEvent: handleVideoEvent,
      sessionId: 'youtube-session',
    });

    // Store tracker for cleanup
    window.youtubeTracker = tracker;
  }

  return player;
}

// Example 7: Advanced Usage with Custom Analytics
function setupAdvancedTracking() {
  const videoElement = document.getElementById('advanced-video');
  const tracker = createHTML5Tracker(videoElement, {
    onEvent: (event) => {
      // Custom analytics processing
      switch (event.type) {
        case VideoEventType.PLAY:
          console.log('▶️ Video started playing');
          break;

        case VideoEventType.PAUSE:
          console.log('⏸️ Video paused');
          break;

        case VideoEventType.QUALITY_CHANGE:
          console.log('🎯 Quality changed:', event.data.currentQuality);
          break;

        case VideoEventType.BUFFER_START:
          console.log('⏳ Buffering started');
          break;

        case VideoEventType.BUFFER_END:
          console.log('✅ Buffering ended');
          break;

        case VideoEventType.SEEK:
          console.log(
            `⏩ Seeked from ${event.data.fromTime}s to ${event.data.toTime}s`
          );
          break;

        case VideoEventType.ERROR:
          console.error('❌ Video error:', event.data.errorMessage);
          break;

        case VideoEventType.ENDED:
          console.log('🎬 Video ended');
          break;
      }

      // Send to analytics service
      sendToAnalytics(event);
    },
    debug: true,
    sessionId: 'advanced-session',
  });

  return tracker;
}

// Example analytics service integration
function sendToAnalytics(event) {
  // Example: Send to Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', event.type, {
      event_category: 'video',
      event_label: event.data.videoSrc,
      value: Math.round(event.data.currentTime),
      custom_map: {
        dimension1: event.data.sessionId,
        dimension2: event.data.quality?.level || 'unknown',
      },
    });
  }

  // Example: Send to custom analytics endpoint
  fetch('/api/video-analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: event.type,
      timestamp: event.data.timestamp,
      sessionId: event.data.sessionId,
      currentTime: event.data.currentTime,
      duration: event.data.duration,
      quality: event.data.quality,
      videoSrc: event.data.videoSrc,
    }),
  }).catch((error) => {
    console.error('Analytics error:', error);
  });
}

// Initialize all players when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  const trackers = [];

  // Initialize different players
  if (document.getElementById('html5-video')) {
    trackers.push(...setupHTML5Player());
  }

  if (document.getElementById('videojs-player')) {
    trackers.push(setupVideoJSPlayer());
  }

  if (document.getElementById('plyr-player')) {
    trackers.push(setupPlyrPlayer());
  }

  if (document.getElementById('jwplayer-container')) {
    trackers.push(setupJWPlayer());
  }

  if (document.getElementById('vimeo-player')) {
    trackers.push(setupVimeoPlayer());
  }

  if (document.getElementById('youtube-player')) {
    trackers.push(setupYouTubePlayer());
  }

  if (document.getElementById('advanced-video')) {
    trackers.push(setupAdvancedTracking());
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', function () {
    trackers.forEach((tracker) => {
      if (tracker && typeof tracker.destroy === 'function') {
        tracker.destroy();
      }
    });

    // Clean up YouTube tracker if it exists
    if (window.youtubeTracker) {
      window.youtubeTracker.destroy();
    }
  });

  console.log(`Initialized ${trackers.length} video trackers`);
});

export {
  setupHTML5Player,
  setupVideoJSPlayer,
  setupPlyrPlayer,
  setupJWPlayer,
  setupVimeoPlayer,
  setupYouTubePlayer,
  setupAdvancedTracking,
};
