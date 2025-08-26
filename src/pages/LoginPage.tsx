import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Star, Mail, Send } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { sendMagicLink } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="card">
          {/* Success State */}
          {emailSent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Magic Link gesendet!
              </h2>
              <p className="text-gray-600 mb-6">
                Wir haben Ihnen einen Login-Link an <strong>{email}</strong> gesendet. 
                Prüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Link, um sich anzumelden.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Hinweis:</strong> Der Link ist 1 Stunde gültig. 
                  Schauen Sie auch in Ihrem Spam-Ordner nach, falls Sie keine E-Mail erhalten haben.
                </p>
              </div>
              <button
                onClick={() => setEmailSent(false)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ← Zurück
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Willkommen zurück!
                </h2>
                <p className="text-gray-600">
                  Geben Sie Ihre E-Mail-Adresse ein und erhalten Sie einen sicheren Login-Link
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="input-field pl-10"
                      placeholder="deine@email.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full btn-primary py-3 text-base font-medium relative flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sende Magic Link...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Magic Link senden
                    </>
                  )}
                </button>
              </form>

              {/* Info Box */}
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">!</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      <strong>Sicherheit zuerst:</strong> Anstatt ein Passwort zu verwenden, senden wir Ihnen 
                      einen sicheren Login-Link per E-Mail. Das ist einfacher und sicherer!
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Neu hier?{' '}
                  <span className="text-gray-800 font-medium">
                    Geben Sie einfach Ihre E-Mail ein - wir erstellen automatisch ein Konto für Sie!
                  </span>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}