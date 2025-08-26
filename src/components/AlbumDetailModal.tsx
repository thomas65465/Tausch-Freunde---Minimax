import { useState, useEffect } from 'react';
import type { Album, Sticker } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Star, Grid, List, Plus, Minus, Share2, CheckCircle, ArrowLeft } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface AlbumWithProgress extends Album {
  collected_count: number;
  completion_percentage: number;
}

interface AlbumDetailModalProps {
  album: AlbumWithProgress;
  onClose: () => void;
  onRefresh: () => void;
}

interface StickerWithCollection extends Sticker {
  collected: boolean;
  quantity: number;
}

type ViewMode = 'all' | 'collected' | 'missing' | 'duplicates';
type DisplayMode = 'grid' | 'list';

const viewModeLabels = {
  all: 'Alle Sticker',
  collected: 'Gesammelt',
  missing: 'Fehlend',
  duplicates: 'Duplikate'
};

const rarityColors = {
  common: 'border-gray-300 bg-gray-50',
  uncommon: 'border-green-300 bg-green-50',
  rare: 'border-blue-300 bg-blue-50',
  epic: 'border-purple-300 bg-purple-50',
  legendary: 'border-yellow-300 bg-yellow-50',
};

export default function AlbumDetailModal({ album, onClose, onRefresh }: AlbumDetailModalProps) {
  const { user } = useAuth();
  const [stickers, setStickers] = useState<StickerWithCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [updatingSticker, setUpdatingSticker] = useState<string | null>(null);
  const [stickerAnimations, setStickerAnimations] = useState<Record<string, boolean>>({});
  const [albumProgress, setAlbumProgress] = useState<{ collected: number; total: number; percentage: number }>({
    collected: album.collected_count,
    total: album.total_stickers,
    percentage: album.completion_percentage
  });

  useEffect(() => {
    loadAlbumStickers();
  }, [album.id]);

  async function loadAlbumStickers() {
    try {
      setLoading(true);
      
      // Get all stickers in this album
      const { data: albumStickers, error: stickersError } = await supabase
        .from('stickers')
        .select('*')
        .eq('album_id', album.id)
        .order('sticker_number', { ascending: true });

      if (stickersError) throw stickersError;

      if (!albumStickers) {
        setStickers([]);
        return;
      }

      // Get user's collected stickers for this album
      const { data: userStickers, error: userStickersError } = await supabase
        .from('user_stickers')
        .select('*')
        .eq('user_id', user!.id)
        .in('sticker_id', albumStickers.map(s => s.id));

      if (userStickersError) throw userStickersError;

      // Create a map of user stickers for quick lookup
      const userStickerMap = new Map();
      userStickers?.forEach(us => {
        userStickerMap.set(us.sticker_id, us.quantity);
      });

      // Combine sticker data with collection status
      const stickersWithCollection: StickerWithCollection[] = albumStickers.map(sticker => ({
        ...sticker,
        collected: userStickerMap.has(sticker.id),
        quantity: userStickerMap.get(sticker.id) || 0
      }));

      setStickers(stickersWithCollection);
      
      // Update local progress state
      const collectedCount = stickersWithCollection.filter(s => s.collected).length;
      setAlbumProgress({
        collected: collectedCount,
        total: albumStickers.length,
        percentage: albumStickers.length > 0 ? Math.round((collectedCount / albumStickers.length) * 100) : 0
      });
    } catch (error) {
      console.error('Error loading album stickers:', error);
      toast.error('Fehler beim Laden der Sticker');
    } finally {
      setLoading(false);
    }
  }

  async function toggleSticker(sticker: StickerWithCollection) {
    if (!user) return;

    try {
      setUpdatingSticker(sticker.id);
      
      if (sticker.collected) {
        // Remove sticker
        const { error } = await supabase
          .from('user_stickers')
          .delete()
          .eq('user_id', user.id)
          .eq('sticker_id', sticker.id);

        if (error) throw error;

        // Show success animation and toast
        setStickerAnimations(prev => ({ ...prev, [sticker.id]: true }));
        toast.success('Sticker entfernt!');
      } else {
        // Add sticker
        const { error } = await supabase
          .from('user_stickers')
          .insert({
            user_id: user.id,
            sticker_id: sticker.id,
            quantity: 1
          });

        if (error) throw error;

        // Show success animation and toast with celebration for new sticker
        setStickerAnimations(prev => ({ ...prev, [sticker.id]: true }));
        toast.success(
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span>Sticker hinzugefügt! 🎉</span>
          </div>,
          {
            duration: 2000,
            style: {
              background: '#10B981',
              color: 'white',
            },
          }
        );
      }

      // Clear animation after a short delay
      setTimeout(() => {
        setStickerAnimations(prev => ({ ...prev, [sticker.id]: false }));
      }, 1000);

      // Refresh stickers and parent component
      await loadAlbumStickers();
      onRefresh();
    } catch (error) {
      console.error('Error toggling sticker:', error);
      toast.error('Fehler beim Aktualisieren des Stickers');
    } finally {
      setUpdatingSticker(null);
    }
  }

  async function adjustQuantity(sticker: StickerWithCollection, change: number) {
    if (!user) return;
    
    const newQuantity = sticker.quantity + change;
    if (newQuantity < 0) return;

    try {
      setUpdatingSticker(sticker.id);
      
      // Store feedback info before async operations
      const isIncrease = change > 0;
      const isRemoval = newQuantity === 0;
      
      if (newQuantity === 0) {
        // Remove sticker completely
        const { error } = await supabase
          .from('user_stickers')
          .delete()
          .eq('user_id', user.id)
          .eq('sticker_id', sticker.id);

        if (error) throw error;
      } else {
        // Update quantity
        const { error } = await supabase
          .from('user_stickers')
          .upsert({
            user_id: user.id,
            sticker_id: sticker.id,
            quantity: newQuantity
          });

        if (error) throw error;
      }

      await loadAlbumStickers();
      onRefresh();
      
      // Show quick success feedback for quantity changes
      if (isIncrease) {
        toast.success('Anzahl erhöht! ➕', { duration: 1500 });
      } else if (isRemoval) {
        toast.success('Sticker entfernt! ➖', { duration: 1500 });
      } else {
        toast.success('Anzahl verringert! ➖', { duration: 1500 });
      }
    } catch (error) {
      console.error('Error adjusting quantity:', error);
      toast.error('Fehler beim Aktualisieren der Anzahl');
    } finally {
      setUpdatingSticker(null);
    }
  }

  async function handleShareAlbum() {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-share', {
        body: {
          type: 'album',
          data: {
            albumName: album.name,
            collectedStickers: album.collected_count,
            totalStickers: album.total_stickers,
            completionRate: album.completion_percentage
          }
        }
      });

      if (error) {
        console.error('Share error:', error);
        toast.error('Fehler beim Teilen');
        return;
      }

      window.open(data.data.whatsappUrl, '_blank');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Fehler beim Teilen');
    }
  }

  const filteredStickers = stickers.filter(sticker => {
    switch (viewMode) {
      case 'collected':
        return sticker.collected;
      case 'missing':
        return !sticker.collected;
      case 'duplicates':
        return sticker.quantity > 1;
      default:
        return true;
    }
  });

  const getCounts = () => {
    const all = stickers.length;
    const collected = stickers.filter(s => s.collected).length;
    const missing = stickers.filter(s => !s.collected).length;
    const duplicates = stickers.filter(s => s.quantity > 1).length;
    
    return { all, collected, missing, duplicates };
  };

  const counts = getCounts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{album.name}</h2>
              <p className="text-gray-600 mb-4">{album.description}</p>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {albumProgress.collected} / {albumProgress.total} Sticker ({albumProgress.percentage}%)
                </div>
                
                <div className="progress-bar w-48">
                  <div 
                    className={`progress-fill transition-all duration-700 ease-out ${
                      albumProgress.percentage === 100 ? 'from-green-500 to-green-600' :
                      albumProgress.percentage >= 75 ? 'from-blue-500 to-blue-600' :
                      albumProgress.percentage >= 50 ? 'from-yellow-500 to-yellow-600' :
                      albumProgress.percentage >= 25 ? 'from-orange-500 to-orange-600' :
                      'from-red-500 to-red-600'
                    }`}
                    style={{ width: `${albumProgress.percentage}%` }}
                  />
                </div>
                
                {/* Completion celebration */}
                {albumProgress.percentage === 100 && (
                  <div className="animate-bounce">
                    <span className="text-2xl">🎉</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="btn-secondary px-4 py-2 flex items-center"
                title="Zur Übersicht"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zur Übersicht
              </button>
              <button
                onClick={handleShareAlbum}
                className="btn-secondary p-2"
                title="Album teilen"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* View Mode */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {Object.entries(viewModeLabels).map(([mode, label]) => {
                const count = counts[mode as keyof typeof counts];
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as ViewMode)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === mode
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Display Mode */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  displayMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Rasteransicht"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  displayMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Listenansicht"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredStickers.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Keine Sticker gefunden
              </h4>
              <p className="text-gray-600">
                {viewMode === 'collected' ? 'Du hast noch keine Sticker in diesem Album gesammelt.' :
                 viewMode === 'missing' ? 'Du hast bereits alle Sticker in diesem Album!' :
                 viewMode === 'duplicates' ? 'Du hast noch keine doppelten Sticker.' :
                 'Dieses Album enthält noch keine Sticker.'}
              </p>
            </div>
          ) : displayMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredStickers.map((sticker) => (
                <div key={sticker.id} className="group">
                  <div 
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 ${
                      sticker.collected 
                        ? `${rarityColors[sticker.rarity]} ring-2 ring-green-400` 
                        : 'border-gray-200 bg-gray-100 hover:border-primary-300'
                    } ${
                      stickerAnimations[sticker.id] ? 'animate-pulse ring-4 ring-green-300' : ''
                    }`}
                    onClick={() => toggleSticker(sticker)}
                  >
                    {/* Sticker Image Placeholder */}
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600 mb-1">
                          #{sticker.sticker_number}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          rarityColors[sticker.rarity]
                        }`}>
                          {sticker.rarity}
                        </div>
                      </div>
                    </div>

                    {/* Success Animation Overlay */}
                    {stickerAnimations[sticker.id] && (
                      <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center animate-pulse">
                        <CheckCircle className="w-8 h-8 text-green-600 animate-bounce" />
                      </div>
                    )}

                    {/* Loading Overlay */}
                    {updatingSticker === sticker.id && (
                      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}

                    {/* Collected Checkmark */}
                    {sticker.collected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    {/* Quantity Badge */}
                    {sticker.quantity > 1 && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {sticker.quantity}x
                      </div>
                    )}
                  </div>

                  {/* Sticker Info */}
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {sticker.name}
                    </h4>
                    
                    {/* Quantity Controls */}
                    {sticker.collected && (
                      <div className="flex items-center justify-center mt-1 space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustQuantity(sticker, -1);
                          }}
                          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200"
                          disabled={updatingSticker === sticker.id}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium min-w-[20px] text-center">
                          {sticker.quantity}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustQuantity(sticker, 1);
                          }}
                          className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-green-600 transition-colors duration-200"
                          disabled={updatingSticker === sticker.id}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-2">
              {filteredStickers.map((sticker) => (
                <div 
                  key={sticker.id} 
                  className={`flex items-center space-x-4 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm ${
                    sticker.collected 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-primary-300'
                  }`}
                  onClick={() => toggleSticker(sticker)}
                >
                  {/* Number & Status */}
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                      sticker.collected 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      #{sticker.sticker_number}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{sticker.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        rarityColors[sticker.rarity]
                      }`}>
                        {sticker.rarity}
                      </span>
                      {sticker.collected && (
                        <span className="text-green-600 font-medium">
                          ✓ Gesammelt ({sticker.quantity}x)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  {sticker.collected && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustQuantity(sticker, -1);
                        }}
                        className="btn-secondary p-1"
                        disabled={updatingSticker === sticker.id}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium min-w-[24px] text-center">
                        {sticker.quantity}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustQuantity(sticker, 1);
                        }}
                        className="btn-secondary p-1"
                        disabled={updatingSticker === sticker.id}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Loading */}
                  {updatingSticker === sticker.id && (
                    <div className="flex-shrink-0">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}