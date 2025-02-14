import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const tabs = [
    { name: 'Products', value: 'products', link: '/products' },
    { name: 'Profiles', value: 'profiles', link: '/profiles' },
    { name: 'Quotes', value: 'quotes', link: '/quotes' },
    { name: 'Teams', value: 'teams', link: '/teams' },
    { name: 'Admins', value: 'admins', link: '/admins' },
    { name: 'Gallery', value: 'gallery', link: '/gallery' },
    { name: 'Stories', value: 'gallery', link: '/stories' },

  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-600 text-white p-6">
        
        <ul>
          {tabs.map((tab) => (
            <li key={tab.value} className="mb-4">
              <Link
                to={tab.link}
                className="block p-2 rounded-md text-lg hover:bg-indigo-700"
              >
                {tab.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <h2 className="text-3xl font-semibold mb-4">Welcome to the Admin Dashboard</h2>
        <p className="text-lg text-gray-600 mb-6">
          Here you can manage products, profiles, quotes, teams, and admins.
        </p>

        {/* Active Tab Content */}
        <div>
          {/* The active tab content will be displayed here based on routing */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
