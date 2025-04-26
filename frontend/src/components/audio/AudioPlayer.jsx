import React, { useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { motion } from 'framer-motion';
// Using phosphor-react icons instead
import { Play, Pause, SkipBack, SkipForward, SpeakerHigh, SpeakerX, Gauge } from 'phosphor-react';
import { audioState, audioPlaybackRateState, currentTranscriptSelector } from '../../atoms/audioAtom';
import { AudioWaveCanvas } from './AudioWave';

const AudioPlayer = () => {
  const audioRef = useRef(null);
  const [audioData, setAudioData] = useRecoilState(audioState);
  const [playbackRate, setPlaybackRate] = useRecoilState(audioPlaybackRateState);
  const currentTranscript = useRecoilValue(currentTranscriptSelector);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  
  // Update audio element when audio source changes
  useEffect(() => {
    if (audioRef.current && audioData.audioSrc) {
      audioRef.current.src = audioData.audioSrc;
      audioRef.current.load();
      if (audioData.isPlaying) {
        audioRef.current.play();
      }
    }
  }, [audioData.audioSrc]);
  
  // Update play/pause state
  useEffect(() => {
    if (audioRef.current) {
      if (audioData.isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioData.isPlaying]);
  
  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  
  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioData(prev => ({
        ...prev,
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration || 0
      }));
    }
  };
  
  // Handle play/pause
  const togglePlayPause = () => {
    setAudioData(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  };
  
  // Handle seeking
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setAudioData(prev => ({
        ...prev,
        currentTime: seekTime
      }));
    }
  };
  
  // Handle mute toggle
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };
  
  // Cycle through playback speeds (0.75, 1, 1.25, 1.5, 2)
  const cyclePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };
  
  // Format time (seconds -> mm:ss)
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Skip forward/backward 10 seconds
  const skipForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
      audioRef.current.currentTime = newTime;
      setAudioData(prev => ({
        ...prev,
        currentTime: newTime
      }));
    }
  };
  
  const skipBackward = () => {
    if (audioRef.current) {
      const newTime = Math.max(0, audioRef.current.currentTime - 10);
      audioRef.current.currentTime = newTime;
      setAudioData(prev => ({
        ...prev,
        currentTime: newTime
      }));
    }
  };

  return (
    <div className="w-full bg-card rounded-xl p-4 shadow-lg">
      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setAudioData(prev => ({ ...prev, isPlaying: false }))}
        onLoadedMetadata={handleTimeUpdate}
      />
      
      {/* Transcript display */}
      <div className="h-20 mb-4 overflow-hidden flex items-center justify-center text-center">
        {currentTranscript ? (
          <motion.p
            key={currentTranscript.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-white text-lg"
          >
            {currentTranscript.text}
          </motion.p>
        ) : (
          <p className="text-text-secondary text-lg">No transcript available</p>
        )}
      </div>
      
      {/* Audio wave visualization */}
      <div className="mb-4">
        <AudioWaveCanvas isPlaying={audioData.isPlaying} color="#9BEB3D" />
      </div>
      
      {/* Progress bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={audioData.duration || 0}
          value={audioData.currentTime || 0}
          onChange={handleSeek}
          className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between mt-2 text-xs text-text-secondary">
          <span>{formatTime(audioData.currentTime)}</span>
          <span>{formatTime(audioData.duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleMute}
            className="p-2 rounded-full text-white hover:bg-secondary/30"
          >
            {isMuted ? <SpeakerX size={18} weight="bold" /> : <SpeakerHigh size={18} weight="bold" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={skipBackward}
            className="p-2 rounded-full text-white hover:bg-secondary/30"
          >
            <SkipBack size={20} weight="bold" />
          </button>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayPause}
            className="p-4 rounded-full bg-primary text-dark hover:bg-primary-dark"
          >
            {audioData.isPlaying ? <Pause size={24} weight="bold" /> : <Play size={24} weight="bold" />}
          </motion.button>
          
          <button 
            onClick={skipForward}
            className="p-2 rounded-full text-white hover:bg-secondary/30"
          >
            <SkipForward size={20} weight="bold" />
          </button>
        </div>
        
        <button 
          onClick={cyclePlaybackRate}
          className="flex items-center p-2 rounded-full text-white hover:bg-secondary/30"
        >
          <Gauge size={18} weight="bold" className="mr-1" />
          <span className="text-xs">{playbackRate}x</span>
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
