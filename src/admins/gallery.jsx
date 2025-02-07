import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminGallery() {
  const [gallery, setGallery] = useState([]);
  const [newProject, setNewProject] = useState({
    type: 'image', // image, video, delivery
    title: '',
    description: '',
    size: 'medium', // ✅ Keeping size instead of category
    media: [],
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    console.log('Fetching gallery...');
    const { data, error } = await supabase.from('gallery').select('*');
  
    if (error) {
      console.error('Error fetching gallery:', error);
      toast.error('Error fetching gallery.');
      return;
    }
  
    console.log('Fetched raw data:', data);
  
    const updatedItems = await Promise.all(
      data.map(async (item) => {
        let mediaData = item.media;
  
        if (!mediaData) {
          mediaData = [];
        } else if (typeof mediaData === 'string') {
          if (mediaData.startsWith('http') || mediaData.endsWith('.jpg') || mediaData.endsWith('.png') || mediaData.endsWith('.mp4')) {
            mediaData = [mediaData]; // Convert single URL string to array
          } else {
            try {
              mediaData = JSON.parse(mediaData); // Parse JSON array if applicable
            } catch (e) {
              console.error('Media parsing error:', e);
              mediaData = [];
            }
          }
        }
  
        // ✅ Convert Supabase storage paths to public URLs
        const mediaURLs = await Promise.all(
          mediaData.map(async (mediaFile) => {
            if (mediaFile.startsWith('http')) return mediaFile; // Already a URL
  
            const { data: publicURL } = supabase.storage.from('product-images').getPublicUrl(mediaFile);
            return publicURL.publicUrl; // Get public URL from Supabase
          })
        );
  
        return { ...item, media: mediaURLs };
      })
    );
  
    console.log('Processed gallery items:', updatedItems);
    setGallery(updatedItems);
  };
  
  // Upload multiple files to Supabase Storage
  const uploadImages = async () => {
    if (imageFiles.length === 0) {
      toast.warning('No files selected.');
      return [];
    }

    setLoading(true);
    const filePaths = await Promise.all(
      imageFiles.map(async (file) => {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const filePath = `gallery/${fileName}`;
        const { data, error } = await supabase.storage.from('product-images').upload(filePath, file);

        if (error) {
          console.error('Upload failed:', error.message);
          toast.error(`Upload failed: ${file.name}`);
          return null;
        }

        return filePath;
      })
    );

    setLoading(false);
    return filePaths.filter(Boolean);
  };

  // Add new project
  const addProject = async () => {
    if (!newProject.title || !newProject.description) {
      toast.warning('Title and Description are required.');
      return;
    }

    const mediaPaths = await uploadImages();
    if (mediaPaths.length === 0) return;

    const updatedProject = { ...newProject, media: JSON.stringify(mediaPaths) };

    const { error } = await supabase.from('gallery').insert([updatedProject]);
    if (error) {
      console.error('Error adding project:', error);
      toast.error('Error adding project.');
    } else {
      toast.success('Project added successfully!');
      fetchGallery();
      setNewProject({ type: 'image', title: '', description: '', size: 'medium', media: [] });
      setImageFiles([]);
    }
  };

  // Delete project & its media
  const deleteProject = async (id, mediaPaths) => {
    if (!id) return;

    if (mediaPaths && mediaPaths.length > 0) {
      await Promise.all(
        mediaPaths.map(async (path) => {
          const { error } = await supabase.storage.from('product-images').remove([path]);
          if (error) console.error('Error deleting media:', error);
        })
      );
    }

    const { error } = await supabase.from('gallery').delete().match({ id });
    if (error) {
      console.error('Error deleting project:', error);
      toast.error('Error deleting project.');
    } else {
      toast.success('Project deleted successfully!');
      fetchGallery();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-5xl mx-auto bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-6">Admin - Manage Gallery</h2>

        {/* Upload New Project */}
        <div className="border p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Add New Project</h3>
          
          <input
            type="text"
            placeholder="Project Title"
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          />

          <textarea
            placeholder="Project Description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          ></textarea>

          {/* Size Dropdown */}
          <select
            value={newProject.size}
            onChange={(e) => setNewProject({ ...newProject, size: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          >
            <option value="large">Large</option>
            <option value="medium">Medium</option>
            <option value="small">Small</option>
          </select>

          {/* File Input */}
          <input type="file" multiple onChange={(e) => setImageFiles([...e.target.files])} className="w-full mb-3" />
          {imageFiles.length > 0 && <p className="text-gray-700">{imageFiles.length} files selected</p>}

          <button onClick={addProject} className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg font-semibold">
            {loading ? 'Uploading...' : 'Add Project'}
          </button>
        </div>

        {/* Display Existing Projects */}
        <h3 className="text-xl font-bold mt-8 mb-4">Existing Projects</h3>
        {gallery.length === 0 ? (
          <p className="text-gray-600 text-center">No projects found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gallery.map((project) => (
              <div key={project.id} className="bg-white shadow-lg rounded-lg p-4">
                <h3 className="text-lg font-bold">{project.title}</h3>
                <p className="text-gray-600">Size: {project.size}</p>
                <p className="text-gray-600 mb-3">{project.description}</p>

                <div className="flex gap-2 overflow-x-auto">
                  {project.media.length > 0 ? (
                    project.media.map((src, idx) => (
                      <div key={idx} className="relative">
                        {src.endsWith('.mp4') ? (
                          <video className="w-24 h-24 rounded-md" controls>
                            <source src={src} type="video/mp4" />
                          </video>
                        ) : (
                          <img src={src} alt="Gallery media" className="w-24 h-24 rounded-md" />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No media available</p>
                  )}
                </div>

                <button
                  onClick={() => deleteProject(project.id, project.media)}
                  className="bg-red-500 text-white py-1 px-3 rounded-lg mt-3 flex items-center gap-1"
                >
                  <Trash className="w-5 h-5" /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminGallery;
