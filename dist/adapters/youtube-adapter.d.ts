import { VideoPlayerAdapter, PlayerType, VideoQuality, YouTubePlayer } from '../types';
/**
 * YouTube Player adapter for the video tracker
 * @see https://developers.google.com/youtube/iframe_api_reference
 */
export declare class YouTubeAdapter implements VideoPlayerAdapter {
    readonly playerType = PlayerType.YOUTUBE;
    readonly element: YouTubePlayer;
    constructor(youtubePlayer: YouTubePlayer);
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
    private getQualityLabel;
    addEventListener(event: string, handler: Function): void;
    removeEventListener(event: string, handler: Function): void;
}
