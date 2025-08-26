import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Get the hash fragment from the URL
        const hashFragment = window.location.hash;

        if (hashFragment && hashFragment.length > 0) {
          // Exchange the auth code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment);

          if (error) {
            console.error('Error exchanging code for session:', error.message);
            setError(error.message);
            setTimeout(() => {
              navigate('/login?error=' + encodeURIComponent(error.message));
            }, 3000);
            return;
          }

          if (data.session) {
            // Successfully signed in, redirect to app
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
            return;
          }
        }

        // If we get here, something went wrong
        setError('Keine Session gefunden');
        setTimeout(() => {
          navigate('/login?error=No session found');
        }, 3000);
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Ein unerwarteter Fehler ist aufgetreten');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    }

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <LoadingSpinner size="lg" />
        </div>
        
        {loading ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Anmeldung wird verarbeitet...
            </h2>
            <p className="text-gray-600">
              Einen Moment bitte, während wir dich anmelden.
            </p>
          </>
        ) : error ? (
          <>
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Fehler bei der Anmeldung
            </h2>
            <p className="text-red-600 mb-4">
              {error}
            </p>
            <p className="text-gray-600">
              Du wirst in Kürze zurück zur Anmeldeseite weitergeleitet...
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              Anmeldung erfolgreich!
            </h2>
            <p className="text-gray-600">
              Du wirst zum Dashboard weitergeleitet...
            </p>
          </>
        )}
      </div>
    </div>
  );
}