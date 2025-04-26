import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { motion } from 'framer-motion';
// Using phosphor-react icons instead
import { ArrowLeft, Bookmark, Share } from 'phosphor-react';
import { selectedBookState } from '../../atoms/bookAtom';
import { audioPlayerState, transcriptState } from '../../atoms/audioPlayerAtom';
import AudioPlayerV2 from '../../components/audio/AudioPlayerV2';
import bookService from '../../services/bookService';
import elevenLabsService from '../../services/elevenLabsService';

const AudioPlayerPage = () => {
  const { bookId, chapterId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useRecoilState(selectedBookState);
  const [playerState, setPlayerState] = useRecoilState(audioPlayerState);
  const [transcriptData, setTranscriptData] = useRecoilState(transcriptState);
  const [chapter, setChapter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isElevenLabsAvailable, setIsElevenLabsAvailable] = useState(false);
  
  // Check if ElevenLabs API key is available
  useEffect(() => {
    const elevenlabsEnabled = import.meta.env.VITE_ENABLE_ELEVENLABS === 'true';
    const hasApiKey = !!import.meta.env.VITE_ELEVEN_LABS_API_KEY;
    setIsElevenLabsAvailable(elevenlabsEnabled && hasApiKey);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch book if not already loaded
        if (!book || book.id !== bookId) {
          const bookData = await bookService.getBookById(bookId);
          setBook(bookData);
        }
        
        // Fetch chapter info
        const chaptersData = await bookService.getChaptersByBookId(bookId);
        const currentChapter = chaptersData.find(ch => ch.id === chapterId);
        setChapter(currentChapter);
        
        // Fetch audio and transcript if not already loaded
        if (playerState.bookId !== bookId || playerState.chapterId !== chapterId) {
          const audioResponse = await bookService.getChapterAudio(bookId, chapterId);
          const transcriptResponse = await bookService.getChapterTranscript(bookId, chapterId);
          
          // Update player state with new audio information
          setPlayerState(prev => ({
            ...prev,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            bookId,
            chapterId,
            chapterTitle: currentChapter?.title || '',
            bookTitle: book?.title || '',
            coverImage: book?.coverImage || '',
            audioUrl: audioResponse.audioUrl,
            isElevenLabsEnabled: isElevenLabsAvailable,
            bookGenre: book?.genre || '',
          }));
          
          // Update transcript data
          setTranscriptData(prev => ({
            ...prev,
            transcript: transcriptResponse.transcript,
            activeSegmentId: null,
            isVisible: true
          }));
        }
      } catch (error) {
        console.error('Error loading audio player data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [bookId, chapterId, book, setBook, playerState.bookId, playerState.chapterId, setPlayerState, setTranscriptData, isElevenLabsAvailable]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <motion.div 
          className="w-16 h-16 relative"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <span className="absolute inset-0 rounded-full bg-primary opacity-50"></span>
          <span className="absolute inset-2 rounded-full bg-primary opacity-70"></span>
          <span className="absolute inset-4 rounded-full bg-primary opacity-90"></span>
          <span className="absolute inset-6 rounded-full bg-primary"></span>
        </motion.div>
        <p className="text-white mt-4">Loading audio...</p>
      </div>
    );
  }
  
  // If data not found
  if (!book || !chapter) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-white text-xl">Content not found</p>
        <button 
          className="mt-4 text-primary"
          onClick={() => navigate('/')}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(`/books/${bookId}`)}
          className="p-2 rounded-full text-white hover:bg-card"
        >
          <ArrowLeft size={24} weight="bold" />
        </button>
        <h1 className="text-lg font-medium text-white">{chapter.title}</h1>
        <div className="flex space-x-2">
          <button className="p-2 rounded-full text-white hover:bg-card">
            <Bookmark size={20} weight="bold" />
          </button>
          <button className="p-2 rounded-full text-white hover:bg-card">
            <Share size={20} weight="bold" />
          </button>
        </div>
      </div>
      
      {/* Book info */}
      <div className="flex items-center mb-6">
        <img 
          src={book.coverImage} 
          alt={book.title}
          className="w-16 h-24 object-cover rounded-lg"
        />
        <div className="ml-4">
          <h2 className="text-white font-medium">{book.title}</h2>
          <p className="text-text-secondary text-sm">{book.author}</p>
        </div>
      </div>
      
      {/* Enhanced audio player */}
      <div className="flex-1">
        <AudioPlayerV2 />
      </div>
      
      {/* Transcript section */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-white font-medium mb-4">Transcript</h3>
        <div className="space-y-4">
          {transcriptData.transcript.map((item) => (
            <motion.div
              key={item.id}
              className={`p-4 rounded-lg transition-colors ${
                transcriptData.activeSegmentId === item.id 
                  ? 'bg-primary/10 border border-primary/30' 
                  : 'bg-card'
              }`}
              animate={{
                backgroundColor: transcriptData.activeSegmentId === item.id ? 'rgba(155, 235, 61, 0.1)' : 'rgba(30, 33, 38, 1)',
                borderColor: transcriptData.activeSegmentId === item.id ? 'rgba(155, 235, 61, 0.3)' : 'transparent',
              }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-white text-sm">{item.text}</p>
              <p className="text-text-secondary text-xs mt-2">
                {new Date(item.startTime * 1000).toISOString().substr(14, 5)} - 
                {new Date(item.endTime * 1000).toISOString().substr(14, 5)}
              </p>
            </motion.div>
          ))}
          
          {transcriptData.transcript.length === 0 && (
            <p className="text-text-secondary text-center py-8">No transcript available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerPage;
