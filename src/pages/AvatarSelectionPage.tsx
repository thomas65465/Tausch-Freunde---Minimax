import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This page is replaced by OnboardingPage
// It redirects to onboarding page
export default function AvatarSelectionPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/onboarding');
  }, [navigate]);

  return null;
}