import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService, resumeService } from '../../services';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { ArrowLeft, Download, Mail, MapPin, Calendar, Briefcase, GraduationCap, Award, User, Loader2 } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const ApplicationDetail = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingResume, setDownloadingResume] = useState(false);

  useEffect(() => {
    loadApplicationDetail();
  }, [applicationId]);

  const loadApplicationDetail = async () => {
    setLoading(true);
    try {
      // Since we don't have a specific endpoint for single application,
      // we'll get all applications and find the matching one
      const response = await applicationService.getRecentApplications();
      if (response.success) {
        const apps = response.data || [];
        const foundApp = apps.find(app => app.id === applicationId);
        if (foundApp) {
          setApplication(foundApp);
        } else {
          toast({
            title: "Application not found",
            description: "The requested application could not be found.",
            variant: "destructive",
          });
          navigate('/recruiter/applications');
        }
      }
    } catch (error) {
      console.error('Error loading application:', error);
      toast({
        title: "Error loading application",
        description: "There was a problem loading the application details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await applicationService.updateApplicationStatus(applicationId, newStatus);
      
      if (response.success) {
        setApplication(prev => ({ ...prev, status: newStatus }));
        toast({
          title: "Status updated",
          description: `Application status changed to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error updating status",
        description: "There was a problem updating the application status",
        variant: "destructive",
      });
    }
  };

  const handleDownloadResume = async () => {
    if (!application?.candidate_id) {
      toast({
        title: "Error",
        description: "Candidate information not available",
        variant: "destructive",
      });
      return;
    }

    setDownloadingResume(true);
    
    try {
      // Get the auth token from cookies
      const token = document.cookie.split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
        
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('Downloading resume for candidate:', application.candidate_id);
      
      // Create a download link with authentication header
      const downloadUrl = `http://localhost:8000/api/resume/download/${application.candidate_id}`;
      
      // Use fetch with proper headers for binary download
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Resume not found for this candidate');
        } else if (response.status === 403) {
          throw new Error('Access denied. You may not have permission to download this resume.');
        } else {
          throw new Error(`Download failed with status: ${response.status}`);
        }
      }

      // Get the blob from response
      const blob = await response.blob();
      console.log('Downloaded blob size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${application.candidate?.full_name || 'candidate'}_resume.pdf`;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Success",
        description: "Resume downloaded successfully!",
      });
      
    } catch (error) {
      console.error('Error downloading resume:', error);
      
      toast({
        title: "Download Failed",
        description: error.message || "There was a problem downloading the resume",
        variant: "destructive",
      });
    } finally {
      setDownloadingResume(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Application Not Found</h1>
            <p className="mt-2 text-gray-600">The requested application could not be found.</p>
            <Link to="/recruiter/applications" className="mt-4 inline-block text-blue-600 hover:underline">
              ← Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { candidate, job } = application;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/recruiter/applications')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {candidate?.full_name || candidate?.name || 'Unknown Candidate'}
              </h1>
              <p className="text-lg text-gray-600">Applied for: {job?.title || 'Unknown Position'}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(application.status)}`}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </div>
              
              <Select
                value={application.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Candidate Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-base">{candidate?.full_name || candidate?.name || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <p className="text-base">{candidate?.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Experience</label>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                      <p className="text-base">{candidate?.experience || 'Not provided'} years</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Application Date</label>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <p className="text-base">{formatDate(application.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {candidate?.skills && candidate.skills.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {candidate?.education && candidate.education.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Education
                    </label>
                    <div className="space-y-2">
                      {candidate.education.map((edu, index) => (
                        <div key={index} className="border rounded p-3">
                          <p className="font-medium">{edu.degree}</p>
                          <p className="text-sm text-gray-600">{edu.institution}</p>
                          <p className="text-xs text-gray-500">{edu.year}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                {candidate?.achievements && candidate.achievements.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      Achievements
                    </label>
                    <ul className="space-y-1">
                      {candidate.achievements.map((achievement, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cover Letter */}
            {application.cover_letter && (
              <Card>
                <CardHeader>
                  <CardTitle>Cover Letter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{application.cover_letter}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <p className="text-base font-medium">{job?.title || 'Unknown Position'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Company</label>
                  <p className="text-base">{job?.company || 'Unknown Company'}</p>
                </div>
                
                {job?.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <p className="text-base">{job.location}</p>
                    </div>
                  </div>
                )}
                
                {job?.salary_min && job?.salary_max && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Salary Range</label>
                    <p className="text-base">${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}</p>
                  </div>
                )}
                
                <Link to={`/recruiter/jobs/${job?.id}`} className="text-blue-600 hover:underline text-sm">
                  View Job Details →
                </Link>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadResume}
                  disabled={!application?.candidate_id || downloadingResume}
                >
                  {downloadingResume ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Resume
                    </>
                  )}
                </Button>
                
                {application?.candidate?.email && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = `mailto:${application.candidate.email}`}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;