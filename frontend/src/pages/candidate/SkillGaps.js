import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { TrendingUp, Target, Award, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const SkillGaps = () => {
  const navigate = useNavigate();
  const [skillData, setSkillData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillGaps();
  }, []);

  const fetchSkillGaps = async () => {
    try {
      const response = await analyticsService.getSkillGaps();
      if (response.success) {
        setSkillData(response.data);
      }
    } catch (error) {
      toast.error('Failed to load skill gap analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Analyzing your skills...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/candidate/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Skill Gap Analysis</h1>
          <p className="text-gray-600">Identify skills to learn and boost your career prospects</p>
        </div>

        <div className="space-y-6">
          {/* Current Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-green-600" />
                Your Current Skills ({skillData?.skill_count || 0})
              </CardTitle>
              <CardDescription>Skills extracted from your resume</CardDescription>
            </CardHeader>
            <CardContent>
              {skillData?.current_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillData.current_skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No skills found. Upload your resume to get started.</p>
              )}
            </CardContent>
          </Card>

          {/* High-Demand Skills You're Missing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                High-Demand Skills to Learn
              </CardTitle>
              <CardDescription>Top skills requested by employers that you don't have yet</CardDescription>
            </CardHeader>
            <CardContent>
              {skillData?.missing_high_demand_skills.length > 0 ? (
                <div className="space-y-4">
                  {skillData.missing_high_demand_skills.map((item, idx) => (
                    <div key={idx} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-lg capitalize">{item.skill}</h4>
                        <span className="text-sm text-gray-600">{item.jobs_requiring} jobs</span>
                      </div>
                      <Progress value={(item.demand / skillData.missing_high_demand_skills[0].demand) * 100} className="h-2" />
                      <p className="text-sm text-gray-600 mt-1">Required by {item.jobs_requiring} job postings</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Great! You have most in-demand skills.</p>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>Action items to improve your job prospects</CardDescription>
            </CardHeader>
            <CardContent>
              {skillData?.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {skillData.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-semibold">{idx + 1}</span>
                      </div>
                      <p className="text-gray-700">{rec}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No specific recommendations at this time.</p>
              )}
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-2">Ready to Level Up?</h3>
              <p className="mb-4">Start learning these skills to increase your job matches and opportunities.</p>
              <Button variant="secondary">Explore Learning Resources</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SkillGaps;
