import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../lib/supabase';
import { X, ArrowLeftRight, Check, XIcon, Clock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface TradeRequestsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface TradeRequest {
  id: string;
  initiator_id: string;
  partner_id: string;
  offering_stickers: any[];
  requesting_stickers: any[];
  status: string;
  created_at: string;
  initiator: User;
}

export default function TradeRequestsModal({ onClose, onSuccess }: TradeRequestsModalProps) {
  const { user } = useAuth();
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTrade, setProcessingTrade] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTradeRequests();
    }
  }, [user]);

  async function loadTradeRequests() {
    try {
      setLoading(true);
      
      // Load pending trade requests where user is the partner (receiver)
      const { data: trades, error } = await supabase
        .from('trades')
        .select(`
          *,
          initiator:users!trades_initiator_id_fkey(*)
        `)
        .eq('partner_id', user!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTradeRequests(trades || []);
    } catch (error) {
      console.error('Error loading trade requests:', error);
      toast.error('Fehler beim Laden der Handelsanfragen');
    } finally {
      setLoading(false);
    }
  }

  async function handleTradeResponse(tradeId: string, action: 'accept' | 'decline') {
    try {
      setProcessingTrade(tradeId);
      
      const { data, error } = await supabase.functions.invoke('trade-response', {
        body: {
          tradeId,
          action,
          userId: user!.id
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error.message || 'Fehler beim Bearbeiten des Handels');
        return;
      }

      toast.success(action === 'accept' ? 'Handel angenommen!' : 'Handel abgelehnt');
      await loadTradeRequests();
      onSuccess();
    } catch (error) {
      console.error('Error processing trade:', error);
      toast.error('Fehler beim Bearbeiten des Handels');
    } finally {
      setProcessingTrade(null);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-4xl w-full p-6 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Lade Handelsanfragen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowLeftRight className="w-6 h-6 text-primary-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Handelsanfragen
                </h2>
                <p className="text-gray-600">
                  {tradeRequests.length} offene Anfrage{tradeRequests.length !== 1 ? 'n' : ''}
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
          {tradeRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Keine offenen Handelsanfragen
              </h4>
              <p className="text-gray-600">
                Wenn jemand einen Handel mit dir vorschlägt, erscheint er hier.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {tradeRequests.map((trade) => (
                <div key={trade.id} className="border border-gray-200 rounded-lg p-6">
                  {/* Trade Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={trade.initiator.avatar_path}
                        alt={trade.initiator.username}
                        className="w-10 h-10 rounded-full border border-gray-200"
                      />
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Handel von {trade.initiator.username}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(trade.created_at).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* What they offer */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        {trade.initiator.username} bietet an:
                      </h4>
                      <div className="space-y-2">
                        {trade.offering_stickers?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">#{item.sticker_number}</span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">{item.name}</div>
                                <div className="text-xs text-gray-600">{item.album_name}</div>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {item.quantity}x
                            </div>
                          </div>
                        )) || []}
                      </div>
                    </div>

                    {/* What they want */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                        {trade.initiator.username} möchte haben:
                      </h4>
                      <div className="space-y-2">
                        {trade.requesting_stickers?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">#{item.sticker_number}</span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">{item.name}</div>
                                <div className="text-xs text-gray-600">{item.album_name}</div>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-blue-600">
                              {item.quantity}x
                            </div>
                          </div>
                        )) || []}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleTradeResponse(trade.id, 'decline')}
                      className="btn-secondary text-red-600 hover:bg-red-50"
                      disabled={processingTrade === trade.id}
                    >
                      {processingTrade === trade.id ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <XIcon className="w-4 h-4 mr-2" />
                      )}
                      Ablehnen
                    </button>
                    <button
                      onClick={() => handleTradeResponse(trade.id, 'accept')}
                      className="btn-primary bg-green-600 hover:bg-green-700"
                      disabled={processingTrade === trade.id}
                    >
                      {processingTrade === trade.id ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Annehmen
                    </button>
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