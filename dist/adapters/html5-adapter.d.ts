import { VideoPlayerAdapter, PlayerType, VideoQuality } from '../types';
export declare class HTML5VideoAdapter implements VideoPlayerAdapter {
    readonly playerType = PlayerType.HTML5;
    readonly element: HTMLVideoElement;
    constructor(videoElement: HTMLVideoElement);
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
    getBufferedTimeRanges(): {
        start: number;
        end: number;
    }[];
    getCurrentBufferInfo(): {
        bufferStart: number;
        bufferEnd: number;
        bufferLength: number;
    };
}
