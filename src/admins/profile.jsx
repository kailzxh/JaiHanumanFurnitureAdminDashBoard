import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const ProfileAdmin = () => {
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);

  // Fetch profiles from the database
  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' });

    if (error) {
      toast.error('Error fetching profiles: ' + error.message);
    } else {
      setProfiles(data);
      setFilteredProfiles(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles(); // Fetch profiles on component mount or when sort changes
  }, [sortBy, sortOrder]);

  // Handle search query change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query) {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter((profile) => {
        const address = `${profile.city || ''} ${profile.district || ''} ${profile.state || ''}`;
        return (
          (profile.full_name && profile.full_name.toLowerCase().includes(query.toLowerCase())) ||
          (profile.email && profile.email.toLowerCase().includes(query.toLowerCase())) ||
          (profile.phone && profile.phone.toLowerCase().includes(query.toLowerCase())) ||
          address.toLowerCase().includes(query.toLowerCase())
        );
      });
      setFilteredProfiles(filtered);
    }
  };

  // Handle sort changes
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle sort order if same field is clicked
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc'); // Default to ascending when changing field
    }
  };

  // Handle updating a profile
  const handleUpdateProfile = async (profileId, updatedFields) => {
    const { error } = await supabase
      .from('profiles')
      .update(updatedFields)
      .eq('id', profileId);

    if (error) {
      toast.error('Error updating profile: ' + error.message);
    } else {
      toast.success('Profile updated successfully');
      fetchProfiles(); // Refresh profiles after update
    }
  };

  // Handle deleting a profile
  const handleDeleteProfile = async (profileId) => {
    const { error } = await supabase.from('profiles').delete().eq('id', profileId);
    if (error) {
      toast.error('Error deleting profile: ' + error.message);
    } else {
      toast.success('Profile deleted successfully');
      fetchProfiles(); // Refresh profiles after deletion
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Profiles Admin Panel</h2>

      {/* Search Input */}
      <div className="mb-6 flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search by Name, Email, Phone, or Address"
          value={searchQuery}
          onChange={handleSearchChange}
          className="border p-2 w-full sm:w-1/2"
        />
      </div>

      {/* Sort Options */}
      <div className="mb-6 flex items-center space-x-4">
        <button
          onClick={() => handleSortChange('full_name')}
          className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
        >
          Sort by Name
        </button>
        <button
          onClick={() => handleSortChange('email')}
          className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
        >
          Sort by Email
        </button>
        <button
          onClick={() => handleSortChange('created_at')}
          className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
        >
          Sort by Date
        </button>
      </div>

      {/* Profiles Table */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Full Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">City</th>
              <th className="px-4 py-2">District</th>
              <th className="px-4 py-2">State</th>
              <th className="px-4 py-2">Date Created</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((profile) => (
                <tr key={profile.id} className="border-b">
                  <td className="px-4 py-2">{profile.full_name}</td>
                  <td className="px-4 py-2">{profile.email}</td>
                  <td className="px-4 py-2">{profile.phone}</td>
                  <td className="px-4 py-2">{profile.city}</td>
                  <td className="px-4 py-2">{profile.district}</td>
                  <td className="px-4 py-2">{profile.state}</td>
                  <td className="px-4 py-2">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() =>
                        handleUpdateProfile(profile.id, { full_name: 'Updated Name' })
                      }
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-2 text-center">No profiles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfileAdmin;
