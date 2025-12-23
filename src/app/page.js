import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          {/* Lechon Icon/Emoji */}
          <div className="text-8xl mb-8 animate-bounce">
            🐖
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Lechon
            <span className="text-orange-600 block">Management</span>
            <span className="text-red-600">System</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Streamline your lechon business operations with our comprehensive management system.
            Track orders, manage inventory, and delight your customers with perfect lechon every time.
          </p>

          {/* CTA Button */}
          <div className="space-y-4">
            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              🚀 Get Started - Login to Dashboard
            </Link>

            <p className="text-gray-500 text-sm">
              Manage your lechon orders with ease
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Order Management</h3>
            <p className="text-gray-600">Track and manage all your lechon orders from preparation to delivery with real-time updates.</p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Customer Portal</h3>
            <p className="text-gray-600">Provide customers with easy order placement and status tracking capabilities.</p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Analytics & Reports</h3>
            <p className="text-gray-600">Get insights into your business performance with comprehensive reporting tools.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center text-gray-500">
          <p className="text-sm">
            © 2025 Lechon Management System. Made with ❤️ for lechon lovers.
          </p>
        </div>
      </div>
    </div>
  );
}
