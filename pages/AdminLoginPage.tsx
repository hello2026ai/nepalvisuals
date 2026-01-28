import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import { withExponentialBackoff } from '../lib/utils/retryUtils';
import { AuthService } from '../lib/services/authService';

const AdminLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check for OAuth errors in URL
    React.useEffect(() => {
        // Combine params from both window.location.search (server redirect) and hash router location.search
        const windowParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(location.search);
        
        const error = windowParams.get('error') || hashParams.get('error');
        const errorDescription = windowParams.get('error_description') || hashParams.get('error_description');
        
        // Check for state error (from RequireAuth redirect)
        const stateError = (location.state as any)?.error;

        if (error) {
            console.error('OAuth Error:', error, errorDescription);
            if (error === 'server_error' && errorDescription?.includes('Unable to exchange external code')) {
                setError('Google Login Failed: Configuration mismatch. Please check your Supabase and Google Cloud settings.');
            } else {
                setError(errorDescription?.replace(/\+/g, ' ') || 'An unexpected error occurred during login.');
            }
            
            // Clean up URL by removing the query params from the root URL
            // This is crucial because HashRouter doesn't control window.location.search
            const newUrl = window.location.origin + window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, newUrl);
            
            // Also navigate to clean up any hash params if they existed
            navigate('/admin/login', { replace: true });
        } else if (stateError) {
             setError(stateError);
        }
    }, [location.search, navigate, location.state]);

    const from = (location.state as any)?.from?.pathname || '/admin/tours';

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/#/admin/tours`, // Redirect back to admin panel
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (err: any) {
            console.error('Google login error:', err);
            setError('Failed to initiate Google login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await AuthService.loginWithProfiles(email, password);

            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8 border border-gray-200">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
                    <p className="text-sm text-gray-500 mt-2">Sign in to manage tours and regions</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-600">error</span>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div className="mb-6">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium transition-all"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        Sign in with Google
                    </button>
                    
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            placeholder="admin@nepalvisuals.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                        />
                        <div className="flex justify-end mt-2">
                            <button 
                                type="button"
                                onClick={() => setIsForgotPasswordOpen(true)}
                                className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 px-4 bg-gray-900 text-white font-semibold rounded-lg shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors ${
                            loading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>
            
            <ForgotPasswordModal 
                isOpen={isForgotPasswordOpen} 
                onClose={() => setIsForgotPasswordOpen(false)} 
            />
        </div>
    );
};

export default AdminLoginPage;
