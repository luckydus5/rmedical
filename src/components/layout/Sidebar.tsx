import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import sanoviaLogo from '@/assets/sanovia-logo.png';
import {
  Building2,
  Users,
  Database,
  BarChart3,
  Brain,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Shield,
  Bell,
  Stethoscope,
  Calendar,
  Activity,
  Heart,
  Clock,
  LogOut,
  UserCog,
  Server,
  Lock,
  FileCheck,
  Layers,
  Globe,
  Zap,
  ChevronDown,
  Sparkles,
  CircleDot,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  route?: string;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['system']);
  const { role, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Admin navigation structure
  const adminNavSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { 
          id: 'command-center', 
          label: 'Command Center', 
          icon: <LayoutDashboard className="h-5 w-5" />, 
          route: '/' 
        },
      ],
    },
    {
      title: 'System Management',
      items: [
        { 
          id: 'facilities', 
          label: 'Facilities', 
          icon: <Building2 className="h-5 w-5" />, 
          route: '/facilities',
        },
        { 
          id: 'staff-portal', 
          label: 'Staff Portal', 
          icon: <Stethoscope className="h-5 w-5" />, 
          route: '/staff-portal' 
        },
        { 
          id: 'users', 
          label: 'Users & Roles', 
          icon: <UserCog className="h-5 w-5" />,
          route: '/users'
        },
      ],
    },
    {
      title: 'Analytics & Reports',
      items: [
        { 
          id: 'analytics', 
          label: 'Analytics', 
          icon: <BarChart3 className="h-5 w-5" />,
          route: '/analytics'
        },
        { 
          id: 'reports', 
          label: 'Reports', 
          icon: <FileCheck className="h-5 w-5" />,
          route: '/reports'
        },
      ],
    },
    {
      title: 'Security & Compliance',
      items: [
        { 
          id: 'security', 
          label: 'Security Center', 
          icon: <Shield className="h-5 w-5" />,
          route: '/security'
        },
        { 
          id: 'audit-logs', 
          label: 'Audit Logs', 
          icon: <FileText className="h-5 w-5" />,
          route: '/audit-logs'
        },
        { 
          id: 'access-control', 
          label: 'Access Control', 
          icon: <Lock className="h-5 w-5" />,
          route: '/access-control'
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { 
          id: 'database', 
          label: 'Database', 
          icon: <Database className="h-5 w-5" />,
          route: '/database'
        },
        { 
          id: 'ai-features', 
          label: 'AI Features', 
          icon: <Brain className="h-5 w-5" />,
          route: '/ai-features',
          badge: 'Beta',
          badgeVariant: 'info'
        },
        { 
          id: 'settings', 
          label: 'Settings', 
          icon: <Settings className="h-5 w-5" />,
          route: '/settings'
        },
      ],
    },
  ];

  // Facility staff navigation
  const facilityNavSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, route: '/' },
      ],
    },
    {
      title: 'Patient Care',
      items: [
        { id: 'staff-portal', label: 'Staff Portal', icon: <Stethoscope className="h-5 w-5" />, route: '/staff-portal' },
        { id: 'records', label: 'Medical Records', icon: <FileText className="h-5 w-5" />, route: '/records' },
        { id: 'appointments', label: 'Appointments', icon: <Calendar className="h-5 w-5" />, route: '/appointments' },
        { id: 'schedule', label: 'My Schedule', icon: <Clock className="h-5 w-5" />, route: '/schedule' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, route: '/profile' },
      ],
    },
  ];

  // Patient navigation
  const patientNavSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, route: '/' },
      ],
    },
    {
      title: 'Health',
      items: [
        { id: 'my-records', label: 'My Records', icon: <FileText className="h-5 w-5" />, route: '/records' },
        { id: 'appointments', label: 'My Appointments', icon: <Calendar className="h-5 w-5" />, route: '/appointments' },
        { id: 'sharing', label: 'Share Access', icon: <Shield className="h-5 w-5" /> },
      ],
    },
    {
      title: 'Settings',
      items: [
        { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, route: '/profile' },
      ],
    },
  ];

  const getNavSections = () => {
    if (role === 'admin') return adminNavSections;
    if (role === 'doctor' || role === 'nurse') return facilityNavSections;
    return patientNavSections;
  };

  const navSections = getNavSections();

  const getBadgeColor = (variant?: string) => {
    switch (variant) {
      case 'success': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      case 'warning': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'info': return 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30';
      case 'danger': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const isActiveRoute = (route?: string, id?: string) => {
    if (route) {
      return location.pathname === route;
    }
    return activeTab === id;
  };

  const handleNavClick = (item: NavItem) => {
    if (item.route) {
      navigate(item.route);
    } else {
      onTabChange(item.id);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return { 
          label: 'System Admin', 
          color: 'from-purple-600 to-indigo-700',
          bgColor: 'bg-purple-600/15',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500/40'
        };
      case 'doctor':
        return { 
          label: 'Doctor', 
          color: 'from-blue-500 to-cyan-600',
          bgColor: 'bg-blue-500/10',
          textColor: 'text-blue-500',
          borderColor: 'border-blue-500/30'
        };
      case 'nurse':
        return { 
          label: 'Nurse', 
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'bg-emerald-500/10',
          textColor: 'text-emerald-500',
          borderColor: 'border-emerald-500/30'
        };
      default:
        return { 
          label: 'Patient', 
          color: 'from-primary to-primary/80',
          bgColor: 'bg-primary/10',
          textColor: 'text-primary',
          borderColor: 'border-primary/30'
        };
    }
  };

  const roleConfig = getRoleConfig();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out',
          'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950',
          'border-r border-slate-800/50',
          collapsed ? 'w-[72px]' : 'w-[280px]'
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          'flex items-center h-16 border-b border-slate-800/50 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/30">
                <img src={sanoviaLogo} alt="Sanovia" className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Sanovia
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                  Healthcare
                </p>
              </div>
            )}
          </div>
          
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setCollapsed(true)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Collapsed Toggle */}
        {collapsed && (
          <div className="flex justify-center py-2 border-b border-slate-800/50">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setCollapsed(false)}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* User Profile Section */}
        {!collapsed && (
          <div className="p-4 border-b border-slate-800/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <Avatar className="h-10 w-10 border-2 border-slate-700">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className={cn('text-sm font-semibold bg-gradient-to-br', roleConfig.color, 'text-white')}>
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin User'}
                </p>
                <Badge 
                  variant="outline" 
                  className={cn('text-[10px] px-2 py-0 font-medium', roleConfig.bgColor, roleConfig.textColor, roleConfig.borderColor)}
                >
                  {roleConfig.label}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed User Avatar */}
        {collapsed && (
          <div className="flex justify-center py-4 border-b border-slate-800/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-10 w-10 border-2 border-slate-700 cursor-pointer">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className={cn('text-sm font-semibold bg-gradient-to-br', roleConfig.color, 'text-white')}>
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {roleConfig.label}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 h-[calc(100vh-280px)]">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className={cn(sectionIndex > 0 && 'mt-6')}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = isActiveRoute(item.route, item.id);
                  
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleNavClick(item)}
                          className={cn(
                            'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                            isActive
                              ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25'
                              : 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
                            collapsed && 'justify-center px-2'
                          )}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white/50" />
                          )}
                          
                          <span className={cn(
                            'transition-all duration-200',
                            !isActive && 'group-hover:scale-110 group-hover:text-primary'
                          )}>
                            {item.icon}
                          </span>
                          
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-left">{item.label}</span>
                              {item.badge && (
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-[9px] px-1.5 py-0 font-medium', getBadgeColor(item.badgeVariant))}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </button>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="font-medium bg-slate-800 border-slate-700 text-white">
                          <div className="flex items-center gap-2">
                            {item.label}
                            {item.badge && (
                              <Badge variant="outline" className={cn('text-[9px] px-1 py-0', getBadgeColor(item.badgeVariant))}>
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
          {/* Help & Support */}
          <div className="p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-slate-800/80 hover:text-white',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <HelpCircle className="h-5 w-5" />
                  {!collapsed && <span>Help & Support</span>}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium bg-slate-800 border-slate-700 text-white">
                  Help & Support
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Logout */}
          <div className="p-3 pt-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    'text-red-400/80 hover:bg-red-500/10 hover:text-red-400',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <LogOut className="h-5 w-5" />
                  {!collapsed && <span>Sign Out</span>}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium bg-slate-800 border-slate-700 text-white">
                  Sign Out
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Version */}
          {!collapsed && (
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between text-[10px] text-slate-600">
                <span>Sanovia v1.0.0</span>
                <span className="flex items-center gap-1">
                  <CircleDot className="h-2 w-2 text-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
