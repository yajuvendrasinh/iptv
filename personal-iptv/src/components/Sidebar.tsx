'use client';

import { Star, Circle, Heart } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string | null;
  category?: string;
  countryCode?: string;
  countryName?: string;
}

interface SidebarProps {
  favorites: Channel[];
  recommended: Channel[];
  activeChannel: Channel;
  onSelectChannel: (channel: Channel) => void;
}

export default function Sidebar({ favorites, recommended, activeChannel, onSelectChannel }: SidebarProps) {
  const getChannelSymbol = (channel: Channel) => {
    if (channel.category?.toLowerCase().includes('sport')) return '⚽';
    if (channel.category?.toLowerCase().includes('music')) return '🎵';
    if (channel.category?.toLowerCase().includes('movie')) return '🎬';
    if (channel.category?.toLowerCase().includes('news')) return '📰';
    if (channel.category?.toLowerCase().includes('kid')) return '👶';
    return '📡';
  };

  const ChannelRow = ({ channel }: { channel: Channel }) => {
    const isActive = activeChannel.id === channel.id && activeChannel.countryCode === channel.countryCode;
    return (
      <button
        onClick={() => onSelectChannel(channel)}
        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-150 group ${
          isActive 
            ? 'bg-neutral-100 dark:bg-neutral-900 font-medium border-l-2 border-lime-500 rounded-l-none' 
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-900 border-l-2 border-transparent'
        }`}
      >
        {/* Compact Logo Thumbnail */}
        <div className="w-16 aspect-video bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center text-xl relative overflow-hidden flex-shrink-0 shadow-sm border border-neutral-200/55 dark:border-neutral-700/50">
          {channel.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={channel.logo} 
              alt={channel.name} 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  const fallback = document.createElement('span');
                  fallback.innerText = getChannelSymbol(channel);
                  fallback.className = 'text-lg';
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <span className="text-lg">{getChannelSymbol(channel)}</span>
          )}
          <span className="absolute bottom-1 right-1 flex items-center px-1 rounded bg-red-600 text-[8px] text-white font-bold uppercase tracking-wider scale-90">
            Live
          </span>
        </div>

        {/* Channel Details */}
        <div className="min-w-0 flex-1">
          <div className={`text-xs truncate ${isActive ? 'text-neutral-950 dark:text-neutral-50 font-semibold' : 'text-neutral-700 dark:text-neutral-300'}`}>
            {channel.name}
          </div>
          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
            {channel.category || 'General'} · {channel.countryName}
          </div>
        </div>
      </button>
    );
  };

  return (
    <aside className="w-full flex flex-col gap-6 select-none">
      {/* 1. Favorites List */}
      <div>
        <div className="flex items-center gap-1.5 px-1 mb-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
          <span>Favorite Channels ({favorites.length})</span>
        </div>
        
        {favorites.length > 0 ? (
          <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
            {favorites.map((channel) => (
              <ChannelRow key={`fav-${channel.id}-${channel.countryCode}`} channel={channel} />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              No favorites added yet. Click <Heart className="w-3 h-3 inline mx-0.5" /> Favorite on the player page to add.
            </p>
          </div>
        )}
      </div>

      {/* 2. Suggested Channels */}
      <div>
        <div className="flex items-center gap-1.5 px-1 mb-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>Recommended</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {recommended.map((channel) => (
            <ChannelRow key={`rec-${channel.id}-${channel.countryCode}`} channel={channel} />
          ))}
        </div>
      </div>
    </aside>
  );
}
