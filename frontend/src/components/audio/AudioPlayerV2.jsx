import React, { useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { motion } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, SpeakerHigh, SpeakerX, 
  Gauge, Bookmark, Share, ArrowsOutCardinal, ListBullets,
  Translate, MagicWand, Radio
} from 'phosphor-react';

import { 
  audioPlayerState, transcriptState, activeTranscriptSegmentSelector,
  activeVoiceSelector, recommendedElevenLabsVoiceSelector, recommendedPlayHtVoiceSelector 
} from '../../atoms/audioPlayerAtom';
import ttsService from '../../utils/ttsService';
import { formatTime, generateWaveformData } from '../../utils/audioUtils';
import AudioWaveform from './AudioWaveform';

const AudioPlayer = () => {
  // Refs
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const waveformRef = useRef(null);
  
  // Recoil state
  const [playerState, setPlayerState] = useRecoilState(audioPlayerState);
  const [transcriptData, setTranscriptData] = useRecoilState(transcriptState);
  const activeSegment = useRecoilValue(activeTranscriptSegmentSelector);
  
  // Local state
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  // Destructure player state for easier access
  const { 
    isPlaying, currentTime, duration, volume, speed, isMuted,
    bookId, chapterId, chapterTitle, bookTitle, bookGenre, coverImage, audioUrl,
    isElevenLabsEnabled, selectedVoiceId, waveformData
  } = playerState;

  // Update audio element when audio source changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      
      // Generate waveform data when audio is loaded
      audioRef.current.onloadedmetadata = () => {
        setPlayerState(prev => ({
          ...prev,
          duration: audioRef.current.duration || 0
        }));
        
        // Generate random waveform data for now
        // In a real app, you would analyze the actual audio
        generateWaveformData(null, 100).then(data => {
          setPlayerState(prev => ({
            ...prev,
            waveformData: data
          }));
        });
      };
      
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
        });
      }
    }
  }, [audioUrl, setPlayerState]);
  
  // Update play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, setPlayerState]);
  
  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);
  
  // Update volume and mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Get recommended voices based on book genre
  const recommendedElevenLabsVoice = useRecoilValue(recommendedElevenLabsVoiceSelector);
  const recommendedPlayHtVoice = useRecoilValue(recommendedPlayHtVoiceSelector);
  const activeVoice = useRecoilValue(activeVoiceSelector);
  
  // Check if TTS services are available
  const [ttsServicesStatus, setTtsServicesStatus] = useState({
    elevenlabs: false,
    playht: false
  });

  // Check available TTS services
  useEffect(() => {
    const checkTtsServices = () => {
      const hasElevenLabsKey = !!import.meta.env.VITE_ELEVEN_LABS_API_KEY;
      const isElevenLabsEnabled = import.meta.env.VITE_ENABLE_ELEVENLABS === 'true';
      const hasPlayHtKeys = !!import.meta.env.VITE_PLAYHT_SECRET_KEY && 
                          !!import.meta.env.VITE_PLAYHT_USER_KEY;
      
      setTtsServicesStatus({
        elevenlabs: hasElevenLabsKey && isElevenLabsEnabled,
        playht: hasPlayHtKeys
      });
      
      setPlayerState(prev => ({
        ...prev,
        isElevenLabsEnabled: hasElevenLabsKey && isElevenLabsEnabled,
        isPlayHtEnabled: hasPlayHtKeys
      }));
    };
    
    checkTtsServices();
  }, [setPlayerState]);
  
  // Generate audio using available TTS services
  const generateAudioFromTranscript = async () => {
    if (!transcriptData.transcript.length) return;
    if (!ttsServicesStatus.elevenlabs && !ttsServicesStatus.playht) {
      console.warn('No TTS services available');
      return;
    }
    
    try {
      setIsGeneratingAudio(true);
      setPlayerState(prev => ({ ...prev, isGeneratingAudio: true }));
      
      // Determine which service to use based on player state
      const preferredService = playerState.ttsService === 'auto' 
        ? (ttsServicesStatus.elevenlabs ? 'elevenlabs' : 'playht')
        : playerState.ttsService;
      
      // Get options for TTS generation
      const options = {
        preferredService,
        elevenLabsVoiceId: selectedVoiceId || recommendedElevenLabsVoice.id,
        playHtVoice: playerState.selectedPlayHtVoice || recommendedPlayHtVoice.id,
        genre: bookGenre || ''
      };
      
      // Generate audio using our utility service that handles both providers
      const result = await ttsService.generateFromTranscript(transcriptData.transcript, options);
      
      if (result.audioData && result.audioData.audioUrl) {
        setPlayerState(prev => ({
          ...prev,
          audioUrl: result.audioData.audioUrl,
          hasGeneratedAudio: true,
          isGeneratingAudio: false,
          activeService: result.service
        }));
      } else {
        console.error('Failed to generate audio with any available service');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
    } finally {
      setIsGeneratingAudio(false);
      setPlayerState(prev => ({ ...prev, isGeneratingAudio: false }));
    }
  };
  
  // Generate audio if needed
  useEffect(() => {
    const shouldGenerateAudio = 
      // No existing audio URL
      !audioUrl && 
      // Not already generated and not currently generating
      !playerState.hasGeneratedAudio && 
      !isGeneratingAudio &&
      // At least one TTS service is available
      (ttsServicesStatus.elevenlabs || ttsServicesStatus.playht);
    
    if (shouldGenerateAudio) {
      generateAudioFromTranscript();
    }
  }, [audioUrl, transcriptData.transcript, ttsServicesStatus, playerState.hasGeneratedAudio]);

  // Event handlers
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    const newTime = audioRef.current.currentTime;
    setPlayerState(prev => ({
      ...prev,
      currentTime: newTime,
    }));
  };
  
  const togglePlayPause = () => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  };
  
  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = pos * duration;
    
    audioRef.current.currentTime = seekTime;
    setPlayerState(prev => ({
      ...prev,
      currentTime: seekTime
    }));
  };
  
  const toggleMute = () => {
    setPlayerState(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }));
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setPlayerState(prev => ({
      ...prev,
      volume: newVolume,
      isMuted: newVolume === 0
    }));
  };
  
  const cyclePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(speed);
    const nextIndex = (currentIndex + 1) % rates.length;
    
    setPlayerState(prev => ({
      ...prev,
      speed: rates[nextIndex]
    }));
  };
  
  const skipForward = () => {
    if (!audioRef.current || !duration) return;
    
    const newTime = Math.min(duration, currentTime + 10);
    audioRef.current.currentTime = newTime;
    
    setPlayerState(prev => ({
      ...prev,
      currentTime: newTime
    }));
  };
  
  const skipBackward = () => {
    if (!audioRef.current) return;
    
    const newTime = Math.max(0, currentTime - 10);
    audioRef.current.currentTime = newTime;
    
    setPlayerState(prev => ({
      ...prev,
      currentTime: newTime
    }));
  };
  
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  
  const toggleTranscript = () => {
    setShowTranscript(!showTranscript);
  };
  
  // Render component
  return (
    <div className={`w-full ${isFullScreen ? 'fixed inset-0 z-50 bg-background pt-16' : 'bg-card rounded-xl'} p-4 shadow-lg`}>
      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlayerState(prev => ({ ...prev, isPlaying: false }))}
      />
      
      {/* Book info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <img 
            src={coverImage} 
            alt={bookTitle} 
            className="w-12 h-12 rounded-md object-cover mr-3" 
          />
          <div>
            <h3 className="text-white font-medium">{chapterTitle || 'Chapter'}</h3>
            <p className="text-gray-400 text-sm">{bookTitle}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            className="text-white hover:text-primary transition-colors"
            onClick={toggleFullScreen}
          >
            <ArrowsOutCardinal size={20} />
          </button>
          <button 
            className="text-white hover:text-primary transition-colors"
            onClick={toggleTranscript}
          >
            <ListBullets size={20} />
          </button>
        </div>
      </div>
      
      {/* Audio waveform */}
      <div 
        className="relative w-full h-28 mb-4 cursor-pointer"
        ref={waveformRef}
        onClick={handleSeek}
      >
        <AudioWaveform 
          waveformData={waveformData} 
          progress={duration ? currentTime / duration : 0}
          isPlaying={isPlaying}
          baseColor="rgba(155, 235, 61, 0.3)"
          progressColor="rgba(155, 235, 61, 0.8)"
        />
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div 
          className="w-full bg-gray-700 h-1 rounded-full overflow-hidden cursor-pointer relative"
          ref={progressRef}
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-primary"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Volume control */}
          <div className="relative">
            <button 
              className="text-white hover:text-primary transition-colors"
              onClick={toggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              {isMuted ? <SpeakerX size={20} /> : <SpeakerHigh size={20} />}
            </button>
            
            {showVolumeSlider && (
              <div 
                className="absolute bottom-full left-0 mb-2 p-2 bg-card rounded-md shadow-lg w-32"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </div>
          
          {/* Playback speed */}
          <button 
            className="flex items-center text-white hover:text-primary transition-colors"
            onClick={cyclePlaybackRate}
          >
            <Gauge size={18} className="mr-1" />
            <span className="text-sm">{speed}x</span>
          </button>
        </div>
        
        {/* Main controls */}
        <div className="flex items-center space-x-4">
          <button 
            className="text-white hover:text-primary transition-colors"
            onClick={skipBackward}
          >
            <SkipBack size={24} />
          </button>
          
          <button 
            className="bg-primary hover:bg-primary-dark text-black rounded-full w-12 h-12 flex items-center justify-center transition-colors"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause size={24} weight="fill" /> : <Play size={24} weight="fill" />}
          </button>
          
          <button 
            className="text-white hover:text-primary transition-colors"
            onClick={skipForward}
          >
            <SkipForward size={24} />
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-white hover:text-primary transition-colors">
            <Bookmark size={20} />
          </button>
          <button className="text-white hover:text-primary transition-colors">
            <Share size={20} />
          </button>
        </div>
      </div>
      
      {/* Transcript display */}
      {showTranscript && (
        <div className="mt-8 p-4 bg-card bg-opacity-50 rounded-lg">
          <h3 className="text-white font-medium mb-4">Transcript</h3>
          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {transcriptData.transcript.map((segment) => (
              <p 
                key={segment.id} 
                className={`mb-2 py-1 px-2 rounded ${activeSegment?.id === segment.id ? 'bg-primary bg-opacity-20 text-white' : 'text-gray-400'}`}
                onClick={() => {
                  if (audioRef.current && segment.startTime !== undefined) {
                    audioRef.current.currentTime = segment.startTime;
                    setPlayerState(prev => ({
                      ...prev,
                      currentTime: segment.startTime
                    }));
                  }
                }}
              >
                {segment.text}
              </p>
            ))}
          </div>
        </div>
      )}
      
      {/* TTS service integration notice */}
      {(ttsServicesStatus.elevenlabs || ttsServicesStatus.playht) && (
        <div className="mt-4 text-center">
          {isGeneratingAudio ? (
            <p className="text-primary text-sm animate-pulse flex items-center justify-center">
              <MagicWand className="mr-2" size={16} weight="fill" />
              Generating audio with AI...
            </p>
          ) : playerState.hasGeneratedAudio ? (
            <div className="flex flex-col items-center">
              <p className="text-gray-400 text-xs flex items-center">
                <Radio className="mr-1" size={12} weight="fill" />
                Audio generated with {playerState.activeService === 'elevenlabs' ? 'ElevenLabs' : 'PlayHT'} using voice: {activeVoice?.name || 'AI'}
              </p>
              <div className="mt-2 flex space-x-2">
                <button
                  className="text-xs px-2 py-1 rounded bg-card hover:bg-primary/20 text-white flex items-center"
                  onClick={() => setPlayerState(prev => ({ ...prev, ttsService: 'elevenlabs' }))}
                  disabled={!ttsServicesStatus.elevenlabs}
                >
                  Use ElevenLabs
                </button>
                <button
                  className="text-xs px-2 py-1 rounded bg-card hover:bg-primary/20 text-white flex items-center"
                  onClick={() => setPlayerState(prev => ({ ...prev, ttsService: 'playht' }))}
                  disabled={!ttsServicesStatus.playht}
                >
                  Use PlayHT
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="text-primary text-sm hover:underline flex items-center justify-center"
              onClick={generateAudioFromTranscript}
              disabled={isGeneratingAudio}
            >
              <Translate className="mr-1" size={16} />
              Generate audio with AI
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
