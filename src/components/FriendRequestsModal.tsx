import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../lib/supabase';
import { X, UserPlus, Check, XIcon } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface FriendRequestsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  requester: User;
}

export default function FriendRequestsModal({ onClose, onSuccess }: FriendRequestsModalProps) {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadFriendRequests();
    }
  }, [user]);

  async function loadFriendRequests() {
    try {
      setLoading(true);
      
      // Load pending friend requests where user is the recipient
      const { data: requests, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:users!friendships_user_id_fkey(*)
        `)
        .eq('friend_id', user!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFriendRequests(requests || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      toast.error('Fehler beim Laden der Freundschaftsanfragen');
    } finally {
      setLoading(false);
    }
  }

  async function handleFriendRequestResponse(requestId: string, action: 'accept' | 'decline') {
    try {
      setProcessingRequest(requestId);
      
      const { data, error } = await supabase.functions.invoke('friend-request', {
        body: {
          requestId,
          action,
          userId: user!.id
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error.message || 'Fehler beim Bearbeiten der Anfrage');
        return;
      }

      toast.success(action === 'accept' ? 'Freundschaftsanfrage angenommen!' : 'Freundschaftsanfrage abgelehnt');
      await loadFriendRequests();
      onSuccess();
    } catch (error) {
      console.error('Error processing friend request:', error);
      toast.error('Fehler beim Bearbeiten der Anfrage');
    } finally {
      setProcessingRequest(null);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full p-6 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Lade Freundschaftsanfragen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserPlus className="w-6 h-6 text-primary-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Freundschaftsanfragen
                </h2>
                <p className="text-gray-600">
                  {friendRequests.length} offene Anfrage{friendRequests.length !== 1 ? 'n' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {friendRequests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Keine offenen Freundschaftsanfragen
              </h4>
              <p className="text-gray-600">
                Wenn jemand dich als Freund hinzufügen möchte, erscheint die Anfrage hier.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {friendRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={request.requester.avatar_path}
                        alt={request.requester.username}
                        className="w-12 h-12 rounded-full border border-gray-200"
                      />
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {request.requester.username}
                        </h3>
                        <p className="text-sm text-gray-600">
                          möchte dein Freund werden
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.created_at).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFriendRequestResponse(request.id, 'decline')}
                        className="btn-secondary text-red-600 hover:bg-red-50"
                        disabled={processingRequest === request.id}
                      >
                        {processingRequest === request.id ? (
                          <LoadingSpinner size="sm" className="mr-1" />
                        ) : (
                          <XIcon className="w-4 h-4 mr-1" />
                        )}
                        Ablehnen
                      </button>
                      <button
                        onClick={() => handleFriendRequestResponse(request.id, 'accept')}
                        className="btn-primary bg-green-600 hover:bg-green-700"
                        disabled={processingRequest === request.id}
                      >
                        {processingRequest === request.id ? (
                          <LoadingSpinner size="sm" className="mr-1" />
                        ) : (
                          <Check className="w-4 h-4 mr-1" />
                        )}
                        Annehmen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}