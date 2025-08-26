import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { User, Sticker } from '../lib/supabase';
import { X, ArrowLeftRight, Package, Send } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface TradingModalProps {
  friend: User;
  onClose: () => void;
  onSuccess: () => void;
}

interface StickerWithQuantity extends Sticker {
  quantity: number;
  album_name: string;
}

interface TradeItem {
  sticker_id: string;
  quantity: number;
}

interface TradeOffer {
  offering: TradeItem[];
  requesting: TradeItem[];
}

export default function TradingModal({ friend, onClose, onSuccess }: TradingModalProps) {
  const { user } = useAuth();
  const [myDuplicates, setMyDuplicates] = useState<StickerWithQuantity[]>([]);
  const [friendDuplicates, setFriendDuplicates] = useState<StickerWithQuantity[]>([]);
  const [tradeOffer, setTradeOffer] = useState<TradeOffer>({
    offering: [],
    requesting: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'offer' | 'request'>('offer');

  useEffect(() => {
    if (user && friend) {
      loadTradingData();
    }
  }, [user, friend]);

  async function loadTradingData() {
    try {
      setLoading(true);
      
      // Load my duplicates (quantity > 1)
      const { data: myStickers, error: myError } = await supabase
        .from('user_stickers')
        .select(`
          *,
          stickers!inner(
            *,
            albums!inner(
              name
            )
          )
        `)
        .eq('user_id', user!.id)
        .gt('quantity', 1);

      if (myError) throw myError;

      // Load friend's duplicates
      const { data: friendStickers, error: friendError } = await supabase
        .from('user_stickers')
        .select(`
          *,
          stickers!inner(
            *,
            albums!inner(
              name
            )
          )
        `)
        .eq('user_id', friend.id)
        .gt('quantity', 1);

      if (friendError) throw friendError;

      // Transform data
      const myDuplicatesList: StickerWithQuantity[] = myStickers?.map(us => ({
        ...us.stickers,
        quantity: us.quantity,
        album_name: us.stickers.albums.name
      })) || [];

      const friendDuplicatesList: StickerWithQuantity[] = friendStickers?.map(us => ({
        ...us.stickers,
        quantity: us.quantity,
        album_name: us.stickers.albums.name
      })) || [];

      setMyDuplicates(myDuplicatesList);
      setFriendDuplicates(friendDuplicatesList);
    } catch (error) {
      console.error('Error loading trading data:', error);
      toast.error('Fehler beim Laden der Handelsdaten');
    } finally {
      setLoading(false);
    }
  }

  function addToOffer(sticker: StickerWithQuantity) {
    const existing = tradeOffer.offering.find(item => item.sticker_id === sticker.id);
    if (existing) {
      if (existing.quantity < sticker.quantity) {
        setTradeOffer(prev => ({
          ...prev,
          offering: prev.offering.map(item => 
            item.sticker_id === sticker.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }));
      }
    } else {
      setTradeOffer(prev => ({
        ...prev,
        offering: [...prev.offering, { sticker_id: sticker.id, quantity: 1 }]
      }));
    }
  }

  function addToRequest(sticker: StickerWithQuantity) {
    const existing = tradeOffer.requesting.find(item => item.sticker_id === sticker.id);
    if (existing) {
      if (existing.quantity < sticker.quantity) {
        setTradeOffer(prev => ({
          ...prev,
          requesting: prev.requesting.map(item => 
            item.sticker_id === sticker.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }));
      }
    } else {
      setTradeOffer(prev => ({
        ...prev,
        requesting: [...prev.requesting, { sticker_id: sticker.id, quantity: 1 }]
      }));
    }
  }

  function removeFromOffer(stickerId: string) {
    setTradeOffer(prev => ({
      ...prev,
      offering: prev.offering.filter(item => item.sticker_id !== stickerId)
    }));
  }

  function removeFromRequest(stickerId: string) {
    setTradeOffer(prev => ({
      ...prev,
      requesting: prev.requesting.filter(item => item.sticker_id !== stickerId)
    }));
  }

  async function submitTrade() {
    if (tradeOffer.offering.length === 0 || tradeOffer.requesting.length === 0) {
      toast.error('Du musst sowohl Sticker anbieten als auch anfragen');
      return;
    }

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase.functions.invoke('trade-suggestions', {
        body: {
          type: 'create_trade',
          trade: {
            initiator_id: user!.id,
            partner_id: friend.id,
            offering: tradeOffer.offering,
            requesting: tradeOffer.requesting,
            status: 'pending'
          }
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error.message || 'Fehler beim Erstellen des Handels');
        return;
      }

      toast.success('Handelsangebot gesendet!');
      onSuccess();
    } catch (error) {
      console.error('Error submitting trade:', error);
      toast.error('Fehler beim Senden des Handelsangebots');
    } finally {
      setSubmitting(false);
    }
  }

  function getStickerByIdFromMyDuplicates(id: string) {
    return myDuplicates.find(s => s.id === id);
  }

  function getStickerByIdFromFriendDuplicates(id: string) {
    return friendDuplicates.find(s => s.id === id);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-4xl w-full p-6 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Lade Handelsdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ArrowLeftRight className="w-6 h-6 text-primary-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Handel mit {friend.username}
                </h2>
                <p className="text-gray-600">
                  Tausche deine doppelten Sticker gegen die deines Freundes!
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

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('offer')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center ${
                activeTab === 'offer'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4 mr-2" />
              Meine Angebote ({tradeOffer.offering.length})
            </button>
            <button
              onClick={() => setActiveTab('request')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center ${
                activeTab === 'request'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Send className="w-4 h-4 mr-2" />
              Meine Wünsche ({tradeOffer.requesting.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Available Stickers */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {activeTab === 'offer' ? 'Meine Duplikate' : `${friend.username}s Duplikate`}
              </h3>
              
              {(activeTab === 'offer' ? myDuplicates : friendDuplicates).length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {activeTab === 'offer' 
                      ? 'Du hast keine doppelten Sticker zum Handeln' 
                      : `${friend.username} hat keine doppelten Sticker`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(activeTab === 'offer' ? myDuplicates : friendDuplicates).map((sticker) => (
                    <div 
                      key={sticker.id}
                      className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all duration-200 cursor-pointer"
                      onClick={() => activeTab === 'offer' ? addToOffer(sticker) : addToRequest(sticker)}
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-2 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-600">#{sticker.sticker_number}</div>
                          <div className="text-xs bg-gray-300 px-2 py-1 rounded-full mt-1">{sticker.rarity}</div>
                        </div>
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 truncate">{sticker.name}</h4>
                      <p className="text-xs text-gray-600">{sticker.album_name}</p>
                      <div className="text-xs text-green-600 font-medium mt-1">
                        {sticker.quantity}x verfügbar
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Items */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {activeTab === 'offer' ? 'Ich biete an' : 'Ich möchte haben'}
              </h3>
              
              {(activeTab === 'offer' ? tradeOffer.offering : tradeOffer.requesting).length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-primary-200 rounded-lg">
                  <ArrowLeftRight className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {activeTab === 'offer' 
                      ? 'Klicke auf Sticker links, um sie zu deinem Angebot hinzuzufügen'
                      : 'Klicke auf Sticker links, um sie zu deinen Wünschen hinzuzufügen'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(activeTab === 'offer' ? tradeOffer.offering : tradeOffer.requesting).map((item) => {
                    const sticker = activeTab === 'offer' 
                      ? getStickerByIdFromMyDuplicates(item.sticker_id)
                      : getStickerByIdFromFriendDuplicates(item.sticker_id);
                    
                    if (!sticker) return null;
                    
                    return (
                      <div key={item.sticker_id} className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="text-xs font-bold text-gray-600">#{sticker.sticker_number}</div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">{sticker.name}</h4>
                          <p className="text-xs text-gray-600">{sticker.album_name}</p>
                        </div>
                        <div className="text-sm font-medium text-primary-600">
                          {item.quantity}x
                        </div>
                        <button
                          onClick={() => activeTab === 'offer' 
                            ? removeFromOffer(item.sticker_id) 
                            : removeFromRequest(item.sticker_id)
                          }
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Angebot: {tradeOffer.offering.length} Sticker • Wunsch: {tradeOffer.requesting.length} Sticker
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary"
                disabled={submitting}
              >
                Abbrechen
              </button>
              <button
                onClick={submitTrade}
                className="btn-primary"
                disabled={submitting || tradeOffer.offering.length === 0 || tradeOffer.requesting.length === 0}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Handel wird gesendet...
                  </>
                ) : (
                  'Handel vorschlagen'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}