import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { jobService, aiMatchService, applicationService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const JobDetails = () => {
  const { id: jobId, jobId: jobIdParam } = useParams();
  const actualJobId = jobId || jobIdParam; // Handle both /jobs/:id and /candidate/jobs/:jobId routes
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  
  useEffect(() => {
    if (actualJobId) {
      loadJobDetails();
    } else {
      setError('No job ID provided in URL');
      setLoading(false);
    }
  }, [actualJobId]);
  
  const loadJobDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get job details
      const jobResponse = await jobService.getJob(actualJobId);
      if (jobResponse.success) {
        setJob(jobResponse.data);
        
        // If user is a candidate, get match score
        if (user && user.role === 'candidate') {
          try {
            const scoreResponse = await aiMatchService.getMatchScore(actualJobId);
            if (scoreResponse.success) {
              setMatchScore(scoreResponse.data);
            }
          } catch (scoreError) {
            console.error('Error getting match score:', scoreError);
          }
        }
      } else {
        setError('Failed to load job details');
      }
    } catch (err) {
      console.error('Error loading job:', err);
      if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('Backend server is not running. Please start the backend server on port 8000.');
      } else if (err.response?.status === 404) {
        setError('Job not found. This job may have been removed or the ID is invalid.');
      } else {
        setError(`Error loading job: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleApply = async (e) => {
    e.preventDefault();
    
    if (!user || user.role !== 'candidate') {
      return;
    }
    
    try {
      setApplying(true);
      const response = await applicationService.applyForJob(actualJobId, coverLetter);
      
      if (response.success) {
        setApplicationSubmitted(true);
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      alert(error.response?.data?.detail || 'Failed to apply for job');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse flex flex-col">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading job</h3>
                <p className="text-red-700 mt-1">{error || 'Job not found'}</p>
                {error && error.includes('Backend server') && (
                  <div className="mt-2 text-sm text-red-600">
                    <p>To fix this issue:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Make sure MongoDB is running on localhost:27017</li>
                      <li>Navigate to the backend directory</li>
                      <li>Run: <code className="bg-red-100 px-1 rounded">python server.py</code></li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Link to="/jobs" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/jobs" className="text-blue-600 hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Jobs
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-1">{job.company} • {job.location}</p>
            </div>
            
            {matchScore && (
              <div className={`
                px-4 py-2 rounded-full text-sm font-medium
                ${matchScore.match_percentage >= 70 ? 'bg-green-100 text-green-800' : 
                  matchScore.match_percentage >= 50 ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-100 text-gray-800'}
              `}>
                {matchScore.match_percentage}% Match
              </div>
            )}
          </div>
          
          {user && user.role === 'candidate' && !applicationSubmitted && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setApplying(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Apply Now
              </button>
            </div>
          )}
          
          {applicationSubmitted && (
            <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4">
              <p className="text-green-700">
                Your application has been submitted successfully!
              </p>
            </div>
          )}
        </div>
        
        {/* Job Description */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          <p className="whitespace-pre-line text-gray-700">
            {job.description}
          </p>
        </div>
        
        {/* Job Requirements */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Requirements</h2>
          
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Experience</h3>
            <p>{job.min_experience} - {job.max_experience} years</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.required_skills && job.required_skills.map((skill, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          {matchScore && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-700 mb-2">Your Match</h3>
              
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Match Score</span>
                  <span>{matchScore.match_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      matchScore.match_percentage >= 70 ? 'bg-green-600' : 
                      matchScore.match_percentage >= 50 ? 'bg-blue-600' : 
                      'bg-gray-500'
                    }`}
                    style={{ width: `${matchScore.match_percentage}%` }}
                  />
                </div>
              </div>
              
              {matchScore.matched_skills && matchScore.matched_skills.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-600">Matched Skills</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {matchScore.matched_skills.map((skill, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {matchScore.missing_skills && matchScore.missing_skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Missing Skills</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {matchScore.missing_skills.map((skill, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Apply Section */}
        {user && user.role === 'candidate' && applying && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Apply for this Position</h2>
            
            <form onSubmit={handleApply}>
              <div className="mb-4">
                <label htmlFor="coverLetter" className="block text-gray-700 font-medium mb-2">
                  Cover Letter (optional)
                </label>
                <textarea
                  id="coverLetter"
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Introduce yourself and explain why you're a good fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setApplying(false)}
                  className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applicationSubmitted}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobDetails;