import { atom, selector } from 'recoil';

export const audioState = atom({
  key: 'audioState',
  default: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    chapterId: null,
    bookId: null,
    audioSrc: null,
  },
});

export const transcriptState = atom({
  key: 'transcriptState',
  default: [],
});

export const currentTranscriptSelector = selector({
  key: 'currentTranscriptSelector',
  get: ({get}) => {
    const audioData = get(audioState);
    const transcript = get(transcriptState);
    
    if (!transcript.length) return null;
    
    // Find the transcript that matches the current time
    return transcript.find(item => 
      audioData.currentTime >= item.startTime && 
      audioData.currentTime <= item.endTime
    );
  },
});

export const audioPlaybackRateState = atom({
  key: 'audioPlaybackRateState',
  default: 1.0,
});
