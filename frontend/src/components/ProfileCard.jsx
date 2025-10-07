import React from 'react';

const ProfileCard = ({ user }) => {
  const renderSkills = () => {
    if (!user.skills || user.skills.length === 0) {
      return <p className="text-gray-500 italic">No skills added yet</p>;
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {user.skills.map((skill, idx) => (
          <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {skill}
          </span>
        ))}
      </div>
    );
  };
  
  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let score = 0;
    let total = 5; // Total number of fields we're checking
    
    if (user.full_name) score++;
    if (user.skills && user.skills.length > 0) score++;
    if (user.experience !== undefined) score++;
    if (user.location) score++;
    if (user.resume_file) score++;
    
    return Math.round((score / total) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4">
        <div className="flex items-center">
          <div className="h-24 w-24 rounded-full bg-white text-blue-600 flex items-center justify-center text-3xl font-bold border-4 border-white">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="ml-4 text-white">
            <h2 className="text-2xl font-bold">{user.full_name}</h2>
            <p className="text-blue-100">{user.role === 'candidate' ? 'Job Seeker' : 'Recruiter'}</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Profile Completion */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm font-medium">{calculateProfileCompletion()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${calculateProfileCompletion()}%` }}
            />
          </div>
        </div>
        
        {/* Contact Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Contact Information</h3>
          <div className="space-y-2">
            <p className="flex items-center">
              <span className="w-20 font-medium">Email:</span>
              <span>{user.email}</span>
            </p>
            {user.phone && (
              <p className="flex items-center">
                <span className="w-20 font-medium">Phone:</span>
                <span>{user.phone}</span>
              </p>
            )}
            {user.location && (
              <p className="flex items-center">
                <span className="w-20 font-medium">Location:</span>
                <span>{user.location}</span>
              </p>
            )}
          </div>
        </div>
        
        {/* Skills */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Skills</h3>
          {renderSkills()}
        </div>
        
        {/* Additional Info (For candidates) */}
        {user.role === 'candidate' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Experience</h3>
            <p>
              {user.experience ? `${user.experience} years` : 'Not specified'}
            </p>
          </div>
        )}
        
        {/* Resume Status */}
        {user.role === 'candidate' && (
          <div>
            <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Resume</h3>
            {user.resume_file ? (
              <div className="flex items-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Resume uploaded
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                No resume uploaded
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;