import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash, Edit, Upload, X } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminStories() {
  const [stories, setStories] = useState([]);
  const [newStory, setNewStory] = useState({
    title: '',
    description: '',
    media: '',
    expires_at: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch Stories from Supabase
  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    const { data, error } = await supabase.from('stories').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stories:', error);
      toast.error('Error fetching stories.');
      return;
    }

    // ✅ Convert media paths to full URLs
    const processedStories = data.map((story) => ({
      ...story,
      media: story.media.startsWith('http')
        ? story.media
        : supabase.storage.from('product-images').getPublicUrl(story.media).data.publicUrl,
    }));

    setStories(processedStories);
  };

  // ✅ Handle File Upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  // ✅ Upload Image to Supabase Storage
  const uploadImage = async () => {
    if (!imageFile) {
      toast.warning('No file selected.');
      return null;
    }

    setLoading(true);
    const fileName = `stories/${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
    const { data, error } = await supabase.storage.from('product-images').upload(fileName, imageFile);

    if (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed.');
      setLoading(false);
      return null;
    }

    setLoading(false);
    return fileName;
  };

  // ✅ Add or Update Story
  const handleStorySubmit = async () => {
    if (!newStory.title || !newStory.description) {
      toast.warning('Title and description are required.');
      return;
    }

    const imagePath = imageFile ? await uploadImage() : newStory.media;

    if (!imagePath) return;

    if (editingStory) {
      // Update story
      const { error } = await supabase
        .from('stories')
        .update({ ...newStory, media: imagePath })
        .match({ id: editingStory });

      if (error) {
        console.error('Error updating story:', error);
        toast.error('Error updating story.');
      } else {
        toast.success('Story updated successfully!');
      }
    } else {
      // Add new story
      const { error } = await supabase.from('stories').insert([{ ...newStory, media: imagePath }]);

      if (error) {
        console.error('Error adding story:', error);
        toast.error('Error adding story.');
      } else {
        toast.success('Story added successfully!');
      }
    }

    setNewStory({ title: '', description: '', media: '', expires_at: '' });
    setImageFile(null);
    setEditingStory(null);
    fetchStories();
  };

  // ✅ Delete Story
  const deleteStory = async (id, mediaPath) => {
    if (!id) return;
  
    try {
      // ✅ Extract storage file path if it's a URL
      if (mediaPath && mediaPath.startsWith('https://')) {
        const fileName = mediaPath.split('/').pop(); // Get file name from URL
        await supabase.storage.from('product-images').remove([`stories/${fileName}`]);
      } else if (mediaPath) {
        await supabase.storage.from('product-images').remove([mediaPath]);
      }
  
      // ✅ Delete the story from Supabase database
      const { error } = await supabase.from('stories').delete().match({ id });
  
      if (error) {
        console.error('Error deleting story:', error);
        toast.error('Error deleting story.');
      } else {
        toast.success('Story deleted successfully!');
        fetchStories(); // ✅ Refresh the list after deletion
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong.');
    }
  };
  
  // ✅ Edit Story
  const editStory = (story) => {
    setNewStory({
      title: story.title,
      description: story.description,
      media: story.media,
      expires_at: story.expires_at || '',
    });
    setEditingStory(story.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-6">Admin - Manage Stories</h2>

        {/* Upload Story */}
        <div className="border p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">{editingStory ? 'Edit Story' : 'Add New Story'}</h3>
          <input
            type="text"
            placeholder="Story Title"
            value={newStory.title}
            onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          />
          <textarea
            placeholder="Story Description"
            value={newStory.description}
            onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          ></textarea>
          <input
            type="datetime-local"
            value={newStory.expires_at}
            onChange={(e) => setNewStory({ ...newStory, expires_at: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          />

          <input type="file" onChange={handleFileUpload} className="w-full mb-3" />
          {imageFile && <p className="text-gray-700">Selected: {imageFile.name}</p>}

          <button onClick={handleStorySubmit} className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg font-semibold">
            {loading ? 'Uploading...' : editingStory ? 'Update Story' : 'Add Story'}
          </button>
        </div>

        {/* Display Existing Stories */}
        <h3 className="text-xl font-bold mt-8 mb-4">Existing Stories</h3>
        <div className="grid grid-cols-1 gap-6">
          {stories.map((story) => (
            <div key={story.id} className="bg-white shadow-lg rounded-lg p-4 flex items-center gap-4">
              <img src={story.media} alt="Story" className="w-20 h-20 rounded-md object-cover" />
              <div className="flex-1">
                <h3 className="text-lg font-bold">{story.title}</h3>
                <p className="text-gray-600">{story.description}</p>
              </div>
              <button onClick={() => editStory(story)} className="text-blue-500 hover:underline">
                <Edit className="w-5 h-5" />
              </button>
              <button onClick={() => deleteStory(story.id, story.media)} className="text-red-500 hover:underline">
                <Trash className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminStories;
