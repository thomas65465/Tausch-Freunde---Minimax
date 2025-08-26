import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This page is no longer needed since we use Magic Links
// It redirects to login page
export default function RegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login');
  }, [navigate]);

  return null;
}