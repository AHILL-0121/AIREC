import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileService, resumeService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Award, Globe, Code, FileText, Download, Calendar, 
  ArrowLeft, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const CandidateProfileView = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingResume, setDownloadingResume] = useState(false);

  useEffect(() => {
    if (candidateId) {
      loadCandidateProfile();
    }
  }, [candidateId]);

  const loadCandidateProfile = async () => {
    try {
      const response = await profileService.getCandidateProfile(candidateId);
      if (response.success) {
        setCandidate(response.data);
      } else {
        toast.error('Failed to load candidate profile');
      }
    } catch (error) {
      console.error('Error loading candidate profile:', error);
      toast.error('Failed to load candidate profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!candidate.resume_filename) {
      toast.error('No resume available for this candidate');
      return;
    }

    setDownloadingResume(true);
    try {
      const response = await resumeService.downloadCandidateResume(candidateId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = candidate.resume_filename || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Resume downloaded successfully');
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast.error('Failed to download resume');
    } finally {
      setDownloadingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">Loading candidate profile...</div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardContent className="text-center py-8">
              <p>Candidate not found or you don't have permission to view this profile.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {candidate.full_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{candidate.full_name || 'Candidate'}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-2">
                      {candidate.email && (
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {candidate.email}
                        </span>
                      )}
                      {candidate.phone && (
                        <span className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {candidate.phone}
                        </span>
                      )}
                      {candidate.location && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {candidate.location}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {candidate.resume_filename && (
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadResume}
                      disabled={downloadingResume}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadingResume ? 'Downloading...' : 'Download Resume'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {candidate.resume_filename && (
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Resume: {candidate.resume_filename}</span>
                    {candidate.resume_uploaded_at && (
                      <span className="text-xs text-gray-500">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(candidate.resume_uploaded_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Badge variant={candidate.profile_complete ? 'default' : 'secondary'}>
                    {candidate.profile_complete ? 'Complete Profile' : 'Incomplete Profile'}
                  </Badge>
                </div>
              </CardContent>
            )}
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Candidate Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidate.bio && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Professional Summary</h4>
                      <p className="text-gray-600">{candidate.bio}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Experience Level</h4>
                      <p className="flex items-center text-gray-600">
                        <Briefcase className="h-4 w-4 mr-2" />
                        {candidate.experience || 0} years
                      </p>
                    </div>
                    
                    {candidate.job_titles && candidate.job_titles.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Recent Positions</h4>
                        <div className="flex flex-wrap gap-1">
                          {candidate.job_titles.slice(0, 3).map((title, idx) => (
                            <Badge key={idx} variant="secondary">{title}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{candidate.skills?.length || 0}</div>
                      <div className="text-xs text-gray-600">Skills</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{candidate.experience || 0}</div>
                      <div className="text-xs text-gray-600">Years Exp.</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{candidate.education?.length || 0}</div>
                      <div className="text-xs text-gray-600">Education</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{candidate.achievements?.length || 0}</div>
                      <div className="text-xs text-gray-600">Achievements</div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Profile created: {new Date(candidate.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center text-3xl font-bold text-blue-600">
                      {candidate.experience || 0} Years
                    </div>
                    
                    {candidate.job_titles && candidate.job_titles.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Positions Held:</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {candidate.job_titles.map((title, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                              <span className="font-medium">{title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.education && candidate.education.length > 0 ? (
                    <div className="space-y-4">
                      {candidate.education.map((edu, idx) => (
                        <div key={idx} className="p-4 border rounded-lg border-l-4 border-green-500">
                          <h4 className="font-semibold text-lg">{edu.degree}</h4>
                          <p className="text-gray-600 font-medium">{edu.institution}</p>
                          {edu.year && (
                            <p className="text-sm text-gray-500 mt-1">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {edu.year}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No education information available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Skills & Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.skills && candidate.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, idx) => (
                        <Badge key={idx} variant="default" className="text-sm py-1 px-3">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No skills listed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Achievements & Accomplishments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.achievements && candidate.achievements.length > 0 ? (
                    <ul className="space-y-3">
                      {candidate.achievements.map((achievement, idx) => (
                        <li key={idx} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                          <Award className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No achievements listed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Additional Info Tab */}
            <TabsContent value="additional">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Certifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Award className="h-5 w-5 mr-2" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {candidate.certifications && candidate.certifications.length > 0 ? (
                      <div className="space-y-2">
                        {candidate.certifications.map((cert, idx) => (
                          <div key={idx} className="p-3 bg-purple-50 rounded border-l-4 border-purple-500 text-purple-800">
                            <Award className="h-4 w-4 inline mr-2" />
                            {cert}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No certifications listed</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Languages */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Globe className="h-5 w-5 mr-2" />
                      Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {candidate.languages && candidate.languages.length > 0 ? (
                      <div className="space-y-2">
                        {candidate.languages.map((lang, idx) => (
                          <div key={idx} className="p-3 bg-orange-50 rounded border-l-4 border-orange-500 text-orange-800">
                            <Globe className="h-4 w-4 inline mr-2" />
                            {lang}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No languages listed</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Projects */}
                {candidate.projects && candidate.projects.length > 0 && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Code className="h-5 w-5 mr-2" />
                        Projects
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {candidate.projects.map((project, idx) => (
                          <div key={idx} className="p-4 border rounded-lg border-l-4 border-indigo-500">
                            <h4 className="font-semibold text-lg flex items-center">
                              <Code className="h-4 w-4 mr-2" />
                              {project.name}
                            </h4>
                            {project.description && (
                              <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                            )}
                            {project.technologies && project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {project.technologies.map((tech, techIdx) => (
                                  <Badge key={techIdx} variant="outline" className="text-xs">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileView;