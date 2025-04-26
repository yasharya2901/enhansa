import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BookCard = ({ book, isCompact = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/books/${book.id}`);
  };

  return (
    <motion.div 
      className={`relative rounded-lg overflow-hidden cursor-pointer ${isCompact ? 'w-28' : 'w-full max-w-[180px]'}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
    >
      <div className="relative pb-[150%]">
        <img 
          src={book.coverImage} 
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/70 to-transparent"></div>
        
        {!isCompact && (
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white text-sm font-medium line-clamp-2">{book.title}</h3>
            <p className="text-text-secondary text-xs mt-1">{book.author}</p>
          </div>
        )}
        
        {!isCompact && book.rating && (
          <div className="absolute top-2 right-2 flex items-center bg-dark/60 rounded-full py-1 px-2">
            <span className="text-primary text-xs mr-1">★</span>
            <span className="text-white text-xs">{book.rating}</span>
          </div>
        )}
      </div>
      
      {isCompact && (
        <div className="mt-2">
          <h3 className="text-white text-xs font-medium line-clamp-1">{book.title}</h3>
          <p className="text-text-secondary text-xs line-clamp-1">{book.author}</p>
        </div>
      )}
    </motion.div>
  );
};

export default BookCard;
