'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { requireAuth } from '@/app/utils/auth';
import { ordersAPI, lechonSlotsAPI } from '@/app/utils/apiServices';
import { formatDateLong, formatTime12Hour, formatDateTime, getCurrentDateFormatted, getCurrentTimeFormatted } from '@/app/utils/dateUtils';

export default function LechonOrders() {
    const today = new Date().toISOString().split('T')[0];
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        numberKilos: '',
        typeOrder: '',
        type: '',
        status: '',
        dateCooked: today,
        timeCooked: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        itemsPerPage: 30,
        totalItems: 0,
        totalPages: 0
    });
    const [sorting, setSorting] = useState({
        field: 'timeCooked',
        direction: 'asc'
    });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [showSlotAssignment, setShowSlotAssignment] = useState(false);
    const [selectedOrderForSlot, setSelectedOrderForSlot] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        firstName: '',
        lastName: '',
        typeOrder: 'order',
        type: 'whole_pig',
        numberKilos: '',
        price: '',
        downPayment: '',
        isPaid: false,
        dateCooked: '',
        timeCooked: '',
        specialInstructions: '',
        status: 'pending'
    });
    const router = useRouter();

    useEffect(() => {
        const checkAuthentication = async () => {
            const authResult = await requireAuth(router, 'admin');
            if (authResult) {
                setLoading(false);
                fetchOrders();
            }
        };

        checkAuthentication();
    }, [router]);

    // Refetch orders when pagination or sorting changes
    useEffect(() => {
        if (!loading) {
            fetchOrders();
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
        fetchOrders();
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            numberKilos: '',
            typeOrder: '',
            type: '',
            status: '',
            dateCooked: today,
            timeCooked: ''
        });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchOrders();
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

    const fetchOrders = async () => {
        try {
            const response = await ordersAPI.getAll({
                ...filters,
                page: pagination.currentPage,
                limit: pagination.itemsPerPage,
                sortField: sorting.field,
                sortDirection: sorting.direction
            });
            setOrders(response.data.orders);
            setPagination(prev => ({
                ...prev,
                totalItems: response.data.pagination.totalItems,
                totalPages: response.data.pagination.totalPages
            }));
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let submitData = { ...formData };

            if (editingOrder) {
                await ordersAPI.update(editingOrder._id, submitData);
            } else {
                // For new orders, automatically set current date and time
                submitData.dateReceived = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
                submitData.timeReceived = new Date().toTimeString().slice(0, 5); // HH:MM format
                await ordersAPI.create(submitData);
            }

            setShowForm(false);
            setEditingOrder(null);
            resetForm();
            fetchOrders();
        } catch (error) {
            console.error('Error saving order:', error);
            alert(error.response?.data?.error || 'Error saving order');
        }
    };

    const handleEdit = (order) => {
        setEditingOrder(order);
        setFormData({
            code: order.code,
            firstName: order.firstName,
            lastName: order.lastName,
            typeOrder: order.typeOrder,
            type: order.type,
            numberKilos: order.numberKilos,
            price: order.price,
            downPayment: order.downPayment,
            isPaid: order.isPaid,
            dateCooked: order.dateCooked.split('T')[0],
            timeCooked: order.timeCooked,
            specialInstructions: order.specialInstructions || '',
            status: order.status
        });
        setShowForm(true);
    };

    const handleDelete = async (orderId) => {
        if (!confirm('Are you sure you want to delete this order?')) return;

        try {
            await ordersAPI.delete(orderId);
            fetchOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
            alert(error.response?.data?.error || 'Error deleting order');
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            firstName: '',
            lastName: '',
            typeOrder: 'order',
            type: 'whole_pig',
            numberKilos: '',
            price: '',
            downPayment: '',
            isPaid: false,
            dateCooked: today,
            timeCooked: '',
            specialInstructions: '',
            status: 'pending'
        });
    };

    const fetchAvailableSlots = async () => {
        try {
            const response = await lechonSlotsAPI.getAll({
                status: 'available'
            });
            // Calculate available capacity for each slot
            const slotsWithCapacity = response.data.slots.map(slot => ({
                ...slot,
                availableCapacity: Math.max(0, slot.capacity - (slot.currentOrders?.length || 0))
            }));
            setAvailableSlots(slotsWithCapacity);
        } catch (error) {
            console.error('Error fetching available slots:', error);
            setAvailableSlots([]);
        }
    };

    const handleAssignSlot = (order) => {
        setSelectedOrderForSlot(order);
        fetchAvailableSlots();
        setShowSlotAssignment(true);
    };

    const handleSlotAssignment = async (slotId) => {
        if (!selectedOrderForSlot || !slotId) return;

        try {
            await lechonSlotsAPI.assignOrder(slotId, selectedOrderForSlot._id);
            setShowSlotAssignment(false);
            setSelectedOrderForSlot(null);
            fetchOrders();
        } catch (error) {
            console.error('Error assigning slot:', error);
            alert(error.response?.data?.error || 'Error assigning slot');
        }
    };

    const handleUnassignSlot = async (orderId) => {
        if (!confirm('Are you sure you want to unassign this order from its slot?')) return;

        try {
            await lechonSlotsAPI.unassignOrder(orderId);
            fetchOrders();
        } catch (error) {
            console.error('Error unassigning slot:', error);
            alert(error.response?.data?.error || 'Error unassigning slot');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
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
                            <h1 className="text-3xl font-bold text-gray-900">Lechon Orders Management</h1>
                            <button
                                onClick={() => {
                                    setEditingOrder(null);
                                    resetForm();
                                    setShowForm(true);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add New Order
                            </button>
                        </div>

                        {/* Filters and Search */}
                        <div className="bg-white rounded-lg shadow-md p-2 mb-2 text-xs">
                            <h2 className="text-md font-semibold text-gray-900 mb-4">Filters & Search</h2>

                            {/* Search Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">General Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search by name, code, or kilos..."
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Date Cooked</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={filters.dateCooked}
                                        onChange={(e) => handleFilterChange('dateCooked', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Time Cooked</label>
                                    <input
                                        type="time"
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={filters.timeCooked}
                                        onChange={(e) => handleFilterChange('timeCooked', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Kilos</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Number of kilos"
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={filters.numberKilos}
                                        onChange={(e) => handleFilterChange('numberKilos', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Filter Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Order Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={filters.typeOrder}
                                        onChange={(e) => handleFilterChange('typeOrder', e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        <option value="order">Order</option>
                                        <option value="labor">Labor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Lechon Type</label>
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
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="preparing">Preparing</option>
                                        <option value="cooking">Cooking</option>
                                        <option value="packed">Packed</option>
                                        <option value="ready">Ready</option>
                                        <option value="picked_up">Picked Up</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Action Buttons */}
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

                        {/* Orders Table */}
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <SortableHeader field="code">Code</SortableHeader>
                                            <SortableHeader field="firstName">Customer</SortableHeader>
                                            <SortableHeader field="type">Type</SortableHeader>
                                            <SortableHeader field="typeOrder">Order</SortableHeader>
                                            <SortableHeader field="numberKilos">Kilos</SortableHeader>
                                            <SortableHeader field="price">Price</SortableHeader>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                            <SortableHeader field="dateCooked">Cooked Date</SortableHeader>
                                            <SortableHeader field="timeCooked">Cooked Time</SortableHeader>
                                            <SortableHeader field="status">Status</SortableHeader>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map((order) => (
                                            <tr key={order._id} className="hover:bg-gray-50">
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">{order._id.slice(-6)}</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-900">{order.code || '__'}</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                                                    {order.firstName || '__'} {order.lastName}
                                                </td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900 capitalize">
                                                    {order.type.replace('_', ' ')}
                                                </td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900 capitalize">{order.typeOrder}</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">{order.numberKilos}{ order.numberKilos ? 'kg' : '__'}</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">{order.price ? formatCurrency(order.price) : '__'}</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                                                    <div className="space-y-1">
                                                        <div className={order.isPaid ? 'text-green-600' : 'text-red-600'}>
                                                            {order.isPaid ? 'Paid' : 'Unpaid'}
                                                        </div>
                                                        {order.downPayment > 0 && (
                                                            <div className="text-xs text-gray-500">
                                                                Down: {formatCurrency(order.downPayment)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">{formatDateLong(order.dateCooked)}</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">{formatTime12Hour(order.timeCooked)}</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                                                            order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                                                order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                                                    {order.slotId ? (
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium">{order.slotId.name || `Slot ${order.slotId._id.slice(-4)}`}</span>
                                                            <button
                                                                onClick={() => handleUnassignSlot(order._id)}
                                                                className="ml-2 text-xs text-red-600 hover:text-red-800"
                                                                title="Unassign from slot"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAssignSlot(order)}
                                                            className="text-blue-600 hover:text-blue-800 text-xs"
                                                        >
                                                            Assign Slot
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs font-medium space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(order)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(order._id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {orders.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No orders found. Create your first order!</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination.totalItems > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-4 mt-4">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    {/* Items per page selector */}
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

                                    {/* Total items info */}
                                    <div className="text-sm text-gray-600">
                                        Showing {Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.totalItems)} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} orders
                                    </div>

                                    {/* Page navigation */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage === 1}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>

                                        {/* Page numbers */}
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
                                                        className={`px-3 py-1 border rounded-md text-sm ${
                                                            pagination.currentPage === pageNum
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

                        {/* Order Form Modal */}
                        {showForm && (
                            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold">
                                            {editingOrder ? 'Edit Order' : 'Add New Order'}
                                        </h2>
                                        <button
                                            onClick={() => setShowForm(false)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Order Code</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    value={formData.code}
                                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                    placeholder="ORD001"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Order Type</label>
                                                <select
                                                    required
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    value={formData.typeOrder}
                                                    onChange={(e) => setFormData({ ...formData, typeOrder: e.target.value })}
                                                >
                                                    <option value="order">Order</option>
                                                    <option value="labor">Labor</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">First Name</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Last Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    value={formData.lastName}
                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Lechon Type</label>
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
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Number of Kilos</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    value={formData.numberKilos}
                                                    onChange={(e) => setFormData({ ...formData, numberKilos: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Price</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Down Payment</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    value={formData.downPayment}
                                                    onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Date Cooked</label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    value={formData.dateCooked}
                                                    onChange={(e) => setFormData({ ...formData, dateCooked: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Time Cooked</label>
                                                <input
                                                    type="time"
                                                    required
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    value={formData.timeCooked}
                                                    onChange={(e) => setFormData({ ...formData, timeCooked: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Status</label>
                                                <select
                                                    required
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="preparing">Preparing</option>
                                                    <option value="ready">Ready</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="isPaid"
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    checked={formData.isPaid}
                                                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                                                />
                                                <label htmlFor="isPaid" className="ml-2 block text-xs text-gray-900">
                                                    Is Paid
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Special Instructions</label>
                                            <textarea
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                rows="3"
                                                value={formData.specialInstructions}
                                                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                                                placeholder="Any special instructions..."
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
                                                {editingOrder ? 'Update Order' : 'Create Order'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Slot Assignment Modal */}
                        {showSlotAssignment && selectedOrderForSlot && (
                            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold">
                                            Assign Slot to Order
                                        </h2>
                                        <button
                                            onClick={() => setShowSlotAssignment(false)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="font-medium text-gray-900">Order Details:</h3>
                                        <p className="text-sm text-gray-600">
                                            {selectedOrderForSlot.firstName} {selectedOrderForSlot.lastName} - {selectedOrderForSlot.type.replace('_', ' ')} ({selectedOrderForSlot.numberKilos}kg)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-medium text-gray-900">Available Slots:</h3>
                                        {availableSlots.length > 0 ? (
                                            availableSlots.map((slot) => (
                                                <div key={slot._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                    <div>
                                                        <div className="font-medium">{slot.name}</div>
                                                        <div className="text-sm text-gray-600">
                                                            Type: {slot.type.replace('_', ' ')} | Capacity: {slot.availableCapacity}/{slot.capacity}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleSlotAssignment(slot._id)}
                                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                                    >
                                                        Assign
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm">No available slots found.</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowSlotAssignment(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}