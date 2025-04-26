import elevenLabsService from '../services/elevenLabsService';
import playHtService from '../services/playHtService';

/**
 * Text-to-speech service that tries ElevenLabs first and falls back to PlayHT if needed
 */
const ttsService = {
  /**
   * Generate audio from text using available TTS services
   * @param {string} text - Text to convert to speech
   * @param {object} options - Options for voice generation
   * @returns {Promise<object>} Audio data with URLs and blob
   */
  generateAudio: async (text, options = {}) => {
    const {
      preferredService = 'elevenlabs', // 'elevenlabs' or 'playht'
      elevenLabsVoiceId = '21m00Tcm4TlvDq8ikWAM', 
      playHtVoice = 'jennifer',
      genre = null
    } = options;

    let audioData = null;
    let usedService = null;

    // Try the preferred service first
    if (preferredService === 'elevenlabs' || !preferredService) {
      try {
        // Check if ElevenLabs API key is available
        const hasElevenLabsKey = !!import.meta.env.VITE_ELEVEN_LABS_API_KEY;
        const isElevenLabsEnabled = import.meta.env.VITE_ENABLE_ELEVENLABS === 'true';
        
        if (hasElevenLabsKey && isElevenLabsEnabled) {
          console.log('Trying ElevenLabs for TTS...');
          audioData = await elevenLabsService.textToSpeech(text, elevenLabsVoiceId);
          if (audioData) {
            usedService = 'elevenlabs';
          }
        }
      } catch (error) {
        console.error('ElevenLabs TTS failed:', error);
      }
    } else if (preferredService === 'playht') {
      // PlayHT was preferred, so try it first
      try {
        const hasPlayHtKeys = !!import.meta.env.VITE_PLAYHT_SECRET_KEY && 
                             !!import.meta.env.VITE_PLAYHT_USER_KEY;
        
        if (hasPlayHtKeys) {
          console.log('Trying PlayHT for TTS...');
          // If genre is provided, get the recommended voice
          const voice = genre ? playHtService.getRecommendedVoice(genre) : playHtVoice;
          audioData = await playHtService.textToSpeech(text, voice);
          if (audioData) {
            usedService = 'playht';
          }
        }
      } catch (error) {
        console.error('PlayHT TTS failed:', error);
      }
    }

    // If the preferred service failed, try the fallback
    if (!audioData) {
      if (preferredService !== 'playht') {
        // Try PlayHT as fallback
        try {
          const hasPlayHtKeys = !!import.meta.env.VITE_PLAYHT_SECRET_KEY && 
                               !!import.meta.env.VITE_PLAYHT_USER_KEY;
          
          if (hasPlayHtKeys) {
            console.log('Falling back to PlayHT for TTS...');
            // If genre is provided, get the recommended voice
            const voice = genre ? playHtService.getRecommendedVoice(genre) : playHtVoice;
            audioData = await playHtService.textToSpeech(text, voice);
            if (audioData) {
              usedService = 'playht';
            }
          }
        } catch (error) {
          console.error('PlayHT fallback failed:', error);
        }
      } else {
        // Try ElevenLabs as fallback
        try {
          const hasElevenLabsKey = !!import.meta.env.VITE_ELEVEN_LABS_API_KEY;
          const isElevenLabsEnabled = import.meta.env.VITE_ENABLE_ELEVENLABS === 'true';
          
          if (hasElevenLabsKey && isElevenLabsEnabled) {
            console.log('Falling back to ElevenLabs for TTS...');
            audioData = await elevenLabsService.textToSpeech(text, elevenLabsVoiceId);
            if (audioData) {
              usedService = 'elevenlabs';
            }
          }
        } catch (error) {
          console.error('ElevenLabs fallback failed:', error);
        }
      }
    }

    // Return format should match what the AudioPlayerV2 component expects
    return {
      audioData: audioData || null,
      service: usedService
    };
  },

  /**
   * Generate audio from transcript segments
   * @param {Array} transcript - Array of transcript segments with text
   * @param {object} options - Voice options
   * @returns {Promise<object>} Audio data
   */
  generateFromTranscript: async (transcript, options = {}) => {
    if (!transcript || transcript.length === 0) {
      console.warn('No transcript provided for TTS generation');
      return { audioData: null, service: null };
    }
    // Combine all transcript segments into a single text
    const text = transcript.map(segment => segment.text).join(' ');
    return await ttsService.generateAudio(text, options);
  },

  /**
   * Clean up resources
   * @param {string} audioUrl - URL to revoke
   * @param {string} service - Service that generated the audio
   */
  cleanup: (audioUrl, service = 'elevenlabs') => {
    if (service === 'elevenlabs') {
      elevenLabsService.revokeAudioUrl(audioUrl);
    } else if (service === 'playht') {
      playHtService.revokeAudioUrl(audioUrl);
    }
  }
};

export default ttsService;
