import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Clock, DollarSign, Briefcase } from 'lucide-react';

const JobCard = ({ job }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleClick = () => {
    const baseRoute = user?.role === 'candidate' ? '/candidate/jobs' : '/jobs';
    navigate(`${baseRoute}/${job.id}`);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <div className="flex flex-col md:flex-row md:justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h2>
          <p className="text-md font-medium text-gray-700 mb-2">{job.company}</p>
          
          <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{job.location || 'Remote'}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{job.min_experience}-{job.max_experience} years</span>
            </div>
            
            {(job.salary_min || job.salary_max) && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>
                  {job.salary_min && job.salary_max 
                    ? `$${job.salary_min.toLocaleString()}-$${job.salary_max.toLocaleString()}`
                    : job.salary_min 
                      ? `From $${job.salary_min.toLocaleString()}`
                      : `Up to $${job.salary_max.toLocaleString()}`
                  }
                </span>
              </div>
            )}
            
            {job.job_type && (
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-1" />
                <span className="capitalize">{job.job_type}</span>
              </div>
            )}
          </div>
          
          <p className="text-gray-600 line-clamp-2 mb-4">{job.description}</p>
          
          {job.required_skills && job.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.required_skills.slice(0, 5).map((skill, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                >
                  {skill}
                </span>
              ))}
              {job.required_skills.length > 5 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                  +{job.required_skills.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
        
        {job.match_score && (
          <div className="md:ml-6 mt-4 md:mt-0 flex items-start">
            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              {job.match_score}% Match
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCard;