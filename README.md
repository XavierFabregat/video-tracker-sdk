# Video Tracker SDK

Professional video event tracking SDK for monitoring video player metrics and user engagement across multiple video platforms.

[![npm version](https://badge.fury.io/js/video-tracker-sdk.svg)](https://www.npmjs.com/package/video-tracker-sdk)
[![CircleCI](https://circleci.com/gh/XavierFabregat/video-tracker-sdk.svg?style=svg)](https://circleci.com/gh/XavierFabregat/video-tracker-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Features

- 🎯 **Universal Compatibility** - Works with HTML5 video, Video.js, and extensible to other players
- 📊 **Comprehensive Analytics** - Track play, pause, seek, buffer, quality changes, and more
- 🔄 **Real-time Events** - Instant event tracking with customizable intervals
- 📈 **Engagement Metrics** - Built-in analytics for completion rates and engagement scores
- 🎛️ **Flexible Configuration** - Highly customizable with metadata support
- 🔒 **TypeScript Support** - Full type definitions included
- 🧪 **Well Tested** - Comprehensive test suite with Jest
- 📦 **Multiple Formats** - CommonJS, ES Modules, and UMD builds

## Installation

```bash
npm install video-tracker-sdk
```

## Quick Start

### HTML5 Video

```javascript
import { createHTML5Tracker } from 'video-tracker-sdk';

const videoElement = document.getElementById('my-video');

const tracker = createHTML5Tracker(videoElement, {
  sessionId: 'unique-session-id',
  onEvent: (event) => {
    console.log(`Event: ${event.type}`, event.data);
    // Send to your analytics service
    analytics.track(event);
  },
  metadata: {
    userId: 'user-123',
    contentId: 'video-456',
    platform: 'web',
  },
});

// Tracker automatically starts monitoring
// Remember to clean up when done
// tracker.destroy();
```

### Video.js Integration

```javascript
import { VideoTracker } from 'video-tracker-sdk';
import { VideoJSAdapter } from 'video-tracker-sdk';

const videojsPlayer = videojs('my-video');
const adapter = new VideoJSAdapter(videojsPlayer);

const tracker = new VideoTracker(adapter, {
  progressInterval: 10, // Track progress every 10 seconds
  debug: true,
  onEvent: (event) => {
    // Handle events
  },
});
```

## Event Types

The SDK tracks the following video events:

| Event              | Description                   | Additional Data                          |
| ------------------ | ----------------------------- | ---------------------------------------- |
| `play`             | Video playback started        | -                                        |
| `pause`            | Video playback paused         | -                                        |
| `seek`             | User seeked to different time | `fromTime`, `toTime`                     |
| `bufferstart`      | Video started buffering       | Buffer info                              |
| `bufferend`        | Video finished buffering      | Buffer info                              |
| `qualitychange`    | Video quality changed         | `previousQuality`, `currentQuality`      |
| `volumechange`     | Volume level changed          | -                                        |
| `fullscreenchange` | Fullscreen mode toggled       | -                                        |
| `error`            | Video error occurred          | `errorCode`, `errorMessage`, `errorType` |
| `ended`            | Video playback completed      | -                                        |
| `progress`         | Periodic progress update      | `percentComplete`, `bytesLoaded`         |
| `durationchange`   | Video duration changed        | -                                        |

## Configuration Options

```typescript
interface VideoTrackerConfig {
  // Unique identifier for tracking session
  sessionId?: string;

  // Enable automatic event tracking (default: true)
  autoTrack?: boolean;

  // Progress tracking interval in seconds (default: 10)
  progressInterval?: number;

  // Event handler function
  onEvent?: (event: VideoEvent) => void;

  // Enable debug logging (default: false)
  debug?: boolean;

  // Custom metadata to include with all events
  metadata?: Record<string, any>;
}
```

## Event Data Structure

Every event includes comprehensive data:

```typescript
interface BaseEventData {
  timestamp: number; // Event timestamp
  currentTime: number; // Video current time
  duration: number; // Video total duration
  volume: number; // Current volume (0-1)
  muted: boolean; // Is muted
  paused: boolean; // Is paused
  seeking: boolean; // Is seeking
  buffering: boolean; // Is buffering
  fullscreen: boolean; // Is fullscreen
  videoSrc: string; // Video source URL
  sessionId: string; // Session identifier
  // ... plus any custom metadata
}
```

## Analytics Utilities

Built-in analytics for engagement metrics:

```javascript
import { EventAnalytics } from 'video-tracker-sdk';

const analytics = new EventAnalytics();

// Add events as they occur
tracker.updateConfig({
  onEvent: (event) => {
    analytics.addEvent(event);
  },
});

// Get analytics summary
const summary = analytics.getAnalytics();
console.log(summary);
// {
//   totalPlayTime: 120000,      // ms
//   seekCount: 3,
//   bufferCount: 1,
//   completionRate: 85.5,       // %
//   engagementScore: 78.2,      // 0-100
//   qualityChanges: 2,
//   errors: 0
// }
```

## Advanced Usage

### Manual Event Tracking

```javascript
// Track custom events
tracker.trackEvent('play', {
  customField: 'manual-trigger',
  source: 'api-call',
});
```

### Multiple Video Players

```javascript
const trackers = [];

document.querySelectorAll('video').forEach((video, index) => {
  const tracker = createHTML5Tracker(video, {
    sessionId: `session-${index}`,
    metadata: { videoIndex: index },
    onEvent: (event) => {
      // Centralized event handling
      sendToAnalytics(event);
    },
  });

  trackers.push(tracker);
});

// Cleanup all trackers
const cleanup = () => {
  trackers.forEach((tracker) => tracker.destroy());
};
```

### Custom Video Player Adapter

```typescript
import { VideoPlayerAdapter, PlayerType } from 'video-tracker-sdk';

class CustomPlayerAdapter implements VideoPlayerAdapter {
  playerType = PlayerType.CUSTOM;
  element: any;

  constructor(customPlayer: any) {
    this.element = customPlayer;
  }

  getCurrentTime(): number {
    return this.element.getCurrentTime();
  }

  // Implement other required methods...
}

const adapter = new CustomPlayerAdapter(myCustomPlayer);
const tracker = new VideoTracker(adapter, config);
```

## Supported Video Players

- ✅ **HTML5 Video** - Native HTML5 `<video>` elements
- ✅ **Video.js** - Popular HTML5 video player
- 🔄 **JW Player** - Coming soon
- 🔄 **Shaka Player** - Coming soon
- 🔄 **HLS.js** - Coming soon
- 🔄 **Custom Players** - Extensible adapter system

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- iOS Safari 12+
- Android Chrome 60+

## API Reference

### VideoTracker

#### Methods

- `constructor(adapter, config)` - Create new tracker instance
- `trackEvent(type, customData?)` - Manually track an event
- `updateConfig(newConfig)` - Update tracker configuration
- `getSessionId()` - Get current session ID
- `destroy()` - Clean up resources and stop tracking

#### Static Methods

- `createHTML5Tracker(videoElement, config?)` - Quick HTML5 setup

### Adapters

#### HTML5VideoAdapter

- `constructor(videoElement)` - Create HTML5 adapter
- `getCurrentBufferInfo()` - Get detailed buffer information
- `getBufferedTimeRanges()` - Get all buffered time ranges

#### VideoJSAdapter

- `constructor(videojsPlayer)` - Create Video.js adapter

## Examples

Check out the `examples/` directory for:

- Basic HTML5 integration
- Video.js setup
- Complete dashboard with real-time analytics
- Multiple video tracking

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Start development build
npm run dev
```

## Continuous Integration

This project uses CircleCI for continuous integration. On every push and pull request, the following checks run:

- **Tests**: Full test suite with coverage reporting
- **Linting**: ESLint code quality checks
- **Build**: Verify the library builds successfully
- **Package Testing**: Ensure the npm package can be installed and imported

All checks must pass before merging to the main branch.

## Testing

The SDK includes comprehensive tests:

```bash
# Run all tests
npm test

# Run with coverage
npm run test -- --coverage

# Test specific file
npm test -- html5-adapter.test.ts
```

## TypeScript

Full TypeScript support with exported types:

```typescript
import {
  VideoTracker,
  VideoEvent,
  VideoEventType,
  VideoTrackerConfig,
  VideoPlayerAdapter,
  BaseEventData,
} from 'video-tracker-sdk';
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] JW Player adapter
- [ ] Shaka Player adapter
- [ ] HLS.js adapter
- [ ] React/Vue component wrappers
- [ ] Real-time dashboard component
- [ ] Advanced analytics (heatmaps, drop-off points)
- [ ] A/B testing utilities
- [ ] CDN distribution

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: xavi.fabregat.pous@gmail.com
- 🐛 [Issues](https://github.com/XavierFabregat/video-tracker-sdk/issues)
- 💬 [Discussions](https://github.com/XavierFabregat/video-tracker-sdk/discussions)

---

Made with ❤️ by [Xavier Fabregat](https://github.com/XavierFabregat)
