export declare enum VideoEventType {
    PLAY = "play",
    PAUSE = "pause",
    SEEK = "seek",
    BUFFER_START = "bufferstart",
    BUFFER_END = "bufferend",
    QUALITY_CHANGE = "qualitychange",
    VOLUME_CHANGE = "volumechange",
    FULLSCREEN_CHANGE = "fullscreenchange",
    ERROR = "error",
    ENDED = "ended",
    PROGRESS = "progress",
    DURATION_CHANGE = "durationchange"
}
export interface VideoQuality {
    width: number;
    height: number;
    bitrate: number;
    level?: string;
    label?: string;
}
export interface BaseEventData {
    timestamp: number;
    currentTime: number;
    duration: number;
    volume: number;
    muted: boolean;
    paused: boolean;
    seeking: boolean;
    buffering: boolean;
    fullscreen: boolean;
    videoSrc: string;
    sessionId: string;
}
export interface SeekEventData extends BaseEventData {
    fromTime: number;
    toTime: number;
}
export interface QualityChangeEventData extends BaseEventData {
    previousQuality: VideoQuality | null;
    currentQuality: VideoQuality;
}
export interface BufferEventData extends BaseEventData {
    bufferLength: number;
    bufferStart: number;
    bufferEnd: number;
}
export interface ErrorEventData extends BaseEventData {
    errorCode: number;
    errorMessage: string;
    errorType: string;
}
export interface ProgressEventData extends BaseEventData {
    percentComplete: number;
    bytesLoaded: number;
    bytesTotal: number;
}
export type VideoEventData = BaseEventData | SeekEventData | QualityChangeEventData | BufferEventData | ErrorEventData | ProgressEventData;
export interface VideoEvent {
    type: VideoEventType;
    data: VideoEventData;
}
export interface VideoTrackerConfig {
    sessionId?: string;
    autoTrack?: boolean;
    progressInterval?: number;
    onEvent?: (event: VideoEvent) => void;
    debug?: boolean;
    metadata?: Record<string, unknown>;
}
export declare enum PlayerType {
    HTML5 = "html5",
    VIDEO_JS = "videojs",
    JW_PLAYER = "jwplayer",
    SHAKA_PLAYER = "shaka",
    HLS_JS = "hlsjs",
    CUSTOM = "custom"
}
export interface VideoPlayerAdapter {
    playerType: PlayerType;
    element: HTMLVideoElement | VideoJSPlayer;
    getCurrentTime(): number;
    getDuration(): number;
    getVolume(): number;
    isMuted(): boolean;
    isPaused(): boolean;
    isSeeking(): boolean;
    isBuffering(): boolean;
    isFullscreen(): boolean;
    getVideoSrc(): string;
    getQuality(): VideoQuality | null;
    addEventListener(event: string, handler: Function): void;
    removeEventListener(event: string, handler: Function): void;
}
export interface VideoJSPlayer {
    currentTime(): number;
    duration(): number;
    volume(): number;
    muted(): boolean;
    paused(): boolean;
    isFullscreen(): boolean;
    currentSrc(): string;
    src(): string;
    el(): {
        querySelector(selector: string): HTMLVideoElement;
    };
    qualityLevels?(): VideoQuality[];
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
}
export interface MediaErrorEvent extends Event {
    target: HTMLMediaElement & {
        error: MediaError | null;
    };
}
