import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Menu, X, Home, FileText, Shield, ChevronRight, BookOpen, UserPlus, Settings, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminSidebarExpanded, setIsAdminSidebarExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navLinks = [
    { id: 'home', name: 'Trang chủ', path: '/', icon: <Home size={18} /> },
    ...(profile?.role === 'student' ? [
      { id: 'application', name: 'Hồ sơ kết nạp', path: '/application', icon: <FileText size={18} /> }
    ] : []),
    ...(profile?.role === 'admin' ? [
      { id: 'applications', name: 'Hồ sơ', path: '/?tab=applications', icon: <FileText size={18} /> },
      ...(profile.isSuperAdmin ? [
        { id: 'training', name: 'Chưa học', path: '/?tab=training', icon: <BookOpen size={18} /> },
        { id: 'users', name: 'Đảng viên', path: '/?tab=users', icon: <UserPlus size={18} /> },
        { id: 'permissions', name: 'Phân công', path: '/?tab=permissions', icon: <Shield size={18} /> },
        { id: 'faq', name: 'Hỏi đáp', path: '/?tab=faq', icon: <MessageCircle size={18} /> },
        { id: 'settings', name: 'Cấu hình', path: '/?tab=settings', icon: <Settings size={18} /> },
      ] : []),
    ] : []),
  ];

  const isLinkActive = (linkPath: string) => {
    if (linkPath === '/') {
      return location.pathname === '/' && !location.search;
    }
    if (linkPath.includes('?tab=')) {
      const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';
      const linkTab = new URLSearchParams(linkPath.split('?')[1]).get('tab');
      
      if (linkTab === 'applications' && location.pathname.startsWith('/application')) {
        return true;
      }
      
      return location.pathname === '/' && currentTab === linkTab;
    }
    return location.pathname === linkPath;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-brand-red text-white shadow-lg bg-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Title */}
            <Link to="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white rounded-2xl p-1.5 transition-all group-hover:scale-110 group-hover:rotate-3 duration-300 shadow-xl">
                <img 
                  src="https://drive.google.com/thumbnail?id=1O7UZhqrJoTc6xac8yB05_laRxhZsfhom&sz=w1000" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg leading-tight uppercase text-brand-yellow tracking-tighter">
                  Chi bộ Sinh viên
                </span>
                <span className="text-xs font-black opacity-90 leading-tight hidden sm:block uppercase tracking-widest text-white/80">
                  Đảng bộ Trường Đại học Kinh tế
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.filter(link => profile?.role !== 'admin').map((link) => {
                const active = isLinkActive(link.path);
                return (
                  <Link
                    key={link.id}
                    to={link.path}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest flex items-center gap-2 ${
                      active 
                        ? 'bg-brand-yellow text-brand-red shadow-lg scale-105' 
                        : 'hover:bg-white/10 text-white/90'
                    }`}
                  >
                    {link.icon && <span className={active ? 'text-brand-red' : 'text-brand-yellow'}>{link.icon}</span>}
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Mobile Menu Toggle */}
            <div className="flex items-center gap-4">
              {profile && (
                <div className="hidden lg:flex items-center gap-4 px-5 py-2.5 bg-black/20 rounded-2xl border border-white/10 shadow-inner">
                  <div className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center text-brand-red font-black text-sm shrink-0 shadow-md">
                    {profile.fullName?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black truncate max-w-[160px] tracking-tight text-white">
                      {profile.fullName || profile.email}
                    </span>
                    <span className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">
                      {profile.role === 'admin' ? 'Đảng viên' : 'Sinh viên'}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="ml-3 p-2 hover:bg-white/10 rounded-xl text-brand-yellow transition-all hover:scale-110"
                    title="Đăng xuất"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              )}
              
              <button 
                onClick={toggleSidebar} 
                className="md:hidden p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all shadow-md"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <button 
                onClick={handleLogout}
                className="lg:hidden p-2.5 bg-brand-yellow text-brand-red rounded-xl transition-all hover:scale-110 shadow-lg"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-16 left-0 right-0 bg-brand-red z-50 shadow-2xl border-t border-white/10"
            >
              <nav className="p-4 space-y-1">
                {navLinks.map((link) => {
                  const active = isLinkActive(link.path);
                  return (
                    <Link
                      key={link.id}
                      to={link.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold uppercase tracking-wider ${
                        active 
                          ? 'bg-white/20 text-brand-yellow' 
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      {link.icon}
                      <span>{link.name}</span>
                      {active && <ChevronRight size={16} className="ml-auto" />}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-grow flex flex-col md:flex-row">
        {profile?.role === 'admin' && (
          <aside 
            className={`hidden md:flex flex-col bg-white border-r border-gray-200 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto transition-all duration-300 z-10 shrink-0 ${
              isAdminSidebarExpanded ? 'w-64' : 'w-20'
            }`}
          >
            <div className={`p-4 flex items-center ${isAdminSidebarExpanded ? 'justify-between' : 'justify-center'} border-b border-slate-50`}>
              {isAdminSidebarExpanded && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menu quản trị</p>}
              <button 
                onClick={() => setIsAdminSidebarExpanded(!isAdminSidebarExpanded)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                title={isAdminSidebarExpanded ? "Thu gọn" : "Mở rộng"}
              >
                <Menu size={18} />
              </button>
            </div>
            
            <div className="p-3 space-y-2 flex-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.path);
                return (
                  <Link
                    key={link.id}
                    to={link.path}
                    title={!isAdminSidebarExpanded ? link.name : undefined}
                    className={`flex items-center ${isAdminSidebarExpanded ? 'gap-3 px-4 py-3' : 'justify-center p-3'} rounded-xl transition-all text-sm font-black uppercase tracking-widest ${
                      active 
                        ? 'bg-brand-red text-white shadow-md shadow-brand-red/20' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className={active ? 'text-white' : 'text-brand-red'}>{link.icon}</span>
                    {isAdminSidebarExpanded && <span>{link.name}</span>}
                    {active && isAdminSidebarExpanded && <ChevronRight size={16} className="ml-auto" />}
                  </Link>
                );
              })}
            </div>
            
            <div className="mt-auto p-3 border-t border-slate-50">
              {isAdminSidebarExpanded ? (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center text-white font-black text-xs">
                      AD
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Quyền quản trị</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Toàn quyền</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-brand-red hover:text-white hover:border-brand-red transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="w-full p-3 bg-slate-50 rounded-xl text-slate-600 hover:bg-brand-red hover:text-white transition-all flex items-center justify-center"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </aside>
        )}
        <main className="flex-grow min-w-0">
          <Outlet />
        </main>
      </div>

        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full p-1.5">
                  <img 
                    src="https://drive.google.com/thumbnail?id=1O7UZhqrJoTc6xac8yB05_laRxhZsfhom&sz=w1000" 
                    alt="Logo" 
                    className="w-full h-full object-contain grayscale opacity-50"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">Chi bộ Sinh viên</p>
                  <p className="text-[10px] text-gray-500">Đảng bộ Trường Đại học Kinh tế</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">
                © {new Date().getFullYear()} Chi bộ Sinh viên. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
  );
}
