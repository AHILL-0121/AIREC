import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';

const JobCard = ({ job, matchScore }) => {
  // Format the date string
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Link to={`/jobs/${job.id}`} className="hover:underline">
            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
          </Link>
          <p className="text-gray-600">{job.company}</p>
          <p className="text-gray-500 text-sm mt-1">{job.location}</p>
        </div>
        
        {matchScore !== undefined && (
          <div className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${matchScore >= 70 ? 'bg-green-100 text-green-800' : 
              matchScore >= 50 ? 'bg-blue-100 text-blue-800' : 
                'bg-gray-100 text-gray-800'}
          `}>
            {matchScore}% Match
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-gray-700 line-clamp-3">
          {job.description}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4">
        {job.required_skills && job.required_skills.slice(0, 5).map((skill, idx) => (
          <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">
            {skill}
          </span>
        ))}
        {job.required_skills && job.required_skills.length > 5 && (
          <span className="text-gray-500 text-sm py-1">
            +{job.required_skills.length - 5} more
          </span>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-200">
        <span className="text-gray-500 text-sm">
          Posted {formatDate(job.created_at)}
        </span>
        
        <Link 
          to={`/jobs/${job.id}`}
          className="text-blue-600 font-medium hover:text-blue-800"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default JobCard;