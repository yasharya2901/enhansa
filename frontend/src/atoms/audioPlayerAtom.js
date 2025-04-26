import { atom, selector } from 'recoil';
import { findActiveTranscriptSegment, generateTranscriptTimestamps } from '../utils/audioUtils';
import playHtService from '../services/playHtService';

// Main audio player state
export const audioPlayerState = atom({
  key: 'audioPlayerState',
  default: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.75,
    speed: 1.0,
    isMuted: false,
    bookId: null,
    chapterId: null,
    chapterTitle: '',
    bookTitle: '',
    bookGenre: '',
    coverImage: '',
    audioUrl: null,
    isLoading: false,
    // TTS service configuration
    ttsService: 'auto', // 'elevenlabs', 'playht', or 'auto' for automatic fallback
    isElevenLabsEnabled: false,
    isPlayHtEnabled: false,
    selectedVoiceId: '21m00Tcm4TlvDq8ikWAM', // Default ElevenLabs voice
    selectedPlayHtVoice: 'jennifer', // Default PlayHT voice
    hasGeneratedAudio: false,
    isGeneratingAudio: false,
    activeService: null, // Which service is currently being used ('elevenlabs' or 'playht')
    waveformData: Array(100).fill(20), // Default placeholder wave data
  }
});

// Current transcript state
export const transcriptState = atom({
  key: 'transcriptState',
  default: {
    transcript: [],
    activeSegmentId: null,
    isVisible: true,
  }
});

// Selector for the active transcript segment
export const activeTranscriptSegmentSelector = selector({
  key: 'activeTranscriptSegmentSelector',
  get: ({ get }) => {
    const { transcript } = get(transcriptState);
    const { currentTime } = get(audioPlayerState);
    
    if (!transcript || !transcript.length) return null;
    
    return findActiveTranscriptSegment(transcript, currentTime);
  }
});

// Selector for processed transcript with timestamps
export const processedTranscriptSelector = selector({
  key: 'processedTranscriptSelector',
  get: ({ get }) => {
    const { transcript } = get(transcriptState);
    const { duration } = get(audioPlayerState);
    
    if (!transcript || !transcript.length) return [];
    
    return generateTranscriptTimestamps(transcript, duration);
  }
});

// ElevenLabs voice presets for different content types
export const elevenLabsVoicePresets = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: 'Calm, professional female voice',
    suitableFor: ['Non-fiction', 'Business', 'Self-help']
  },
  {
    id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    description: 'Conversational, warm female voice',
    suitableFor: ['Fiction', 'Children', 'Romance']
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Adam',
    description: 'Authoritative male voice',
    suitableFor: ['Adventure', 'Mystery', 'Thriller']
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Sam',
    description: 'Deep, clear male voice',
    suitableFor: ['Science Fiction', 'Fantasy', 'History']
  }
];

// PlayHT voice presets for different content types
export const playHtVoicePresets = [
  {
    id: 'jennifer',
    name: 'Jennifer',
    description: 'Professional female voice',
    suitableFor: ['Business', 'Finance', 'Self-help']
  },
  {
    id: 'matthew',
    name: 'Matthew',
    description: 'Clear, articulate male voice',
    suitableFor: ['Non-fiction', 'Self-help', 'Business']
  },
  {
    id: 'sophie',
    name: 'Sophie',
    description: 'Warm, engaging female voice',
    suitableFor: ['Fiction', 'Romance', 'Children']
  },
  {
    id: 'mike',
    name: 'Mike',
    description: 'Energetic male voice',
    suitableFor: ['Adventure', 'Thriller', 'Sports']
  },
  {
    id: 'jack',
    name: 'Jack',
    description: 'Deep, suspenseful male voice',
    suitableFor: ['Crime', 'Mystery', 'Thriller']
  }
];

// Selector to get recommended ElevenLabs voice based on book genre
export const recommendedElevenLabsVoiceSelector = selector({
  key: 'recommendedElevenLabsVoiceSelector',
  get: ({ get }) => {
    const { bookGenre } = get(audioPlayerState);
    
    if (!bookGenre) return elevenLabsVoicePresets[0]; // Default to Rachel
    
    // Find a suitable voice based on the book genre
    const suitableVoice = elevenLabsVoicePresets.find(voice => 
      voice.suitableFor.some(genre => 
        genre.toLowerCase() === bookGenre.toLowerCase()
      )
    );
    
    return suitableVoice || elevenLabsVoicePresets[0];
  }
});

// Selector to get recommended PlayHT voice based on book genre
export const recommendedPlayHtVoiceSelector = selector({
  key: 'recommendedPlayHtVoiceSelector',
  get: ({ get }) => {
    const { bookGenre } = get(audioPlayerState);
    
    if (!bookGenre) return playHtVoicePresets[0]; // Default to Jennifer
    
    // Find a suitable voice based on the book genre
    const suitableVoice = playHtVoicePresets.find(voice => 
      voice.suitableFor.some(genre => 
        genre.toLowerCase() === bookGenre.toLowerCase()
      )
    );
    
    return suitableVoice || playHtVoicePresets[0];
  }
});

// Selector to get the appropriate voice based on active service
export const activeVoiceSelector = selector({
  key: 'activeVoiceSelector',
  get: ({ get }) => {
    const playerState = get(audioPlayerState);
    const { activeService } = playerState;
    
    if (activeService === 'elevenlabs') {
      return get(recommendedElevenLabsVoiceSelector);
    } else if (activeService === 'playht') {
      return get(recommendedPlayHtVoiceSelector);
    }
    
    // Default to ElevenLabs if no active service
    return get(recommendedElevenLabsVoiceSelector);
  }
});
