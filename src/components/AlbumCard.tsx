import { useState } from 'react';
import type { Album } from '../lib/supabase';
import { ChevronRight, Star } from 'lucide-react';
import AlbumDetailModal from './AlbumDetailModal';

interface AlbumWithProgress extends Album {
  collected_count: number;
  completion_percentage: number;
}

interface AlbumCardProps {
  album: AlbumWithProgress;
  onRefresh: () => void;
}

export default function AlbumCard({ album, onRefresh }: AlbumCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'from-green-500 to-green-600';
    if (percentage >= 75) return 'from-blue-500 to-blue-600';
    if (percentage >= 50) return 'from-yellow-500 to-yellow-600';
    if (percentage >= 25) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <>
      <div className="card hover:shadow-lg transition-all duration-200 cursor-pointer group" 
           onClick={() => setShowDetail(true)}>
        {/* Album Image */}
        <div className="relative mb-4 overflow-hidden rounded-lg">
          <div className="w-full h-32 bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center">
            {album.image_url ? (
              <img
                src={album.image_url}
                alt={album.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <Star className="w-12 h-12 text-primary-400" />
            )}
          </div>
          
          {/* Completion Badge */}
          {album.completion_percentage === 100 && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
              <Star className="w-3 h-3 mr-1" />
              Komplett!
            </div>
          )}
        </div>

        {/* Album Info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
              {album.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {album.description}
            </p>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-700 font-medium">
                {album.collected_count} / {album.total_stickers} Sticker
              </span>
              <span className="text-sm font-bold text-gray-900">
                {album.completion_percentage}%
              </span>
            </div>
            
            <div className="progress-bar">
              <div 
                className={`h-full bg-gradient-to-r ${getProgressColor(album.completion_percentage)} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${album.completion_percentage}%` }}
              />
            </div>
          </div>

          {/* View Details */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">
              {album.total_stickers} Sticker insgesamt
            </div>
            <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700">
              Details
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Album Detail Modal */}
      {showDetail && (
        <AlbumDetailModal
          album={album}
          onClose={() => setShowDetail(false)}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}