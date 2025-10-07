import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { jobService } from '../../services';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Edit,
  Trash2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";

const RecruiterJobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);
  
  const fetchJobDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get job details
      const jobResponse = await jobService.getJob(jobId);
      
      if (jobResponse.success) {
        const jobData = jobResponse.data;
        
        // Verify the job belongs to the current recruiter
        if (jobData.posted_by !== user.id) {
          setError('You do not have permission to view this job');
          setLoading(false);
          return;
        }
        
        setJob(jobData);
        
        // Get applications for this job
        try {
          const appsResponse = await jobService.getJobApplications(jobId);
          if (appsResponse.success) {
            setApplications(appsResponse.data || []);
          }
        } catch (appsError) {
          console.error('Error getting applications:', appsError);
          // Don't set error state, as getting the job was successful
        }
      } else {
        setError('Failed to load job details');
      }
    } catch (err) {
      setError('Error loading job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditJob = () => {
    navigate(`/recruiter/edit-job/${jobId}`, { state: { job } });
  };
  
  const handleDeleteJob = async () => {
    setDeleteLoading(true);
    
    try {
      const response = await jobService.deleteJob(jobId);
      
      if (response.success) {
        toast({
          title: "Job deleted",
          description: "The job posting has been removed successfully",
        });
        navigate('/recruiter/dashboard');
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to delete job",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while deleting the job",
      });
      console.error('Error deleting job:', error);
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Error</h3>
              <p className="text-red-600">{error || "Job not found or has been removed."}</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => navigate('/recruiter/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate('/recruiter/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <div className="space-x-2">
            <Button onClick={handleEditJob}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this job posting and all associated applications. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteJob}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:justify-between mb-6">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-semibold text-gray-900">{job.company}</h2>
                <div className="flex items-center mt-2 text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{job.location || "Remote"}</span>
                </div>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-gray-600 text-sm">Posted on</span>
                <span className="font-medium">{formatDate(job.created_at)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Experience</h3>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-600" />
                  <span className="font-medium">
                    {job.min_experience}-{job.max_experience} years
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Job Type</h3>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-gray-600" />
                  <span className="font-medium capitalize">
                    {job.job_type || "Full-time"}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Applications</h3>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-gray-600" />
                  <span className="font-medium">{applications.length || 0}</span>
                </div>
              </div>
            </div>
            
            {(job.salary_min || job.salary_max) && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Salary Range</h3>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-gray-600" />
                  <span className="font-medium">
                    {job.salary_min && job.salary_max
                      ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                      : job.salary_min
                      ? `From $${job.salary_min.toLocaleString()}`
                      : `Up to $${job.salary_max.toLocaleString()}`
                    }
                  </span>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Job Description</h3>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: job.description }} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills && job.required_skills.length > 0 ? (
                    job.required_skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No required skills specified</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Preferred Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.preferred_skills && job.preferred_skills.length > 0 ? (
                    job.preferred_skills.map((skill, i) => (
                      <Badge key={i} variant="outline">{skill}</Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No preferred skills specified</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Applications ({applications.length})</CardTitle>
            <CardDescription>
              Manage candidates who have applied to this position
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div 
                    key={app.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/recruiter/applications/${app.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{app.candidate?.full_name || "Unnamed Candidate"}</h3>
                        <p className="text-sm text-gray-600">
                          Applied on {formatDate(app.created_at)}
                        </p>
                      </div>
                      <Badge>{app.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No applications yet</h3>
                <p className="text-gray-600 mb-4">
                  Share your job posting to start receiving applications
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Copy job URL to clipboard
                    const url = `${window.location.origin}/jobs/${job.id}`;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "URL Copied",
                      description: "Job posting URL copied to clipboard",
                    });
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Copy Job URL
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecruiterJobDetails;