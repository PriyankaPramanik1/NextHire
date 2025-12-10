'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Avatar,
} from '@mui/material';
import { TrendingUp, People, Work, Settings } from '@mui/icons-material';
import { styled } from '@mui/system';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// ----- Styled Components -----
const StatCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: 16,
  padding: theme.spacing(3),
}));

const RecentActivityCard = styled(Card)(() => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
}));

// ----- Types -----
interface Stats {
  totalJobs: number;
  totalApplications: number;
  recentApplications: number;
}

interface JobPerformance {
  _id: string;
  title: string;
  views: number;
  totalApplications: number;
}

interface Applicant {
  name: string;
  email: string;
}

interface Application {
  _id: string;
  applicant: Applicant;
  job: { title: string };
  createdAt: string;
}

// ----- Component -----
export default function EmployerDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    totalApplications: 0,
    recentApplications: 0,
  });

  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [jobPerformance, setJobPerformance] = useState<JobPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, recentAppsRes, perfRes] = await Promise.all([
        api.get<Stats>('/jobs/dashboard/stats'),
        api.get<Application[]>('/jobs/dashboard/recent-applications'),
        api.get<JobPerformance[]>('/jobs/dashboard/job-performance'),
      ]);

      setStats(statsRes.data);
      setRecentApplications(recentAppsRes.data);
      setJobPerformance(perfRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.totalJobs,
      icon: <Work sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      icon: <People sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Recent Applications (7 days)',
      value: stats.recentApplications,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
    },
  ];

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
    },
    colors: ['#4f46e5'],
    stroke: { curve: 'smooth' },
    xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  };

  const chartSeries = [
    {
    name: 'Applications',
    data: jobPerformance.map((job) => job.totalApplications),
  },
  ];

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <LinearProgress sx={{ width: '40%' }} />
      </Box>
    );

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" fontWeight="700" mb={3}>
        Welcome back, Employer 👋
      </Typography>

      {/* Stat Cards */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((card, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">{card.title}</Typography>
                {card.icon}
              </Box>
              <Typography variant="h3" fontWeight={700} mt={1}>
                {card.value}
              </Typography>
            </StatCard>
          </Grid>
        ))}
      </Grid>

      {/* Row: Chart + Performance */}
      <Grid container spacing={3}>
        {/* Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <RecentActivityCard>
            <CardContent>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Applications Overview
              </Typography>
              <Chart options={chartOptions} series={chartSeries} type="area" height={300} />
            </CardContent>
          </RecentActivityCard>
        </Grid>

        {/* Job Performance */}
        <Grid size={{ xs: 12, md: 4 }}>
          <RecentActivityCard>
            <CardContent>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Job Performance
              </Typography>
              {jobPerformance.map((job) => (
                <Box
                  key={job._id}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                >
                  <Typography fontWeight="600">{job.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Views: {job.views}
                  </Typography>
                  <Chip
                    label={`${job.totalApplications} Applications`}
                    size="small"
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </Box>
              ))}
            </CardContent>
          </RecentActivityCard>
        </Grid>

        {/* Recent Applications */}
        <Grid size={{ xs: 12 }}>
          <RecentActivityCard>
            <CardContent>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Recent Applications
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Applicant</TableCell>
                      <TableCell>Job</TableCell>
                      <TableCell>Applied</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentApplications.map((app) => (
                      <TableRow key={app._id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2 }}>
                              {app.applicant.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography>{app.applicant.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {app.applicant.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{app.job.title}</TableCell>
                        <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </RecentActivityCard>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box mt={4}>
        <Typography variant="h6" fontWeight="600" mb={2}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button fullWidth variant="contained" startIcon={<Work />}>
              Post New Job
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button fullWidth variant="outlined" startIcon={<People />}>
              View applications
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button fullWidth variant="outlined" startIcon={<Settings />}>
              Company Settings
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
