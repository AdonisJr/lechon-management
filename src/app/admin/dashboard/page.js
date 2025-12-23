'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { requireAuth } from '@/app/utils/auth';

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuthentication = async () => {
            const authResult = await requireAuth(router, 'admin');
            if (authResult) {
                setLoading(false);
            }
        };

        checkAuthentication();
    }, [router]);

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

            {/* Main Content */}
            <main className="flex-1 md:ml-0">
                <div className="p-4 md:p-8">
                    {/* Toggle Button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-lg shadow-lg"
                    >
                        ☰
                    </button>

                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
                        <p className="text-gray-600 text-lg">Welcome to the admin dashboard. Manage your lechon orders and users here.</p>

                        {/* Placeholder for dashboard content */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Total Orders</h3>
                                <p className="text-3xl font-bold text-blue-600">42</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Active Users</h3>
                                <p className="text-3xl font-bold text-green-600">128</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Revenue</h3>
                                <p className="text-3xl font-bold text-purple-600">$12,345</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}