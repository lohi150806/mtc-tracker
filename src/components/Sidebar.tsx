import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  MapPin,
  ShieldCheck,
  Menu,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.svg';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const location = useLocation();

  const nav = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home size={16} /> },
    { to: '/map', label: 'Route Map', icon: <MapPin size={16} /> },
    { to: '/scheme', label: 'Govt Scheme', icon: <ShieldCheck size={16} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-56'
      } bg-[#0F172A] border-r border-[#1E293B] transition-all duration-300 flex-shrink-0`}
    >
      <motion.div
        className="relative h-screen flex flex-col bg-[#0F172A] p-4 text-[#E2E8F0]"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="MTC"
              className="h-8 w-8 rounded-md"
            />

            {!collapsed && (
              <span className="font-semibold text-sm">
                MTC Analytics
              </span>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#94A3B8] hover:text-white"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Dropdown Menu */}
        {!collapsed && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mt-6 flex items-center justify-between rounded-xl bg-[#162133] px-3 py-2 text-sm"
          >
            Menu
            <ChevronDown
              size={16}
              className={`transition ${
                menuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}

        {menuOpen && (
          <nav className="mt-3 flex flex-col gap-2">
            {nav.map((item) => {
              const active = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                    active
                      ? 'bg-[#062B4A] text-[#38BDF8]'
                      : 'hover:bg-[#162133]'
                  }`}
                >
                  {item.icon}

                  {!collapsed && (
                    <span>{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Version fixed at bottom */}
        {!collapsed && (
          <div className="absolute bottom-4 left-4 text-xs text-[#64748B]">
            MTC Analytics v1.0.0
          </div>
        )}
      </motion.div>
    </aside>
  );
}