import { VideoPlayerAdapter, PlayerType, VideoQuality, VimeoPlayer } from '../types';
/**
 * Vimeo Player adapter for the video tracker
 * @see https://developer.vimeo.com/player/sdk
 */
export declare class VimeoAdapter implements VideoPlayerAdapter {
    readonly playerType = PlayerType.VIMEO;
    readonly element: VimeoPlayer;
    private _currentTime;
    private _duration;
    private _volume;
    private _muted;
    private _paused;
    private _fullscreen;
    private _videoUrl;
    private _quality;
    constructor(vimeoPlayer: VimeoPlayer);
    /**
     * Initialize cached values from the async Vimeo API
     */
    private initializeCache;
    private parseQuality;
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
