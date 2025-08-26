import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, UserPlus, Copy, Check, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface AddFriendModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddFriendModal({ onClose, onSuccess }: AddFriendModalProps) {
  const { userProfile } = useAuth();
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault();
    
    if (!friendCode.trim()) {
      toast.error('Bitte gib einen Freunde-Code ein');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('friend-request', {
        body: {
          friendCode: friendCode.trim().toUpperCase(),
          action: 'request'
        }
      });

      if (error) {
        toast.error(error.message || 'Fehler beim Hinzufügen des Freundes');
        return;
      }

      if (data?.error) {
        toast.error(data.error.message || 'Fehler beim Hinzufügen des Freundes');
        return;
      }

      toast.success('Freundschaftsanfrage gesendet!');
      onSuccess();
    } catch (error) {
      console.error('Add friend error:', error);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  }

  async function copyFriendCode() {
    if (!userProfile?.friend_code) return;
    
    try {
      await navigator.clipboard.writeText(userProfile.friend_code);
      setCopied(true);
      toast.success('Freunde-Code kopiert!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Kopieren fehlgeschlagen');
    }
  }

  async function handleWhatsAppInvite() {
    try {
      setWhatsappLoading(true);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-share', {
        body: {
          type: 'friend_invite'
        }
      });

      if (error) {
        console.error('WhatsApp share error:', error);
        toast.error('Fehler beim Erstellen des Einladungslinks');
        return;
      }

      if (data?.error) {
        toast.error(data.error.message || 'Fehler beim Erstellen des Einladungslinks');
        return;
      }

      // Open WhatsApp with the generated invite
      window.open(data.data.whatsappUrl, '_blank');
      toast.success('WhatsApp-Einladung geöffnet!');
    } catch (error) {
      console.error('WhatsApp invite error:', error);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setWhatsappLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Freund hinzufügen
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* My Friend Code */}
        <div className="bg-primary-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-primary-900 mb-2">
            Mein Freunde-Code
          </h4>
          <div className="flex items-center justify-between mb-3">
            <code className="text-lg font-mono font-bold text-primary-700">
              {userProfile?.friend_code || 'Lädt...'}
            </code>
            <button
              onClick={copyFriendCode}
              className="btn-secondary p-2"
              title="Code kopieren"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-sm text-primary-700 mb-3">
            Teile diesen Code mit Freunden, damit sie dich hinzufügen können!
          </p>
          
          {/* WhatsApp Invite Button */}
          <button
            onClick={handleWhatsAppInvite}
            className="w-full btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center"
            disabled={whatsappLoading}
          >
            {whatsappLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Wird erstellt...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Über WhatsApp einladen
              </>
            )}
          </button>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleAddFriend} className="space-y-4">
          <div>
            <label htmlFor="friendCode" className="block text-sm font-medium text-gray-700 mb-2">
              Freunde-Code eingeben
            </label>
            <input
              id="friendCode"
              type="text"
              className="input-field text-center font-mono text-lg"
              placeholder="ABC123"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Gib den 6-stelligen Code deines Freundes ein
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading || !friendCode.trim()}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Wird hinzugefügt...
                </>
              ) : (
                'Freund hinzufügen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}