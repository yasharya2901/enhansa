/**
 * Utility functions for audio processing and playback
 */

// Format time in seconds to MM:SS format
export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Convert audio buffer to base64 string
export const audioBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Find the transcript segment that should be active at the current playback time
export const findActiveTranscriptSegment = (transcript, currentTime) => {
  if (!transcript || !transcript.length) return null;
  
  return transcript.find(segment => 
    currentTime >= segment.startTime && currentTime <= segment.endTime
  ) || null;
};

// Calculate waveform data from audio buffer for visualization
export const generateWaveformData = async (audioBuffer, numberOfPoints = 100) => {
  return new Promise((resolve) => {
    // If we have a Web Audio API AudioBuffer
    if (audioBuffer instanceof AudioBuffer) {
      const channelData = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channelData.length / numberOfPoints);
      const dataPoints = [];
      
      for (let i = 0; i < numberOfPoints; i++) {
        const blockStart = blockSize * i;
        let sum = 0;
        
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[blockStart + j] || 0);
        }
        
        // Normalize between 0 and 1, then scale to desired range (0-100)
        const average = sum / blockSize;
        const scaled = Math.min(100, Math.max(1, average * 150));
        dataPoints.push(scaled);
      }
      
      resolve(dataPoints);
    } 
    // For audio elements or other sources, generate random data for now
    else {
      const randomData = Array.from({ length: numberOfPoints }, () => 
        Math.floor(Math.random() * 75) + 5
      );
      resolve(randomData);
    }
  });
};

// Generate timestamps for transcript segments if they don't exist
export const generateTranscriptTimestamps = (transcript, totalDuration) => {
  if (!transcript || !transcript.length) return [];
  
  // Check if timestamps already exist
  const hasTimestamps = transcript.every(segment => 
    typeof segment.startTime === 'number' && 
    typeof segment.endTime === 'number'
  );
  
  if (hasTimestamps) return transcript;
  
  // Calculate approximate timestamps based on text length
  const totalTextLength = transcript.reduce((sum, segment) => sum + segment.text.length, 0);
  const durationPerChar = totalDuration / totalTextLength;
  
  let currentTime = 0;
  return transcript.map(segment => {
    const segmentDuration = segment.text.length * durationPerChar;
    const startTime = currentTime;
    const endTime = currentTime + segmentDuration;
    
    currentTime = endTime;
    
    return {
      ...segment,
      startTime,
      endTime
    };
  });
};

// Create a smooth transition between audio segments
export const createCrossfadeAudio = async (audioContext, audioBuffer1, audioBuffer2, crossfadeDuration = 0.5) => {
  if (!audioBuffer1 || !audioBuffer2) return null;
  
  const duration1 = audioBuffer1.duration;
  const duration2 = audioBuffer2.duration;
  const totalDuration = duration1 + duration2 - crossfadeDuration;
  
  const outputBuffer = audioContext.createBuffer(
    audioBuffer1.numberOfChannels,
    audioContext.sampleRate * totalDuration,
    audioContext.sampleRate
  );
  
  // Copy and crossfade the buffers
  for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
    const outputData = outputBuffer.getChannelData(channel);
    const buffer1Data = audioBuffer1.getChannelData(channel);
    const buffer2Data = audioBuffer2.getChannelData(channel);
    
    // Copy first buffer
    for (let i = 0; i < buffer1Data.length; i++) {
      outputData[i] = buffer1Data[i];
    }
    
    // Crossfade region
    const crossfadeSamples = crossfadeDuration * audioContext.sampleRate;
    const crossfadeStart = buffer1Data.length - crossfadeSamples;
    
    for (let i = 0; i < crossfadeSamples; i++) {
      const buffer1Index = crossfadeStart + i;
      const buffer2Index = i;
      const crossfadeRatio = i / crossfadeSamples;
      
      // Linear crossfade
      outputData[buffer1Index] = buffer1Data[buffer1Index] * (1 - crossfadeRatio) + 
                                buffer2Data[buffer2Index] * crossfadeRatio;
    }
    
    // Copy rest of second buffer
    for (let i = crossfadeSamples; i < buffer2Data.length; i++) {
      const outputIndex = (buffer1Data.length - crossfadeSamples) + i;
      outputData[outputIndex] = buffer2Data[i];
    }
  }
  
  return outputBuffer;
};

// Cache for storing preloaded audio elements
const audioCache = new Map();

// Preload an audio file
export const preloadAudio = async (audioUrl, cacheKey = audioUrl) => {
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }
  
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = audioUrl;
    audio.preload = 'auto';
    
    audio.oncanplaythrough = () => {
      audioCache.set(cacheKey, audio);
      resolve(audio);
    };
    
    audio.onerror = (err) => {
      reject(err);
    };
    
    // Start loading
    audio.load();
  });
};

// Clear audio from cache
export const clearAudioCache = (cacheKey) => {
  if (cacheKey && audioCache.has(cacheKey)) {
    audioCache.delete(cacheKey);
  } else if (!cacheKey) {
    audioCache.clear();
  }
};
