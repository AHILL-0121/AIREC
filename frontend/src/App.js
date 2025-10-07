import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import logger from './lib/logger';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Candidate Pages
import CandidateDashboard from './pages/candidate/Dashboard';
import UploadResume from './pages/candidate/UploadResume';
import ProfileEdit from './pages/candidate/ProfileEdit';
import Profile from './pages/Profile';
import EnhancedProfile from './pages/candidate/EnhancedProfile';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import Applications from './pages/candidate/Applications';
import SkillGaps from './pages/candidate/SkillGaps';
import JobFeed from './pages/candidate/JobFeed';

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/Dashboard';
import PostJob from './pages/recruiter/PostJob';
import RecruiterApplications from './pages/recruiter/Applications';
import ApplicationDetail from './pages/recruiter/ApplicationDetail';
import RecruiterJobDetails from './pages/recruiter/JobDetails';
import CandidateProfileView from './pages/recruiter/CandidateProfileView';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} />;
  }

  return children;
};

// Navigation logger component
const RouteLogger = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    logger.info(`Route changed to: ${location.pathname}${location.search}${location.hash} (${navigationType})`);
  }, [location, navigationType]);

  return null;
};

function AppRoutes() {
  const { user } = useAuth();
  
  useEffect(() => {
    logger.info(`User authenticated: ${!!user}${user ? `, role: ${user.role}` : ''}`);
  }, [user]);

  return (
    <Routes>
      <Route path="*" element={<RouteLogger />} />
      
      {/* Public Routes */}
      <Route 
        path="/" 
        element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Landing />} 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Signup />} 
      />

      {/* Candidate Routes */}
      <Route
        path="/candidate/dashboard"
        element={
          <ProtectedRoute role="candidate">
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/upload-resume"
        element={
          <ProtectedRoute role="candidate">
            <UploadResume />
          </ProtectedRoute>
        }
      />

      {/* Common Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <Jobs />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/jobs/:id"
        element={
          <ProtectedRoute>
            <JobDetails />
          </ProtectedRoute>
        }
      />

      {/* Additional Candidate Routes */}
      <Route
        path="/candidate/applications"
        element={
          <ProtectedRoute role="candidate">
            <Applications />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/candidate/profile/edit"
        element={
          <ProtectedRoute role="candidate">
            <ProfileEdit />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/candidate/skill-gaps"
        element={
          <ProtectedRoute role="candidate">
            <SkillGaps />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/candidate/jobs"
        element={
          <ProtectedRoute role="candidate">
            <JobFeed />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/candidate/jobs/:jobId"
        element={
          <ProtectedRoute role="candidate">
            <JobDetails />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/candidate/enhanced-profile"
        element={
          <ProtectedRoute role="candidate">
            <EnhancedProfile />
          </ProtectedRoute>
        }
      />

      {/* Recruiter Routes */}
      <Route
        path="/recruiter/dashboard"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/recruiter/post-job"
        element={
          <ProtectedRoute role="recruiter">
            <PostJob />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/recruiter/applications"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterApplications />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/recruiter/applications/:applicationId"
        element={
          <ProtectedRoute role="recruiter">
            <ApplicationDetail />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/recruiter/jobs/:jobId"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterJobDetails />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/recruiter/edit-job/:jobId"
        element={
          <ProtectedRoute role="recruiter">
            <PostJob />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/recruiter/candidate/:candidateId"
        element={
          <ProtectedRoute role="recruiter">
            <CandidateProfileView />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    const appVersion = process.env.REACT_APP_VERSION || '1.0.0';
    const nodeEnv = process.env.NODE_ENV;
    
    logger.info(`Application initialized (v${appVersion}, ${nodeEnv})`);
    logger.info(`Backend API URL: ${process.env.REACT_APP_BACKEND_URL}`);
    
    // Log browser and device information
    const userAgent = navigator.userAgent;
    logger.debug(`User agent: ${userAgent}`);
    
    // Error handling for uncaught errors with protection against recursive logging
    const originalConsoleError = console.error;
    let isLogging = false; // Flag to prevent recursion
    
    console.error = (...args) => {
      // Check if this is a recursive logging call
      const errorString = args.map(arg => String(arg)).join(' ');
      
      if (isLogging || errorString.includes('too much recursion') || errorString.includes('Maximum call stack size exceeded')) {
        // Just use the original console.error without logging to prevent recursion
        originalConsoleError.apply(console, args);
      } else {
        try {
          isLogging = true; // Set flag to prevent recursion
          logger.error('Console error:', ...args);
        } catch (e) {
          // If logger throws an error, just use the original console
          originalConsoleError.apply(console, ['Error in logger:', e]);
        } finally {
          isLogging = false; // Reset flag
          // Always call the original
          originalConsoleError.apply(console, args);
        }
      }
    };
    
    // Global error handler with protection
    const handleGlobalError = (event) => {
      // Avoid recursive logging
      if (isLogging || String(event.error).includes('too much recursion') || String(event.error).includes('Maximum call stack size exceeded')) {
        originalConsoleError.call(console, 'Error caught but not logged to prevent recursion:', event.error);
        return;
      }
      
      try {
        isLogging = true;
        logger.error('Uncaught error:', event.error);
      } catch (e) {
        originalConsoleError.call(console, 'Error in logger while handling error:', e);
      } finally {
        isLogging = false;
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    
    // Unhandled promise rejection handler with protection
    const handleUnhandledRejection = (event) => {
      // Avoid recursive logging
      if (isLogging || String(event.reason).includes('too much recursion') || String(event.reason).includes('Maximum call stack size exceeded')) {
        originalConsoleError.call(console, 'Rejection caught but not logged to prevent recursion:', event.reason);
        return;
      }
      
      try {
        isLogging = true;
        logger.error('Unhandled promise rejection:', event.reason);
      } catch (e) {
        originalConsoleError.call(console, 'Error in logger while handling rejection:', e);
      } finally {
        isLogging = false;
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      // Cleanup
      console.error = originalConsoleError;
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
