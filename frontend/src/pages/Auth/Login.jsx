import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { motion } from 'framer-motion';
// Using phosphor-react icons instead
import { Book, Headphones, GoogleLogo } from 'phosphor-react';
import { userState, authLoadingState } from '../../atoms/authAtom';
import Button from '../../components/common/Button';
import authService from '../../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const setUser = useSetRecoilState(userState);
  const setAuthLoading = useSetRecoilState(authLoadingState);
  
  const handleGoogleLogin = async () => {
    try {
      // In a real implementation, this would use Firebase or another auth provider
      // For now, we'll simulate a successful login
      
      // Mock user data
      const userData = {
        id: '123456',
        displayName: 'Daniel Reader',
        email: 'daniel@example.com',
        photoURL: 'https://ui-avatars.com/api/?name=Daniel+Reader&background=random',
      };
      
      // Store in localStorage (simulating token storage)
      localStorage.setItem('token', 'mock_token_12345');
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update Recoil state
      setUser(userData);
      setAuthLoading(false);
      
      // Redirect to home
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Logo and Branding */}
      <motion.div 
        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-10">
          <motion.div 
            className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Headphones className="text-primary" size={40} weight="duotone" />
          </motion.div>
          <h1 className="text-white text-3xl font-bold mb-2">Enhasa</h1>
          <p className="text-text-secondary">Making books live</p>
        </div>
        
        <div className="w-full max-w-md space-y-8">
          <div className="bg-card rounded-xl p-6 shadow-lg">
            <h2 className="text-white text-xl font-medium mb-6 text-center">Sign in to continue</h2>
            
            <Button
              className="w-full"
              primary
              icon={<GoogleLogo size={20} weight="bold" />}
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </Button>
            
            <div className="mt-8 text-center">
              <p className="text-text-secondary text-sm">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
          
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-center space-x-6">
              <div className="flex flex-col items-center">
                <div className="bg-card p-3 rounded-full mb-2">
                  <Book className="text-primary" size={24} weight="duotone" />
                </div>
                <p className="text-white text-sm">Thousands of Books</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="bg-card p-3 rounded-full mb-2">
                  <Headphones className="text-primary" size={24} weight="duotone" />
                </div>
                <p className="text-white text-sm">Premium Audio</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <footer className="py-4 text-center text-text-secondary text-sm">
        © {new Date().getFullYear()} Enhasa. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
