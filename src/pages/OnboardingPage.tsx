import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Star, Check, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

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

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | 'error'>('checking');
  const [loading, setLoading] = useState(false);
  
  const { createUserProfile, checkUsernameAvailability } = useAuth();
  const navigate = useNavigate();

  // Debounced username check
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  async function handleUsernameChange(value: string) {
    setUsername(value);
    
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    if (value.length < 3) {
      setUsernameStatus('error');
      return;
    }

    setUsernameStatus('checking');
    
    const newTimeout = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailability(value);
      setUsernameStatus(isAvailable ? 'available' : 'taken');
    }, 500);
    
    setCheckTimeout(newTimeout);
  }

  async function handleComplete() {
    if (!username || !selectedAvatar) {
      toast.error('Bitte wählen Sie einen Benutzernamen und Avatar.');
      return;
    }

    if (usernameStatus !== 'available') {
      toast.error('Bitte wählen Sie einen verfügbaren Benutzernamen.');
      return;
    }

    try {
      setLoading(true);
      await createUserProfile(username, selectedAvatar);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Profile creation error:', error);
      // Error is handled in createUserProfile
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-2xl w-full">
        <div className="card">
          {step === 1 ? (
            /* Welcome Step */
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center animate-float">
                    <Star className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                    ✨
                  </div>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                <span className="text-gradient">Willkommen bei der</span>
                <br />
                <span className="text-primary-600">Pickerl-Sammel-App!</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
                Schön, dass Sie hier sind! Lassen Sie uns Ihr Profil einrichten, 
                damit Sie sofort mit dem Sammeln beginnen können.
              </p>
              
              <button
                onClick={() => setStep(2)}
                className="btn-primary text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Los geht's! →
              </button>
            </div>
          ) : step === 2 ? (
            /* Username Step */
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Wählen Sie Ihren Benutzernamen
                </h2>
                <p className="text-gray-600">
                  Dieser Name wird anderen Sammlern angezeigt
                </p>
              </div>

              <div className="space-y-4">
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
                      placeholder="Ihr gewünschter Benutzername"
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

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="btn-secondary px-6 py-2"
                  >
                    ← Zurück
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={usernameStatus !== 'available'}
                    className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Weiter →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Avatar Step */
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Wählen Sie Ihren Avatar
                </h2>
                <p className="text-gray-600">
                  Wählen Sie Ihr Lieblings-Tier als Avatar
                </p>
              </div>

              {/* Avatar Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.path}
                    onClick={() => setSelectedAvatar(avatar.path)}
                    className={`relative group p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      selectedAvatar === avatar.path
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <img
                      src={avatar.path}
                      alt={avatar.name}
                      className="w-full h-16 object-contain mb-2"
                    />
                    <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                      {avatar.name}
                    </p>
                    {selectedAvatar === avatar.path && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary px-6 py-2"
                >
                  ← Zurück
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading || !selectedAvatar}
                  className="btn-primary px-8 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Erstelle Profil...
                    </>
                  ) : (
                    'Profil erstellen'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {[1, 2, 3].map((stepNum) => (
            <div
              key={stepNum}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                step === stepNum
                  ? 'bg-primary-500 scale-125'
                  : step > stepNum
                  ? 'bg-primary-300'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}