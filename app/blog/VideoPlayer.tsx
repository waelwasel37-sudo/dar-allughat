
'use client';

import { useState } from 'react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
    src: string;
}

const VideoPlayer = ({ src }: VideoPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = () => {
        setIsPlaying(true);
    };

    return (
        <div className={styles.videoContainer}>
            {!isPlaying ? (
                <div className={styles.thumbnailWrapper} onClick={handlePlay}>
                    <div className={styles.playButton}></div>
                    <p className={styles.playText}>تشغيل الفيديو</p>
                </div>
            ) : (
                <video src={src} controls autoPlay className={styles.videoPlayer}></video>
            )}
        </div>
    );
};

export default VideoPlayer;
