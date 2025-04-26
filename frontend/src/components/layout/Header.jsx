import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { motion } from 'framer-motion';
// Using phosphor-react icons instead
import { House, Book, MagnifyingGlass, User } from 'phosphor-react';
import { userState } from '../../atoms/authAtom';
import authService from '../../services/authService';

const Header = () => {
  const [user, setUser] = useRecoilState(userState);
  const location = useLocation();
  
  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };
  
  const navItems = [
    { icon: <House size={20} weight="bold" />, label: 'Home', path: '/' },
    { icon: <Book size={20} weight="bold" />, label: 'Library', path: '/library' },
    { icon: <MagnifyingGlass size={20} weight="bold" />, label: 'Search', path: '/search' },
    { icon: <User size={20} weight="bold" />, label: 'Profile', path: '/profile' },
  ];
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <header className="w-full">
      {/* Top header - shown on larger screens */}
      <div className="hidden md:flex justify-between items-center py-4 px-6">
        <Link to="/" className="flex items-center">
          <h1 className="text-primary text-2xl font-bold">Enhasa</h1>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center text-sm font-medium ${
                isActive(item.path) ? 'text-primary' : 'text-white hover:text-primary'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        
        {user ? (
          <div className="flex items-center">
            <img 
              src={user.photoURL || 'https://ui-avatars.com/api/?name=' + user.displayName} 
              alt={user.displayName}
              className="w-8 h-8 rounded-full mr-3"
            />
            <button 
              onClick={handleLogout}
              className="text-sm text-text-secondary hover:text-primary"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="text-primary font-medium">
            Login
          </Link>
        )}
      </div>
      
      {/* Bottom navigation bar - shown on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-dark z-10 md:hidden">
        <nav className="flex justify-around py-3">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className="flex flex-col items-center"
            >
              <div className="relative">
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/20 rounded-full -m-1"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <div className={`p-2 ${isActive(item.path) ? 'text-primary' : 'text-white'}`}>
                  {item.icon}
                </div>
              </div>
              <span className={`text-xs mt-1 ${isActive(item.path) ? 'text-primary' : 'text-text-secondary'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
