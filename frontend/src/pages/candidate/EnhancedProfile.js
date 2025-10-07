import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { resumeService, profileService, skillService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Award, Globe, Code, FileText, Edit3, Save, X, Plus,
  Upload, Download, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const EnhancedProfile = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      // Get enhanced parsed resume data
      const resumeResponse = await resumeService.getParsedData();
      if (resumeResponse.success) {
        setProfileData({
          ...user,
          ...resumeResponse.data,
          // Merge any existing profile data with resume data
          full_name: user.full_name || '',
          email: user.email || '',
          bio: resumeResponse.data.bio || user.bio || '',
          location: resumeResponse.data.location || user.location || '',
          phone: resumeResponse.data.phone || user.phone || '',
        });
      } else {
        // Fallback to user data if no resume data
        setProfileData(user);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setProfileData(user);
    }
  };

  const handleSkillSearch = async (value) => {
    setSkillSearch(value);
    if (value.length >= 2) {
      try {
        const response = await skillService.searchSkills(value);
        if (response.success) {
          const filteredSkills = response.data.filter(
            (skill) => !profileData.skills?.includes(skill)
          );
          setSkillSuggestions(filteredSkills);
          setShowSkillSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    } else {
      setSkillSuggestions([]);
      setShowSkillSuggestions(false);
    }
  };

  const addSkill = (skill) => {
    if (!profileData.skills?.includes(skill)) {
      setProfileData({
        ...profileData,
        skills: [...(profileData.skills || []), skill],
      });
    }
    setSkillSearch('');
    setSkillSuggestions([]);
    setShowSkillSuggestions(false);
  };

  const removeSkill = (skillToRemove) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills?.filter((skill) => skill !== skillToRemove) || [],
    });
  };

  const handleInputChange = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await profileService.updateProfile(user.id, profileData);
      if (response.success) {
        await checkAuth();
        setEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/candidate/dashboard')} className="mb-4">
          ← Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {profileData.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{profileData.full_name || 'Your Name'}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-2">
                      {profileData.email && (
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {profileData.email}
                        </span>
                      )}
                      {profileData.phone && (
                        <span className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {profileData.phone}
                        </span>
                      )}
                      {profileData.location && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {profileData.location}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!editing ? (
                    <>
                      <Button variant="outline" onClick={() => navigate('/candidate/upload-resume')}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Resume
                      </Button>
                      <Button onClick={() => setEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            {profileData.resume_filename && (
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Resume: {profileData.resume_filename}</span>
                    {profileData.resume_uploaded_at && (
                      <span className="text-xs text-gray-500">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(profileData.resume_uploaded_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
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
                    Profile Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={profileData.full_name || ''}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location || ''}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Professional Summary</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio || ''}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profileData.bio && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Professional Summary</h4>
                          <p className="text-gray-600">{profileData.bio}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Experience Level</h4>
                          <p className="flex items-center text-gray-600">
                            <Briefcase className="h-4 w-4 mr-2" />
                            {profileData.experience || 0} years
                          </p>
                        </div>
                        {profileData.job_titles && profileData.job_titles.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Recent Positions</h4>
                            <div className="flex flex-wrap gap-1">
                              {profileData.job_titles.slice(0, 3).map((title, idx) => (
                                <Badge key={idx} variant="secondary">{title}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                    <div className="text-center text-2xl font-bold text-blue-600">
                      {profileData.experience || 0} Years
                    </div>
                    {profileData.job_titles && profileData.job_titles.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Job Titles Held:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {profileData.job_titles.map((title, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
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
                  {profileData.education && profileData.education.length > 0 ? (
                    <div className="space-y-4">
                      {profileData.education.map((edu, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <h4 className="font-semibold">{edu.degree}</h4>
                          <p className="text-gray-600">{edu.institution}</p>
                          {edu.year && <p className="text-sm text-gray-500">{edu.year}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No education information available. Upload a resume or add manually.</p>
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
                  {editing && (
                    <div className="mb-4 relative">
                      <Label htmlFor="skill-search">Add Skills</Label>
                      <Input
                        id="skill-search"
                        placeholder="Search and add skills..."
                        value={skillSearch}
                        onChange={(e) => handleSkillSearch(e.target.value)}
                      />
                      {showSkillSuggestions && skillSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                          {skillSuggestions.map((skill, idx) => (
                            <button
                              key={idx}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                              onClick={() => addSkill(skill)}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {profileData.skills && profileData.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.map((skill, idx) => (
                        <div key={idx} className="relative">
                          <Badge variant="default" className="pr-8">
                            {skill}
                            {editing && (
                              <button
                                onClick={() => removeSkill(skill)}
                                className="absolute right-1 top-0.5 text-white hover:bg-red-600 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            )}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No skills listed. Upload a resume or add skills manually.</p>
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
                  {profileData.achievements && profileData.achievements.length > 0 ? (
                    <ul className="space-y-2">
                      {profileData.achievements.map((achievement, idx) => (
                        <li key={idx} className="flex items-start">
                          <Award className="h-4 w-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No achievements listed. Upload a resume to extract achievements automatically.</p>
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
                    {profileData.certifications && profileData.certifications.length > 0 ? (
                      <div className="space-y-2">
                        {profileData.certifications.map((cert, idx) => (
                          <div key={idx} className="p-2 bg-purple-50 rounded text-purple-800">
                            {cert}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-sm">No certifications listed.</p>
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
                    {profileData.languages && profileData.languages.length > 0 ? (
                      <div className="space-y-2">
                        {profileData.languages.map((lang, idx) => (
                          <div key={idx} className="p-2 bg-orange-50 rounded text-orange-800">
                            {lang}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-sm">No languages listed.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Projects */}
                {profileData.projects && profileData.projects.length > 0 && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Code className="h-5 w-5 mr-2" />
                        Projects
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profileData.projects.map((project, idx) => (
                          <div key={idx} className="p-4 border rounded-lg">
                            <h4 className="font-semibold">{project.name}</h4>
                            {project.description && (
                              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                            )}
                            {project.technologies && project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
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

export default EnhancedProfile;