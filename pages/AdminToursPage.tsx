import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tour, TourService } from '../lib/services/tourService';
import { useRegionsData } from '../lib/hooks/useRegionsData';
import { AdminPageSkeleton } from '../components/skeletons/AdminPageSkeleton';

const AdminToursPage: React.FC = () => {
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { regions } = useRegionsData();
    const [filters, setFilters] = useState({
        searchTerm: '',
        category: '',
        region: '',
        status: '',
        page: 1,
        limit: 10
    });
    const [totalCount, setTotalCount] = useState(0);

    const fetchTours = async () => {
        setLoading(true);
        try {
            // Map status to "Published" | "Draft" or undefined
            const statusFilter = filters.status === 'All Statuses' || filters.status === '' 
                ? undefined 
                : filters.status as 'Published' | 'Draft';

            const result = await TourService.getAllTours({
                searchTerm: filters.searchTerm,
                page: filters.page,
                limit: filters.limit,
                status: statusFilter,
                category: filters.category || undefined,
                region: filters.region || undefined,
            });
            setTours(result.data);
            setTotalCount(result.count || 0);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load tours.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchTours();
        }, 300);
        return () => clearTimeout(debounce);
    }, [filters]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this tour?')) return;
        try {
            await TourService.deleteTour(id);
            setTours(tours.filter(t => t.id !== id));
        } catch (err: any) {
            console.error(err);
            alert('Failed to delete tour.');
        }
    };

    const totalPages = Math.ceil(totalCount / filters.limit);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
    };

    const renderPaginationButtons = () => {
        const buttons = [];
        const maxVisibleButtons = 5;
        let startPage = Math.max(1, filters.page - Math.floor(maxVisibleButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

        if (endPage - startPage + 1 < maxVisibleButtons) {
            startPage = Math.max(1, endPage - maxVisibleButtons + 1);
        }

        if (startPage > 1) {
            buttons.push(
                <button key="1" onClick={() => handlePageChange(1)} className="px-3 py-1 border border-admin-border rounded-md text-xs hover:bg-admin-background">1</button>
            );
            if (startPage > 2) {
                buttons.push(<span key="start-ellipsis" className="px-2">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 border border-admin-border rounded-md text-xs ${filters.page === i ? 'bg-admin-primary text-white border-admin-primary' : 'hover:bg-admin-background'}`}
                    aria-current={filters.page === i ? 'page' : undefined}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(<span key="end-ellipsis" className="px-2">...</span>);
            }
            buttons.push(
                <button key={totalPages} onClick={() => handlePageChange(totalPages)} className="px-3 py-1 border border-admin-border rounded-md text-xs hover:bg-admin-background">{totalPages}</button>
            );
        }

        return buttons;
    };

    if (loading && tours.length === 0) return <AdminPageSkeleton />;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-admin-text-primary">Tour Management</h1>
                    <p className="mt-1 text-sm text-admin-text-secondary">Manage your catalog, prices, and availability.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        to="/admin/trek/new"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-admin-primary text-white font-semibold rounded-lg shadow-sm hover:bg-admin-primary-hover transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        Add New Tour
                    </Link>
                </div>
            </div>

            <div className="bg-admin-surface rounded-xl border border-admin-border shadow-sm">
                <div className="p-4 border-b border-admin-border">
                     <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-secondary text-lg">search</span>
                             <input 
                                type="text" 
                                placeholder="Search by ID, name, or destination..." 
                                value={filters.searchTerm}
                                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value, page: 1 }))}
                                className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition" 
                            />
                        </div>
                        <div className="flex gap-4">
                            <select 
                                value={filters.category}
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
                                className="w-full md:w-48 border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition"
                            >
                                <option value="">All Categories</option>
                                <option value="Cultural">Cultural</option>
                                <option value="Adventure">Adventure</option>
                            </select>
                             <select 
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                                className="w-full md:w-48 border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition"
                            >
                                <option value="">All Statuses</option>
                                <option value="Published">Published</option>
                                <option value="Draft">Draft</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-primary"></div>
                        </div>
                    )}
                    <table className="w-full text-sm">
                        <thead className="text-xs text-admin-text-secondary uppercase bg-admin-background">
                            <tr>
                                <th className="px-6 py-3 font-medium text-left">Tour ID</th>
                                <th className="px-6 py-3 font-medium text-left">Tour Name</th>
                                <th className="px-6 py-3 font-medium text-left">Destination</th>
                                <th className="px-6 py-3 font-medium text-left">Category</th>
                                <th className="px-6 py-3 font-medium text-left">Status</th>
                                <th className="px-6 py-3 font-medium text-left">Price</th>
                                <th className="px-6 py-3 font-medium text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-admin-border">
                            {tours.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-admin-text-secondary">
                                        No tours found.
                                    </td>
                                </tr>
                            ) : (
                                tours.map(tour => (
                                <tr key={tour.id} className="hover:bg-admin-background transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-admin-text-secondary">{tour.id.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-admin-background flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                {tour.featured_image ? (
                                                    <img src={tour.featured_image} alt={tour.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-admin-text-secondary">photo_camera</span>
                                                )}
                                            </div>
                                            <span className="font-semibold text-admin-text-primary">{tour.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-admin-text-secondary">{tour.destination}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tour.region ? 'bg-admin-primary/10 text-admin-primary' : 'bg-gray-100 text-gray-600'}`}>
                                            {tour.region || 'Unspecified'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${tour.status === 'Published' ? 'bg-status-published-bg text-status-published' : 'bg-status-draft-bg text-status-draft'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${tour.status === 'Published' ? 'bg-status-published' : 'bg-status-draft'}`}></span>
                                            {tour.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-admin-text-primary">${tour.price.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <Link to={`/admin/trek/view/${tour.id}`} className="p-2 text-admin-text-secondary hover:text-admin-primary rounded-md" aria-label={`View ${tour.name}`}><span className="material-symbols-outlined text-lg">visibility</span></Link>
                                            <Link to={`/admin/trek/edit/${tour.id}`} className="p-2 text-admin-text-secondary hover:text-admin-primary rounded-md" aria-label={`Edit ${tour.name}`}><span className="material-symbols-outlined text-lg">edit</span></Link>
                                            <button onClick={() => handleDelete(tour.id)} className="p-2 text-admin-text-secondary hover:text-red-600 rounded-md" aria-label={`Delete ${tour.name}`}><span className="material-symbols-outlined text-lg">delete</span></button>
                                        </div>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
                 <div className="p-4 border-t border-admin-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs text-admin-text-secondary">
                        <p>Showing <span className="font-semibold">{Math.min((filters.page - 1) * filters.limit + 1, totalCount)}</span> to <span className="font-semibold">{Math.min(filters.page * filters.limit, totalCount)}</span> of <span className="font-semibold">{totalCount}</span> results</p>
                        <div className="flex items-center gap-2">
                            <span>Rows per page:</span>
                            <select 
                                value={filters.limit} 
                                onChange={handleLimitChange}
                                className="border border-admin-border rounded-md text-xs py-1 px-2 focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                        <button 
                            disabled={filters.page === 1}
                            onClick={() => handlePageChange(filters.page - 1)}
                            className="p-1 border border-admin-border rounded-md disabled:opacity-50 hover:bg-admin-background"
                            aria-label="Previous Page"
                        >
                            <span className="material-symbols-outlined text-base">chevron_left</span>
                        </button>
                        
                        <div className="flex gap-1">
                            {renderPaginationButtons()}
                        </div>

                        <button 
                            disabled={filters.page === totalPages || totalPages === 0}
                            onClick={() => handlePageChange(filters.page + 1)}
                            className="p-1 border border-admin-border rounded-md disabled:opacity-50 hover:bg-admin-background"
                            aria-label="Next Page"
                        >
                            <span className="material-symbols-outlined text-base">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminToursPage;
