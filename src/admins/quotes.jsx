import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch quotes from the database
  const fetchQuotes = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' });

    if (error) {
      console.error('Error fetching quotes:', error);
    } else {
      setQuotes(data);
      setFilteredQuotes(data);
    }
  };

  useEffect(() => {
    fetchQuotes(); // Fetch quotes on component mount
  }, [sortBy, sortOrder]);

  // Handle search query change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query) {
      // If search query is empty, show all quotes
      setFilteredQuotes(quotes);
    } else {
      // Filter quotes based on name, email, or address
      const filtered = quotes.filter(
        (quote) =>
          quote.name.toLowerCase().includes(query.toLowerCase()) ||
          quote.email.toLowerCase().includes(query.toLowerCase()) ||
          `${quote.street_address} ${quote.city} ${quote.district} ${quote.state}`
            .toLowerCase()
            .includes(query.toLowerCase())
      );
      setFilteredQuotes(filtered);
    }
  };

  // Sort the quotes by selected field
  const handleSortChange = (field) => {
    setSortBy(field);
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
  };

  // Handle updating quotes
  const handleUpdateQuote = async (quoteId, updatedFields) => {
    const { error } = await supabase
      .from('quotes')
      .update(updatedFields)
      .eq('id', quoteId);

    if (error) {
      console.error('Error updating quote:', error);
    } else {
      fetchQuotes(); // Refresh quotes after update
    }
  };

  // Handle deleting a quote
  const handleDeleteQuote = async (quoteId) => {
    const { error } = await supabase.from('quotes').delete().eq('id', quoteId);

    if (error) {
      console.error('Error deleting quote:', error);
    } else {
      fetchQuotes(); // Refresh quotes after deletion
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Quotes Admin Panel</h2>

      {/* Search Input */}
      <div className="mb-6 flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search by Name, Email, or Address"
          value={searchQuery}
          onChange={handleSearchChange}
          className="border p-2 w-full sm:w-1/2 mb-4"
        />
      </div>

      {/* Sort Options */}
      <div className="mb-6 flex items-center space-x-4">
        <button
          onClick={() => handleSortChange('name')}
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

      {/* Quotes Table */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Requirements</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Date Created</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((quote) => (
                <tr key={quote.id} className="border-b">
                  <td className="px-4 py-2">{quote.name}</td>
                  <td className="px-4 py-2">{quote.email}</td>
                  <td className="px-4 py-2">{quote.phone}</td>
                  <td className="px-4 py-2">{quote.requirements}</td>
                  <td className="px-4 py-2">
                    {quote.street_address}, {quote.city}, {quote.district}, {quote.state}
                  </td>
                  <td className="px-4 py-2">{new Date(quote.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleUpdateQuote(quote.id, { name: 'Updated Name' })}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuote(quote.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 ml-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-2 text-center">No quotes found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Quotes;
