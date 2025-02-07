import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const AdminTable = () => {
  const [admins, setAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', role: 'admin' });
  const { user, loading } = useAuth(); 
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchAdmins();
    }
  }, [user]);

  // ✅ Fetch logged-in user's role from the `admin` table
  const fetchUserRole = async () => {
    const { data, error } = await supabase
      .from('admin')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error.message);
    } else {
      setUserRole(data?.role);
    }
  };

  // ✅ Fetch all admins from the `admin` table
  const fetchAdmins = async () => {
    const { data, error } = await supabase.from('admin').select('*');
    if (error) {
      console.error('Error fetching admins:', error.message);
    } else {
      setAdmins(data);
    }
  };

  // ✅ Check if the user exists in `auth.users` and get UUID
  const checkUserExists = async (email) => {
    try {
      const { data, error } = await supabase.rpc('get_user_uuid', { email_input: email });

      if (error || !data) {
        toast.error('User not found. Please register first.');
        return null;
      }

      return data; // Returns user UUID
    } catch (error) {
      console.error('Error fetching user:', error.message);
      return null;
    }
  };

  // ✅ Add an admin only if they exist in `auth.users`
  const addAdmin = async () => {
    const { email, role } = newAdmin;
    if (!email || !role) {
      toast.error('Please fill in all fields');
      return;
    }

    // ✅ Check if the user exists in `auth.users`
    const userId = await checkUserExists(email);
    if (!userId) return;

    // ✅ Check if the user is already an admin
    const { data: existingAdmin } = await supabase
      .from('admin')
      .select('admin_id')
      .eq('user_id', userId)
      .single();

    if (existingAdmin) {
      toast.error('This user is already an admin.');
      return;
    }

    // ✅ Insert new admin into the `admin` table
    const { error } = await supabase.from('admin').insert([
      { email, role, user_id: userId },
    ]);

    if (error) {
      console.error('Error adding admin:', error.message);
      toast.error('Failed to add admin.');
    } else {
      toast.success('Admin added successfully!');
      setIsAddingAdmin(false);
      fetchAdmins(); // Refresh the list
    }
  };

  // ✅ Remove an admin from the `admin` table
  const removeAdmin = async (adminId) => {
    const { error } = await supabase.from('admin').delete().eq('admin_id', adminId);
    if (error) {
      console.error('Error removing admin:', error.message);
      toast.error('Failed to remove admin.');
    } else {
      toast.success('Admin removed successfully!');
      fetchAdmins(); // Refresh the list
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You need to be logged in</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Admin Management</h2>

      {/* ✅ Search & Sort Controls */}
      <div className="flex mb-4 justify-between">
        <input
          type="text"
          placeholder="Search admins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded"
        />
        <div className="flex gap-2">
          <select onChange={(e) => setSortBy(e.target.value)} value={sortBy} className="border p-2 rounded">
            <option value="name">Sort by Name</option>
            <option value="role">Sort by Role</option>
          </select>
          {userRole === 'superadmin' && (
            <button onClick={() => setIsAddingAdmin(true)} className="bg-blue-600 text-white p-2 rounded">
              Add Admin
            </button>
          )}
        </div>
      </div>

      {/* ✅ Add Admin Form */}
      {isAddingAdmin && userRole === 'superadmin' && (
        <div className="bg-gray-100 p-4 mb-4 rounded">
          <h3 className="font-semibold mb-2">Add New Admin</h3>
          <div className="mb-2">
            <label>Email:</label>
            <input
              type="email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="mb-2">
            <label>Role:</label>
            <select
              value={newAdmin.role}
              onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
              className="border p-2 rounded w-full"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div className="flex justify-between">
            <button onClick={addAdmin} className="bg-green-600 text-white p-2 rounded">Add Admin</button>
            <button onClick={() => setIsAddingAdmin(false)} className="bg-red-600 text-white p-2 rounded">Cancel</button>
          </div>
        </div>
      )}

      {/* ✅ Admin Table */}
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Role</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.admin_id}>
              <td className="p-2 border">{admin.email}</td>
              <td className="p-2 border">{admin.role}</td>
              <td className="p-2 border">
                {userRole === 'superadmin' && (
                  <button onClick={() => removeAdmin(admin.admin_id)} className="bg-red-600 text-white p-2 rounded">
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
