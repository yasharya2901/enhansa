import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RecoilRoot, useRecoilState, useSetRecoilState } from 'recoil';
import { userState, authLoadingState } from './atoms/authAtom';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import BookDetails from './pages/BookDetails';
import AudioPlayerPage from './pages/AudioPlayer';
import authService from './services/authService';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// App initialization component
function AppInit() {
  const [, setUser] = useRecoilState(userState);
  const setAuthLoading = useSetRecoilState(authLoadingState);
  
  useEffect(() => {
    // Check if user is already logged in
    if (authService.isAuthenticated()) {
      // Get user from localStorage (in real app, would validate token with backend)
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing user data:', error);
          authService.logout();
        }
      }
    }
    
    setAuthLoading(false);
  }, [setUser, setAuthLoading]);
  
  return null;
}

function App() {
  return (
    <Router>
      <AppInit />
        <div className="min-h-screen bg-background">
          <div className="max-w-screen-md mx-auto px-4 pt-6 pb-20">
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Header />
                    <main className="mt-6">
                      <Home />
                    </main>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/books/:id" 
                element={
                  <ProtectedRoute>
                    <Header />
                    <main className="mt-6">
                      <BookDetails />
                    </main>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/player/:bookId/:chapterId" 
                element={
                  <ProtectedRoute>
                    <main className="mt-6">
                      <AudioPlayerPage />
                    </main>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/library" 
                element={
                  <ProtectedRoute>
                    <Header />
                    <main className="mt-6">
                      <Home />
                    </main>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/search" 
                element={
                  <ProtectedRoute>
                    <Header />
                    <main className="mt-6">
                      <div className="text-white">Search page coming soon</div>
                    </main>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Header />
                    <main className="mt-6">
                      <div className="text-white">Profile page coming soon</div>
                    </main>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </div>
      </Router>
  );
}

export default App;
