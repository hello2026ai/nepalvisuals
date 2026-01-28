import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SettingsService } from '../../lib/services/settingsService';
import { supabase } from '../../lib/supabaseClient';
import { AuthService } from '../../lib/services/authService';

const NavLink: React.FC<{ to: string; icon: string; label: string; exact?: boolean; isSubLink?: boolean; isCollapsed?: boolean }> = ({ to, icon, label, exact = false, isSubLink = false, isCollapsed = false }) => {
    const location = useLocation();
    const fullPath = `/admin${to === '/' ? '' : to}`;
    
    let isActive = false;
    if (exact) {
        isActive = location.pathname === '/admin' || location.pathname === '/admin/';
    } else {
        // Use a more specific check to prevent a parent path like '/team' from matching a sibling path like '/team-types'
        isActive = location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`);
    }
    
    // Handle special cases where URL structure doesn't align with nav hierarchy
    if (to === '/tours' && location.pathname.startsWith('/admin/trek')) {
        isActive = true;
    }
    
    if (to === '/regions' && location.pathname.startsWith('/admin/region')) {
        isActive = true;
    }
    
    return (
        <Link
            to={fullPath}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${isActive ? 'bg-admin-primary/10 text-admin-primary' : 'text-admin-text-secondary hover:bg-gray-100'} ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? label : undefined}
        >
            <span className={`material-symbols-outlined ${isSubLink ? 'text-base' : 'text-lg'}`}>{icon}</span>
            {!isCollapsed && <span>{label}</span>}
        </Link>
    );
};


const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // Initialize from localStorage if available
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('adminSidebarCollapsed');
            return saved === 'true';
        }
        return false;
    });
    
    const location = useLocation();
    const navigate = useNavigate();
    
    const isTeamPathActive = location.pathname.startsWith('/admin/team');
    const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(isTeamPathActive);
    
    // Settings State
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [siteTitle, setSiteTitle] = useState('Tour Operator');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await SettingsService.getAllSettings();
                if (settings.branding?.logo_url) {
                    setLogoUrl(settings.branding.logo_url);
                }
                if (settings.site_config?.title) {
                    setSiteTitle(settings.site_config.title);
                }
            } catch (error) {
                console.error('Failed to load admin settings:', error);
            }
        };
        fetchSettings();
    }, []);

    // Effect to open the menu when navigating to a team-related page
    useEffect(() => {
        if (isTeamPathActive && !isCollapsed) {
            setIsTeamMenuOpen(true);
        }
    }, [isTeamPathActive, location.pathname, isCollapsed]);

    useEffect(() => {
        document.body.classList.remove('dark', 'bg-background-dark');
        document.body.classList.add('bg-admin-background');

        return () => {
            document.body.classList.remove('bg-admin-background');
            document.body.classList.add('dark', 'bg-background-dark');
        };
    }, []);

    const handleLogout = async () => {
        await AuthService.logout();
        navigate('/admin/login');
    };
    
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('adminSidebarCollapsed', String(newState));
        if (newState) {
            setIsTeamMenuOpen(false); // Close submenus on collapse
        }
    };

    const isBypassMode = import.meta.env.VITE_ENABLE_ADMIN_BYPASS === 'true';

    return (
        <div className={`min-h-screen w-full lg:grid transition-all duration-300 font-sans text-admin-text-primary ${isCollapsed ? 'lg:grid-cols-[80px_1fr]' : 'lg:grid-cols-[280px_1fr]'}`}>
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-10 lg:hidden"
                    aria-hidden="true"
                ></div>
            )}
            
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-20 bg-admin-surface border-r border-admin-border flex flex-col transition-all duration-300 
                ${isSidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'} 
                ${isCollapsed ? 'lg:w-[80px]' : 'lg:w-[280px]'} 
                lg:sticky lg:top-0 lg:h-screen`}>
                
                {/* Collapse Toggle Button */}
                <button
                    onClick={toggleCollapse}
                    className="absolute -right-3 top-8 bg-admin-surface border border-admin-border rounded-full p-1 shadow-md hidden lg:flex items-center justify-center text-admin-text-secondary hover:text-admin-primary transition-colors z-30"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!isCollapsed}
                    aria-controls="sidebar-nav"
                >
                    <span className="material-symbols-outlined text-lg">
                        {isCollapsed ? 'chevron_right' : 'chevron_left'}
                    </span>
                </button>

                <div className={`flex flex-col items-center justify-center gap-4 mb-6 py-8 border-b border-admin-border w-full transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-6'}`}>
                    {logoUrl ? (
                        <img src={logoUrl} alt="Site Logo" className={`object-contain transition-all duration-300 ${isCollapsed ? 'h-8 w-8' : 'h-16 w-auto max-w-full'}`} />
                    ) : (
                        <span className={`material-symbols-outlined text-admin-primary transition-all duration-300 ${isCollapsed ? 'text-3xl' : 'text-5xl'}`}>hiking</span>
                    )}
                    {!isCollapsed && (
                        <span className="font-bold text-xl text-admin-text-primary tracking-tight whitespace-nowrap overflow-hidden">Admin Panel</span>
                    )}
                    {isBypassMode && !isCollapsed && (
                        <div className="mt-2 px-3 py-1 bg-red-100 text-red-800 text-xs font-bold uppercase rounded-full border border-red-200">
                            Bypass Mode
                        </div>
                    )}
                </div>
                
                <nav id="sidebar-nav" className="flex flex-col gap-1 flex-grow px-2 overflow-y-auto overflow-x-hidden">
                    <NavLink to="/" icon="dashboard" label="Dashboard" exact={true} isCollapsed={isCollapsed} />
                    <NavLink to="/tours" icon="map" label="Tours" isCollapsed={isCollapsed} />
                    <NavLink to="/regions" icon="public" label="Regions" isCollapsed={isCollapsed} />
                    <NavLink to="/media" icon="perm_media" label="Media" isCollapsed={isCollapsed} />
                    <NavLink to="/bookings" icon="confirmation_number" label="Bookings" isCollapsed={isCollapsed} />
                    <NavLink to="/customers" icon="badge" label="Customers" isCollapsed={isCollapsed} />
                    <NavLink to="/users" icon="group" label="Users" isCollapsed={isCollapsed} />
                    
                    {/* Team Dropdown */}
                    <div>
                         <button
                            onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                            className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                                isTeamPathActive
                                    ? 'bg-admin-primary/10 text-admin-primary'
                                    : 'text-admin-text-secondary hover:bg-gray-100'
                            } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                            title={isCollapsed ? "Team" : undefined}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-lg">badge</span>
                                {!isCollapsed && <span>Team</span>}
                            </div>
                            {!isCollapsed && (
                                <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${isTeamMenuOpen ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            )}
                        </button>
                        {isTeamMenuOpen && !isCollapsed && (
                            <div className="pl-6 pt-1 mt-1 space-y-1 border-l-2 border-admin-border/50 ml-5 animate-fadeIn">
                                <NavLink to="/team" icon="group" label="Team Members" isSubLink={true} isCollapsed={isCollapsed} />
                                <NavLink to="/team-types" icon="category" label="Team Types" isSubLink={true} isCollapsed={isCollapsed} />
                            </div>
                        )}
                    </div>

                    <NavLink to="/settings" icon="settings" label="Settings" isCollapsed={isCollapsed} />
                </nav>
                 <div className="mt-auto border-t border-admin-border pt-4 p-4">
                    <Link to="/" className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-semibold text-admin-text-secondary hover:bg-gray-100 transition-colors ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Back to Public Site" : undefined}>
                        <span className="material-symbols-outlined text-lg mr-3">logout</span>
                        {!isCollapsed && <span>Back to Public Site</span>}
                    </Link>
                </div>
            </aside>
            
            <div className="flex flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-admin-border bg-admin-surface/80 backdrop-blur-sm px-6">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="relative flex-1">
                        {isBypassMode && (
                             <div className="bg-red-600 text-white px-4 py-1 text-sm font-medium text-center shadow-md animate-pulse rounded-md">
                                ⚠️ SECURITY WARNING: AUTHENTICATION BYPASS ENABLED
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-admin-text-secondary hover:text-admin-primary rounded-full"><span className="material-symbols-outlined">notifications</span></button>
                        <div className="relative">
                            <button className="w-9 h-9 rounded-full overflow-hidden border-2 border-admin-border">
                                <img src="https://randomuser.me/api/portraits/men/34.jpg" alt="Admin user" />
                            </button>
                        </div>
                         <button onClick={handleLogout} className="px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold hover:bg-admin-background transition-colors">Logout</button>
                    </div>
                </header>
                {/* Main Content */}
                <main className="flex-1 bg-admin-background">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
