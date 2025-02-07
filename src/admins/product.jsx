import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ProductUploader = () => {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Handle file selection
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImageFile(file);
  };

  // Fetch products from the database
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order(sortBy, { ascending: sortOrder === 'asc' });
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data);
      setSortedProducts(data);
    }
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query) {
      // If search query is empty, show all products
      setSortedProducts(products);
    } else {
      // Filter products based on name, category, or price
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase()) ||
          product.price.toString().includes(query) // search by price
      );
      setSortedProducts(filtered);
    }
  };

  // Sort the products by selected field
  const handleSortChange = (field) => {
    setSortBy(field);
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
  };

  // Upload Image and Insert Product into Supabase
  const addProduct = async () => {
    if (!productName || !price || !category || !imageFile) {
      alert('All fields are required!');
      return;
    }

    const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;

    // Upload image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`products/${fileName}`, imageFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error('Image upload failed:', uploadError);
      return;
    }

    // Retrieve the public URL
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(`products/${fileName}`);

    const imageUrl = publicUrlData.publicUrl;

    // Insert product details into the database
    const { error: dbError } = await supabase.from('products').insert([
      { name: productName, price, image: imageUrl, category },
    ]);

    if (dbError) {
      console.error('Error adding product:', dbError);
    } else {
      alert('Product added successfully!');
      setProductName('');
      setPrice('');
      setCategory('');
      setImageFile(null);
      setImageUrl('');
      fetchProducts(); // Fetch updated product list
    }
  };

  // Update Product logic
  const updateProduct = async () => {
    if (!productName || !price || !category) {
      alert('All fields are required!');
      return;
    }

    let imageUrl = editingProduct.image;

    // If a new image is selected, upload it to Supabase
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;

      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(`products/${fileName}`, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) {
        console.error('Image upload failed:', uploadError);
        return;
      }

      // Retrieve the public URL for the updated image
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${fileName}`);

      imageUrl = publicUrlData.publicUrl; // Use new image URL
    }

    // Update the product in the database
    const { error: dbError } = await supabase
      .from('products')
      .update({
        name: productName,
        price,
        category,
        image: imageUrl,
      })
      .eq('id', editingProduct.id);

    if (dbError) {
      console.error('Error updating product:', dbError);
    } else {
      alert('Product updated successfully!');
      setEditingProduct(null); // Reset the editing state
      setProductName('');
      setPrice('');
      setCategory('');
      setImageFile(null);
      setImageUrl('');
      fetchProducts(); // Fetch updated product list
    }
  };

  // Delete product logic
  const deleteProduct = async (productId, imageUrl) => {
    // Delete the image from Supabase Storage
    const fileName = imageUrl.split('/').pop(); // Extract the filename from the URL
    const { error: deleteImageError } = await supabase.storage
      .from('product-images')
      .remove([`products/${fileName}`]);

    if (deleteImageError) {
      console.error('Error deleting image:', deleteImageError);
      return;
    }

    // Delete the product from the database
    const { error: dbDeleteError } = await supabase.from('products').delete().eq('id', productId);

    if (dbDeleteError) {
      console.error('Error deleting product:', dbDeleteError);
    } else {
      alert('Product deleted successfully!');
      fetchProducts(); // Fetch updated product list
    }
  };

  useEffect(() => {
    fetchProducts(); // Fetch products when the component mounts
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products by name, category, or price"
          value={searchQuery}
          onChange={handleSearchChange}
          className="border p-2 w-full mb-4"
        />
        <input
          type="text"
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
          onClick={editingProduct ? updateProduct : addProduct}
          className="bg-blue-600 text-white p-2 w-full mt-4"
        >
          {editingProduct ? 'Update Product' : 'Add Product'}
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold">Existing Products</h3>
        {products.length > 0 ? (
          <ul>
            {sortedProducts.map((product) => (
              <li key={product.id} className="flex items-center justify-between py-2">
                <div>
                  <img src={product.image} alt={product.name} className="w-16 h-16 object-cover mr-4" />
                  <span>{product.name}</span> - <span>${product.price}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setProductName(product.name);
                      setPrice(product.price);
                      setCategory(product.category);
                      setImageUrl(product.image);
                    }}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id, product.image)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No products found.</p>
        )}
      </div>
    </div>
  );
};

export default ProductUploader;
