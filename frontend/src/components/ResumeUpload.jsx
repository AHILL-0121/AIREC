import React, { useState } from 'react';
import { resumeService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const ResumeUpload = () => {
  const { user, checkAuth } = useAuth();
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check if file is PDF
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are supported');
        setFile(null);
        return;
      }
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setParsing(true);
      setError(null);
      
      const response = await resumeService.uploadResume(file);
      
      if (response.success) {
        setResult(response.data.parsed_data);
        // Refresh user data to get updated skills
        await checkAuth();
      } else {
        setError('Failed to parse resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      setError(error.response?.data?.detail || 'Error uploading resume');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Your Resume</h2>
      <p className="text-gray-600 mb-4">
        Upload your resume to let AI extract your skills and experience. Supported format: PDF.
      </p>
      
      <div className="mb-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
      
      <button
        onClick={handleUpload}
        disabled={!file || parsing}
        className={`w-full py-2 px-4 rounded-lg font-medium ${
          !file || parsing
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {parsing ? 'Analyzing Resume...' : 'Upload & Parse Resume'}
      </button>
      
      {result && (
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-3">Extracted Information</h3>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-700">Skills</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {result.skills && result.skills.map((skill, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          {result.experience_years !== undefined && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700">Experience</h4>
              <p>{result.experience_years} years</p>
            </div>
          )}
          
          {result.education && result.education.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700">Education</h4>
              <ul className="list-disc list-inside">
                {result.education.map((edu, idx) => (
                  <li key={idx}>
                    {edu.degree} - {edu.institution} ({edu.year})
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {result.job_titles && result.job_titles.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700">Previous Positions</h4>
              <ul className="list-disc list-inside">
                {result.job_titles.map((title, idx) => (
                  <li key={idx}>{title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;