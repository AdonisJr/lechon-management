'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { requireAuth } from '@/app/utils/auth';
import { lechonSlotsAPI } from '@/app/utils/apiServices';
import { formatDateLong, formatTime12Hour, formatDuration } from '@/app/utils/dateUtils';
import {
    FaFire,
    FaEdit,
    FaTrash,
    FaTools,
    FaCheckCircle,
    FaCog
} from 'react-icons/fa';


export default function LechonSlots() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        type: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        itemsPerPage: 30,
        totalItems: 0,
        totalPages: 0
    });
    const [sorting, setSorting] = useState({
        field: 'name',
        direction: 'asc'
    });
    const [formData, setFormData] = useState({
        name: '',
        status: 'available',
        capacity: 1,
        type: 'multi_purpose',
        notes: ''
    });
    const router = useRouter();

    const [, forceUpdate] = useState(0);

    useEffect(() => {
        const checkAuthentication = async () => {
            const authResult = await requireAuth(router, 'admin');
            if (authResult) {
                setLoading(false);
                fetchSlots();
            }
        };

        checkAuthentication();
    }, [router]);

    // Refetch slots when pagination or sorting changes
    useEffect(() => {
        if (!loading) {
            fetchSlots();
        }
    }, [pagination.currentPage, pagination.itemsPerPage, sorting.field, sorting.direction]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyFilters = () => {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchSlots();
    };

    const clearFilters = () => {
        setFilters({
            date: '',
            type: '',
            available: ''
        });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchSlots();
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setPagination(prev => ({
            ...prev,
            itemsPerPage: newItemsPerPage,
            currentPage: 1 // Reset to first page when changing items per page
        }));
    };

    const handleSort = (field) => {
        setSorting(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page when sorting
    };

    const fetchSlots = async () => {
        try {
            const response = await lechonSlotsAPI.getAll({
                ...filters,
                page: pagination.currentPage,
                limit: pagination.itemsPerPage,
                sortField: sorting.field,
                sortDirection: sorting.direction
            });
            setSlots(response.data.slots);
            setPagination(prev => ({
                ...prev,
                totalItems: response.data.pagination.totalItems,
                totalPages: response.data.pagination.totalPages
            }));
        } catch (error) {
            console.error('Error fetching slots:', error);
        }
    };

    const handleUnassignSlot = async (orderId) => {
        if (!confirm('Are you sure you want to unassign this order from its slot?')) return;

        try {
            await lechonSlotsAPI.unassignOrder(orderId);
            fetchSlots();
        } catch (error) {
            console.error('Error unassigning slot:', error);
            alert(error.response?.data?.error || 'Error unassigning slot');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSlot) {
                await lechonSlotsAPI.update(editingSlot._id, formData);
            } else {
                await lechonSlotsAPI.create(formData);
            }

            setShowForm(false);
            setEditingSlot(null);
            resetForm();
            fetchSlots();
        } catch (error) {
            console.error('Error saving slot:', error);
            alert(error.response?.data?.error || 'Error saving slot');
        }
    };

    const handleEdit = (slot) => {
        setEditingSlot(slot);
        setFormData({
            name: slot.name,
            status: slot.status,
            capacity: slot.capacity,
            type: slot.type,
            notes: slot.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (slotId) => {
        if (!confirm('Are you sure you want to delete this slot?')) return;

        try {
            await lechonSlotsAPI.delete(slotId);
            fetchSlots();
        } catch (error) {
            console.error('Error deleting slot:', error);
            alert(error.response?.data?.error || 'Error deleting slot');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            status: 'available',
            capacity: 1,
            type: 'multi_purpose',
            notes: ''
        });
    };

    const SortableHeader = ({ field, children, className = "" }) => {
        const isActive = sorting.field === field;
        const direction = isActive ? sorting.direction : null;

        return (
            <th
                className={`px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${className}`}
                onClick={() => handleSort(field)}
            >
                <div className="flex items-center gap-1">
                    {children}
                    <span className="ml-1">
                        {isActive ? (
                            direction === 'asc' ? '↑' : '↓'
                        ) : (
                            <span className="text-gray-300">↕</span>
                        )}
                    </span>
                </div>
            </th>
        );
    };

    const getLatestHistory = (slot, orderId) => {
        if (!slot.history || slot.history.length === 0) return null;

        // Filter only histories that match this order
        const historiesForOrder = slot.history.filter(h => h.orderId === orderId);

        if (historiesForOrder.length === 0) return null;

        // Sort by startCooking descending and take the latest
        return historiesForOrder.sort(
            (a, b) => new Date(b.startCooking) - new Date(a.startCooking)
        )[0];
    };

    useEffect(() => {
        const interval = setInterval(() => forceUpdate(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <main className="flex-1 md:ml-0">
                <div className="p-4 md:p-8">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-lg shadow-lg"
                    >
                        ☰
                    </button>

                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold text-gray-900">Lechon Cooking Slots Management</h1>
                            <button
                                onClick={() => {
                                    setEditingSlot(null);
                                    resetForm();
                                    setShowForm(true);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add New Slot
                            </button>
                        </div>

                        {/* Filters and Search */}
                        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search by name or notes..."
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="available">Available</option>
                                        <option value="occupied">Occupied</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="out_of_order">Out of Order</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={filters.type}
                                        onChange={(e) => handleFilterChange('type', e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        <option value="whole_pig">Whole Pig</option>
                                        <option value="chicken">Chicken</option>
                                        <option value="pig_belly">Pig Belly</option>
                                        <option value="whole_cow">Whole Cow</option>
                                        <option value="multi_purpose">Multi Purpose</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={applyFilters}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Apply Filters
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        {/* Slots Table */}
                        {/* Slots Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {slots.map((slot) => {
                                const isOccupied = slot.status === 'occupied';

                                return (
                                    <div
                                        key={slot._id}
                                        className="relative bg-white rounded-xl shadow-md border hover:shadow-lg transition-all duration-300"
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start p-4 border-b">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {slot.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {slot.type.replace('_', ' ')}
                                                </p>

                                            </div>

                                            {/* Status Icon */}
                                            <div className={`text-xl ${slot.status === 'available' ? 'text-green-600' :
                                                slot.status === 'occupied' ? 'text-orange-500 flex gap-1' :
                                                    slot.status === 'maintenance' ? 'text-yellow-500' :
                                                        'text-red-600'
                                                }`}>
                                                {slot.status === 'available' && <FaCheckCircle />}
                                                {slot.status === 'occupied' && [<FaFire />, <FaCog className='animate-spin' />]}
                                                {slot.status === 'maintenance' && <FaTools />}
                                                {slot.status === 'out_of_order' && <FaTools />}
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="px-4 pt-3">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${slot.status === 'available' ? 'bg-green-100 text-green-800' :
                                                slot.status === 'occupied' ? 'bg-orange-100 text-orange-800' :
                                                    slot.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {slot.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        {/* Capacity */}
                                        <div className="px-4 py-2 text-sm text-gray-700">
                                            Capacity: <strong>{slot.capacity}</strong> <br />
                                            Available: <strong>{slot.availableCapacity}</strong>
                                        </div>

                                        {/* Orders */}
                                        <div className="px-4 pb-4">
                                            <h4 className="text-xs font-semibold text-gray-500 mb-2">
                                                Current Orders
                                            </h4>

                                            {slot.currentOrders && slot.currentOrders.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {slot.currentOrders.map(order => {
                                                        const latestHistory = getLatestHistory(slot, order._id);
                                                        const startCooking = latestHistory?.startCooking;

                                                        return (
                                                            <li key={order._id} className="bg-gray-100 rounded px-2 py-1 text-xs">
                                                                <div className="text-gray-500">Order #: {order._id.slice(-6)}</div>
                                                                <div>Code: {order.code ?? '--'}</div>
                                                                <div className="font-medium">
                                                                    Customer: {order.lastName}, {order.firstName}
                                                                </div>
                                                                <div className="font-medium">Kilos: {order.kilos ?? '--'}</div>
                                                                <div className="font-medium">Date Cooked: {order.dateCooked ? formatDateLong(order.dateCooked) : '--'}</div>
                                                                <div className="font-medium">Time Cooked: {order.timeCooked ? formatTime12Hour(order.timeCooked) : '--'}</div>

                                                                {startCooking && (
                                                                    <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                                                        ⏱ Cooking Time: {formatDuration(startCooking)}
                                                                    </div>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : (
                                                <span className="text-gray-400 italic">No orders</span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-2 p-3 border-t">
                                            <button
                                                onClick={() => handleUnassignSlot(slot.currentOrders[0]?._id)}
                                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                                                title="Remove Order from Slot"
                                            >
                                                ✕
                                            </button>
                                            <button
                                                onClick={() => handleEdit(slot)}
                                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                                                title="Edit Slot"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(slot._id)}
                                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                                                title="Delete Slot"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                        {/* Pagination */}
                        {pagination.totalItems > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-4 mt-4">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Items per page:</label>
                                        <select
                                            value={pagination.itemsPerPage}
                                            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={30}>30</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>

                                    <div className="text-sm text-gray-600">
                                        Showing {Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.totalItems)} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} slots
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage === 1}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>

                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (pagination.totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (pagination.currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                                    pageNum = pagination.totalPages - 4 + i;
                                                } else {
                                                    pageNum = pagination.currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-3 py-1 border rounded-md text-sm ${pagination.currentPage === pageNum
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Slot Form Modal */}
                        {showForm && (
                            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold">
                                            {editingSlot ? 'Edit Slot' : 'Add New Slot'}
                                        </h2>
                                        <button
                                            onClick={() => setShowForm(false)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Slot Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g., Slot A, Oven 1, Pit 2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <select
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="available">Available</option>
                                                <option value="occupied">Occupied</option>
                                                <option value="maintenance">Maintenance</option>
                                                <option value="out_of_order">Out of Order</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Type</label>
                                            <select
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="whole_pig">Whole Pig</option>
                                                <option value="chicken">Chicken</option>
                                                <option value="pig_belly">Pig Belly</option>
                                                <option value="whole_cow">Whole Cow</option>
                                                <option value="multi_purpose">Multi Purpose</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Capacity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={formData.capacity}
                                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                                            <textarea
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                rows="3"
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                placeholder="Optional notes about this slot..."
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowForm(false)}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            >
                                                {editingSlot ? 'Update Slot' : 'Create Slot'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}