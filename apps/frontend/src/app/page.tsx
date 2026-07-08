import { UserProfile } from '../components/user-profile';

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">DocuSensei</h1>
          <UserProfile />
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            Welcome to your authenticated app! 🎉
          </h2>
          <p className="text-gray-600">
            You are successfully logged in. Clerk authentication is working perfectly.
          </p>

          <div className="mt-6 rounded-lg bg-blue-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-blue-900">Next Steps</h3>
            <ul className="space-y-2 text-blue-800">
              <li>• Explore the UserButton in the top right corner</li>
              <li>• Try the "Log JWT Token" button to see your auth token</li>
              <li>• Check out protected backend routes</li>
              <li>• Customize your user profile in Clerk Dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
