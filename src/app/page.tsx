export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Homebase Portal
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real Estate Transaction Management Platform
          </p>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            Manage properties, buyers, sellers, and tasks in one place.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mb-12">
            <a 
              href="/dashboard" 
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Enter Portal
            </a>
            <a 
              href="/properties" 
              className="px-8 py-3 border border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Manage Properties
            </a>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-2">🏠</div>
              <h3 className="font-semibold text-gray-900">Property Management</h3>
              <p className="text-sm text-gray-600 mt-2">Upload, search, and manage properties</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-semibold text-gray-900">Buyer Discovery</h3>
              <p className="text-sm text-gray-600 mt-2">Browse and engage with listings</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-semibold text-gray-900">Task Management</h3>
              <p className="text-sm text-gray-600 mt-2">Track and manage transactions</p>
            </div>
          </div>

          {/* Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-green-900 mb-2">✅ System Status</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✅ Portal live on Vercel</li>
              <li>✅ Database schema complete (RLS enabled)</li>
              <li>✅ 14 API endpoints active</li>
              <li>⏳ Email notifications (pending Gmail setup)</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
