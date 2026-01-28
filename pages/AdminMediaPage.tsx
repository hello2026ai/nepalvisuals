import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MediaFile, MediaService } from '../lib/services/mediaService';

// Reusing modal components logic but adapting to real data structure
const BulkEditModal: React.FC<{
    items: MediaFile[];
    onClose: () => void;
    onSave: (updates: { alt_text?: string; caption?: string }) => void;
}> = ({ items, onClose, onSave }) => {
    const [altText, setAltText] = useState('');
    const [caption, setCaption] = useState('');
    const [applyAlt, setApplyAlt] = useState(false);
    const [applyCaption, setApplyCaption] = useState(false);

    const handleSave = () => {
        const updates: { alt_text?: string; caption?: string } = {};
        if (applyAlt) updates.alt_text = altText;
        if (applyCaption) updates.caption = caption;
        onSave(updates);
    };
    
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose} role="dialog" aria-modal="true">
            <div className="w-full max-w-2xl bg-admin-surface rounded-xl shadow-lg flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-admin-border">
                    <h3 className="text-xl font-bold text-admin-text-primary">Bulk Edit {items.length} Items</h3>
                </div>
                <div className="p-6 flex-grow space-y-4 overflow-y-auto">
                    <div className="flex gap-2 flex-wrap max-h-28 overflow-y-auto bg-admin-background p-2 rounded-lg border border-admin-border">
                        {items.map(item => (
                            <img key={item.id} src={item.public_url} alt={item.title || ''} className="w-12 h-12 object-cover rounded-md" />
                        ))}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <input type="checkbox" id="applyAlt" checked={applyAlt} onChange={e => setApplyAlt(e.target.checked)} className="w-4 h-4 rounded text-admin-primary focus:ring-admin-primary border-admin-border" />
                            <label htmlFor="applyAlt" className="text-sm font-medium text-admin-text-primary select-none">Apply Alternative Text</label>
                        </div>
                        <input type="text" value={altText} onChange={e => setAltText(e.target.value)} disabled={!applyAlt} className="w-full border border-admin-border rounded-lg text-sm disabled:bg-admin-background disabled:opacity-50" placeholder="Enter new alt text for all selected images" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <input type="checkbox" id="applyCaption" checked={applyCaption} onChange={e => setApplyCaption(e.target.checked)} className="w-4 h-4 rounded text-admin-primary focus:ring-admin-primary border-admin-border" />
                             <label htmlFor="applyCaption" className="text-sm font-medium text-admin-text-primary select-none">Apply Caption</label>
                        </div>
                        <textarea rows={2} value={caption} onChange={e => setCaption(e.target.value)} disabled={!applyCaption} className="w-full border border-admin-border rounded-lg text-sm disabled:bg-admin-background disabled:opacity-50" placeholder="Enter new caption for all selected images"></textarea>
                    </div>
                </div>
                <div className="p-6 bg-admin-background border-t border-admin-border flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-admin-primary text-white font-semibold rounded-lg shadow-sm hover:bg-admin-primary-hover transition-colors">Apply Changes</button>
                </div>
            </div>
        </div>
    );
};

const BulkDeleteModal: React.FC<{
    count: number;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ count, onCancel, onConfirm }) => (
     <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" role="dialog" aria-modal="true">
        <div className="relative w-full max-w-md bg-admin-surface rounded-xl shadow-lg p-6 animate-scaleIn">
            <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined">delete_forever</span>
                </div>
                <h3 className="text-lg font-bold text-admin-text-primary">Delete Multiple Items</h3>
                <p className="text-sm text-admin-text-secondary mt-2">
                    Are you sure you want to delete <strong className="text-admin-text-primary">{count} selected items</strong>? This action is permanent and cannot be undone.
                </p>
            </div>
            <div className="mt-6 flex justify-center gap-4">
                <button onClick={onCancel} className="w-full px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold hover:bg-admin-background transition-colors">Cancel</button>
                <button onClick={onConfirm} className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition-colors">Delete Items</button>
            </div>
        </div>
    </div>
);


const EditModal: React.FC<{ item: MediaFile; onClose: () => void; onSave: (item: MediaFile) => void; onDelete: () => void; }> = ({ item, onClose, onSave, onDelete }) => {
    const [editedItem, setEditedItem] = useState(item);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditedItem({ ...editedItem, [e.target.name]: e.target.value });
    };
    
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose} role="dialog" aria-modal="true">
            <div className="w-full max-w-4xl bg-admin-surface rounded-xl shadow-lg flex flex-col md:flex-row overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-1/2 bg-admin-background p-4 flex items-center justify-center">
                     <img src={editedItem.public_url} alt={editedItem.alt_text || ''} className="max-h-[70vh] w-auto h-auto object-contain rounded-lg" />
                </div>
                <div className="w-full md:w-1/2 p-6 flex flex-col">
                     <div className="flex-grow space-y-4 overflow-y-auto">
                        <h3 className="text-xl font-bold text-admin-text-primary mb-4">Edit Media Details</h3>
                        <div>
                            <label className="text-xs font-medium text-admin-text-secondary block mb-1">Title</label>
                            <input type="text" name="title" value={editedItem.title || ''} onChange={handleChange} className="w-full border border-admin-border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-admin-text-secondary block mb-1">Alternative Text (for SEO & accessibility)</label>
                            <input type="text" name="alt_text" value={editedItem.alt_text || ''} onChange={handleChange} className="w-full border border-admin-border rounded-lg text-sm" />
                        </div>
                         <div>
                            <label className="text-xs font-medium text-admin-text-secondary block mb-1">Caption</label>
                            <textarea name="caption" rows={3} value={editedItem.caption || ''} onChange={handleChange} className="w-full border border-admin-border rounded-lg text-sm"></textarea>
                        </div>
                        <div className="pt-4 border-t border-admin-border text-xs text-admin-text-secondary space-y-1">
                            <p><strong>File name:</strong> {editedItem.filename}</p>
                            <p><strong>Uploaded on:</strong> {new Date(editedItem.created_at).toLocaleDateString()}</p>
                            <p><strong>Size:</strong> {(editedItem.size_bytes ? (editedItem.size_bytes / 1024).toFixed(2) + ' KB' : 'N/A')}</p>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-admin-border flex items-center justify-between gap-3">
                         <button onClick={onDelete} className="text-sm font-semibold text-red-600 hover:underline">Delete Image</button>
                         <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold hover:bg-admin-background transition-colors">Cancel</button>
                            <button onClick={() => onSave(editedItem)} className="px-4 py-2 bg-admin-primary text-white font-semibold rounded-lg shadow-sm hover:bg-admin-primary-hover transition-colors">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DeleteModal: React.FC<{ item: MediaFile; onCancel: () => void; onConfirm: () => void; }> = ({ item, onCancel, onConfirm }) => (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" role="dialog" aria-modal="true">
        <div className="relative w-full max-w-md bg-admin-surface rounded-xl shadow-lg p-6 animate-scaleIn">
            <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined">delete_forever</span>
                </div>
                <h3 className="text-lg font-bold text-admin-text-primary">Delete Image</h3>
                <p className="text-sm text-admin-text-secondary mt-2">
                    Are you sure you want to delete <strong className="text-admin-text-primary">{item.filename}</strong>? This action is permanent and cannot be undone.
                </p>
            </div>
            <div className="mt-6 flex justify-center gap-4">
                <button onClick={onCancel} className="w-full px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold hover:bg-admin-background transition-colors">Cancel</button>
                <button onClick={onConfirm} className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition-colors">Delete Image</button>
            </div>
        </div>
    </div>
);


const AdminMediaPage: React.FC = () => {
    const [mediaItems, setMediaItems] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
    const [filterType, setFilterType] = useState('all');

    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const data = await MediaService.getAllMedia();
            setMediaItems(data);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load media.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const filteredAndSortedMedia = useMemo(() => {
        let items = [...mediaItems];
        if (filterType !== 'all') {
            items = items.filter(item => item.filename.toLowerCase().endsWith(`.${filterType}`));
        }
        items.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return sortBy === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });
        return items;
    }, [mediaItems, sortBy, filterType]);

    const openEditModal = (item: MediaFile) => {
        setSelectedMedia(item);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setSelectedMedia(null);
        setIsEditModalOpen(false);
    };

    const openDeleteModal = (item: MediaFile) => {
        setSelectedMedia(item);
        setIsDeleteModalOpen(true);
        setIsEditModalOpen(false);
    };
    
    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        if (selectedMedia) setIsEditModalOpen(true);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        setLoading(true);
        try {
            const uploadPromises = Array.from(files).map((file) => MediaService.uploadFile(file as File));
            const newItems = await Promise.all(uploadPromises);
            setMediaItems(prev => [...newItems, ...prev]);
        } catch (err: any) {
            console.error(err);
            alert('Upload failed: ' + err.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const handleUpdate = async (updatedItem: MediaFile) => {
        try {
            const result = await MediaService.updateMediaMetadata(updatedItem.id, {
                title: updatedItem.title,
                alt_text: updatedItem.alt_text,
                caption: updatedItem.caption
            });
            setMediaItems(mediaItems.map(item => item.id === result.id ? result : item));
            closeEditModal();
        } catch (err: any) {
            console.error(err);
            alert('Update failed.');
        }
    };

    const handleDelete = async () => {
        if (!selectedMedia) return;
        try {
            await MediaService.deleteMedia(selectedMedia.id, selectedMedia.file_path);
            setMediaItems(mediaItems.filter(item => item.id !== selectedMedia.id));
            setSelectedMedia(null);
            setIsDeleteModalOpen(false);
            setIsEditModalOpen(false);
        } catch (err: any) {
            console.error(err);
            alert('Delete failed.');
        }
    };
    
    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        setSelectedItems(new Set());
    };

    const handleItemSelect = (itemId: string) => {
        setSelectedItems(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(itemId)) {
                newSelection.delete(itemId);
            } else {
                newSelection.add(itemId);
            }
            return newSelection;
        });
    };

    const handleBulkUpdate = async (updates: { alt_text?: string; caption?: string }) => {
        try {
            const updatePromises = Array.from(selectedItems).map(id => 
                MediaService.updateMediaMetadata(id as string, updates)
            );
            await Promise.all(updatePromises);
            
            // Refresh local state
            setMediaItems(prevItems =>
                prevItems.map(item => {
                    if (selectedItems.has(item.id)) {
                        return { ...item, ...updates };
                    }
                    return item;
                })
            );
            setIsBulkEditModalOpen(false);
            toggleSelectMode();
        } catch (err: any) {
            console.error(err);
            alert('Bulk update failed.');
        }
    };

    const handleBulkDelete = async () => {
        try {
             const deletePromises = mediaItems
                .filter(item => selectedItems.has(item.id))
                .map(item => MediaService.deleteMedia(item.id, item.file_path));
            
            await Promise.all(deletePromises);
            
            setMediaItems(prevItems => prevItems.filter(item => !selectedItems.has(item.id)));
            setIsBulkDeleteModalOpen(false);
            toggleSelectMode();
        } catch (err: any) {
            console.error(err);
            alert('Bulk delete failed.');
        }
    };

    if (loading && mediaItems.length === 0) return <div className="p-8 text-center">Loading media...</div>;

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="sm:flex sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-admin-text-primary">Media Library</h1>
                        <p className="mt-1 text-sm text-admin-text-secondary">Upload, manage, and edit your media assets.</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-admin-primary text-white font-semibold rounded-lg shadow-sm hover:bg-admin-primary-hover transition-colors disabled:opacity-50">
                            <span className="material-symbols-outlined text-base">upload</span>
                            {loading ? 'Uploading...' : 'Upload New Media'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 px-4 py-3 bg-admin-surface rounded-xl border border-admin-border shadow-sm">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')} className="w-full md:w-auto bg-admin-background border-admin-border rounded-md text-sm">
                            <option value="newest">Sort by Newest</option>
                            <option value="oldest">Sort by Oldest</option>
                        </select>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full md:w-auto bg-admin-background border-admin-border rounded-md text-sm">
                            <option value="all">All Types</option>
                            <option value="jpg">JPG</option>
                            <option value="png">PNG</option>
                            <option value="mp4">Video</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={toggleSelectMode} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 border ${isSelectMode ? 'bg-admin-primary/10 text-admin-primary border-admin-primary/20' : 'bg-admin-background text-admin-text-secondary border-admin-border hover:bg-gray-100'}`}>
                            <span className="material-symbols-outlined text-base">{isSelectMode ? 'close' : 'check_box'}</span> {isSelectMode ? 'Cancel' : 'Bulk Select'}
                        </button>
                        <div className="flex items-center gap-1 bg-admin-background p-1 rounded-lg border border-admin-border">
                            <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white shadow-sm text-admin-primary' : 'text-admin-text-secondary hover:bg-white/50'}`}>
                                <span className="material-symbols-outlined text-base">grid_view</span> Grid
                            </button>
                            <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow-sm text-admin-primary' : 'text-admin-text-secondary hover:bg-white/50'}`}>
                                <span className="material-symbols-outlined text-base">view_list</span> List
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-admin-surface rounded-xl border border-admin-border shadow-sm p-4">
                     {mediaItems.length === 0 ? (
                         <div className="text-center py-12 text-admin-text-secondary">
                             <span className="material-symbols-outlined text-4xl mb-2">image_not_supported</span>
                             <p>No media files found. Upload some to get started.</p>
                         </div>
                     ) : viewMode === 'grid' ? (
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredAndSortedMedia.map(item => {
                                const isSelected = selectedItems.has(item.id);
                                return (
                                    <div key={item.id} onClick={() => isSelectMode ? handleItemSelect(item.id) : openEditModal(item)} className={`group relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${isSelected ? 'ring-2 ring-admin-primary border-transparent' : 'border-admin-border hover:ring-2 hover:ring-admin-primary/50'}`}>
                                        <img src={item.public_url} alt={item.alt_text || ''} className="w-full h-full object-cover" />
                                        {isSelectMode && (
                                            <div className={`absolute top-2 left-2 w-5 h-5 bg-white border border-admin-border rounded-sm flex items-center justify-center z-10 ${isSelected ? 'border-admin-primary' : ''}`}>
                                                {isSelected && <span className="material-symbols-outlined text-admin-primary text-lg">check</span>}
                                            </div>
                                        )}
                                        {!isSelectMode && (
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-3xl">edit</span>
                                            </div>
                                        )}
                                         {isSelected && <div className="absolute inset-0 bg-admin-primary/20 pointer-events-none"></div>}
                                    </div>
                                )}
                            )}
                        </div>
                     ) : (
                        <div className="space-y-1">
                            <div className="hidden md:grid grid-cols-12 gap-4 px-2 py-2 text-xs font-bold text-admin-text-secondary uppercase tracking-wider border-b border-admin-border">
                                {isSelectMode && <div className="col-span-1"></div>}
                                <div className={isSelectMode ? "col-span-5" : "col-span-6"}>File</div>
                                <div className="col-span-2">Uploaded on</div>
                                <div className="col-span-4">Alt Text</div>
                            </div>
                            {filteredAndSortedMedia.map(item => {
                                const isSelected = selectedItems.has(item.id);
                                return (
                                <div key={item.id} onClick={() => isSelectMode ? handleItemSelect(item.id) : openEditModal(item)} className={`grid grid-cols-12 gap-4 items-center p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-admin-primary/10' : 'hover:bg-admin-background'}`}>
                                    {isSelectMode && (
                                        <div className="col-span-1 flex items-center justify-center">
                                            <div className={`w-5 h-5 bg-white border border-admin-border rounded-sm flex items-center justify-center ${isSelected ? 'border-admin-primary' : ''}`}>
                                                {isSelected && <span className="material-symbols-outlined text-admin-primary text-lg">check</span>}
                                            </div>
                                        </div>
                                    )}
                                    <div className={`flex items-center gap-4 ${isSelectMode ? 'col-span-11 md:col-span-5' : 'col-span-12 md:col-span-6'}`}>
                                        <img src={item.public_url} alt={item.alt_text || ''} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                        <div className="truncate">
                                            <p className="font-semibold text-admin-text-primary truncate">{item.filename}</p>
                                            <p className="text-xs text-admin-text-secondary truncate">{item.caption || 'No caption'}</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:block col-span-2 text-sm text-admin-text-secondary">{new Date(item.created_at).toLocaleDateString()}</div>
                                    <div className="hidden md:block col-span-4 text-sm text-admin-text-secondary truncate pr-4">{item.alt_text || <span className="text-gray-400">—</span>}</div>
                                </div>
                            )}
                        )}
                        </div>
                     )}
                </div>
            </div>

            {isEditModalOpen && selectedMedia && (
                <EditModal item={selectedMedia} onClose={closeEditModal} onSave={handleUpdate} onDelete={() => openDeleteModal(selectedMedia)} />
            )}

            {isDeleteModalOpen && selectedMedia && (
                <DeleteModal item={selectedMedia} onCancel={closeDeleteModal} onConfirm={handleDelete} />
            )}

            {selectedItems.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm animate-fadeIn">
                    <div className="bg-admin-surface/80 backdrop-blur-md border border-admin-border rounded-xl shadow-lg p-3 flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold">{selectedItems.size} items selected</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsBulkEditModalOpen(true)} className="p-2 text-admin-text-secondary hover:text-admin-primary rounded-full hover:bg-gray-100" title="Bulk Edit">
                                <span className="material-symbols-outlined">edit_note</span>
                            </button>
                            <button onClick={() => setIsBulkDeleteModalOpen(true)} className="p-2 text-admin-text-secondary hover:text-red-500 rounded-full hover:bg-gray-100" title="Bulk Delete">
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isBulkEditModalOpen && (
                <BulkEditModal 
                    items={mediaItems.filter(item => selectedItems.has(item.id))}
                    onClose={() => setIsBulkEditModalOpen(false)}
                    onSave={handleBulkUpdate}
                />
            )}
            {isBulkDeleteModalOpen && (
                <BulkDeleteModal
                    count={selectedItems.size}
                    onCancel={() => setIsBulkDeleteModalOpen(false)}
                    onConfirm={handleBulkDelete}
                />
            )}
        </>
    );
};

export default AdminMediaPage;
