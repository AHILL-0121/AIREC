import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { jobService, skillService } from '../../services';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
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
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jobId } = useParams();
  const location = useLocation();
  const isEditMode = !!jobId;
  
  // Initial form data
  const initialFormData = {
    title: '',
    company: user?.company || '',
    location: '',
    job_type: 'full-time',
    min_experience: 0,
    max_experience: 2,
    salary_min: '',
    salary_max: '',
    description: '',
    required_skills: [],
    preferred_skills: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [isRequired, setIsRequired] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [submitError, setSubmitError] = useState(null);
  


  // Load existing job data if in edit mode
  useEffect(() => {
    const loadJobData = async () => {
      if (isEditMode) {
        setInitialLoading(true);
        try {
          // First try to use job data from location state (if available)
          if (location.state?.job) {
            setFormData(location.state.job);
            setInitialLoading(false);
            return;
          }
          
          // Otherwise fetch from the API
          const response = await jobService.getJob(jobId);
          if (response.success) {
            // Verify the job belongs to the current recruiter
            if (response.data.posted_by !== user.id) {
              setSubmitError('You do not have permission to edit this job');
              navigate('/recruiter/dashboard');
              return;
            }
            
            setFormData(response.data);
          } else {
            setSubmitError('Failed to load job details');
            navigate('/recruiter/dashboard');
          }
        } catch (error) {
          console.error('Error loading job details:', error);
          setSubmitError('Error loading job details');
          navigate('/recruiter/dashboard');
        } finally {
          setInitialLoading(false);
        }
      }
    };

    loadJobData();
  }, [jobId, isEditMode, navigate, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillSearch = async (e) => {
    const value = e.target.value;
    setSkillSearch(value);
    
    if (value.length >= 2) {
      try {
        const response = await skillService.searchSkills(value);
        if (response.success) {
          const currentSkills = [
            ...formData.required_skills, 
            ...formData.preferred_skills
          ];
          
          // Filter out skills already added
          const filteredSuggestions = response.data.filter(
            skill => !currentSkills.includes(skill)
          );
          
          setSkillSuggestions(filteredSuggestions);
        }
      } catch (error) {
        console.error('Error searching skills:', error);
      }
    } else {
      setSkillSuggestions([]);
    }
  };

  const addSkill = (skill) => {
    setFormData(prev => {
      const target = isRequired ? 'required_skills' : 'preferred_skills';
      const updatedSkills = [...prev[target], skill];
      
      return {
        ...prev,
        [target]: updatedSkills
      };
    });
    
    setSkillSearch('');
    setSkillSuggestions([]);
  };

  const removeSkill = (skill, type) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(s => s !== skill)
    }));
  };
  


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);
    
    try {
      let response;
      
      if (isEditMode) {
        // Update existing job
        response = await jobService.updateJob(jobId, formData);
        if (response.success) {
          toast({
            title: "Success!",
            description: "Job posting updated successfully",
          });
        }
      } else {
        // Create new job
        response = await jobService.createJob(formData);
        if (response.success) {
          toast({
            title: "Success!",
            description: "Job posting created successfully",
          });
        }
      }
      
      if (response.success) {
        // Check for id or _id field and navigate
        const responseJobId = response.data.id || response.data._id || jobId;
        if (responseJobId) {
          navigate(`/recruiter/jobs/${responseJobId}`);
        } else {
          // If no ID found, go to jobs dashboard
          navigate('/recruiter/dashboard');
          console.error('No job ID returned from API', response.data);
        }
      } else {
        setSubmitError(response.message || `Failed to ${isEditMode ? 'update' : 'create'} job posting`);
      }
    } catch (error) {
      setSubmitError(error.response?.data?.detail || `Error ${isEditMode ? 'updating' : 'creating'} job`);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} job:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Job Posting' : 'Post a New Job'}
          </h1>
          <p className="text-gray-600">
            {isEditMode 
              ? 'Update your job posting details' 
              : 'Create a job posting to find the perfect candidate'
            }
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the basic details about the position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title*
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company*
                </label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Your company name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location*
                  </label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Remote, New York, NY"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="job_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type*
                  </label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(value) => handleSelectChange('job_type', value)}
                    required
                  >
                    <SelectTrigger id="job_type">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Requirements & Compensation</CardTitle>
              <CardDescription>
                Define experience requirements and compensation range
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Required (years)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Select
                        value={formData.min_experience.toString()}
                        onValueChange={(value) => handleSelectChange('min_experience', parseInt(value))}
                      >
                        <SelectTrigger id="min_experience">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="10">10+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select
                        value={formData.max_experience.toString()}
                        onValueChange={(value) => handleSelectChange('max_experience', parseInt(value))}
                      >
                        <SelectTrigger id="max_experience">
                          <SelectValue placeholder="Max" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Range (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        id="salary_min"
                        name="salary_min"
                        value={formData.salary_min}
                        onChange={handleChange}
                        placeholder="Min"
                        type="number"
                      />
                    </div>
                    <div>
                      <Input
                        id="salary_max"
                        name="salary_max"
                        value={formData.salary_max}
                        onChange={handleChange}
                        placeholder="Max"
                        type="number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
              <CardDescription>
                Provide a detailed description of the role and responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the job responsibilities, qualifications, and any other relevant details..."
                className="min-h-40"
                required
              />
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                Add the skills required or preferred for this position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label htmlFor="skillSearch" className="block text-sm font-medium text-gray-700">
                    Add Skills
                  </label>
                  <div className="flex items-center">
                    <label className="inline-flex items-center text-sm mr-4">
                      <input
                        type="radio"
                        checked={isRequired}
                        onChange={() => setIsRequired(true)}
                        className="mr-1"
                      />
                      <span>Required</span>
                    </label>
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="radio"
                        checked={!isRequired}
                        onChange={() => setIsRequired(false)}
                        className="mr-1"
                      />
                      <span>Preferred</span>
                    </label>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex gap-2">
                    <Input
                      id="skillSearch"
                      value={skillSearch}
                      onChange={handleSkillSearch}
                      placeholder="Search for skills to add..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && skillSearch.trim()) {
                          e.preventDefault();
                          addSkill(skillSearch.trim());
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={() => skillSearch.trim() && addSkill(skillSearch.trim())}
                      className="whitespace-nowrap"
                    >
                      Add Skill
                    </Button>
                  </div>
                  
                  {skillSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {skillSuggestions.map((skill, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => addSkill(skill)}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h4>
                {formData.required_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.required_skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="pl-3 py-1 flex items-center">
                        {skill}
                        <button 
                          type="button"
                          onClick={() => removeSkill(skill, 'required_skills')}
                          className="ml-2 rounded-full hover:bg-gray-200 h-5 w-5 flex items-center justify-center text-gray-500"
                        >
                          ✕
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No required skills added yet</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preferred Skills</h4>
                {formData.preferred_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.preferred_skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="pl-3 py-1 flex items-center">
                        {skill}
                        <button 
                          type="button"
                          onClick={() => removeSkill(skill, 'preferred_skills')}
                          className="ml-2 rounded-full hover:bg-gray-200 h-5 w-5 flex items-center justify-center text-gray-500"
                        >
                          ✕
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No preferred skills added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {submitError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{submitError}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/recruiter/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;