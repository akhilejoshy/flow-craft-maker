import React, { useState } from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Image, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/screenshots', icon: Image, label: 'Screenshots' },
];

const TopNav: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
            <Activity className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground hidden sm:block">Workflow</span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden sm:flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <RouterNavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </RouterNavLink>
          ))}
        </nav>

        {/* Spacer on mobile */}
        <div className="flex-1 sm:hidden" />

        {/* Desktop: user email + logout */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs text-sidebar-foreground/60 truncate max-w-[160px]">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {/* Mobile: hamburger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="sm:hidden flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-sidebar-border bg-sidebar px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <RouterNavLink
              key={item.to}
              to={item.to}
              end
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </RouterNavLink>
          ))}
          <div className="pt-2 border-t border-sidebar-border">
            <p className="px-3 py-1 text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopNav;
