import { VideoPlayerAdapter, PlayerType, VideoQuality, PlyrPlayer } from '../types';
/**
 * Plyr adapter for the video tracker
 * @see https://plyr.io/
 */
export declare class PlyrAdapter implements VideoPlayerAdapter {
    readonly playerType = PlayerType.PLYR;
    readonly element: PlyrPlayer;
    constructor(plyrPlayer: PlyrPlayer);
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
