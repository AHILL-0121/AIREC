import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import JobCard from '../components/JobCard';
import { jobService, skillService } from '../services';

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
  const [skillFilter, setSkillFilter] = useState(searchParams.get('skills') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [searchParams]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = {
        query: searchParams.get('query') || '',
        skills: searchParams.get('skills') || '',
        location: searchParams.get('location') || '',
      };
      
      const response = await jobService.searchJobs(params);
      if (response.success) {
        setJobs(response.data);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = {};
    if (searchTerm) params.query = searchTerm;
    if (skillFilter) params.skills = skillFilter;
    if (locationFilter) params.location = locationFilter;
    
    setSearchParams(params);
  };

  const handleSkillInput = async (value) => {
    setSkillFilter(value);
    if (value.length >= 2) {
      try {
        const response = await skillService.searchSkills(value);
        if (response.success) {
          setSuggestions(response.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Find Your Next Opportunity</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title or Keywords
              </label>
              <input
                id="searchTerm"
                type="text"
                placeholder="e.g., Software Engineer, Marketing"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <label htmlFor="skillFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Skills
              </label>
              <input
                id="skillFilter"
                type="text"
                placeholder="e.g., React, Python"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={skillFilter}
                onChange={(e) => handleSkillInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                  {suggestions.map((skill, idx) => (
                    <div 
                      key={idx}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSkillFilter(skill);
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                id="locationFilter"
                type="text"
                placeholder="e.g., Remote, New York"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
          </div>
          
          <button
            onClick={handleSearch}
            className="mt-4 w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Search Jobs
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.length > 0 ? (
              jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                <p className="mt-2 text-gray-500">
                  Try adjusting your search filters or check back later for new opportunities.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Jobs;