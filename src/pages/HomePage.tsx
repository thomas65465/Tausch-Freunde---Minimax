import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, Gift, Zap, Mail, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { sendMagicLink } = useAuth();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      toast.error('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }

    try {
      setLoading(true);
      await sendMagicLink(email);
      setEmailSent(true);
    } catch (error: any) {
      console.error('Magic link error:', error);
      // Error is already handled in sendMagicLink function with toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center animate-float">
                  <Star className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  ✨
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-gradient">Sticker Sammler</span>
              <br />
              <span className="text-2xl md:text-3xl text-gray-600 font-medium">
                Sammle, Tausche, Teile!
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Die ultimative App für Kinder und Eltern, um Sticker-Sammelaktionen 
              zu verfolgen, mit Freunden zu tauschen und gemeinsam Spaß zu haben.
            </p>
            
            {/* Magic Link Login Form */}
            {!emailSent ? (
              <form onSubmit={handleMagicLink} className="max-w-md mx-auto mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.de"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="btn-primary px-6 py-3 text-base font-medium flex items-center justify-center rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Sende...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Magic Link senden
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  <strong>Sicher & Einfach:</strong> Kein Passwort nötig - wir senden Ihnen einen sicheren Login-Link per E-Mail!
                </p>
              </form>
            ) : (
              <div className="max-w-md mx-auto mb-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-800 mb-2">Magic Link gesendet!</h3>
                <p className="text-green-700 mb-4">
                  Wir haben einen Login-Link an <strong>{email}</strong> gesendet.
                  Prüfen Sie Ihr Postfach!
                </p>
                <button
                  onClick={() => {setEmailSent(false); setEmail('');}}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  ← Andere E-Mail verwenden
                </button>
              </div>
            )}
            
            <div className="text-center">
              <Link 
                to="/login" 
                className="text-primary-600 hover:text-primary-700 font-medium underline"
              >
                Zur vollständigen Anmeldung
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Warum Sticker Sammler?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Alles was du brauchst, um deine Sammlungen zu organisieren und Spaß zu haben!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center group hover:shadow-lg transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sammle Alles</h3>
              <p className="text-gray-600">
                Verfolge deine Fortschritte in allen deinen Lieblingsalben mit übersichtlichen Fortschrittsbalken.
              </p>
            </div>
            
            <div className="card text-center group hover:shadow-lg transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Mit Freunden</h3>
              <p className="text-gray-600">
                Füge Freunde hinzu und vergleiche eure Sammlungen. Seht wer am weitesten ist!
              </p>
            </div>
            
            <div className="card text-center group hover:shadow-lg transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tausche Smart</h3>
              <p className="text-gray-600">
                Automatische Tauschvorschläge basierend auf deinen Duplikaten und fehlenden Stickern.
              </p>
            </div>
            
            <div className="card text-center group hover:shadow-lg transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Teile Erfolge</h3>
              <p className="text-gray-600">
                Teile deine Fortschritte über WhatsApp und lade Freunde zum Sammeln ein.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-primary-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Bereit zum Sammeln?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Starte noch heute deine Sticker-Sammlung und erlebe den Spaß am Sammeln neu!
          </p>
          <Link 
            to="/login" 
            className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-block"
          >
            Jetzt Loslegen
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Star className="w-8 h-8 text-primary-400 mr-2" />
              <span className="text-xl font-bold">Sticker Sammler</span>
            </div>
            <p className="text-gray-400 mb-4">
              Die beste App für Sticker-Sammler aller Altersgruppen.
            </p>
            <div className="flex justify-center space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors duration-200">
                Anmelden
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}