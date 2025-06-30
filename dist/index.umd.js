(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.VideoTracker = {}));
})(this, (function (exports) { 'use strict';

    // Event types that the SDK can track
    exports.VideoEventType = void 0;
    (function (VideoEventType) {
        VideoEventType["PLAY"] = "play";
        VideoEventType["PAUSE"] = "pause";
        VideoEventType["SEEK"] = "seek";
        VideoEventType["BUFFER_START"] = "bufferstart";
        VideoEventType["BUFFER_END"] = "bufferend";
        VideoEventType["QUALITY_CHANGE"] = "qualitychange";
        VideoEventType["VOLUME_CHANGE"] = "volumechange";
        VideoEventType["FULLSCREEN_CHANGE"] = "fullscreenchange";
        VideoEventType["ERROR"] = "error";
        VideoEventType["ENDED"] = "ended";
        VideoEventType["PROGRESS"] = "progress";
        VideoEventType["DURATION_CHANGE"] = "durationchange";
    })(exports.VideoEventType || (exports.VideoEventType = {}));
    // Supported video player types
    exports.PlayerType = void 0;
    (function (PlayerType) {
        PlayerType["HTML5"] = "html5";
        PlayerType["VIDEO_JS"] = "videojs";
        PlayerType["JW_PLAYER"] = "jwplayer";
        PlayerType["SHAKA_PLAYER"] = "shaka";
        PlayerType["HLS_JS"] = "hlsjs";
        PlayerType["CUSTOM"] = "custom";
    })(exports.PlayerType || (exports.PlayerType = {}));

    class HTML5VideoAdapter {
        constructor(videoElement) {
            this.playerType = exports.PlayerType.HTML5;
            this.element = videoElement;
        }
        getCurrentTime() {
            return this.element.currentTime;
        }
        getDuration() {
            return this.element.duration || 0;
        }
        getVolume() {
            return this.element.volume;
        }
        isMuted() {
            return this.element.muted;
        }
        isPaused() {
            return this.element.paused;
        }
        isSeeking() {
            return this.element.seeking;
        }
        isBuffering() {
            // Check if we're waiting for data
            return (this.element.readyState < HTMLMediaElement.HAVE_FUTURE_DATA &&
                !this.element.paused);
        }
        isFullscreen() {
            const doc = document;
            return (doc.fullscreenElement === this.element ||
                doc.webkitFullscreenElement === this.element ||
                doc.mozFullScreenElement === this.element ||
                doc.msFullscreenElement === this.element);
        }
        getVideoSrc() {
            return this.element.currentSrc || this.element.src || '';
        }
        getQuality() {
            // For HTML5 video, we try to get quality from the video track if available
            const videoTracks = this.element
                .videoTracks;
            if (videoTracks && videoTracks.length > 0) {
                const track = videoTracks[0];
                return {
                    width: this.element.videoWidth,
                    height: this.element.videoHeight,
                    bitrate: 0, // Not available in HTML5 video API
                    level: track.label || 'auto',
                };
            }
            // Fallback to video dimensions
            if (this.element.videoWidth && this.element.videoHeight) {
                return {
                    width: this.element.videoWidth,
                    height: this.element.videoHeight,
                    bitrate: 0,
                    level: 'auto',
                };
            }
            return null;
        }
        addEventListener(event, handler) {
            this.element.addEventListener(event, handler);
        }
        removeEventListener(event, handler) {
            this.element.removeEventListener(event, handler);
        }
        // Helper method to get buffered time ranges
        getBufferedTimeRanges() {
            const buffered = this.element.buffered;
            const ranges = [];
            for (let i = 0; i < buffered.length; i++) {
                ranges.push({
                    start: buffered.start(i),
                    end: buffered.end(i),
                });
            }
            return ranges;
        }
        // Helper method to get the current buffer info
        getCurrentBufferInfo() {
            const currentTime = this.getCurrentTime();
            const buffered = this.element.buffered;
            let bufferStart = 0;
            let bufferEnd = 0;
            // Find the buffer range that contains the current time
            for (let i = 0; i < buffered.length; i++) {
                if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
                    bufferStart = buffered.start(i);
                    bufferEnd = buffered.end(i);
                    break;
                }
            }
            return {
                bufferStart,
                bufferEnd,
                bufferLength: bufferEnd - bufferStart,
            };
        }
    }

    class VideoTracker {
        constructor(adapter, config = {}) {
            var _a, _b, _c;
            this.progressTimer = null;
            this.lastProgressTime = 0;
            this.lastQuality = null;
            this.eventHandlers = new Map();
            this.adapter = adapter;
            this.config = {
                sessionId: config.sessionId || this.generateSessionId(),
                autoTrack: (_a = config.autoTrack) !== null && _a !== void 0 ? _a : true,
                progressInterval: (_b = config.progressInterval) !== null && _b !== void 0 ? _b : 10,
                onEvent: config.onEvent || (() => { }),
                debug: (_c = config.debug) !== null && _c !== void 0 ? _c : false,
                metadata: config.metadata || {},
            };
            if (this.config.autoTrack) {
                this.attachEventListeners();
            }
            this.startProgressTracking();
        }
        generateSessionId() {
            return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        getBaseEventData() {
            return {
                timestamp: Date.now(),
                currentTime: this.adapter.getCurrentTime(),
                duration: this.adapter.getDuration(),
                volume: this.adapter.getVolume(),
                muted: this.adapter.isMuted(),
                paused: this.adapter.isPaused(),
                seeking: this.adapter.isSeeking(),
                buffering: this.adapter.isBuffering(),
                fullscreen: this.adapter.isFullscreen(),
                videoSrc: this.adapter.getVideoSrc(),
                sessionId: this.config.sessionId,
                ...this.config.metadata,
            };
        }
        emitEvent(type, data) {
            const event = { type, data };
            if (this.config.debug) {
                console.log('[VideoTracker]', event);
            }
            this.config.onEvent(event);
        }
        attachEventListeners() {
            // Play event
            const playHandler = () => {
                this.emitEvent(exports.VideoEventType.PLAY, this.getBaseEventData());
            };
            this.adapter.addEventListener('play', playHandler);
            this.eventHandlers.set('play', playHandler);
            // Pause event
            const pauseHandler = () => {
                this.emitEvent(exports.VideoEventType.PAUSE, this.getBaseEventData());
            };
            this.adapter.addEventListener('pause', pauseHandler);
            this.eventHandlers.set('pause', pauseHandler);
            // Seek events
            const seekingHandler = () => {
                this.lastProgressTime = this.adapter.getCurrentTime();
            };
            this.adapter.addEventListener('seeking', seekingHandler);
            this.eventHandlers.set('seeking', seekingHandler);
            const seekedHandler = () => {
                const seekData = {
                    ...this.getBaseEventData(),
                    fromTime: this.lastProgressTime,
                    toTime: this.adapter.getCurrentTime(),
                };
                this.emitEvent(exports.VideoEventType.SEEK, seekData);
            };
            this.adapter.addEventListener('seeked', seekedHandler);
            this.eventHandlers.set('seeked', seekedHandler);
            // Buffer events
            const waitingHandler = () => {
                const bufferData = {
                    ...this.getBaseEventData(),
                    bufferLength: 0,
                    bufferStart: 0,
                    bufferEnd: 0,
                };
                if (this.adapter instanceof HTML5VideoAdapter) {
                    const bufferInfo = this.adapter.getCurrentBufferInfo();
                    bufferData.bufferLength = bufferInfo.bufferLength;
                    bufferData.bufferStart = bufferInfo.bufferStart;
                    bufferData.bufferEnd = bufferInfo.bufferEnd;
                }
                this.emitEvent(exports.VideoEventType.BUFFER_START, bufferData);
            };
            this.adapter.addEventListener('waiting', waitingHandler);
            this.eventHandlers.set('waiting', waitingHandler);
            const canplayHandler = () => {
                const bufferData = {
                    ...this.getBaseEventData(),
                    bufferLength: 0,
                    bufferStart: 0,
                    bufferEnd: 0,
                };
                if (this.adapter instanceof HTML5VideoAdapter) {
                    const bufferInfo = this.adapter.getCurrentBufferInfo();
                    bufferData.bufferLength = bufferInfo.bufferLength;
                    bufferData.bufferStart = bufferInfo.bufferStart;
                    bufferData.bufferEnd = bufferInfo.bufferEnd;
                }
                this.emitEvent(exports.VideoEventType.BUFFER_END, bufferData);
            };
            this.adapter.addEventListener('canplay', canplayHandler);
            this.eventHandlers.set('canplay', canplayHandler);
            // Volume change
            const volumeChangeHandler = () => {
                this.emitEvent(exports.VideoEventType.VOLUME_CHANGE, this.getBaseEventData());
            };
            this.adapter.addEventListener('volumechange', volumeChangeHandler);
            this.eventHandlers.set('volumechange', volumeChangeHandler);
            // Fullscreen change (for HTML5)
            if (this.adapter.element instanceof HTMLVideoElement) {
                const fullscreenChangeHandler = () => {
                    this.emitEvent(exports.VideoEventType.FULLSCREEN_CHANGE, this.getBaseEventData());
                };
                document.addEventListener('fullscreenchange', fullscreenChangeHandler);
                document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
                document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
                document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
                this.eventHandlers.set('fullscreenchange', fullscreenChangeHandler);
            }
            // Error events
            const errorHandler = (event) => {
                var _a, _b, _c, _d;
                const errorData = {
                    ...this.getBaseEventData(),
                    errorCode: ((_b = (_a = event.target) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.code) || 0,
                    errorMessage: ((_d = (_c = event.target) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Unknown error',
                    errorType: event.type || 'error',
                };
                this.emitEvent(exports.VideoEventType.ERROR, errorData);
            };
            this.adapter.addEventListener('error', errorHandler);
            this.eventHandlers.set('error', errorHandler);
            // Ended event
            const endedHandler = () => {
                this.emitEvent(exports.VideoEventType.ENDED, this.getBaseEventData());
            };
            this.adapter.addEventListener('ended', endedHandler);
            this.eventHandlers.set('ended', endedHandler);
            // Duration change
            const durationChangeHandler = () => {
                this.emitEvent(exports.VideoEventType.DURATION_CHANGE, this.getBaseEventData());
            };
            this.adapter.addEventListener('durationchange', durationChangeHandler);
            this.eventHandlers.set('durationchange', durationChangeHandler);
        }
        startProgressTracking() {
            if (this.progressTimer) {
                clearInterval(this.progressTimer);
            }
            this.progressTimer = window.setInterval(() => {
                if (!this.adapter.isPaused() && !this.adapter.isSeeking()) {
                    const currentTime = this.adapter.getCurrentTime();
                    const duration = this.adapter.getDuration();
                    if (duration > 0) {
                        const progressData = {
                            ...this.getBaseEventData(),
                            percentComplete: (currentTime / duration) * 100,
                            bytesLoaded: 0, // Would need to be implemented by specific adapters
                            bytesTotal: 0, // Would need to be implemented by specific adapters
                        };
                        this.emitEvent(exports.VideoEventType.PROGRESS, progressData);
                    }
                    // Check for quality changes
                    const currentQuality = this.adapter.getQuality();
                    if (currentQuality &&
                        !this.qualitiesEqual(currentQuality, this.lastQuality)) {
                        const qualityData = {
                            ...this.getBaseEventData(),
                            previousQuality: this.lastQuality,
                            currentQuality,
                        };
                        this.emitEvent(exports.VideoEventType.QUALITY_CHANGE, qualityData);
                        this.lastQuality = currentQuality;
                    }
                }
            }, this.config.progressInterval * 1000);
        }
        qualitiesEqual(q1, q2) {
            if (!q1 && !q2)
                return true;
            if (!q1 || !q2)
                return false;
            return (q1.width === q2.width &&
                q1.height === q2.height &&
                q1.bitrate === q2.bitrate);
        }
        trackEvent(type, customData) {
            const baseData = this.getBaseEventData();
            const eventData = { ...baseData, ...customData };
            this.emitEvent(type, eventData);
        }
        updateConfig(newConfig) {
            this.config = { ...this.config, ...newConfig };
        }
        getSessionId() {
            return this.config.sessionId;
        }
        destroy() {
            // Clear progress timer
            if (this.progressTimer) {
                clearInterval(this.progressTimer);
                this.progressTimer = null;
            }
            // Remove all event listeners
            this.eventHandlers.forEach((handler, event) => {
                if (event === 'fullscreenchange') {
                    document.removeEventListener('fullscreenchange', handler);
                    document.removeEventListener('webkitfullscreenchange', handler);
                    document.removeEventListener('mozfullscreenchange', handler);
                    document.removeEventListener('MSFullscreenChange', handler);
                }
                else {
                    this.adapter.removeEventListener(event, handler);
                }
            });
            this.eventHandlers.clear();
        }
    }

    // Helper function to create a tracker with HTML5 video
    function createHTML5Tracker(videoElement, config) {
        const adapter = new HTML5VideoAdapter(videoElement);
        return new VideoTracker(adapter, config);
    }

    exports.HTML5VideoAdapter = HTML5VideoAdapter;
    exports.VideoTracker = VideoTracker;
    exports.createHTML5Tracker = createHTML5Tracker;

}));
