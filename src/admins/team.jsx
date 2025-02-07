import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TeamHandler = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortedTeamMembers, setSortedTeamMembers] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch team members from Supabase
  const fetchTeamMembers = async () => {
    const { data, error } = await supabase.from('team_members').select('*');
    if (error) {
      console.error('Error fetching team members:', error);
    } else {
      setTeamMembers(data);
      setSortedTeamMembers(data);
    }
  };

  useEffect(() => {
    fetchTeamMembers(); // Fetch team members on component mount
  }, []);

  // Handle file selection
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImageFile(file);
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query) {
      setSortedTeamMembers(teamMembers);
    } else {
      const filtered = teamMembers.filter(
        (member) =>
          member.name.toLowerCase().includes(query.toLowerCase()) ||
          member.role.toLowerCase().includes(query.toLowerCase())
      );
      setSortedTeamMembers(filtered);
    }
  };

  // Handle sorting of team members
  const handleSortChange = (field) => {
    setSortBy(field);
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);

    const sorted = [...sortedTeamMembers].sort((a, b) => {
      const fieldA = a[field].toLowerCase();
      const fieldB = b[field].toLowerCase();
      if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    setSortedTeamMembers(sorted);
  };

  // Add or Update Team Member
  const handleSubmit = async () => {
    if (!name || !role || !imageFile) {
      alert('All fields are required!');
      return;
    }

    // Upload image if new image is selected
    const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images') // Your bucket name
      .upload(`team-members/${fileName}`, imageFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error('Image upload failed:', uploadError);
      return;
    }

    // Get public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(`team-members/${fileName}`);

    const imageUrl = publicUrlData.publicUrl;

    // Insert or Update team member in the database
    if (editingTeamMember) {
      const { error: dbError } = await supabase
        .from('team_members')
        .update({
          name,
          role,
          image_url: imageUrl,
        })
        .eq('id', editingTeamMember.id);

      if (dbError) {
        console.error('Error updating team member:', dbError);
      } else {
        alert('Team member updated successfully!');
        resetForm();
        fetchTeamMembers();
      }
    } else {
      const { error: dbError } = await supabase.from('team_members').insert([
        { name, role, image_url: imageUrl },
      ]);

      if (dbError) {
        console.error('Error adding team member:', dbError);
      } else {
        alert('Team member added successfully!');
        resetForm();
        fetchTeamMembers();
      }
    }
  };

  // Delete Team Member
  const deleteTeamMember = async (id, imageUrl) => {
    const fileName = imageUrl.split('/').pop();

    // Delete the image from Supabase Storage
    const { error: deleteImageError } = await supabase.storage
      .from('product-images')
      .remove([`team-members/${fileName}`]);

    if (deleteImageError) {
      console.error('Error deleting image:', deleteImageError);
      return;
    }

    // Delete team member from the database
    const { error: dbDeleteError } = await supabase.from('team_members').delete().eq('id', id);

    if (dbDeleteError) {
      console.error('Error deleting team member:', dbDeleteError);
    } else {
      alert('Team member deleted successfully!');
      fetchTeamMembers();
    }
  };

  // Reset the form
  const resetForm = () => {
    setName('');
    setRole('');
    setImageFile(null);
    setImageUrl('');
    setEditingTeamMember(null);
  };

  // Populate form for editing
  const handleEdit = (teamMember) => {
    setEditingTeamMember(teamMember);
    setName(teamMember.name);
    setRole(teamMember.role);
    setImageUrl(teamMember.image_url);
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">
        {editingTeamMember ? 'Edit Team Member' : 'Add Team Member'}
      </h2>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by name or role"
        value={searchQuery}
        onChange={handleSearchChange}
        className="border p-2 w-full mb-4"
      />

      {/* Form for adding or editing team members */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <input
          type="text"
          placeholder="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="border p-2 w-full mb-2"
        />
        {imageUrl && <img src={imageUrl} alt="Preview" className="w-32 mt-2" />}
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white p-2 w-full mt-4"
        >
          {editingTeamMember ? 'Update Team Member' : 'Add Team Member'}
        </button>
      </div>

      {/* Table of Team Members */}
      <div className="mt-6">
        <h3 className="text-xl font-bold">Existing Team Members</h3>

        {/* Sort Buttons */}
        <div className="mb-4">
          <button
            onClick={() => handleSortChange('name')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2"
          >
            Sort by Name
          </button>
          <button
            onClick={() => handleSortChange('role')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Sort by Role
          </button>
        </div>

        {sortedTeamMembers.length > 0 ? (
          <ul>
            {sortedTeamMembers.map((member) => (
              <li key={member.id} className="flex items-center justify-between py-2">
                <div>
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="w-16 h-16 object-cover mr-4"
                  />
                  <span>{member.name}</span> - <span>{member.role}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTeamMember(member.id, member.image_url)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No team members found.</p>
        )}
      </div>
    </div>
  );
};

export default TeamHandler;
