import { VideoPlayerAdapter, PlayerType, VideoQuality, JWPlayer } from '../types';
/**
 * JW Player adapter for the video tracker
 * @see https://www.jwplayer.com/
 */
export declare class JWPlayerAdapter implements VideoPlayerAdapter {
    readonly playerType = PlayerType.JW_PLAYER;
    readonly element: JWPlayer;
    constructor(jwPlayer: JWPlayer);
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
