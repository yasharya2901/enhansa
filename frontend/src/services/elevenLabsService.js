import axios from 'axios';

// ElevenLabs API service for text-to-speech functionality
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

// This should be stored in environment variables in production
const API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY || '';

// Default voice settings
const defaultVoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75
};

// Create axios instance with base URL and headers
const elevenLabsApi = axios.create({
  baseURL: ELEVEN_LABS_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'xi-api-key': API_KEY
  }
});

// Service functions
const elevenLabsService = {
  // Get available voices
  getVoices: async () => {
    try {
      if (!API_KEY) {
        console.warn('ElevenLabs API key is not set');
        return [];
      }
      
      const response = await elevenLabsApi.get('/voices');
      return response.data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  },

  // Convert text to speech
  textToSpeech: async (text, voiceId = '21m00Tcm4TlvDq8ikWAM', modelId = 'eleven_multilingual_v2') => {
    try {
      if (!API_KEY) {
        console.warn('ElevenLabs API key is not set');
        // Return a mock response or fallback
        return null;
      }

      const response = await elevenLabsApi.post(
        `/text-to-speech/${voiceId}`,
        {
          text,
          model_id: modelId,
          voice_settings: defaultVoiceSettings
        },
        {
          responseType: 'arraybuffer'
        }
      );

      // Convert the binary response to an audio blob
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return {
        audioBlob,
        audioUrl
      };
    } catch (error) {
      console.error('Error converting text to speech:', error);
      return null;
    }
  },

  // Generate audio for a transcript
  generateTranscriptAudio: async (transcript, voiceId) => {
    // Combine transcript entries into a single text
    const text = transcript.map(entry => entry.text).join(' ');
    return await elevenLabsService.textToSpeech(text, voiceId);
  },
  
  // Cache for storing generated audio
  audioCache: new Map(),
  
  // Get audio with caching
  getCachedAudio: async (text, voiceId) => {
    const cacheKey = `${voiceId}:${text}`;
    
    if (elevenLabsService.audioCache.has(cacheKey)) {
      return elevenLabsService.audioCache.get(cacheKey);
    }
    
    const audioData = await elevenLabsService.textToSpeech(text, voiceId);
    
    if (audioData) {
      elevenLabsService.audioCache.set(cacheKey, audioData);
    }
    
    return audioData;
  },
  
  // Clean up resources
  revokeAudioUrl: (audioUrl) => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }
};

export default elevenLabsService;
