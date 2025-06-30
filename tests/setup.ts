// Jest setup file for video tracker tests

// Mock HTMLVideoElement for testing
globalThis.HTMLVideoElement = class MockHTMLVideoElement {
  currentTime = 0;
  duration = 100;
  volume = 1;
  muted = false;
  paused = true;
  seeking = false;
  readyState = 4; // HAVE_ENOUGH_DATA
  videoWidth = 1920;
  videoHeight = 1080;
  currentSrc = 'http://example.com/video.mp4';
  src = 'http://example.com/video.mp4';
  buffered = {
    length: 1,
    start: () => 0,
    end: () => 50,
  };

  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  play = jest.fn();
  pause = jest.fn();
} as any;

// Mock document.fullscreenElement
Object.defineProperty(document, 'fullscreenElement', {
  value: null,
  writable: true,
});

// Mock window.setInterval and clearInterval properly
Object.defineProperty(globalThis, 'setInterval', {
  value: jest.fn(() => 123), // Return a mock timer ID
  writable: true,
});

Object.defineProperty(globalThis, 'clearInterval', {
  value: jest.fn(),
  writable: true,
});
