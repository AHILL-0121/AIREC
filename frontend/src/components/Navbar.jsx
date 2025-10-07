import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { skillService } from '../services';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(`/jobs/search?query=${searchQuery}`);
      setShowSuggestions(false);
    }
  };

  const handleSkillSearch = async (value) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      try {
        const response = await skillService.searchSkills(value);
        if (response.success) {
          setSuggestions(response.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-blue-600 text-xl font-bold">
              RecruiterAI
            </Link>
          </div>
          
          <div className="hidden md:block flex-grow mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search jobs, skills, companies..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => handleSkillSearch(e.target.value)}
                onKeyPress={handleSearch}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
                  {suggestions.map((skill, index) => (
                    <div 
                      key={index} 
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSearchQuery(skill);
                        setShowSuggestions(false);
                        navigate(`/jobs/search?skills=${skill}`);
                      }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Link to="/jobs" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                Jobs
              </Link>
              
              {user ? (
                <>
                  {user.role === 'candidate' ? (
                    <Link to="/candidate/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                      Dashboard
                    </Link>
                  ) : (
                    <Link to="/recruiter/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                      Dashboard
                    </Link>
                  )}
                  
                  <Link to="/profile" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                    Profile
                  </Link>
                  
                  <button 
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-800 px-3 py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                    Login
                  </Link>
                  <Link 
                    to="/signup"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="md:hidden">
            {/* Mobile menu button */}
            <button className="text-gray-700 hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;