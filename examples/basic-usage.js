// Basic usage example for the Video Tracker SDK

// This would typically be: import { createHTML5Tracker } from 'video-tracker-sdk';
const { createHTML5Tracker } = require('../dist/index.js');

// Create a simple HTML video element (in a real scenario this would be in HTML)
console.log('Video Tracker SDK - Basic Usage Example');
console.log('=====================================');

// Example configuration
const config = {
  sessionId: 'demo-session-123',
  autoTrack: true,
  progressInterval: 5, // Track progress every 5 seconds
  debug: true,
  onEvent: (event) => {
    console.log(`[${event.type}]`, {
      timestamp: new Date(event.data.timestamp).toISOString(),
      currentTime: event.data.currentTime.toFixed(2),
      duration: event.data.duration.toFixed(2),
      paused: event.data.paused,
      volume: event.data.volume,
    });
  },
  metadata: {
    userId: 'user-456',
    contentId: 'video-789',
    contentType: 'educational',
  },
};

console.log('Configuration:', config);
console.log('\nIn a real implementation, you would:');
console.log('1. Get a reference to your video element');
console.log(
  '2. Create the tracker: const tracker = createHTML5Tracker(videoElement, config);'
);
console.log('3. The tracker will automatically start monitoring events');
console.log('\nExample events you would see:');
console.log('- PLAY when video starts');
console.log('- PAUSE when video is paused');
console.log('- PROGRESS every 5 seconds during playback');
console.log('- SEEK when user skips to different time');
console.log('- ENDED when video completes');
console.log('- And many more...');
