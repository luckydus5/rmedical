import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import sanoviaLogo from '@/assets/sanovia-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DashboardHeader() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'doctor': return 'bg-info/10 text-info border-info/20';
      case 'nurse': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => navigate('/')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden transition-transform group-hover:scale-105">
            <img src={sanoviaLogo} alt="Sanovia" className="h-10 w-10 object-contain" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
            Sanovia
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(role)}`}>
                    {role || 'patient'}
                  </Badge>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
