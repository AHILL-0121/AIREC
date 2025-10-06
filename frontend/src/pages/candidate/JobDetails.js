import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService, aiMatchService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Briefcase, MapPin, DollarSign, Clock, ArrowLeft, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const [jobRes, scoreRes] = await Promise.all([
        jobService.getJob(jobId),
        aiMatchService.getMatchScore(jobId).catch(() => null),
      ]);

      if (jobRes.success) {
        setJob(jobRes.data);
      }
      if (scoreRes && scoreRes.success) {
        setMatchScore(scoreRes.data);
      }
    } catch (error) {
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job not found</h2>
          <Button onClick={() => navigate('/candidate/feed')}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/candidate/feed')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                  <p className="text-xl text-gray-700 mb-4">{job.company}</p>
                  <div className="flex flex-wrap gap-4 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{job.min_experience}-{job.max_experience} years experience</span>
                    </div>
                    {job.salary_range && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{job.salary_range}</span>
                      </div>
                    )}
                  </div>
                </div>
                {matchScore && (
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{matchScore.match_percentage}%</div>
                    <p className="text-sm text-gray-600">Match Score</p>
                  </div>
                )}
              </div>
              <Button size="lg" className="w-full mt-4">
                Apply Now
              </Button>
            </CardContent>
          </Card>

          {/* Match Analysis */}
          {matchScore && (
            <Card>
              <CardHeader>
                <CardTitle>Your Match Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matchScore.matched_skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-2" />
                        Your Matching Skills ({matchScore.matched_skills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {matchScore.matched_skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {matchScore.missing_skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center text-orange-600">
                        <X className="h-4 w-4 mr-2" />
                        Skills to Develop ({matchScore.missing_skills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {matchScore.missing_skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </CardContent>
          </Card>

          {/* Required Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
