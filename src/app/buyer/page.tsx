export default function BuyerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700">← Back to Dashboard</a>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Buyer Property Discovery</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 mb-4">Buyer discovery portal loading...</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✅ View assigned properties</li>
            <li>✅ Search properties by features</li>
            <li>✅ Like and comment on properties</li>
            <li>✅ Watch property for updates</li>
            <li>✅ View full property details and photos</li>
            <li>⏳ Live data from Supabase (configure after Gmail setup)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
