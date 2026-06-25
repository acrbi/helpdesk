import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import {
  LayoutDashboard, Ticket, PlusCircle, Building2,
  FolderOpen, Users, BarChart2, GitMerge,
  Bell, Settings, ChevronLeft, LogOut, Menu,
} from 'lucide-react';

const NAV = [
  { group: 'Principal',
    items: [
      { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/tickets',     icon: Ticket,          label: 'Tickets',      badge: 8 },
      { to: '/tickets/new', icon: PlusCircle,      label: 'Nuevo Ticket' },
    ]},
  { group: 'Gestión',
    items: [
      { to: '/clients',  icon: Building2,  label: 'Clientes' },
      { to: '/projects', icon: FolderOpen, label: 'Proyectos' },
      { to: '/team',     icon: Users,      label: 'Equipo Técnico' },
    ]},
  { group: 'Análisis',
    items: [
      { to: '/reports', icon: BarChart2, label: 'Reportes' },
      { to: '/flow',    icon: GitMerge,  label: 'Flujo ITIL' },
    ]},
];

export default function AppLayout() {
  const { user, logout }         = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── SIDEBAR ─────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-[60px]'} flex-shrink-0 bg-[#0A1628] flex flex-col transition-all duration-250 overflow-hidden z-50`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-[18px] border-b border-white/7 min-h-[68px] flex-shrink-0">
          <div className="w-9 h-9 rounded-[10px] bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/40">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-white font-bold text-sm tracking-tight whitespace-nowrap">HelpDesk Pro</div>
              <div className="text-white/30 text-[10px] font-medium uppercase tracking-wide mt-0.5">ITIL v4 · IA</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {NAV.map(({ group, items }) => (
            <div key={group} className="mb-1">
              {sidebarOpen && (
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-white/25 uppercase tracking-[1px]">{group}</div>
              )}
              {items.map(({ to, icon: Icon, label, badge }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-[13px] font-medium transition-colors relative
                     ${isActive ? 'bg-blue-600/20 text-white before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-blue-500 before:rounded-r-sm'
                                : 'text-white/50 hover:bg-white/6 hover:text-white/85'}`
                  }
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span className="whitespace-nowrap flex-1">{label}</span>}
                  {sidebarOpen && badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Collapse button */}
        <button onClick={toggleSidebar}
          className="flex items-center gap-2.5 px-4 py-3 border-t border-white/7 text-white/35 hover:text-white/60 transition-colors text-[12px] flex-shrink-0">
          <ChevronLeft size={18} className={`flex-shrink-0 transition-transform duration-250 ${sidebarOpen ? '' : 'rotate-180'}`} />
          {sidebarOpen && <span>Colapsar</span>}
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-t border-white/7 flex-shrink-0 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">{initials}</div>
          {sidebarOpen && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-white text-[12px] font-600 truncate">{user?.name}</div>
                <div className="text-white/35 text-[10px] capitalize">{user?.role}</div>
              </div>
              <button onClick={() => logout().then(() => navigate('/login'))} className="text-white/30 hover:text-white/60 transition-colors">
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-slate-200 flex items-center gap-3 px-6 flex-shrink-0 shadow-sm z-40">
          <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-600 lg:hidden">
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="w-full pl-9 pr-3 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white transition-colors" placeholder="Buscar tickets, clientes..." />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
              <Settings size={18} />
            </button>
            <button onClick={() => navigate('/tickets/new')} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-3 py-2 rounded-lg transition-colors shadow-sm">
              <PlusCircle size={15} /> Nuevo Ticket
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
