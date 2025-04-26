import axios from 'axios';

// PlayHT API service for text-to-speech functionality
const PLAYHT_API_URL = 'https://api.play.ht/api/v2';

// API keys should be stored in environment variables
const SECRET_KEY = import.meta.env.VITE_PLAYHT_SECRET_KEY || '';
const USER_KEY = import.meta.env.VITE_PLAYHT_USER_KEY || '';

// Create axios instance with base URL and headers
const playHtApi = axios.create({
  baseURL: PLAYHT_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': SECRET_KEY,
    'X-User-ID': USER_KEY
  }
});

// Helper function to convert AudioBuffer to WAV format
function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit

  setUint32(0x61746164);                         // "data" chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);          // write 16-bit sample
      pos += 2;
    }
    offset++;                                     // next source sample
  }

  return buffer;

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

// Default voice settings
const defaultVoiceOptions = {
  voice: 'jennifer',
  speed: 1.0,
  quality: 'premium'
};

const playHtService = {
  // Get available voices
  getVoices: async () => {
    try {
      if (!SECRET_KEY || !USER_KEY) {
        console.warn('PlayHT API keys are not set');
        return [];
      }
      
      const response = await playHtApi.get('/voices');
      return response.data;
    } catch (error) {
      console.error('Error fetching PlayHT voices:', error);
      return [];
    }
  },
  
  // Convert text to speech
  textToSpeech: async (text, voice = defaultVoiceOptions.voice, quality = defaultVoiceOptions.quality) => {
    try {
      if (!SECRET_KEY || !USER_KEY) {
        console.warn('PlayHT API keys are not set');
        return null;
      }

      // For short text inputs, mock the response to avoid API calls during development
      if (process.env.NODE_ENV === 'development' && text.length < 500) {
        console.log('Development mode: Using mock audio for PlayHT');
        // Create a simple beep sound as mock audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // A4 note
        gainNode.gain.value = 0.5;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const offlineContext = new OfflineAudioContext(1, audioContext.sampleRate * 3, audioContext.sampleRate);
        const source = offlineContext.createOscillator();
        source.type = 'sine';
        source.frequency.value = 440;
        source.connect(offlineContext.destination);
        source.start();
        source.stop(3); // 3 seconds
        
        const buffer = await offlineContext.startRendering();
        const arrayBuffer = bufferToWave(buffer, buffer.length);
        
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        return {
          audioBlob,
          audioUrl
        };
      }
      
      // Step 1: Create a conversion request
      const conversionResponse = await playHtApi.post('/tts', {
        text,
        voice,
        quality,
        output_format: 'mp3'
      });
      
      // Step 2: Get the conversion ID
      const { id: transcriptionId } = conversionResponse.data;
      
      // Step 3: Poll for completion
      let audioUrl = null;
      let maxAttempts = 30; // Maximum number of polling attempts
      let attempts = 0;
      let pollInterval = 1000; // Start with 1 second intervals
      
      while (!audioUrl && attempts < maxAttempts) {
        attempts++;
        
        // Wait before polling again with progressive backoff
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        pollInterval = Math.min(pollInterval * 1.5, 5000); // Increase interval up to 5 seconds
        
        try {
          // Check conversion status
          const statusResponse = await playHtApi.get(`/tts/${transcriptionId}`);
          const { status, url } = statusResponse.data;
          
          if (status === 'COMPLETED' && url) {
            audioUrl = url;
            break;
          } else if (status === 'FAILED') {
            console.error('PlayHT conversion failed');
            return null;
          }
        } catch (pollError) {
          console.warn(`Polling attempt ${attempts} failed:`, pollError);
          // Continue polling even if a single attempt fails
        }
      }
      
      if (!audioUrl) {
        console.error('PlayHT conversion timed out or failed');
        return null;
      }
      
      // Load the audio file and convert to blob
      try {
        const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        const audioBlob = new Blob([audioResponse.data], { type: 'audio/mpeg' });
        const localAudioUrl = URL.createObjectURL(audioBlob);
        
        return {
          audioBlob,
          audioUrl: localAudioUrl
        };
      } catch (audioError) {
        console.error('Error downloading audio from PlayHT:', audioError);
        return null;
      }
    } catch (error) {
      console.error('Error converting text to speech with PlayHT:', error);
      return null;
    }
  },
  

  
  // Generate audio for a transcript
  generateTranscriptAudio: async (transcript, voice = defaultVoiceOptions.voice) => {
    // Combine transcript entries into a single text
    const text = transcript.map(entry => entry.text).join(' ');
    return await playHtService.textToSpeech(text, voice);
  },
  
  // Recommended voices for different content types
  voiceRecommendations: {
    'Business': 'jennifer',
    'Self-help': 'matthew',
    'Fiction': 'sophie',
    'Adventure': 'mike',
    'Fantasy': 'daniel',
    'History': 'ryan',
    'Crime': 'jack',
    'Finance': 'jennifer'
  },
  
  // Get a recommended voice based on genre
  getRecommendedVoice: (genre) => {
    return playHtService.voiceRecommendations[genre] || 'jennifer';
  },
  
  // Cache for storing generated audio
  audioCache: new Map(),
  
  // Get audio with caching
  getCachedAudio: async (text, voice) => {
    const cacheKey = `${voice}:${text}`;
    
    if (playHtService.audioCache.has(cacheKey)) {
      return playHtService.audioCache.get(cacheKey);
    }
    
    const audioData = await playHtService.textToSpeech(text, voice);
    
    if (audioData) {
      playHtService.audioCache.set(cacheKey, audioData);
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

export default playHtService;
