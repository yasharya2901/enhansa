import api from './api';
import { mockBooks, mockChapters, mockTranscript, getChaptersByBookId, getTranscriptByChapterId } from './mockData';

export const bookService = {
  // Get all books
  getAllBooks: async () => {
    try {
      // When backend is ready, uncomment this:
      // const response = await api.get('/books');
      // return response.data;
      
      // Using mock data for now
      return new Promise(resolve => {
        setTimeout(() => resolve(mockBooks), 800); // Simulate network delay
      });
    } catch (error) {
      console.error('Get books error:', error);
      throw error;
    }
  },

  // Get book by ID
  getBookById: async (id) => {
    try {
      // When backend is ready, uncomment this:
      // const response = await api.get(`/books/${id}`);
      // return response.data;
      
      // Using mock data for now
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const book = mockBooks.find(book => book.id === id);
          if (book) {
            resolve(book);
          } else {
            reject(new Error('Book not found'));
          }
        }, 600);
      });
    } catch (error) {
      console.error('Get book error:', error);
      throw error;
    }
  },

  // Get chapters by book ID
  getChaptersByBookId: async (bookId) => {
    try {
      // When backend is ready, uncomment this:
      // const response = await api.get(`/books/${bookId}/chapters`);
      // return response.data;
      
      // Using mock data for now
      return new Promise(resolve => {
        setTimeout(() => {
          const chapters = getChaptersByBookId(bookId);
          resolve(chapters);
        }, 700);
      });
    } catch (error) {
      console.error('Get chapters error:', error);
      throw error;
    }
  },

  // Get chapter audio
  getChapterAudio: async (bookId, chapterId) => {
    try {
      // When backend is ready, uncomment this:
      // const response = await api.get(`/books/${bookId}/chapters/${chapterId}/audio`);
      // return response.data;
      
      // For now, return a sample audio URL
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            audioUrl: 'https://cdn.freesound.org/previews/686/686771_14377009-lq.mp3', // Sample audio from freesound.org
            format: 'mp3',
            duration: 60, // Sample duration
          });
        }, 500);
      });
    } catch (error) {
      console.error('Get audio error:', error);
      throw error;
    }
  },

  // Get chapter transcript
  getChapterTranscript: async (bookId, chapterId) => {
    try {
      // When backend is ready, uncomment this:
      // const response = await api.get(`/books/${bookId}/chapters/${chapterId}/transcript`);
      // return response.data;
      
      // Using mock data for now
      return new Promise(resolve => {
        setTimeout(() => {
          const transcript = getTranscriptByChapterId(chapterId);
          resolve({ transcript });
        }, 600);
      });
    } catch (error) {
      console.error('Get transcript error:', error);
      throw error;
    }
  }
};

export default bookService;
