import React, { useState } from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Image, LogOut, Menu, X, MoreVertical } from 'lucide-react';
// import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/login";
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import icon from '../../icon.png';


const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/screenshots', icon: Image, label: 'Screenshots' },
];

const TopNav: React.FC = () => {
  // const { logout, user } = useAuth();
  const dispatch = useAppDispatch();
  const email = localStorage.getItem("email")

  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    console.log("1. Starting Logout");

    // 1. Clear the Redux state
    dispatch(logout());
    localStorage.clear();

    console.log("2. Navigating to Login");
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <div
          className="flex items-center gap-2 shrink-0 cursor-pointer"
          onClick={() => window.location.reload()}
        >
          {/* <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
            <Activity className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
          </div> */}
           <img
                src={icon}
                alt="WorkFlow Icon"
                className="h-7 w-auto object-contain rounded-lg"
              />
        </div>
        {/* Desktop Nav Links */}
        <nav className="flex items-center gap-4 flex-1">
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

        <div className="flex-1 sm:hidden" />

        <div className="flex sm:hidden items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-52 bg-popover border-border"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
                {email}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </header>
  );
};

export default TopNav;
