import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Upload, CheckCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

const UploadResume = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState(null);

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
    try {
      const response = await resumeService.uploadResume(file);
      if (response.success) {
        setParsedData(response.data.parsed_data);
        toast.success('Resume uploaded and parsed successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
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

              {file && !parsedData && (
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

              {/* Parsed Data Display */}
              {parsedData && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Resume Parsed Successfully!</span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Extracted Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-1">Experience:</h4>
                      <p className="text-sm text-gray-600">{parsedData.experience_years} years</p>
                    </div>

                    {parsedData.education && parsedData.education.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Education:</h4>
                        {parsedData.education.map((edu, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            {edu.degree} - {edu.institution}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button className="w-full" onClick={() => navigate('/candidate/dashboard')}>
                    Continue to Dashboard
                  </Button>
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
