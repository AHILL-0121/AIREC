import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Upload, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ClientSideResumeParser from '../../components/ClientSideResumeParser';

const UploadResume = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [showClientFallback, setShowClientFallback] = useState(false);
  const [clientProcessing, setClientProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setParsedData(null);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setShowClientFallback(false);
    try {
      // Using the resumeService to upload the file
      const response = await resumeService.uploadResume(file);
      
      if (response && response.success) {
        setParsedData(response.parsed_data || response.data?.parsed_data);
        
        // Show appropriate toast based on parsing method
        const parsedData = response.parsed_data || response.data?.parsed_data;
        const parsingMethod = response.parsing_method || 
                             parsedData?.parsing_method || 
                             'unknown';
        
        if (parsingMethod === 'gemini_ai') {
          toast.success('Resume uploaded and parsed successfully with Gemini AI!');
        } else if (parsingMethod === 'fallback') {
          toast.info('Resume uploaded, but used basic extraction due to AI service limitations.');
        } else if (parsingMethod === 'manual') {
          toast.info('Resume uploaded. AI parsing unavailable - using manual extraction.');
        } else {
          toast.success(response.message || 'Resume uploaded successfully!');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.response?.status === 503) {
        // Specific handling for Gemini AI unavailability
        toast.error('Gemini AI is required for resume parsing but is currently unavailable.');
        setShowClientFallback(true);
      } else if (error.response?.status === 500) {
        // Show more detailed error for server errors
        const errorMessage = error.response?.data?.detail || 'Failed to process resume';
        toast.error(`Server error: ${errorMessage}`);
        setShowClientFallback(true);
      } else if (error.response?.status === 422) {
        // Handle validation errors
        toast.error('Missing or invalid file format. Please select a PDF file.');
      } else if (error.response?.status === 413) {
        toast.error('Resume file is too large. Please upload a smaller file (max 10MB).');
      } else if (error.response?.status === 415) {
        toast.error('Invalid file format. Please upload a PDF file.');
      } else {
        // Safely handle complex error details
        const errorDetail = error.response?.data?.detail;
        let errorMessage = 'Failed to upload resume';
        
        if (errorDetail) {
          if (typeof errorDetail === 'string') {
            errorMessage = errorDetail;
          } else if (Array.isArray(errorDetail)) {
            errorMessage = 'Validation error: Please check your file format';
          } else if (typeof errorDetail === 'object') {
            errorMessage = 'Server error: Please try again';
          }
        }
        
        toast.error(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };
  
  const handleClientParseStart = () => {
    setClientProcessing(true);
  };
  
  const handleClientParseSuccess = (data) => {
    setClientProcessing(false);
    setParsedData({
      ...data,
      parsing_method: 'client_side_gemini'
    });
    toast.success('Resume parsed successfully with client-side Gemini AI!');
  };
  
  const handleClientParseError = (error) => {
    setClientProcessing(false);
    toast.error('Client-side parsing failed: ' + error);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/candidate/dashboard')} className="mb-4">
          ← Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>Upload your resume in PDF format and let AI parse it automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <Button type="button" onClick={() => document.getElementById('resume-upload').click()}>
                    Select PDF File
                  </Button>
                </label>
                {file && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Selected: {file.name}</p>
                  </div>
                )}
              </div>

              {file && !parsedData && !showClientFallback && (
                <Button className="w-full" onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Parsing Resume with AI...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload and Parse
                    </>
                  )}
                </Button>
              )}
              
              {file && showClientFallback && !parsedData && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-md">
                    <AlertCircle className="h-5 w-5" />
                    <span>Server-side parsing is unavailable. Try client-side parsing instead.</span>
                  </div>
                  
                  <ClientSideResumeParser 
                    file={file}
                    onStart={handleClientParseStart}
                    onSuccess={handleClientParseSuccess}
                    onError={handleClientParseError}
                    isProcessing={clientProcessing}
                  />
                </div>
              )}

              {/* Enhanced Parsed Data Display */}
              {parsedData && (
                <div className="space-y-4 mt-6">
                  <div className={`flex items-center space-x-2 ${
                    parsedData.parsing_method?.includes('openrouter') || parsedData.parsing_method === 'gemini_ai' || parsedData.parsing_method === 'client_side_gemini' 
                      ? 'text-green-600' 
                      : parsedData.parsing_method === 'fallback' || parsedData.parsing_method === 'manual' 
                      ? 'text-amber-600' 
                      : 'text-green-600'
                  }`}>
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">
                      {parsedData.parsing_method?.includes('openrouter') && 'Resume Parsed Successfully with OpenRouter AI!'}
                      {parsedData.parsing_method === 'gemini_ai' && 'Resume Parsed Successfully with Gemini AI!'}
                      {parsedData.parsing_method === 'client_side_gemini' && 'Resume Parsed Successfully with Client-Side Gemini AI!'}
                      {parsedData.parsing_method === 'fallback' && 'Resume Parsed with Basic Extraction'}
                      {parsedData.parsing_method === 'manual' && 'Resume Processed (AI Unavailable)'}
                      {!parsedData.parsing_method && 'Resume Parsed Successfully!'}
                    </span>
                  </div>
                  
                  {parsedData.message && (
                    <div className="text-sm text-gray-600 italic">
                      {parsedData.message}
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    {/* Contact Information */}
                    {(parsedData.phone || parsedData.location) && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Contact Information:</h4>
                        <div className="space-y-1">
                          {parsedData.phone && (
                            <p className="text-sm text-gray-600">📞 {parsedData.phone}</p>
                          )}
                          {parsedData.location && (
                            <p className="text-sm text-gray-600">📍 {parsedData.location}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Professional Summary */}
                    {parsedData.summary && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Professional Summary:</h4>
                        <p className="text-sm text-gray-600">{parsedData.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Extracted Skills:</h4>
                      {parsedData.skills && parsedData.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {parsedData.skills.map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No skills extracted. You can add them manually in your profile.</p>
                      )}
                    </div>

                    {/* Experience and Job Titles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Experience:</h4>
                        <p className="text-sm text-gray-600">{parsedData.experience_years || 0} years</p>
                      </div>
                      {parsedData.job_titles && parsedData.job_titles.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Job Titles:</h4>
                          <div className="flex flex-wrap gap-1">
                            {parsedData.job_titles.map((title, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                {title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Education */}
                    {parsedData.education && parsedData.education.length > 0 ? (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Education:</h4>
                        <div className="space-y-2">
                          {parsedData.education.map((edu, idx) => (
                            <div key={idx} className="p-2 bg-white rounded border">
                              <p className="text-sm font-medium">{edu.degree}</p>
                              <p className="text-xs text-gray-600">{edu.institution} {edu.year ? `(${edu.year})` : ''}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Education:</h4>
                        <p className="text-sm text-gray-500 italic">No education details extracted. You can add them manually in your profile.</p>
                      </div>
                    )}

                    {/* Achievements */}
                    {parsedData.achievements && parsedData.achievements.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Achievements:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {parsedData.achievements.map((achievement, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-green-600 mr-2">✓</span>
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Certifications */}
                    {parsedData.certifications && parsedData.certifications.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Certifications:</h4>
                        <div className="flex flex-wrap gap-2">
                          {parsedData.certifications.map((cert, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {parsedData.languages && parsedData.languages.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Languages:</h4>
                        <div className="flex flex-wrap gap-2">
                          {parsedData.languages.map((lang, idx) => (
                            <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {parsedData.projects && parsedData.projects.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Projects:</h4>
                        <div className="space-y-2">
                          {parsedData.projects.map((project, idx) => (
                            <div key={idx} className="p-2 bg-white rounded border">
                              <p className="text-sm font-medium">{project.name}</p>
                              {project.description && (
                                <p className="text-xs text-gray-600 mb-1">{project.description}</p>
                              )}
                              {project.technologies && project.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {project.technologies.map((tech, techIdx) => (
                                    <span key={techIdx} className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button className="flex-1" onClick={() => navigate('/candidate/profile')}>
                      View Full Profile
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => navigate('/candidate/dashboard')}>
                      Continue to Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadResume;
