import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Album, User } from '../lib/supabase';
import { Plus, LogOut, Star, Package, Bell, Users, Settings } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import AlbumCard from '../components/AlbumCard';
import FriendsPanel from '../components/FriendsPanel';
import AddFriendModal from '../components/AddFriendModal';
import StickerPackModal from '../components/StickerPackModal';
import TradeRequestsModal from '../components/TradeRequestsModal';
import FriendRequestsModal from '../components/FriendRequestsModal';
import toast from 'react-hot-toast';

interface AlbumWithProgress extends Album {
  collected_count: number;
  completion_percentage: number;
}

export default function DashboardPage() {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<AlbumWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showStickerPack, setShowStickerPack] = useState(false);
  const [showTradeRequests, setShowTradeRequests] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [totalStickers, setTotalStickers] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [pendingTradesCount, setPendingTradesCount] = useState(0);
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadFriends();
      loadPendingTrades();
      loadPendingFriendRequests();
    }
  }, [user]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // Load all active albums
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (albumsError) throw albumsError;

      if (!albumsData) {
        setAlbums([]);
        return;
      }

      // Load user's collected stickers for each album
      const albumsWithProgress: AlbumWithProgress[] = [];
      let totalStickersCount = 0;
      let totalCollectedCount = 0;

      for (const album of albumsData) {
        // Get stickers in this album
        const { data: stickers, error: stickersError } = await supabase
          .from('stickers')
          .select('id')
          .eq('album_id', album.id);

        if (stickersError) {
          console.error('Error loading stickers for album:', album.name, stickersError);
          continue;
        }

        const albumStickerIds = stickers?.map(s => s.id) || [];
        totalStickersCount += albumStickerIds.length;

        // Get user's collected stickers for this album
        const { data: userStickers, error: userStickersError } = await supabase
          .from('user_stickers')
          .select('sticker_id')
          .eq('user_id', user!.id)
          .in('sticker_id', albumStickerIds);

        if (userStickersError) {
          console.error('Error loading user stickers for album:', album.name, userStickersError);
        }

        const collectedCount = userStickers?.length || 0;
        totalCollectedCount += collectedCount;
        const completionPercentage = albumStickerIds.length > 0 ? Math.round((collectedCount / albumStickerIds.length) * 100) : 0;

        albumsWithProgress.push({
          ...album,
          collected_count: collectedCount,
          completion_percentage: completionPercentage
        });
      }

      setAlbums(albumsWithProgress);
      setTotalStickers(totalStickersCount);
      setTotalCollected(totalCollectedCount);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }

  async function loadFriends() {
    try {
      // Get accepted friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user!.id},friend_id.eq.${user!.id}`);

      if (error) {
        console.error('Error loading friendships:', error);
        return;
      }

      if (!friendships || friendships.length === 0) {
        setFriends([]);
        return;
      }

      // Get friend IDs
      const friendIds = friendships.map(friendship => 
        friendship.user_id === user!.id ? friendship.friend_id : friendship.user_id
      );

      // Get friend profiles
      const { data: friendProfiles, error: friendsError } = await supabase
        .from('users')
        .select('*')
        .in('id', friendIds);

      if (friendsError) {
        console.error('Error loading friend profiles:', friendsError);
        return;
      }

      setFriends(friendProfiles || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  }

  async function loadPendingTrades() {
    try {
      const { data: pendingTrades, error } = await supabase
        .from('trades')
        .select('id')
        .eq('partner_id', user!.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error loading pending trades:', error);
        return;
      }

      setPendingTradesCount(pendingTrades?.length || 0);
    } catch (error) {
      console.error('Error loading pending trades:', error);
    }
  }

  async function loadPendingFriendRequests() {
    try {
      const { data: pendingRequests, error } = await supabase
        .from('friendships')
        .select('id')
        .eq('friend_id', user!.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error loading pending friend requests:', error);
        return;
      }

      setPendingFriendRequestsCount(pendingRequests?.length || 0);
    } catch (error) {
      console.error('Error loading pending friend requests:', error);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const overallCompletion = totalStickers > 0 ? Math.round((totalCollected / totalStickers) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo & User */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sticker Sammler</h1>
                {userProfile && (
                  <div className="flex items-center space-x-2">
                    <img
                      src={userProfile.avatar_path}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full border border-gray-200"
                    />
                    <span className="text-sm text-gray-600">
                      {userProfile.username} • {userProfile.friend_code}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowStickerPack(true)}
                className="btn-secondary p-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:from-primary-600 hover:to-purple-700"
                title="Sticker-Paket öffnen"
              >
                <Package className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowFriendRequests(true)}
                className="btn-secondary p-2 relative"
                title="Freundschaftsanfragen"
              >
                <Users className="w-5 h-5" />
                {pendingFriendRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {pendingFriendRequestsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowTradeRequests(true)}
                className="btn-secondary p-2 relative"
                title="Handelsanfragen"
              >
                <Bell className="w-5 h-5" />
                {pendingTradesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {pendingTradesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowAddFriend(true)}
                className="btn-secondary p-2"
                title="Freund hinzufügen"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="btn-secondary p-2"
                title="Einstellungen"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="btn-secondary p-2 text-red-600 hover:bg-red-50"
                title="Abmelden"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Overall Progress */}
            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Meine Sammlung
                  </h2>
                  <p className="text-gray-600">
                    {totalCollected} von {totalStickers} Stickern gesammelt
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600 mb-1">
                    {overallCompletion}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Gesamt
                  </div>
                </div>
              </div>
              
              <div className="progress-bar mb-4">
                <div 
                  className="progress-fill"
                  style={{ width: `${overallCompletion}%` }}
                />
              </div>
              
              {/* Freunde-Avatare unter dem Fortschrittsbalken */}
              {friends.length > 0 && (
                <div className="flex items-center justify-center mb-4">
                  <div className="text-xs text-gray-500 mr-2">Sammelt mit:</div>
                  <div className="flex -space-x-1">
                    {friends.slice(0, 8).map((friend) => (
                      <div
                        key={friend.id}
                        className="relative group"
                        title={friend.username}
                      >
                        <img
                          src={friend.avatar_path}
                          alt={friend.username}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:z-10 hover:scale-110 transition-transform duration-200"
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                          {friend.username}
                        </div>
                      </div>
                    ))}
                    {friends.length > 8 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        +{friends.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{albums.length}</div>
                  <div className="text-sm text-blue-700">Alben</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {albums.filter(album => album.completion_percentage === 100).length}
                  </div>
                  <div className="text-sm text-green-700">Komplett</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{friends.length}</div>
                  <div className="text-sm text-purple-700">Freunde</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-600">
                    {Math.round((totalCollected / Math.max(totalStickers, 1)) * 100)}
                  </div>
                  <div className="text-sm text-yellow-700">Fortschritt</div>
                </div>
              </div>
            </div>

            {/* Albums Grid */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Meine Alben</h3>
              {albums.length === 0 ? (
                <div className="card text-center py-12">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Keine Alben gefunden
                  </h4>
                  <p className="text-gray-600">
                    Es sind momentan keine aktiven Sammelaktionen verfügbar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {albums.map((album) => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      onRefresh={loadDashboardData}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <FriendsPanel
              friends={friends}
              onRefresh={() => {
                loadFriends();
                loadDashboardData();
              }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddFriend && (
        <AddFriendModal
          onClose={() => setShowAddFriend(false)}
          onSuccess={() => {
            setShowAddFriend(false);
            loadFriends();
          }}
        />
      )}
      
      {showStickerPack && (
        <StickerPackModal
          onClose={() => setShowStickerPack(false)}
          onSuccess={() => {
            setShowStickerPack(false);
            loadDashboardData();
          }}
        />
      )}
      
      {showTradeRequests && (
        <TradeRequestsModal
          onClose={() => setShowTradeRequests(false)}
          onSuccess={() => {
            setShowTradeRequests(false);
            loadPendingTrades();
            loadDashboardData();
          }}
        />
      )}
      
      {showFriendRequests && (
        <FriendRequestsModal
          onClose={() => setShowFriendRequests(false)}
          onSuccess={() => {
            setShowFriendRequests(false);
            loadPendingFriendRequests();
            loadFriends();
          }}
        />
      )}
    </div>
  );
}