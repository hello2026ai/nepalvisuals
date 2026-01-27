import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Region, RegionService } from '../lib/services/regionService';
import MediaSelectorModal from '../components/admin/MediaSelectorModal';

const AdminRegionEditorPage: React.FC = () => {
    const { regionId } = useParams<{ regionId: string }>();
    const isEditing = !!regionId && regionId !== 'new';
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [region, setRegion] = useState<Partial<Region>>({
        name: '',
        tagline: '',
        description: '',
        status: 'Draft',
        image_url: ''
    });

    useEffect(() => {
        if (isEditing && regionId) {
            setLoading(true);
            RegionService.getRegionById(regionId)
                .then(data => {
                    if (data) setRegion(data);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isEditing, regionId]);

    const handleChange = (field: keyof Region, value: any) => {
        setRegion(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!region.name) {
            alert('Region Name is required');
            return;
        }

        setLoading(true);
        try {
            if (isEditing && regionId) {
                await RegionService.updateRegion(regionId, region);
                alert('Region updated successfully!');
            } else {
                const newRegion = await RegionService.createRegion(region);
                alert('Region created successfully!');
                navigate(`/admin/region/edit/${newRegion.id}`);
            }
        } catch (err: any) {
            console.error(err);
            alert('Failed to save region. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing && !region.id) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <Link to="/admin/regions" className="inline-flex items-center gap-2 text-sm font-semibold text-admin-text-secondary hover:text-admin-primary mb-4">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Regions
                </Link>
                <h1 className="text-2xl font-bold text-admin-text-primary">{isEditing ? 'Edit Region' : 'Create New Region'}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Region Details */}
                    <div className="bg-admin-surface rounded-lg border border-admin-border">
                        <div className="p-6 border-b border-admin-border">
                            <h3 className="font-semibold text-admin-text-primary">Region Details</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-admin-text-primary block mb-1">Region Name *</label>
                                <input 
                                    type="text" 
                                    value={region.name || ''} 
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition" 
                                    required
                                />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-admin-text-primary block mb-1">Tagline</label>
                                <input 
                                    type="text" 
                                    value={region.tagline || ''} 
                                    onChange={(e) => handleChange('tagline', e.target.value)}
                                    className="w-full border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition" 
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-admin-text-primary block mb-1">Description</label>
                                <textarea 
                                    rows={4} 
                                    value={region.description || ''} 
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    className="w-full border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition"
                                ></textarea>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-admin-text-primary block mb-1">Latitude</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        placeholder="e.g. 27.9881"
                                        value={region.latitude || ''} 
                                        onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                                        className="w-full border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition" 
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-admin-text-primary block mb-1">Longitude</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        placeholder="e.g. 86.9250"
                                        value={region.longitude || ''} 
                                        onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                                        className="w-full border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tours Sub-category placeholder */}
                    <div className="bg-admin-surface rounded-lg border border-admin-border opacity-60">
                         <div className="p-6 border-b border-admin-border">
                            <h3 className="font-semibold text-admin-text-primary">Tours in this Region</h3>
                        </div>
                        <div className="p-6 text-center text-sm text-admin-text-secondary">
                            Tour association is managed through the Tour Editor.
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    {/* Status & Visibility */}
                    <div className="bg-admin-surface rounded-lg border border-admin-border">
                        <div className="p-6 border-b border-admin-border">
                            <h3 className="font-semibold text-admin-text-primary">Status</h3>
                        </div>
                        <div className="p-6">
                            <select 
                                value={region.status || 'Draft'} 
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="w-full border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition"
                            >
                                <option value="Published">Published</option>
                                <option value="Draft">Draft</option>
                            </select>
                        </div>
                    </div>
                     {/* Background Image */}
                     <div className="bg-admin-surface rounded-lg border border-admin-border">
                        <div className="p-6 border-b border-admin-border">
                            <h3 className="font-semibold text-admin-text-primary">Background Image</h3>
                        </div>
                         <div className="p-6">
                             <div className="w-full aspect-video rounded-lg bg-admin-background flex items-center justify-center overflow-hidden border-2 border-dashed border-admin-border mb-4">
                                {region.image_url ? (
                                    <img src={region.image_url} alt="Region" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-4xl text-admin-text-secondary">landscape</span>
                                )}
                            </div>
                            <input 
                                type="text" 
                                placeholder="Image URL" 
                                value={region.image_url || ''} 
                                onChange={(e) => handleChange('image_url', e.target.value)}
                                className="w-full mb-2 border border-admin-border rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-admin-primary focus:border-transparent transition"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setShowMediaModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-admin-surface border border-admin-border rounded-lg text-sm font-semibold hover:bg-admin-background transition-colors text-admin-text-primary"
                                >
                                    <span className="material-symbols-outlined text-lg">perm_media</span>
                                    Select from Media
                                </button>
                                <button className="w-full text-center px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold hover:bg-admin-background transition-colors text-admin-text-secondary cursor-not-allowed opacity-50" disabled>
                                    Upload New
                                </button>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <MediaSelectorModal 
                isOpen={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                onSelect={(url) => {
                    handleChange('image_url', url);
                    setShowMediaModal(false);
                }}
            />

            <div className="mt-8 pt-6 border-t border-admin-border flex justify-end gap-3">
                <Link to="/admin/regions" className="px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold hover:bg-admin-background transition-colors">Cancel</Link>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-admin-primary text-white font-semibold rounded-lg shadow-sm hover:bg-admin-primary-hover transition-colors disabled:opacity-50"
                >
                    {isEditing ? 'Save Changes' : 'Create Region'}
                </button>
            </div>
        </div>
    );
};

export default AdminRegionEditorPage;
