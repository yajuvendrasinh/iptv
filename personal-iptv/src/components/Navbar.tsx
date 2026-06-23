'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Settings, Sun, Moon, Tv } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string | null;
  category?: string;
  countryCode?: string;
  countryName?: string;
}

interface NavbarProps {
  onSelectChannel: (channel: Channel) => void;
}

export default function Navbar({ onSelectChannel }: NavbarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Initialize theme from document class or localStorage
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    if (isDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Handle Search Input Changes
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/channels?q=${encodeURIComponent(searchQuery)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChannelClick = (channel: Channel) => {
    onSelectChannel(channel);
    setSearchQuery('');
    setSearchResults([]);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 z-50 transition-colors duration-200 shadow-sm">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => window.location.reload()}>
        <Tv className="w-5 h-5 text-lime-500" />
        <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 text-base">
          Stream<em className="text-lime-500 not-italic font-bold">r</em>
        </span>
      </div>

      {/* Middle: Search Box */}
      <div ref={searchRef} className="relative w-full max-w-md mx-4">
        <div className="relative flex items-center">
          <Input
            type="search"
            placeholder="Search channels, categories, countries..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full h-9 pl-9 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-xs focus-visible:ring-lime-500 transition-colors"
          />
          <Search className="absolute left-3 w-4 h-4 text-neutral-400" />
        </div>

        {/* Autocomplete Dropdown */}
        {isDropdownOpen && (searchQuery.trim().length >= 2 || searchResults.length > 0) && (
          <div className="absolute top-11 left-0 right-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg max-h-80 overflow-y-auto z-50 p-2 scrollbar-thin">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-neutral-400">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {searchResults.map((channel) => (
                  <button
                    key={`${channel.id}-${channel.countryCode}`}
                    onClick={() => handleChannelClick(channel)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-base flex-shrink-0">
                      {channel.category?.toLowerCase().includes('sport') ? '⚽' : 
                       channel.category?.toLowerCase().includes('music') ? '🎵' : 
                       channel.category?.toLowerCase().includes('movie') ? '🎬' : 
                       channel.category?.toLowerCase().includes('news') ? '📰' : '📡'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        {channel.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                        <span>{channel.category || 'General'}</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
                        <span>{channel.countryName}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-neutral-400">No channels found</div>
            )}
          </div>
        )}
      </div>

      {/* Right: Theme Toggle & Actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme Switch Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-lime-400" />
          )}
        </Button>

        {/* Settings button */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </Button>

        {/* User Profile Initial Badge */}
        <div className="w-7 h-7 rounded-full bg-lime-400 dark:bg-lime-400 text-neutral-950 flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer select-none">
          Y
        </div>
      </div>
    </nav>
  );
}
