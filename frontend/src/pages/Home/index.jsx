import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { motion } from 'framer-motion';
// Using phosphor-react icons instead
import { CaretRight } from 'phosphor-react';
import { booksState, categoriesState, selectedCategoryState } from '../../atoms/bookAtom';
import { userState } from '../../atoms/authAtom';
import BookCard from '../../components/common/BookCard';
import bookService from '../../services/bookService';

const Home = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useRecoilState(booksState);
  const categories = useRecoilValue(categoriesState);
  const [selectedCategory, setSelectedCategory] = useRecoilState(selectedCategoryState);
  const [user] = useRecoilState(userState);
  const [isLoading, setIsLoading] = useState(true);
  const [continuedBooks, setContinuedBooks] = useState([]);
  
  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const data = await bookService.getAllBooks();
        setBooks(data);
        
        // Mock continued books (would normally come from API)
        const mockContinued = data.slice(0, 3).map(book => ({
          ...book,
          progress: Math.floor(Math.random() * 100),
          lastChapter: 'Chapter ' + Math.floor(Math.random() * 10 + 1)
        }));
        setContinuedBooks(mockContinued);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBooks();
  }, [setBooks]);
  
  // Group books by category
  const booksByCategory = categories.map(category => {
    const filteredBooks = books.filter(book => book.genre === category);
    return {
      category,
      books: filteredBooks
    };
  });
  
  return (
    <div className="pb-20 md:pb-0">
      {/* Hero section with greeting */}
      <section className="pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">
              Hello {user?.displayName?.split(' ')[0] || 'Reader'}
            </h1>
            <p className="text-text-secondary">Welcome back!</p>
          </div>
          
          {user && (
            <div className="flex-shrink-0">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                alt={user.displayName}
                className="w-10 h-10 rounded-full"
              />
            </div>
          )}
        </motion.div>

        {/* Reading goal progress */}
        <div className="mt-6 bg-card rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-white font-medium">Weekly goal</p>
            <p className="text-xs text-text-secondary">250/300 minutes</p>
          </div>
          <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '83%' }}></div>
          </div>
          <p className="text-xs text-text-secondary mt-2">Keep it up!</p>
        </div>
      </section>

      {/* Category tabs */}
      <section className="mb-6">
        <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-2">
          <button 
            className={`px-4 py-2 rounded-full text-sm ${!selectedCategory ? 'bg-primary text-dark' : 'bg-card text-white'}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          
          {categories.map(category => (
            <button 
              key={category}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${selectedCategory === category ? 'bg-primary text-dark' : 'bg-card text-white'}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Continue reading section */}
      {continuedBooks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Continue Reading</h2>
            <button 
              className="flex items-center text-xs text-primary"
              onClick={() => navigate('/library')}
            >
              See all <CaretRight size={14} weight="bold" />
            </button>
          </div>
          
          <div className="space-y-4">
            {continuedBooks.map(book => (
              <div 
                key={book.id}
                className="flex bg-card rounded-xl p-3 cursor-pointer"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <img 
                  src={book.coverImage} 
                  alt={book.title}
                  className="w-16 h-24 rounded-lg object-cover"
                />
                
                <div className="ml-4 flex-1">
                  <h3 className="text-white font-medium">{book.title}</h3>
                  <p className="text-xs text-text-secondary">{book.author}</p>
                  
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-text-secondary">{book.lastChapter}</p>
                      <p className="text-xs text-text-secondary">{book.progress}%</p>
                    </div>
                    <div className="w-full h-1 bg-dark rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${book.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Books by category */}
      {booksByCategory
        .filter(({ category }) => !selectedCategory || category === selectedCategory)
        .map(({ category, books }) => (
          books.length > 0 && (
            <section key={category} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">{category}</h2>
                <button 
                  className="flex items-center text-xs text-primary"
                  onClick={() => {
                    setSelectedCategory(category);
                    navigate('/library');
                  }}
                >
                  See all <CaretRight size={14} weight="bold" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {books.slice(0, 6).map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          )
        ))
      }
      
      {isLoading && (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default Home;
