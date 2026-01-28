import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { AdminLogger } from '../../lib/services/adminLogger';
import { AuthService } from '../../lib/services/authService';

interface RequireAuthProps {
    children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            // CHECK FOR BYPASS MODE
            if (import.meta.env.VITE_ENABLE_ADMIN_BYPASS === 'true') {
                console.warn('⚠️ ADMIN AUTHENTICATION BYPASS ENABLED ⚠️');
                setIsAuthenticated(true);
                
                // Log bypass access
                const hasLoggedBypass = sessionStorage.getItem('admin_bypass_logged');
                if (!hasLoggedBypass) {
                    // We log to console as we might not have a user ID for the DB logger
                    console.log('[AdminLogger] Action: ADMIN_BYPASS_ACCESS', {
                        details: {
                            method: 'bypass_env_var',
                            timestamp: new Date().toISOString()
                        }
                    });
                    // Attempt to log to DB if possible (though usually fails without RLS user)
                    // AdminLogger.log(...) 
                    sessionStorage.setItem('admin_bypass_logged', 'true');
                }
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                const custom = AuthService.getCustomSession();
                if (custom && (custom.role === 'Admin' || custom.role === 'Super Admin')) {
                    setIsAuthenticated(true);
                    return;
                } else {
                    setIsAuthenticated(false);
                    return;
                }
            }

            // Enforce RBAC: Check if user has Admin or Super Admin role
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (error || !profile || (profile.role !== 'Admin' && profile.role !== 'Super Admin')) {
                    console.warn('Access denied: User is not an admin', profile);
                    setIsAuthenticated(false);
                    // Sign out the user so they can try a different account
                    await supabase.auth.signOut();
                } else {
                    setIsAuthenticated(true);
                    
                    // Log successful admin access (debounced or session-based logging could be better, 
                    // but for now we log unique sessions if possible or just log on access grant)
                    // To prevent spamming logs on every page load/refresh, we could check sessionStorage
                    const hasLoggedSession = sessionStorage.getItem('admin_session_logged');
                    if (!hasLoggedSession) {
                        AdminLogger.log({
                            action: 'ADMIN_ACCESS_GRANTED',
                            details: {
                                role: profile.role,
                                method: session.user.app_metadata.provider || 'email'
                            }
                        });
                        sessionStorage.setItem('admin_session_logged', 'true');
                    }
                }
            } catch (err) {
                console.error('Error checking admin role:', err);
                setIsAuthenticated(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                // Re-run check on auth change (handled by state reset usually, but let's be safe)
                if (!session) {
                    setIsAuthenticated(false);
                }
                // Note: ideally we'd re-check role here too if session changed user
            });

            return () => subscription.unsubscribe();
        };

        checkAuth();
    }, []);

    if (isAuthenticated === null) {
        // Loading state
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-gray-500 font-medium">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location, error: "Access Denied: You do not have administrator privileges." }} replace />;
    }

    return <>{children}</>;
};

export default RequireAuth;
