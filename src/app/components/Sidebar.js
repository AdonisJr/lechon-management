'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuthData } from '../utils/auth';

export default function Sidebar({ isOpen, onToggle }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        clearAuthData();
        router.push('/login');
    };

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 bg-opacity-50 md:hidden"
                    onClick={onToggle}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6">
                    {/* Close button for mobile */}
                    <button
                        onClick={onToggle}
                        className="md:hidden absolute top-4 right-4 text-white hover:text-gray-300"
                    >
                        ✕
                    </button>

                    {/* User Information */}
                    <div className="flex items-center mb-8">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                            A
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Admin User</p>
                            <p className="text-gray-300 text-xs">admin@example.com</p>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <nav className="space-y-2 text-xs">
                        <Link href="/admin/dashboard">
                            <button
                                className={`w-full text-left mt-2 py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center cursor-pointer ${pathname === '/admin/dashboard' ? 'bg-gray-700' : ''
                                    }`}
                            >
                                <span className="mr-3">🏠</span>
                                Dashboard
                            </button>
                        </Link>
                        <Link href="/admin/dashboard/orders">
                            <button
                                className={`w-full text-left mt-2 py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center cursor-pointer ${pathname === '/admin/dashboard/orders' ? 'bg-gray-700' : ''
                                    }`}
                            >
                                <span className="mr-3">📋</span>
                                Lechon Orders
                            </button>
                        </Link>
                        <Link href="/admin/dashboard/users">
                            <button
                                className={`w-full text-left mt-2 py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center cursor-pointer ${pathname === '/admin/dashboard/users' ? 'bg-gray-700' : ''
                                    }`}
                            >
                                <span className="mr-3">👥</span>
                                Users
                            </button>
                        </Link>
                    </nav>

                    {/* Logout Button */}
                    <div className="mt-8 pt-8 border-t border-gray-700 text-xs">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left py-3 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center text-red-400 hover:text-white cursor-pointer"
                        >
                            <span className="mr-3">🚪</span>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}