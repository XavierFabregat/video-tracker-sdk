import { VideoPlayerAdapter, PlayerType, VideoQuality, VideoJSPlayer } from '../types';
export declare class VideoJSAdapter implements VideoPlayerAdapter {
    readonly playerType = PlayerType.VIDEO_JS;
    readonly element: VideoJSPlayer;
    private videoElement;
    constructor(videojsPlayer: VideoJSPlayer);
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
