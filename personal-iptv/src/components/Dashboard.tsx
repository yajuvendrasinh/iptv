'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, Share2, MoreHorizontal, Clock, Globe, Shield, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import VideoPlayer from './VideoPlayer';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string | null;
  category?: string;
  countryCode?: string;
  countryName?: string;
}

// Curated stable recommended channels list
const RECOMMENDED_CHANNELS: Channel[] = [
  {
    id: "AlJazeera.qa@English",
    name: "Al Jazeera English",
    category: "News",
    countryCode: "sk",
    countryName: "Slovakia",
    url: "https://dash4.antik.sk/live/test_aljazeera_eng/playlist.m3u8",
    logo: null
  },
  {
    id: "BBCNews.uk@Europe",
    name: "BBC News Europe",
    category: "News",
    countryCode: "sk",
    countryName: "Slovakia",
    url: "https://dash2.antik.sk/live/test_bbc_world/playlist.m3u8",
    logo: null
  },
  {
    id: "EuronewsEnglish.fr@HD",
    name: "Euronews English HD",
    category: "News",
    countryCode: "sk",
    countryName: "Slovakia",
    url: "https://dash4.antik.sk/live/test_euronews/playlist.m3u8",
    logo: null
  },
  {
    id: "France24.fr@English",
    name: "France 24 English",
    category: "News",
    countryCode: "sk",
    countryName: "Slovakia",
    url: "https://dash3.antik.sk/live/test_france24_eng/playlist.m3u8",
    logo: null
  },
  {
    id: "TRTWorld.tr@HD",
    name: "TRT World HD",
    category: "News",
    countryCode: "sk",
    countryName: "Slovakia",
    url: "https://dash2.antik.sk/live/test_trt_world_atktv/playlist.m3u8",
    logo: null
  },
  {
    id: "ArirangTV.kr@HD",
    name: "Arirang TV HD",
    category: "General",
    countryCode: "sk",
    countryName: "Slovakia",
    url: "https://dash3.antik.sk/live/test_arirang/playlist.m3u8",
    logo: null
  }
];

export default function Dashboard() {
  const [activeChannel, setActiveChannel] = useState<Channel>(RECOMMENDED_CHANNELS[0]);
  const [sidebarChannels, setSidebarChannels] = useState<Channel[]>(RECOMMENDED_CHANNELS);
  const [favorites, setFavorites] = useState<Channel[]>([]);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [epgData, setEpgData] = useState<{ time: string; title: string; isNow?: boolean }[]>([]);
  const [currentProgress, setCurrentProgress] = useState(42);

  // Modal Dialogs States
  const [isPlaylistsOpen, setIsPlaylistsOpen] = useState(false);
  const [isAllChannelsOpen, setIsAllChannelsOpen] = useState(false);
  
  // Playlists aggregation data
  const [countries, setCountries] = useState<{ name: string; code: string; count: number }[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  
  // Channels Modal State
  const [modalSearchText, setModalSearchText] = useState('');
  const [modalChannels, setModalChannels] = useState<Channel[]>([]);
  const [modalChannelsLoading, setModalChannelsLoading] = useState(false);

  // Fetch unique countries on modal open
  useEffect(() => {
    if (!isPlaylistsOpen) return;
    setPlaylistsLoading(true);
    fetch('/api/countries')
      .then(res => res.json())
      .then(data => {
        setCountries(data);
        setPlaylistsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setPlaylistsLoading(false);
      });
  }, [isPlaylistsOpen]);

  // Fetch initial channels in modal, or on search change
  useEffect(() => {
    if (!isAllChannelsOpen) return;
    setModalChannelsLoading(true);
    const q = modalSearchText.trim();
    fetch(`/api/channels?q=${encodeURIComponent(q)}&limit=100`)
      .then(res => res.json())
      .then(data => {
        setModalChannels(data);
        setModalChannelsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setModalChannelsLoading(false);
      });
  }, [isAllChannelsOpen, modalSearchText]);

  // Load a playlist (country) dynamically
  const selectPlaylist = async (countryCode: string) => {
    try {
      const res = await fetch(`/api/channels?country=${countryCode}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setSidebarChannels(data);
          setActiveChannel(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsPlaylistsOpen(false);
  };

  const getCountryFlag = (countryCode: string) => {
    if (countryCode === 'intl' || countryCode === 'undefined') return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch (e) {
      return '🏳️';
    }
  };

  // Load favorites and last played channel from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('iptv_favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }

      const lastChannel = localStorage.getItem('iptv_last_channel');
      if (lastChannel) {
        setActiveChannel(JSON.parse(lastChannel));
      }
    } catch (e) {
      console.error('Failed to load local storage data:', e);
    }
  }, []);

  // Save active channel to local storage when it changes
  useEffect(() => {
    if (activeChannel) {
      localStorage.setItem('iptv_last_channel', JSON.stringify(activeChannel));
    }
  }, [activeChannel]);

  // Update mock EPG timeline whenever the channel or system hour changes
  useEffect(() => {
    const currentHour = new Date().getHours();
    
    // Generate simple dynamic schedule based on channel name
    const schedule = [
      {
        time: `${String((currentHour - 1 + 24) % 24).padStart(2, '0')}:00`,
        title: `${activeChannel.name} Focus`
      },
      {
        time: `${String(currentHour).padStart(2, '0')}:00`,
        title: `${activeChannel.category || 'General'} World Hour`,
        isNow: true
      },
      {
        time: `${String((currentHour + 1) % 24).padStart(2, '0')}:00`,
        title: `Global Reports & Analysis`
      },
      {
        time: `${String((currentHour + 2) % 24).padStart(2, '0')}:00`,
        title: `Documentary Special`
      }
    ];

    setEpgData(schedule);

    // Mock progress bar state
    const currentMinute = new Date().getMinutes();
    const progress = Math.round((currentMinute / 60) * 100);
    setCurrentProgress(progress);
  }, [activeChannel]);

  // Check if active channel is favorited
  const isFavorite = favorites.some(
    (ch) => ch.id === activeChannel.id && ch.countryCode === activeChannel.countryCode
  );

  // Toggle favorite
  const toggleFavorite = () => {
    let newFavs = [...favorites];
    if (isFavorite) {
      newFavs = newFavs.filter(
        (ch) => !(ch.id === activeChannel.id && ch.countryCode === activeChannel.countryCode)
      );
    } else {
      newFavs.push(activeChannel);
    }
    setFavorites(newFavs);
    localStorage.setItem('iptv_favorites', JSON.stringify(newFavs));
  };

  // Copy share link
  const copyShareLink = () => {
    const textToCopy = `Watch ${activeChannel.name} on Streamr: ${activeChannel.url}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 min-h-screen transition-colors duration-200">
      {/* 1. Top Navbar */}
      <Navbar 
        onSelectChannel={setActiveChannel} 
        onOpenPlaylists={() => setIsPlaylistsOpen(true)}
        onOpenChannels={() => setIsAllChannelsOpen(true)}
      />

      {/* 2. Main Page Grid Layout */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 pt-20 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Player, Metadata, Schedule */}
        <section className="lg:col-span-2 flex flex-col">
          {/* Custom Player */}
          <VideoPlayer channel={activeChannel} />

          {/* Channel Info Title & Tags */}
          <div className="mt-4">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {activeChannel.name}
            </h1>
            
            {/* Live tags / badges */}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400 select-none">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>24/7 Live Stream</span>
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                <span>{activeChannel.countryName || 'International'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>{activeChannel.category || 'General'}</span>
              </span>
            </div>
          </div>

          {/* YouTube Action Buttons */}
          <div className="flex items-center justify-between mt-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            {/* Favorites Toggle button */}
            <Button
              onClick={toggleFavorite}
              variant={isFavorite ? 'default' : 'secondary'}
              size="sm"
              className={`rounded-full px-4 h-9 gap-1.5 font-medium transition-all ${
                isFavorite 
                  ? 'bg-lime-400 dark:bg-lime-400 hover:bg-lime-500 text-neutral-950 font-semibold' 
                  : 'bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-neutral-950 text-neutral-950' : ''}`} />
              <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
            </Button>

            {/* Share and Extra options */}
            <div className="flex items-center gap-2">
              <Button
                onClick={copyShareLink}
                variant="secondary"
                size="sm"
                className="rounded-full px-4 h-9 gap-1.5 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
              >
                <Share2 className="w-4 h-4" />
                <span>{shareStatus === 'copied' ? 'Link Copied!' : 'Share'}</span>
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Collapsible Info Card */}
          <div className="mt-5 p-4 rounded-xl bg-neutral-100/60 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-lg select-none">
                📺
              </div>
              <div>
                <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{activeChannel.name}</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">{activeChannel.countryName || 'International'} · Free Stream</p>
              </div>
            </div>

            <div className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
              {activeChannel.name} is a live streaming television channel broadcasting from {activeChannel.countryName}. 
              It provides continuous live coverage of events, localized broadcasts, {activeChannel.category?.toLowerCase() || 'general'} programming, and entertainment streams direct to your player.
              {isDescExpanded && (
                <span className="block mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800/80">
                  This personal stream portal compiles publicly accessible M3U streams directly into a clean, modern workspace. 
                  Stream load speeds depend on source server bandwidth. All channels broadcast directly in high definition (HD).
                </span>
              )}
            </div>

            <button
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className="mt-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:underline hover:text-neutral-900 dark:hover:text-white"
            >
              {isDescExpanded ? 'Show less' : 'Show more'}
            </button>

            {/* Dynamic Mock EPG (Electronic Program Guide) */}
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800/80">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>On Air Schedule</span>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {epgData.map((item, idx) => (
                  <div key={`epg-${idx}`} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-neutral-400 w-10">{item.time}</span>
                        <span className={`font-medium ${item.isNow ? 'text-lime-600 dark:text-lime-400 font-semibold' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {item.title}
                        </span>
                      </div>
                      {item.isNow && (
                        <span className="px-1.5 py-0.5 rounded bg-lime-400/20 text-lime-600 dark:text-lime-400 text-[9px] font-bold tracking-wider">
                          NOW PLAYING
                        </span>
                      )}
                    </div>
                    {item.isNow && (
                      <div className="ml-13 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-lime-400 dark:bg-lime-400" style={{ width: `${currentProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Sidebar (Favorites & Recommendations) */}
        <section className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800/80 pt-6 lg:pt-0 lg:pl-6">
          <Sidebar
            favorites={favorites}
            recommended={sidebarChannels}
            activeChannel={activeChannel}
            onSelectChannel={setActiveChannel}
          />
        </section>

      </main>

      {/* Playlists Modal */}
      <Dialog open={isPlaylistsOpen} onOpenChange={setIsPlaylistsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Browse Playlists by Country</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-thin">
            {playlistsLoading ? (
              <div className="p-8 text-center text-xs text-neutral-400">Loading playlists...</div>
            ) : countries.length > 0 ? (
              countries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => selectPlaylist(c.code)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/85 text-left transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {getCountryFlag(c.code)}
                    </span>
                    <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                      {c.name}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold">
                    {c.count} channels
                  </span>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400">No playlists available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* All Channels Modal */}
      <Dialog open={isAllChannelsOpen} onOpenChange={setIsAllChannelsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-semibold">Browse All Channels</DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center mb-4">
            <Input
              type="search"
              placeholder="Search inside all channels..."
              value={modalSearchText}
              onChange={(e) => setModalSearchText(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs"
            />
            <Search className="absolute left-3 w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-thin">
            {modalChannelsLoading ? (
              <div className="p-8 text-center text-xs text-neutral-400">Loading channels...</div>
            ) : modalChannels.length > 0 ? (
              modalChannels.map((channel) => (
                <button
                  key={`${channel.id}-${channel.countryCode}-modal`}
                  onClick={() => {
                    setActiveChannel(channel);
                    setIsAllChannelsOpen(false);
                    setModalSearchText('');
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/85 text-left transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800"
                >
                  <div className="w-12 aspect-video bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center text-lg relative overflow-hidden flex-shrink-0">
                    {channel.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={channel.logo} 
                        alt={channel.name} 
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>📡</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {channel.name}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {channel.category || 'General'} · {channel.countryName}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400">No channels found</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
