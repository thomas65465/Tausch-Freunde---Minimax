import { useState, useEffect } from 'react';
import type { User } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { Users, ArrowLeftRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import TradingModal from './TradingModal';

interface FriendsPanelProps {
  friends: User[];
  onRefresh: () => void;
}

interface FriendWithStats extends User {
  total_stickers: number;
  collected_stickers: number;
  completion_percentage: number;
}

export default function FriendsPanel({ friends, onRefresh }: FriendsPanelProps) {
  const [friendsWithStats, setFriendsWithStats] = useState<FriendWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFriendForTrade, setSelectedFriendForTrade] = useState<User | null>(null);

  useEffect(() => {
    if (friends.length > 0) {
      loadFriendsStats();
    } else {
      setFriendsWithStats([]);
    }
  }, [friends]);

  async function loadFriendsStats() {
    try {
      setLoading(true);
      const friendsStats: FriendWithStats[] = [];

      for (const friend of friends) {
        // Get total stickers available
        const { data: allStickers, error: stickersError } = await supabase
          .from('stickers')
          .select('id');

        if (stickersError) {
          console.error('Error loading all stickers:', stickersError);
          continue;
        }

        const totalStickers = allStickers?.length || 0;

        // Get friend's collected stickers
        const { data: friendStickers, error: friendStickersError } = await supabase
          .from('user_stickers')
          .select('sticker_id')
          .eq('user_id', friend.id);

        if (friendStickersError) {
          console.error('Error loading friend stickers:', friendStickersError);
          continue;
        }

        const collectedStickers = friendStickers?.length || 0;
        const completionPercentage = totalStickers > 0 ? Math.round((collectedStickers / totalStickers) * 100) : 0;

        friendsStats.push({
          ...friend,
          total_stickers: totalStickers,
          collected_stickers: collectedStickers,
          completion_percentage: completionPercentage
        });
      }

      // Sort by completion percentage (highest first)
      friendsStats.sort((a, b) => b.completion_percentage - a.completion_percentage);
      setFriendsWithStats(friendsStats);
    } catch (error) {
      console.error('Error loading friends stats:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card sticky top-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Freunde ({friends.length})
        </h3>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : friendsWithStats.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {friends.length === 0 ? 'Noch keine Freunde hinzugefügt' : 'Lade Freunde-Daten...'}
          </p>
          <p className="text-sm text-gray-500">
            Füge Freunde hinzu, um eure Fortschritte zu vergleichen!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {friendsWithStats.map((friend, index) => (
            <div key={friend.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              {/* Rank */}
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {index + 1}
                </div>
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={friend.avatar_path}
                  alt={friend.username}
                  className="w-10 h-10 rounded-full border-2 border-gray-200"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {friend.username}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFriendForTrade(friend);
                      }}
                      className="p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors duration-200"
                      title="Handeln"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                    </button>
                    <p className="text-sm font-bold text-gray-900">
                      {friend.completion_percentage}%
                    </p>
                  </div>
                </div>
                
                <div className="progress-bar h-1.5 mb-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      friend.completion_percentage === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      friend.completion_percentage >= 75 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      friend.completion_percentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                      friend.completion_percentage >= 25 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${friend.completion_percentage}%` }}
                  />
                </div>
                
                <p className="text-xs text-gray-500">
                  {friend.collected_stickers}/{friend.total_stickers} Sticker
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Trading Modal */}
      {selectedFriendForTrade && (
        <TradingModal
          friend={selectedFriendForTrade}
          onClose={() => setSelectedFriendForTrade(null)}
          onSuccess={() => {
            setSelectedFriendForTrade(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}