import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const IndeedJobSearch = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>External Job Search</CardTitle>
          <CardDescription>
            This feature has been removed as requested
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="mb-4">The Indeed integration has been removed as requested.</p>
            <p className="mb-4">Please use our internal job posting system instead.</p>
            <Button
              onClick={() => navigate('/recruiter/post-job')}
            >
              Create a New Job Posting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndeedJobSearch;