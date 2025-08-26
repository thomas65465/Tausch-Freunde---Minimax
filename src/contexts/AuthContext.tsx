import { createContext, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../lib/supabase';
import toast from 'react-hot-toast';

// Helper function to translate auth errors to German
function translateAuthError(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Ungültige E-Mail-Adresse oder Passwort. Bitte überprüfen Sie Ihre Eingaben.',
    'invalid_grant': 'Ungültige E-Mail-Adresse oder Passwort. Bitte überprüfen Sie Ihre Eingaben.',
    'Invalid email or password': 'Ungültige E-Mail-Adresse oder Passwort. Bitte überprüfen Sie Ihre Eingaben.',
    'Email not confirmed': 'Bitte bestätigen Sie Ihre E-Mail-Adresse.',
    'User not found': 'Benutzer nicht gefunden. Bitte registrieren Sie sich zuerst.',
    'Password is too short': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    'Password should be at least 6 characters': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    'User already registered': 'Ein Konto mit dieser E-Mail-Adresse existiert bereits.',
    'Unable to validate email address': 'E-Mail-Adresse ungültig. Bitte überprüfen Sie Ihre Eingabe.',
    'Signup is disabled': 'Registrierung ist momentan deaktiviert.',
    'Password is too weak': 'Das Passwort ist zu schwach. Bitte wählen Sie ein stärkeres Passwort.',
    'Email rate limit exceeded': 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
    'Too many requests': 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
  };
  
  // Check for exact matches first
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Return original message if no translation found
  return errorMessage;
}

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: User | null;
  loading: boolean;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  createUserProfile: (username: string, avatarPath: string) => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  isNewUser: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile after user is set
  useEffect(() => {
    if (user) {
      loadUserProfile(user.id);
    } else {
      setUserProfile(null);
    }
  }, [user]);

  // Initialize auth state on mount with enhanced session handling
  useEffect(() => {
    async function initializeAuth() {
      try {
        setLoading(true);
        
        // Enhanced session recovery - check for stored session
        const storedSession = localStorage.getItem('sticker-app-session');
        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession.expires_at && new Date(parsedSession.expires_at * 1000) > new Date()) {
              // Session is still valid, try to restore
              await supabase.auth.setSession(parsedSession);
            } else {
              // Session expired, remove it
              localStorage.removeItem('sticker-app-session');
            }
          } catch (e) {
            // Invalid stored session, remove it
            localStorage.removeItem('sticker-app-session');
          }
        }
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Store session for persistence
          localStorage.setItem('sticker-app-session', JSON.stringify(session));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    }
    
    initializeAuth();

    // Set up auth listener with enhanced session persistence
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user || null);
        
        // Handle specific events with session storage
        if (event === 'SIGNED_IN' && session) {
          // Store session for persistence
          localStorage.setItem('sticker-app-session', JSON.stringify(session));
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          // Clear all cached data
          localStorage.removeItem('sticker-app-user-profile');
          localStorage.removeItem('sticker-app-session');
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Update stored session with new tokens
          localStorage.setItem('sticker-app-session', JSON.stringify(session));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string) {
    try {
      // First check cache for better UX
      const cached = localStorage.getItem('sticker-app-user-profile');
      if (cached) {
        try {
          const cachedProfile = JSON.parse(cached);
          if (cachedProfile.id === userId) {
            setUserProfile(cachedProfile);
          }
        } catch (e) {
          // Invalid cache, ignore
        }
      }

      // Fetch fresh data
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setUserProfile(data);
        // Cache the profile
        localStorage.setItem('sticker-app-user-profile', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async function sendMagicLink(email: string) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`,
          // Enhanced session configuration for persistent login
          data: {
            remember_me: true,
            persistent_session: true
          }
        }
      });

      if (error) {
        const errorMessage = translateAuthError(error.message);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success('Magic Link wurde an Ihre E-Mail-Adresse gesendet! Prüfen Sie Ihr Postfach.');
    } catch (error: any) {
      console.error('Magic link error:', error);
      const errorMessage = error.message || 'Fehler beim Senden des Magic Links';
      toast.error(errorMessage);
      throw error;
    }
  }

  async function createUserProfile(username: string, avatarPath: string) {
    if (!user) {
      throw new Error('Benutzer nicht angemeldet');
    }

    try {
      // Generiere einen einzigartigen Freundescode
      const friendCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          username,
          avatar_path: avatarPath,
          friend_code: friendCode
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        const errorMessage = error.code === '23505' 
          ? 'Dieser Benutzername ist bereits vergeben. Bitte wählen Sie einen anderen.'
          : 'Fehler beim Erstellen des Profils';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      setUserProfile(data);
      toast.success('Profil erfolgreich erstellt!');
    } catch (error: any) {
      console.error('Create profile error:', error);
      throw error;
    }
  }

  async function checkUsernameAvailability(username: string): Promise<boolean> {
    if (!username || username.length < 3) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Username check error:', error);
        return false;
      }

      return !data; // Verfügbar wenn kein Benutzer gefunden wurde
    } catch (error) {
      console.error('Username check error:', error);
      return false;
    }
  }

  function isNewUser(): boolean {
    return user !== null && userProfile === null;
  }

  async function signOut() {
    // Clear all cached data before signing out
    localStorage.removeItem('sticker-app-user-profile');
    localStorage.removeItem('sticker-app-session');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error(error.message || 'Fehler beim Abmelden');
      throw error;
    }
    
    toast.success('Erfolgreich abgemeldet!');
  }

  async function updateProfile(updates: Partial<User>) {
    if (!user) {
      throw new Error('User not logged in');
    }

    const { data: currentUser } = await supabase.auth.getUser();
    
    if (!currentUser.user) {
      throw new Error('User nicht gefunden');
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUser.user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Fehler beim Aktualisieren des Profils');
      throw error;
    }

    setUserProfile(data);
    toast.success('Profil erfolgreich aktualisiert!');
  }

  async function refreshProfile() {
    if (user) {
      await loadUserProfile(user.id);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      sendMagicLink,
      signOut,
      updateProfile,
      refreshProfile,
      createUserProfile,
      checkUsernameAvailability,
      isNewUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}