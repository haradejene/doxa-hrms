export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Join Our Team</h1>
        <p className="text-center text-gray-600 mb-12">
          Discover exciting career opportunities at our company
        </p>
        
        {/* Job listings will go here */}
        <div className="grid gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Loading jobs...</h2>
          </div>
        </div>
      </div>
    </div>
  )
}