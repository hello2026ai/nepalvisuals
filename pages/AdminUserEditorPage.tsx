import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserService, UserProfile } from '../lib/services/userService';

const AdminUserEditorPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const isEditing = !!userId && userId !== 'new';
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<Partial<UserProfile>>({
        full_name: '',
        email: '',
        role: 'Customer',
        status: 'Active',
        avatar_url: ''
    });
    
    // For password handling
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && userId) {
            setLoading(true);
            UserService.getUserById(userId)
                .then(data => {
                    if (data) {
                        setUser(data);
                        if (data.avatar_url) setImagePreview(data.avatar_url);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isEditing, userId]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();

    const handleSave = async () => {
        if (!user.full_name || !user.email) {
            alert('Full Name and Email are required.');
            return;
        }

        if (!isEditing && !password) {
            alert('Password is required for new users.');
            return;
        }

        if (password && password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            if (isEditing && userId) {
                await UserService.updateUser(userId, user, password || undefined);
                alert('User updated successfully!');
            } else {
                await UserService.createUser(user, password);
                alert('User created successfully!');
                navigate('/admin/users');
            }
        } catch (err: any) {
            console.error(err);
            alert('Failed to save user: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing && !user.id) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-semibold text-admin-text-secondary hover:text-admin-primary mb-4">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Users
                </Link>
                <h1 className="text-2xl font-bold text-admin-text-primary">
                    {isEditing ? `Edit User - ${user.full_name}` : 'Add New User'}
                </h1>
                {isEditing && <p className="mt-1 text-sm text-admin-text-secondary">User ID: {userId}</p>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Form */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-admin-surface rounded-lg border border-admin-border">
                        <div className="p-6 border-b border-admin-border">
                            <h3 className="font-semibold text-admin-text-primary">Account Details</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-admin-text-primary block mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    value={user.full_name || ''} 
                                    onChange={e => setUser({...user, full_name: e.target.value})}
                                    className="w-full border border-admin-border rounded-lg text-sm" 
                                />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-admin-text-primary block mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={user.email || ''} 
                                    onChange={e => setUser({...user, email: e.target.value})}
                                    className="w-full border border-admin-border rounded-lg text-sm" 
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-sm font-medium text-admin-text-primary block mb-1">{isEditing ? 'New Password' : 'Password'}</label>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter password'} 
                                        className="w-full border border-admin-border rounded-lg text-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-admin-text-primary block mb-1">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password" 
                                        className="w-full border border-admin-border rounded-lg text-sm" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Role & Status */}
                    <div className="bg-admin-surface rounded-lg border border-admin-border">
                        <div className="p-6 border-b border-admin-border">
                            <h3 className="font-semibold text-admin-text-primary">Role & Status</h3>
                        </div>
                        <div className="p-6 space-y-4">
                             <div>
                                <label className="text-sm font-medium text-admin-text-primary block mb-1">Role</label>
                                <select 
                                    value={user.role} 
                                    onChange={e => setUser({...user, role: e.target.value as any})}
                                    className="w-full border border-admin-border rounded-lg text-sm"
                                >
                                    <option value="Customer">Customer</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Guide">Guide</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-admin-text-primary text-sm">Account Status</p>
                                    <p className="text-xs text-admin-text-secondary">Set user account to active or inactive.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={user.status === 'Active'} 
                                        onChange={e => setUser({...user, status: e.target.checked ? 'Active' : 'Inactive'})}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Profile Photo */}
                     <div className="bg-admin-surface rounded-lg border border-admin-border">
                        <div className="p-6 border-b border-admin-border">
                            <h3 className="font-semibold text-admin-text-primary">Profile Photo</h3>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-32 h-32 rounded-full bg-admin-background flex items-center justify-center overflow-hidden border-2 border-dashed border-admin-border">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-4xl text-admin-text-secondary">person</span>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                                <button onClick={triggerFileSelect} className="w-full text-center px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold hover:bg-admin-background transition-colors">
                                    {isEditing ? 'Change Photo' : 'Upload Photo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-admin-border flex justify-end gap-3">
                <Link to="/admin/users" className="px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold hover:bg-admin-background transition-colors">Cancel</Link>
                <button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="px-4 py-2 bg-admin-primary text-white font-semibold rounded-lg shadow-sm hover:bg-admin-primary-hover transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create User')}
                </button>
            </div>
        </div>
    );
};

export default AdminUserEditorPage;
