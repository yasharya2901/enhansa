import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { motion } from 'framer-motion';
// Using phosphor-react icons instead
import { ArrowLeft, Clock, Headphones, Bookmark } from 'phosphor-react';
import { selectedBookState } from '../../atoms/bookAtom';
import { audioState, transcriptState } from '../../atoms/audioAtom';
import Button from '../../components/common/Button';
import bookService from '../../services/bookService';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useRecoilState(selectedBookState);
  const [, setAudioData] = useRecoilState(audioState);
  const [, setTranscript] = useRecoilState(transcriptState);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setIsLoading(true);
        
        // Fetch book details
        const bookData = await bookService.getBookById(id);
        setBook(bookData);
        
        // Fetch chapters
        const chaptersData = await bookService.getChaptersByBookId(id);
        setChapters(chaptersData);
      } catch (error) {
        console.error('Error fetching book details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookDetails();
    
    // Clean up when component unmounts
    return () => {
      setBook(null);
    };
  }, [id, setBook]);
  
  // Start listening to a chapter
  const startListening = async (chapterId) => {
    try {
      // Get audio source
      const audioData = await bookService.getChapterAudio(id, chapterId);
      
      // Get transcript
      const transcriptData = await bookService.getChapterTranscript(id, chapterId);
      
      // Set audio state
      setAudioData({
        isPlaying: true,
        currentTime: 0,
        duration: 0,
        bookId: id,
        chapterId,
        audioSrc: audioData.audioUrl,
      });
      
      // Set transcript
      setTranscript(transcriptData.transcript);
      
      // Navigate to player
      navigate(`/player/${id}/${chapterId}`);
    } catch (error) {
      console.error('Error starting playback:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-white text-xl">Book not found</p>
        <Button 
          primary 
          className="mt-4"
          onClick={() => navigate('/')}
        >
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full text-white hover:bg-card"
        >
          <ArrowLeft size={24} weight="bold" />
        </button>
        <h1 className="ml-2 text-xl font-medium text-white">Book Details</h1>
      </div>
      
      {/* Book info section */}
      <section className="mb-8">
        <div className="flex flex-col md:flex-row">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:w-1/3 flex justify-center"
          >
            <img 
              src={book.coverImage} 
              alt={book.title}
              className="w-48 h-72 object-cover rounded-xl shadow-lg"
            />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 md:mt-0 md:ml-6 md:w-2/3"
          >
            <h2 className="text-2xl font-bold text-white">{book.title}</h2>
            <p className="text-text-secondary mt-1">by {book.author}</p>
            
            <div className="flex mt-4 space-x-4">
              <div className="flex items-center">
                <Clock className="text-primary mr-2" weight="bold" />
                <span className="text-sm text-text-secondary">{book.duration || '4h 30m'}</span>
              </div>
              <div className="flex items-center">
                <Headphones className="text-primary mr-2" weight="bold" />
                <span className="text-sm text-text-secondary">{book.listens || '2.4k'} listens</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary mr-1">★</span>
                <span className="text-sm text-text-secondary">{book.rating || '4.7'}</span>
              </div>
            </div>
            
            <div className="mt-5 p-3 bg-card rounded-lg">
              <h3 className="font-medium text-white mb-2">Overview</h3>
              <p className="text-sm text-text-secondary line-clamp-3 md:line-clamp-none">
                {book.description || 'No description available.'}
              </p>
            </div>
            
            <div className="mt-5 flex space-x-3">
              <Button primary onClick={() => startListening(chapters[0]?.id)}>
                Start Listening
              </Button>
              <Button outline icon={<Bookmark weight="bold" />}>
                Save for Later
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Chapters section */}
      <section>
        <h3 className="text-lg font-medium text-white mb-4">Chapters</h3>
        
        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-card rounded-lg p-4 cursor-pointer hover:bg-card/80"
              onClick={() => startListening(chapter.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-white font-medium">{chapter.title}</h4>
                  <p className="text-xs text-text-secondary mt-1">{chapter.duration || '15 minutes'}</p>
                </div>
                <div className="flex items-center text-primary">
                  <Headphones size={18} weight="bold" />
                </div>
              </div>
            </motion.div>
          ))}
          
          {chapters.length === 0 && (
            <p className="text-text-secondary text-center py-8">No chapters available</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default BookDetails;
