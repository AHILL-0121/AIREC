import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ProfileCard from '../components/ProfileCard';
import ResumeUpload from '../components/ResumeUpload';
import { useAuth } from '../contexts/AuthContext';
import { profileService, skillService } from '../services';

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    location: '',
    bio: '',
    skills: [],
    experience: 0,
  });
  const [skillSearch, setSkillSearch] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        location: user.location || '',
        bio: user.bio || '',
        skills: user.skills || [],
        experience: user.experience || 0,
      });
    }
  }, [user]);

  const handleSkillSearch = async (value) => {
    setSkillSearch(value);
    if (value.length >= 2) {
      try {
        const response = await skillService.searchSkills(value);
        if (response.success) {
          // Filter out skills already added to profile
          const filteredSkills = response.data.filter(
            (skill) => !profileData.skills.includes(skill)
          );
          setSkillSuggestions(filteredSkills);
          setShowSkillSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    } else {
      setSkillSuggestions([]);
      setShowSkillSuggestions(false);
    }
  };

  const addSkill = (skill) => {
    if (!profileData.skills.includes(skill)) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, skill],
      });
    }
    setSkillSearch('');
    setSkillSuggestions([]);
    setShowSkillSuggestions(false);
  };

  const removeSkill = (skillToRemove) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await profileService.updateProfile(user.id, profileData);
      if (response.success) {
        await checkAuth(); // Refresh user data
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-semibold">Please log in to view your profile</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="md:col-span-1">
            <ProfileCard user={user} />
          </div>
          
          {/* Right Column - Edit Form or Resume Upload */}
          <div className="md:col-span-2">
            {editing ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Edit Profile</h2>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={profileData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={profileData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="City, Country or Remote"
                    />
                  </div>
                  
                  {user.role === 'candidate' && (
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        name="experience"
                        value={profileData.experience}
                        onChange={handleInputChange}
                        min="0"
                        max="50"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description about yourself"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                      Skills
                    </label>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profileData.skills.map((skill, idx) => (
                        <div key={idx} className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 text-blue-800 hover:text-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={skillSearch}
                        onChange={(e) => handleSkillSearch(e.target.value)}
                        placeholder="Type to add skills"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      {showSkillSuggestions && skillSuggestions.length > 0 && (
                        <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                          {skillSuggestions.map((skill, idx) => (
                            <div
                              key={idx}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => addSkill(skill)}
                            >
                              {skill}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {skillSearch && !skillSuggestions.includes(skillSearch) && (
                      <button
                        type="button"
                        onClick={() => addSkill(skillSearch)}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                      >
                        + Add "{skillSearch}" as a new skill
                      </button>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded-md font-medium ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Profile Information</h2>
                    <button
                      onClick={() => setEditing(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Edit Profile
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-gray-500 text-sm">Full Name</h3>
                      <p className="font-medium">{user.full_name || 'Not set'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-gray-500 text-sm">Email</h3>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-gray-500 text-sm">Location</h3>
                      <p className="font-medium">{user.location || 'Not set'}</p>
                    </div>
                    
                    {user.role === 'candidate' && (
                      <div>
                        <h3 className="text-gray-500 text-sm">Experience</h3>
                        <p className="font-medium">
                          {user.experience ? `${user.experience} years` : 'Not set'}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-gray-500 text-sm">Bio</h3>
                      <p className="font-medium">{user.bio || 'Not set'}</p>
                    </div>
                  </div>
                </div>
                
                {user.role === 'candidate' && <ResumeUpload />}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;