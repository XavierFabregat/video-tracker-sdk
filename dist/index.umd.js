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
        PlayerType["PLYR"] = "plyr";
        PlayerType["JW_PLAYER"] = "jwplayer";
        PlayerType["VIMEO"] = "vimeo";
        PlayerType["YOUTUBE"] = "youtube";
        PlayerType["SHAKA_PLAYER"] = "shaka";
        PlayerType["HLS_JS"] = "hlsjs";
        PlayerType["CUSTOM"] = "custom";
    })(exports.PlayerType || (exports.PlayerType = {}));
    // YouTube Player States
    exports.YouTubePlayerState = void 0;
    (function (YouTubePlayerState) {
        YouTubePlayerState[YouTubePlayerState["UNSTARTED"] = -1] = "UNSTARTED";
        YouTubePlayerState[YouTubePlayerState["ENDED"] = 0] = "ENDED";
        YouTubePlayerState[YouTubePlayerState["PLAYING"] = 1] = "PLAYING";
        YouTubePlayerState[YouTubePlayerState["PAUSED"] = 2] = "PAUSED";
        YouTubePlayerState[YouTubePlayerState["BUFFERING"] = 3] = "BUFFERING";
        YouTubePlayerState[YouTubePlayerState["CUED"] = 5] = "CUED";
    })(exports.YouTubePlayerState || (exports.YouTubePlayerState = {}));

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

    // Video.js adapter for the video tracker
    class VideoJSAdapter {
        constructor(videojsPlayer) {
            this.playerType = exports.PlayerType.VIDEO_JS;
            this.element = videojsPlayer;
            this.videoElement = videojsPlayer.el().querySelector('video');
        }
        getCurrentTime() {
            return this.element.currentTime() || 0;
        }
        getDuration() {
            return this.element.duration() || 0;
        }
        getVolume() {
            return this.element.volume();
        }
        isMuted() {
            return this.element.muted();
        }
        isPaused() {
            return this.element.paused();
        }
        isSeeking() {
            var _a;
            return ((_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.seeking) || false;
        }
        isBuffering() {
            var _a;
            const readyState = ((_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.readyState) || 0;
            return readyState < HTMLMediaElement.HAVE_FUTURE_DATA && !this.isPaused();
        }
        isFullscreen() {
            return this.element.isFullscreen();
        }
        getVideoSrc() {
            return this.element.currentSrc() || this.element.src() || '';
        }
        getQuality() {
            var _a, _b, _c, _d;
            // Video.js provides quality levels through plugins
            const qualityLevels = (_b = (_a = this.element).qualityLevels) === null || _b === void 0 ? void 0 : _b.call(_a);
            if (qualityLevels && qualityLevels.length > 0) {
                const currentLevel = qualityLevels[0];
                if (currentLevel) {
                    return {
                        width: currentLevel.width || 0,
                        height: currentLevel.height || 0,
                        bitrate: currentLevel.bitrate || 0,
                        level: currentLevel.label || 'auto',
                    };
                }
            }
            // Fallback to video element dimensions
            if (((_c = this.videoElement) === null || _c === void 0 ? void 0 : _c.videoWidth) && ((_d = this.videoElement) === null || _d === void 0 ? void 0 : _d.videoHeight)) {
                return {
                    width: this.videoElement.videoWidth,
                    height: this.videoElement.videoHeight,
                    bitrate: 0,
                    level: 'auto',
                };
            }
            return null;
        }
        addEventListener(event, handler) {
            this.element.on(event, handler);
        }
        removeEventListener(event, handler) {
            this.element.off(event, handler);
        }
    }

    /**
     * Plyr adapter for the video tracker
     * @see https://plyr.io/
     */
    class PlyrAdapter {
        constructor(plyrPlayer) {
            this.playerType = exports.PlayerType.PLYR;
            this.element = plyrPlayer;
        }
        getCurrentTime() {
            return this.element.currentTime || 0;
        }
        getDuration() {
            return this.element.duration || 0;
        }
        getVolume() {
            return this.element.volume || 0;
        }
        isMuted() {
            return this.element.muted || false;
        }
        isPaused() {
            return this.element.paused;
        }
        isSeeking() {
            return this.element.seeking || false;
        }
        isBuffering() {
            return this.element.buffering || false;
        }
        isFullscreen() {
            var _a;
            return ((_a = this.element.fullscreen) === null || _a === void 0 ? void 0 : _a.active) || false;
        }
        getVideoSrc() {
            var _a;
            return ((_a = this.element.source) === null || _a === void 0 ? void 0 : _a.src) || '';
        }
        getQuality() {
            const quality = this.element.quality;
            if (!quality) {
                // Fallback to media element dimensions
                const media = this.element.media;
                if ((media === null || media === void 0 ? void 0 : media.videoWidth) && (media === null || media === void 0 ? void 0 : media.videoHeight)) {
                    return {
                        width: media.videoWidth,
                        height: media.videoHeight,
                        bitrate: 0,
                        level: 'auto',
                    };
                }
                return null;
            }
            // Map Plyr quality to our VideoQuality interface
            const qualityMap = {
                2160: { width: 3840, height: 2160, label: '4K' },
                1440: { width: 2560, height: 1440, label: '1440p' },
                1080: { width: 1920, height: 1080, label: '1080p' },
                720: { width: 1280, height: 720, label: '720p' },
                480: { width: 854, height: 480, label: '480p' },
                360: { width: 640, height: 360, label: '360p' },
                240: { width: 426, height: 240, label: '240p' },
            };
            const qualityInfo = qualityMap[quality];
            if (qualityInfo) {
                return {
                    width: qualityInfo.width,
                    height: qualityInfo.height,
                    bitrate: 0,
                    level: qualityInfo.label,
                };
            }
            return {
                width: 0,
                height: 0,
                bitrate: 0,
                level: quality.toString(),
            };
        }
        addEventListener(event, handler) {
            this.element.on(event, handler);
        }
        removeEventListener(event, handler) {
            this.element.off(event, handler);
        }
    }

    /**
     * JW Player adapter for the video tracker
     * @see https://www.jwplayer.com/
     */
    class JWPlayerAdapter {
        constructor(jwPlayer) {
            this.playerType = exports.PlayerType.JW_PLAYER;
            this.element = jwPlayer;
        }
        getCurrentTime() {
            return this.element.getPosition() || 0;
        }
        getDuration() {
            return this.element.getDuration() || 0;
        }
        getVolume() {
            return this.element.getVolume() || 0;
        }
        isMuted() {
            return this.element.getMute() || false;
        }
        isPaused() {
            const state = this.element.getState();
            return state === 'paused' || state === 'idle';
        }
        isSeeking() {
            // JW Player doesn't have a direct seeking state
            // This would need to be tracked via state changes
            return false;
        }
        isBuffering() {
            const state = this.element.getState();
            return state === 'buffering' || state === 'loading';
        }
        isFullscreen() {
            return this.element.getFullscreen() || false;
        }
        getVideoSrc() {
            const playlistItem = this.element.getPlaylistItem();
            return (playlistItem === null || playlistItem === void 0 ? void 0 : playlistItem.file) || '';
        }
        getQuality() {
            try {
                const qualityLevels = this.element.getQualityLevels();
                const currentQuality = this.element.getCurrentQuality();
                if (qualityLevels && qualityLevels.length > 0 && currentQuality >= 0) {
                    const quality = qualityLevels[currentQuality];
                    if (quality) {
                        return {
                            width: quality.width || 0,
                            height: quality.height || 0,
                            bitrate: 0,
                            level: quality.label || 'auto',
                        };
                    }
                }
                return null;
            }
            catch (_a) {
                // JW Player might not have quality levels available
                return null;
            }
        }
        addEventListener(event, handler) {
            this.element.on(event, handler);
        }
        removeEventListener(event, handler) {
            this.element.off(event, handler);
        }
    }

    /**
     * Vimeo Player adapter for the video tracker
     * @see https://developer.vimeo.com/player/sdk
     */
    class VimeoAdapter {
        constructor(vimeoPlayer) {
            this.playerType = exports.PlayerType.VIMEO;
            // Cache for async values to provide synchronous access
            this._currentTime = 0;
            this._duration = 0;
            this._volume = 0;
            this._muted = false;
            this._paused = true;
            this._fullscreen = false;
            this._videoUrl = '';
            this._quality = null;
            this.element = vimeoPlayer;
            this.initializeCache();
        }
        /**
         * Initialize cached values from the async Vimeo API
         */
        async initializeCache() {
            try {
                this._currentTime = await this.element.getCurrentTime();
                this._duration = await this.element.getDuration();
                this._volume = await this.element.getVolume();
                this._muted = await this.element.getMuted();
                this._paused = await this.element.getPaused();
                this._fullscreen = await this.element.getFullscreen();
                this._videoUrl = await this.element.getVideoUrl();
                // Set up listeners to keep cache updated
                this.element.on('timeupdate', async () => {
                    this._currentTime = await this.element.getCurrentTime();
                });
                this.element.on('volumechange', async () => {
                    this._volume = await this.element.getVolume();
                    this._muted = await this.element.getMuted();
                });
                this.element.on('play', async () => {
                    this._paused = await this.element.getPaused();
                });
                this.element.on('pause', async () => {
                    this._paused = await this.element.getPaused();
                });
                this.element.on('fullscreenchange', async () => {
                    this._fullscreen = await this.element.getFullscreen();
                });
                // Parse quality from video URL or set default
                const qualityStr = await this.element.getVideoQuality();
                this._quality = this.parseQuality(qualityStr);
            }
            catch (error) {
                console.warn('Error initializing Vimeo adapter cache:', error);
            }
        }
        parseQuality(qualityStr) {
            const qualityMap = {
                '4K': { width: 3840, height: 2160 },
                '2K': { width: 2560, height: 1440 },
                '1080p': { width: 1920, height: 1080 },
                '720p': { width: 1280, height: 720 },
                '540p': { width: 960, height: 540 },
                '360p': { width: 640, height: 360 },
                '240p': { width: 426, height: 240 },
            };
            const quality = qualityMap[qualityStr];
            if (quality) {
                return {
                    width: quality.width,
                    height: quality.height,
                    bitrate: 0,
                    level: qualityStr,
                };
            }
            return {
                width: 0,
                height: 0,
                bitrate: 0,
                level: qualityStr || 'auto',
            };
        }
        getCurrentTime() {
            return this._currentTime;
        }
        getDuration() {
            return this._duration;
        }
        getVolume() {
            return this._volume;
        }
        isMuted() {
            return this._muted;
        }
        isPaused() {
            return this._paused;
        }
        isSeeking() {
            // Vimeo doesn't provide a direct seeking state
            // This would need to be tracked via events
            return false;
        }
        isBuffering() {
            // Vimeo doesn't provide a direct buffering state
            // This would need to be tracked via events
            return false;
        }
        isFullscreen() {
            return this._fullscreen;
        }
        getVideoSrc() {
            return this._videoUrl;
        }
        getQuality() {
            return this._quality;
        }
        addEventListener(event, handler) {
            this.element.on(event, handler);
        }
        removeEventListener(event, handler) {
            this.element.off(event, handler);
        }
    }

    /**
     * YouTube Player adapter for the video tracker
     * @see https://developers.google.com/youtube/iframe_api_reference
     */
    class YouTubeAdapter {
        constructor(youtubePlayer) {
            this.playerType = exports.PlayerType.YOUTUBE;
            this.element = youtubePlayer;
        }
        getCurrentTime() {
            return this.element.getCurrentTime() || 0;
        }
        getDuration() {
            return this.element.getDuration() || 0;
        }
        getVolume() {
            return this.element.getVolume() || 0;
        }
        isMuted() {
            return this.element.isMuted() || false;
        }
        isPaused() {
            const state = this.element.getPlayerState();
            return (state === exports.YouTubePlayerState.PAUSED ||
                state === exports.YouTubePlayerState.CUED ||
                state === exports.YouTubePlayerState.ENDED);
        }
        isSeeking() {
            // YouTube doesn't provide a direct seeking state
            // This would need to be tracked via state changes
            return false;
        }
        isBuffering() {
            const state = this.element.getPlayerState();
            return state === exports.YouTubePlayerState.BUFFERING;
        }
        isFullscreen() {
            // YouTube Player API doesn't provide direct fullscreen state
            // This would need to be tracked via document fullscreen APIs
            const doc = document;
            return (document.fullscreenElement !== null ||
                doc.webkitFullscreenElement !== null ||
                doc.mozFullScreenElement !== null ||
                doc.msFullscreenElement !== null);
        }
        getVideoSrc() {
            return this.element.getVideoUrl() || '';
        }
        getQuality() {
            const quality = this.element.getPlaybackQuality();
            if (!quality) {
                return null;
            }
            // Map YouTube quality levels to dimensions
            const qualityMap = {
                hd2160: { width: 3840, height: 2160 }, // 4K
                hd1440: { width: 2560, height: 1440 }, // 1440p
                hd1080: { width: 1920, height: 1080 }, // 1080p
                hd720: { width: 1280, height: 720 }, // 720p
                large: { width: 854, height: 480 }, // 480p
                medium: { width: 640, height: 360 }, // 360p
                small: { width: 426, height: 240 }, // 240p
                tiny: { width: 256, height: 144 }, // 144p
                auto: { width: 0, height: 0 }, // Auto quality
            };
            const qualityInfo = qualityMap[quality];
            if (qualityInfo) {
                return {
                    width: qualityInfo.width,
                    height: qualityInfo.height,
                    bitrate: 0,
                    level: this.getQualityLabel(quality),
                };
            }
            return {
                width: 0,
                height: 0,
                bitrate: 0,
                level: quality,
            };
        }
        getQualityLabel(quality) {
            const labelMap = {
                hd2160: '4K',
                hd1440: '1440p',
                hd1080: '1080p',
                hd720: '720p',
                large: '480p',
                medium: '360p',
                small: '240p',
                tiny: '144p',
                auto: 'Auto',
            };
            return labelMap[quality] || quality;
        }
        addEventListener(event, handler) {
            this.element.addEventListener(event, handler);
        }
        removeEventListener(event, handler) {
            this.element.removeEventListener(event, handler);
        }
    }

    class EventAnalytics {
        constructor() {
            this.events = [];
            this.playStartTime = null;
            this.pauseStartTime = null;
            this.bufferStartTime = null;
            this.bufferDurations = [];
        }
        addEvent(event) {
            this.events.push(event);
            this.updateTimers(event);
        }
        updateTimers(event) {
            const now = event.data.timestamp;
            switch (event.type) {
                case exports.VideoEventType.PLAY:
                    if (this.pauseStartTime) {
                        this.pauseStartTime = null;
                    }
                    this.playStartTime = now;
                    break;
                case exports.VideoEventType.PAUSE:
                    if (this.playStartTime) {
                        this.playStartTime = null;
                    }
                    this.pauseStartTime = now;
                    break;
                case exports.VideoEventType.BUFFER_START:
                    this.bufferStartTime = now;
                    break;
                case exports.VideoEventType.BUFFER_END:
                    if (this.bufferStartTime) {
                        this.bufferDurations.push(now - this.bufferStartTime);
                        this.bufferStartTime = null;
                    }
                    break;
            }
        }
        getAnalytics() {
            const playEvents = this.events.filter((e) => e.type === exports.VideoEventType.PLAY);
            const pauseEvents = this.events.filter((e) => e.type === exports.VideoEventType.PAUSE);
            const seekEvents = this.events.filter((e) => e.type === exports.VideoEventType.SEEK);
            const bufferStartEvents = this.events.filter((e) => e.type === exports.VideoEventType.BUFFER_START);
            const qualityChangeEvents = this.events.filter((e) => e.type === exports.VideoEventType.QUALITY_CHANGE);
            const errorEvents = this.events.filter((e) => e.type === exports.VideoEventType.ERROR);
            // Calculate total play and pause times
            let totalPlayTime = 0;
            let totalPauseTime = 0;
            for (let i = 0; i < Math.min(playEvents.length, pauseEvents.length); i++) {
                if (pauseEvents[i] && playEvents[i]) {
                    totalPlayTime +=
                        pauseEvents[i].data.timestamp - playEvents[i].data.timestamp;
                }
            }
            // Calculate completion rate
            const lastEvent = this.events[this.events.length - 1];
            const completionRate = (lastEvent === null || lastEvent === void 0 ? void 0 : lastEvent.data.duration) > 0
                ? (lastEvent.data.currentTime / lastEvent.data.duration) * 100
                : 0;
            // Calculate engagement score (simplified)
            const engagementScore = Math.min(100, (totalPlayTime / 1000 / 60) * 10 + // 10 points per minute watched
                (completionRate / 100) * 50 + // 50 points for completion
                Math.max(0, 25 - seekEvents.length * 2) // Penalty for excessive seeking
            );
            return {
                totalPlayTime,
                totalPauseTime,
                seekCount: seekEvents.length,
                bufferCount: bufferStartEvents.length,
                averageBufferDuration: this.bufferDurations.length > 0
                    ? this.bufferDurations.reduce((a, b) => a + b, 0) /
                        this.bufferDurations.length
                    : 0,
                completionRate,
                engagementScore,
                qualityChanges: qualityChangeEvents.length,
                errors: errorEvents.length,
            };
        }
        reset() {
            this.events = [];
            this.playStartTime = null;
            this.pauseStartTime = null;
            this.bufferStartTime = null;
            this.bufferDurations = [];
        }
    }

    // Helper function to create a tracker with HTML5 video
    function createHTML5Tracker(videoElement, config) {
        const adapter = new HTML5VideoAdapter(videoElement);
        return new VideoTracker(adapter, config);
    }

    exports.EventAnalytics = EventAnalytics;
    exports.HTML5VideoAdapter = HTML5VideoAdapter;
    exports.JWPlayerAdapter = JWPlayerAdapter;
    exports.PlyrAdapter = PlyrAdapter;
    exports.VideoJSAdapter = VideoJSAdapter;
    exports.VideoTracker = VideoTracker;
    exports.VimeoAdapter = VimeoAdapter;
    exports.YouTubeAdapter = YouTubeAdapter;
    exports.createHTML5Tracker = createHTML5Tracker;

}));
