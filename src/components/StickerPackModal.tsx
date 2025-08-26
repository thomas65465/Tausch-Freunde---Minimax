import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Sticker } from '../lib/supabase';
import { X, Package, Sparkles, Gift } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface StickerPackModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface PackResult {
  stickers: Sticker[];
  isNew: boolean[];
}

const rarityWeights = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 4,
  legendary: 1
};

const rarityColors = {
  common: 'border-gray-300 bg-gray-50',
  uncommon: 'border-green-300 bg-green-50',
  rare: 'border-blue-300 bg-blue-50',
  epic: 'border-purple-300 bg-purple-50',
  legendary: 'border-yellow-300 bg-yellow-50',
};

export default function StickerPackModal({ onClose, onSuccess }: StickerPackModalProps) {
  const { user } = useAuth();
  const [opening, setOpening] = useState(false);
  const [packResult, setPackResult] = useState<PackResult | null>(null);
  const [animation, setAnimation] = useState(false);
  const [showResults, setShowResults] = useState(false);

  async function openStickerPack() {
    if (!user) return;

    try {
      setOpening(true);
      setAnimation(true);
      
      // Simulate pack opening animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get all available stickers
      const { data: allStickers, error: stickersError } = await supabase
        .from('stickers')
        .select('*');

      if (stickersError) throw stickersError;

      if (!allStickers || allStickers.length === 0) {
        toast.error('Keine Sticker verfügbar');
        return;
      }

      // Generate 5 random stickers based on rarity weights
      const packStickers: Sticker[] = [];
      const isNew: boolean[] = [];
      
      for (let i = 0; i < 5; i++) {
        const randomSticker = getRandomStickerByRarity(allStickers);
        packStickers.push(randomSticker);
        
        // Check if user already has this sticker
        const { data: existingSticker } = await supabase
          .from('user_stickers')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('sticker_id', randomSticker.id)
          .single();
        
        const isNewSticker = !existingSticker;
        isNew.push(isNewSticker);
        
        // Add or update user's sticker collection
        await supabase
          .from('user_stickers')
          .upsert({
            user_id: user.id,
            sticker_id: randomSticker.id,
            quantity: (existingSticker?.quantity || 0) + 1
          });
      }

      setPackResult({ stickers: packStickers, isNew });
      setAnimation(false);
      setShowResults(true);
      
      // Count new vs duplicate stickers for toast
      const newCount = isNew.filter(Boolean).length;
      const duplicateCount = 5 - newCount;
      
      if (newCount === 5) {
        toast.success('🎉 Alle 5 Sticker sind neu!');
      } else if (newCount > 0) {
        toast.success(`✨ ${newCount} neue Sticker erhalten! (${duplicateCount} Duplikate)`);
      } else {
        toast('💫 5 Duplikate erhalten - perfekt zum Handeln!');
      }
      
    } catch (error) {
      console.error('Error opening sticker pack:', error);
      toast.error('Fehler beim Öffnen des Sticker-Pakets');
    } finally {
      setOpening(false);
    }
  }

  function getRandomStickerByRarity(stickers: Sticker[]): Sticker {
    // Create weighted array based on rarity
    const weightedStickers: Sticker[] = [];
    
    stickers.forEach(sticker => {
      const weight = rarityWeights[sticker.rarity as keyof typeof rarityWeights] || 1;
      for (let i = 0; i < weight; i++) {
        weightedStickers.push(sticker);
      }
    });
    
    const randomIndex = Math.floor(Math.random() * weightedStickers.length);
    return weightedStickers[randomIndex];
  }

  function handleClose() {
    if (packResult) {
      onSuccess(); // Refresh the parent component
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="w-6 h-6 mr-2 text-primary-600" />
            Sticker-Paket
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            disabled={opening}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!packResult && !opening ? (
          /* Pre-opening state */
          <div className="py-8">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary-400 to-purple-500 rounded-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-200 cursor-pointer">
              <Gift className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Sticker-Paket öffnen
            </h3>
            <p className="text-gray-600 mb-6">
              Öffne ein Paket und erhalte 5 zufällige Sticker!
            </p>
            <div className="text-sm text-gray-500 mb-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-full mr-1"></div>
                  <span>Häufig (50%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div>
                  <span>Ungewöhnlich (30%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
                  <span>Selten (15%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-400 rounded-full mr-1"></div>
                  <span>Episch (4%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
                  <span>Legendär (1%)</span>
                </div>
              </div>
            </div>
            <button
              onClick={openStickerPack}
              className="btn-primary px-8 py-3 text-lg"
            >
              <Package className="w-5 h-5 mr-2" />
              Paket öffnen
            </button>
          </div>
        ) : opening || animation ? (
          /* Opening animation */
          <div className="py-12">
            <div className={`w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary-400 to-purple-500 rounded-2xl flex items-center justify-center ${
              animation ? 'animate-bounce' : ''
            }`}>
              <Sparkles className="w-16 h-16 text-white animate-pulse" />
            </div>
            <div className="space-y-2">
              <LoadingSpinner size="lg" />
              <p className="text-xl font-bold text-gray-900">Paket wird geöffnet...</p>
              <p className="text-gray-600">Die Spannung steigt! 🎉</p>
            </div>
          </div>
        ) : showResults && packResult ? (
          /* Results */
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                Deine neuen Sticker!
              </h3>
              <div className="text-sm text-gray-600">
                {packResult.isNew.filter(Boolean).length} neu • {packResult.isNew.filter(isNew => !isNew).length} Duplikate
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 mb-6">
              {packResult.stickers.map((sticker, index) => (
                <div key={`${sticker.id}-${index}`} className="relative">
                  <div 
                    className={`aspect-square rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                      rarityColors[sticker.rarity]
                    } ${packResult.isNew[index] ? 'ring-2 ring-yellow-400 shadow-lg' : ''}`}
                    style={{ 
                      animationDelay: `${index * 200}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-600 mb-1">
                          #{sticker.sticker_number}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          rarityColors[sticker.rarity]
                        }`}>
                          {sticker.rarity}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* New Badge */}
                  {packResult.isNew[index] && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      NEU!
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-gray-900 truncate">
                      {sticker.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={openStickerPack}
                className="flex-1 btn-secondary"
              >
                <Package className="w-4 h-4 mr-2" />
                Weiteres Paket öffnen
              </button>
              <button
                onClick={handleClose}
                className="flex-1 btn-primary"
              >
                Fertig
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}