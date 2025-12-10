'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Box,
  Grid,
} from "@mui/material";
import { styled } from "@mui/system";

const GradientBackground = styled(Box)({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
});

const StyledPaper = styled(Paper)({
  padding: "2rem",
  borderRadius: "15px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
});

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!user) return;

    const currentPath = window.location.pathname;
    if (currentPath === "/login") {
      if (user.role === "jobseeker") router.push("/jobseeker/dashboard");
      else if (user.role === "employer") router.push("/employer/dashboard");
    }
  }, [user]);

  useEffect(() => {
    const msg = searchParams?.get("message");
    if (msg) setMessage(msg);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <GradientBackground>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left Side */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box textAlign="center" color="white">
              <Typography variant="h2" fontWeight="bold">
                NextHire
              </Typography>
              <Typography variant="h5">Find Your Dream Job Today</Typography>
              <Typography variant="body1">
                Connect with top employers and unlock your true potential.
              </Typography>
            </Box>
          </Grid>

          {/* Login Form */}
          <Grid size={{ xs: 12, md: 6 }}>
            <StyledPaper>
              <Typography
                variant="h4"
                textAlign="center"
                color="primary"
                gutterBottom
              >
                Welcome Back
              </Typography>

              {error && <Alert severity="error">{error}</Alert>}
              {message && <Alert severity="success">{message}</Alert>}

              <form onSubmit={handleSubmit} autoComplete="off">
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  inputProps={{
                    "data-form-type": "other", // Prevent extension processing
                    autoComplete: "off",
                  }}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  inputProps={{
                    "data-form-type": "other", // Prevent extension auto-fill
                    autoComplete: "new-password",
                  }}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  margin="normal"
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Sign In
                </Button>

                <Box textAlign="center">
                  <Button
                    color="primary"
                    onClick={() => router.push("/register")}
                  >
                    Don't have an account? Sign up
                  </Button>
                </Box>
              </form>
            </StyledPaper>
          </Grid>
        </Grid>
      </Container>
    </GradientBackground>
  );
}
