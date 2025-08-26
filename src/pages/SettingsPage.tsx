import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Album, User } from '../lib/supabase';
import { Settings, User as UserIcon, Palette, Package, Bell, Check, X, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AVATARS = [
  { name: 'Fuchs', path: '/images/avatars/fox.png' },
  { name: 'Panda', path: '/images/avatars/panda.png' },
  { name: 'Katze', path: '/images/avatars/cat.png' },
  { name: 'Hund', path: '/images/avatars/dog.png' },
  { name: 'Elefant', path: '/images/avatars/elephant.png' },
  { name: 'Löwe', path: '/images/avatars/lion.png' },
  { name: 'Bär', path: '/images/avatars/bear.png' },
  { name: 'Hase', path: '/images/avatars/rabbit.png' },
  { name: 'Pinguin', path: '/images/avatars/penguin.png' },
  { name: 'Affe', path: '/images/avatars/monkey.png' },
  { name: 'Eule', path: '/images/avatars/owl.png' },
  { name: 'Tiger', path: '/images/avatars/tiger.png' },
  { name: 'Giraffe', path: '/images/avatars/giraffe.png' },
  { name: 'Nilpferd', path: '/images/avatars/hippo.png' },
  { name: 'Koala', path: '/images/avatars/koala.png' },
  { name: 'Schwein', path: '/images/avatars/pig.png' }
];

interface AlbumWithStatus extends Album {
  user_album_status?: 'active' | 'inactive' | 'rejected';
  is_new?: boolean;
}

export default function SettingsPage() {
  const { user, userProfile, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'albums'>('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile settings
  const [username, setUsername] = useState(userProfile?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar_path || '');
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | 'error' | 'unchanged'>('unchanged');
  
  // Album settings
  const [albums, setAlbums] = useState<AlbumWithStatus[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username);
      setSelectedAvatar(userProfile.avatar_path);
    }
  }, [userProfile]);

  useEffect(() => {
    loadAlbumsWithStatus();
  }, [user]);

  async function loadAlbumsWithStatus() {
    if (!user) return;
    
    try {
      setAlbumsLoading(true);
      
      // Load all albums with user's status
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .order('created_at', { ascending: false });

      if (albumsError) throw albumsError;

      // Load user's album statuses
      const { data: userAlbumsData, error: userAlbumsError } = await supabase
        .from('user_albums')
        .select('*')
        .eq('user_id', user.id);

      if (userAlbumsError) throw userAlbumsError;

      // Merge data
      const userAlbumsMap = new Map(
        (userAlbumsData || []).map(ua => [ua.album_id, ua.status])
      );

      const albumsWithStatus: AlbumWithStatus[] = (albumsData || []).map(album => ({
        ...album,
        user_album_status: userAlbumsMap.get(album.id) || 'active'
      }));

      setAlbums(albumsWithStatus);
    } catch (error) {
      console.error('Error loading albums:', error);
      toast.error('Fehler beim Laden der Alben');
    } finally {
      setAlbumsLoading(false);
    }
  }

  async function handleUsernameChange(value: string) {
    setUsername(value);
    
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    if (value === userProfile?.username) {
      setUsernameStatus('unchanged');
      return;
    }

    if (value.length < 3) {
      setUsernameStatus('error');
      return;
    }

    setUsernameStatus('checking');
    
    const newTimeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('username', value)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Username check error:', error);
          setUsernameStatus('error');
          return;
        }

        setUsernameStatus(!data ? 'available' : 'taken');
      } catch (error) {
        console.error('Username check error:', error);
        setUsernameStatus('error');
      }
    }, 500);
    
    setCheckTimeout(newTimeout);
  }

  async function handleProfileUpdate() {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      
      const updates: Partial<User> = {};
      
      if (username !== userProfile.username && usernameStatus === 'available') {
        updates.username = username;
      }
      
      if (selectedAvatar !== userProfile.avatar_path) {
        updates.avatar_path = selectedAvatar;
      }
      
      if (Object.keys(updates).length === 0) {
        toast('Keine Änderungen zu speichern');
        return;
      }
      
      await updateProfile(updates);
      await refreshProfile();
      
      toast.success('Profil erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Fehler beim Aktualisieren des Profils');
    } finally {
      setLoading(false);
    }
  }

  async function handleAlbumStatusChange(albumId: string, newStatus: 'active' | 'inactive' | 'rejected') {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_albums')
        .upsert({
          user_id: user.id,
          album_id: albumId,
          status: newStatus
        });

      if (error) throw error;

      // Update local state
      setAlbums(prev => prev.map(album => 
        album.id === albumId 
          ? { ...album, user_album_status: newStatus }
          : album
      ));

      const album = albums.find(a => a.id === albumId);
      const statusText = {
        active: 'aktiviert',
        inactive: 'deaktiviert', 
        rejected: 'abgelehnt'
      }[newStatus];
      
      toast.success(`${album?.name || 'Album'} wurde ${statusText}`);
    } catch (error) {
      console.error('Error updating album status:', error);
      toast.error('Fehler beim Aktualisieren des Album-Status');
    }
  }

  const canSaveProfile = (
    (username !== userProfile?.username && usernameStatus === 'available') ||
    selectedAvatar !== userProfile?.avatar_path
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary p-2"
                title="Zurück zum Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">Einstellungen</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserIcon className="w-4 h-4 inline mr-2" />
                Profil
              </button>
              <button
                onClick={() => setActiveTab('albums')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'albums'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Sammlungen
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'profile' ? (
          /* Profile Settings */
          <div className="card max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Profil bearbeiten
            </h2>

            <div className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Benutzername
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    className={`input-field pr-10 ${
                      usernameStatus === 'available' 
                        ? 'border-green-300 focus:border-green-500' 
                        : usernameStatus === 'taken' || usernameStatus === 'error'
                        ? 'border-red-300 focus:border-red-500'
                        : ''
                    }`}
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    minLength={3}
                    maxLength={20}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {usernameStatus === 'checking' && (
                      <LoadingSpinner size="sm" />
                    )}
                    {usernameStatus === 'available' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                    {(usernameStatus === 'taken' || usernameStatus === 'error') && (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                
                {/* Status Messages */}
                <div className="mt-2 text-sm">
                  {usernameStatus === 'available' && (
                    <p className="text-green-600 flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Benutzername ist verfügbar!
                    </p>
                  )}
                  {usernameStatus === 'taken' && (
                    <p className="text-red-600 flex items-center">
                      <X className="w-4 h-4 mr-1" />
                      Benutzername ist bereits vergeben
                    </p>
                  )}
                  {usernameStatus === 'error' && (
                    <p className="text-red-600 flex items-center">
                      <X className="w-4 h-4 mr-1" />
                      Benutzername muss mindestens 3 Zeichen haben
                    </p>
                  )}
                </div>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Avatar auswählen
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar.path}
                      onClick={() => setSelectedAvatar(avatar.path)}
                      className={`relative group p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                        selectedAvatar === avatar.path
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      title={avatar.name}
                    >
                      <img
                        src={avatar.path}
                        alt={avatar.name}
                        className="w-full h-12 object-contain"
                      />
                      {selectedAvatar === avatar.path && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleProfileUpdate}
                  disabled={loading || !canSaveProfile}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Speichere...
                    </>
                  ) : (
                    'Änderungen speichern'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Album Settings */
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Sammlungs-Verwaltung
            </h2>

            {albumsLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Lade Sammlungen...</p>
              </div>
            ) : albums.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Keine Sammlungen gefunden
                </h4>
                <p className="text-gray-600">
                  Es sind momentan keine Sammlungen verfügbar.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {albums.map((album) => (
                  <div key={album.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={album.image_url}
                          alt={album.name}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                        <div>
                          <h3 className="font-bold text-gray-900">{album.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{album.description}</p>
                          {album.is_new && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              <Bell className="w-3 h-3 mr-1" />
                              Neu
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAlbumStatusChange(album.id, 'active')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                            album.user_album_status === 'active'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-green-50 hover:text-green-700'
                          }`}
                        >
                          Aktiv
                        </button>
                        <button
                          onClick={() => handleAlbumStatusChange(album.id, 'inactive')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                            album.user_album_status === 'inactive'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-yellow-50 hover:text-yellow-700'
                          }`}
                        >
                          Inaktiv
                        </button>
                        <button
                          onClick={() => handleAlbumStatusChange(album.id, 'rejected')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                            album.user_album_status === 'rejected'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-red-50 hover:text-red-700'
                          }`}
                        >
                          Ablehnen
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}