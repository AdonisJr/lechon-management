'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { requireAuth } from '@/app/utils/auth';
import { ordersAPI } from '@/app/utils/apiServices';
import { formatDateLong, formatTime12Hour, formatDateTime, getCurrentDateFormatted, getCurrentTimeFormatted } from '@/app/utils/dateUtils';

export default function LechonOrders() {
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
        dateCooked: '',
        timeCooked: ''
    });
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

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyFilters = () => {
        fetchOrders();
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            numberKilos: '',
            typeOrder: '',
            type: '',
            status: '',
            dateCooked: '',
            timeCooked: ''
        });
        fetchOrders();
    };

    const fetchOrders = async () => {
        try {
            const response = await ordersAPI.getAll(filters);
            setOrders(response.data.orders);
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
            dateCooked: '',
            timeCooked: '',
            specialInstructions: '',
            status: 'pending'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
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
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kilos</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cooked Date</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Cooked Time</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map((order) => (
                                            <tr key={order._id} className="hover:bg-gray-50">
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">{order._id.slice(-6)}</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-900">{order.code}</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                                                    {order.firstName} {order.lastName}
                                                </td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900 capitalize">
                                                    {order.type.replace('_', ' ')}
                                                </td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900 capitalize">{order.typeOrder}</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">{order.numberKilos}kg</td>
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900">{formatCurrency(order.price)}</td>
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
                                                <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900 hidden sm:table-cell">{formatTime12Hour(order.timeCooked)}</td>
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

                        {/* Order Form Modal */}
                        {showForm && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                                                    required
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
                                                    required
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
                                                    required
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
                                                    required
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
                    </div>
                </div>
            </main>
        </div>
    );
}