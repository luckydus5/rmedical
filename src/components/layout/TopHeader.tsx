import { Bell, Search, Moon, Sun, MessageSquare, Check, CheckCheck, AlertCircle, Info, Calendar, Building2, User, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface TopHeaderProps {
  sidebarCollapsed?: boolean;
}

interface SearchResult {
  id: string;
  type: 'patient' | 'facility' | 'staff' | 'page';
  title: string;
  subtitle: string;
  url: string;
}

export default function TopHeader({ sidebarCollapsed = false }: TopHeaderProps) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get notifications
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    isMarkingAllAsRead 
  } = useNotifications();

  // Fetch user's full name from profiles
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Global search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];

    try {
      // Search patients (profiles)
      const { data: patients } = await supabase
        .from('profiles')
        .select('user_id, full_name, national_id')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      if (patients) {
        patients.forEach(p => {
          results.push({
            id: p.user_id,
            type: 'patient',
            title: p.full_name || 'Unknown',
            subtitle: p.national_id ? `ID: ${p.national_id}` : 'Patient',
            url: `/patients/${p.user_id}`,
          });
        });
      }

      // Search facilities
      const { data: facilities } = await supabase
        .from('facilities')
        .select('id, name, city, facility_type')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (facilities) {
        facilities.forEach(f => {
          results.push({
            id: f.id,
            type: 'facility',
            title: f.name,
            subtitle: `${f.facility_type?.replace('_', ' ')} • ${f.city || 'Unknown location'}`,
            url: `/admin/facilities`,
          });
        });
      }

      // Search staff - first get staff, then get their profile names
      const { data: staff } = await supabase
        .from('facility_staff')
        .select('id, role, user_id')
        .limit(10);

      if (staff && staff.length > 0) {
        // Get profiles for these staff members
        const userIds = staff.map(s => s.user_id);
        const { data: staffProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds)
          .ilike('full_name', `%${query}%`);

        if (staffProfiles) {
          staffProfiles.forEach(profile => {
            const staffMember = staff.find(s => s.user_id === profile.user_id);
            if (staffMember && profile.full_name) {
              results.push({
                id: staffMember.id,
                type: 'staff',
                title: profile.full_name,
                subtitle: staffMember.role?.replace('_', ' ') || 'Staff',
                url: `/admin/users`,
              });
            }
          });
        }
      }

      // Add page results based on query
      const pages = [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Patients', url: '/patients' },
        { name: 'Appointments', url: '/appointments' },
        { name: 'Facilities', url: '/admin/facilities' },
        { name: 'Users & Roles', url: '/admin/users' },
        { name: 'Analytics', url: '/admin/analytics' },
        { name: 'Reports', url: '/admin/reports' },
        { name: 'Settings', url: '/admin/settings' },
        { name: 'Medical Records', url: '/records' },
      ];

      pages.forEach(page => {
        if (page.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: page.url,
            type: 'page',
            title: page.name,
            subtitle: 'Navigate to page',
            url: page.url,
          });
        }
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSelect = (result: SearchResult) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(result.url);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      case 'appointment': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'facility': return <Building2 className="h-4 w-4 text-purple-500" />;
      case 'user': return <User className="h-4 w-4 text-cyan-500" />;
      case 'system': return <Settings className="h-4 w-4 text-gray-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSearchIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient': return <User className="h-4 w-4" />;
      case 'facility': return <Building2 className="h-4 w-4" />;
      case 'staff': return <User className="h-4 w-4" />;
      case 'page': return <Search className="h-4 w-4" />;
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <>
      {/* Global Search Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput 
          placeholder="Search patients, facilities, pages..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <CommandEmpty>
              {searchQuery.length < 2 
                ? 'Type at least 2 characters to search...'
                : 'No results found.'
              }
            </CommandEmpty>
          ) : (
            <>
              {['patient', 'facility', 'staff', 'page'].map(type => {
                const typeResults = searchResults.filter(r => r.type === type);
                if (typeResults.length === 0) return null;
                return (
                  <CommandGroup key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + 's'}>
                    {typeResults.map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSearchSelect(result)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          {getSearchIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>

      <header 
        className="fixed top-0 right-0 z-30 h-16 border-b border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300"
        style={{ left: sidebarCollapsed ? '5rem' : '18rem' }}
      >
        <div className="flex h-full items-center justify-between px-6">
          {/* Search Bar - Clickable */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div 
              className="relative flex-1 cursor-pointer"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <div className="pl-10 h-10 bg-muted/50 border-0 rounded-md flex items-center text-muted-foreground text-sm hover:bg-muted transition-colors">
                Search patients, records, facilities...
              </div>
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Offline Indicator */}
            <OfflineIndicator />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-lg hover:bg-muted"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Messages */}
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted relative">
              <MessageSquare className="h-4 w-4" />
            </Button>

            {/* Notifications - Real */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs text-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        markAllAsRead();
                      }}
                      disabled={isMarkingAllAsRead}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                      <p className="text-xs mt-1">You'll see alerts for appointments, updates, and more here.</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                          if (notification.action_url) {
                            navigate(notification.action_url);
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-center text-primary font-medium justify-center cursor-pointer"
                      onClick={() => navigate('/notifications')}
                    >
                      View all notifications
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Separator */}
            <div className="h-8 w-px bg-border mx-2" />

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-1.5 gap-3 hover:bg-muted rounded-xl">
                  <Avatar className="h-8 w-8 border-2 border-primary/20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{role || 'Patient'}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/settings')}>Preferences</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
