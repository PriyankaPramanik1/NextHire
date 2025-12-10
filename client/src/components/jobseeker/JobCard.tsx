import { Card, CardContent, Typography, Button, Box, Chip } from '@mui/material';
import { LocationOn, Business, AttachMoney, Schedule } from '@mui/icons-material';
import { Job } from '@/types';
import { useRouter } from 'next/navigation';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const router = useRouter();

  const handleViewJob = () => {
    router.push(`/jobseeker/jobs/${job._id}`);
  };

  const formatSalary = (min: number, max: number, currency: string) => {
    return `$${min.toLocaleString()} - $${max.toLocaleString()} ${currency}`;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {job.title}
        </Typography>
        
        <Box display="flex" alignItems="center" mb={1}>
          <Business sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {job.employer.company.name}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {job.location}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={2}>
          <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={2}>
          <Schedule sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {job.type.replace('-', ' ')}
          </Typography>
        </Box>

        <Box mb={2}>
          {job.skills.slice(0, 3).map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              size="small"
              variant="outlined"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
          {job.skills.length > 3 && (
            <Chip
              label={`+${job.skills.length - 3}`}
              size="small"
              variant="outlined"
              sx={{ mb: 0.5 }}
            />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {job.description.length > 150 
            ? `${job.description.substring(0, 150)}...` 
            : job.description
          }
        </Typography>

        <Button
          variant="contained"
          fullWidth
          onClick={handleViewJob}
          sx={{ mt: 'auto' }}
        >
          View Job
        </Button>
      </CardContent>
    </Card>
  );
}