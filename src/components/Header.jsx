import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user, signOut } = useAuth();  // Use the AuthContext

  return (
    <header className="bg-indigo-600 text-white p-4 flex justify-between items-center">
      <div>
        <Link to="/" className="text-3xl font-bold">
          Jai Hanuman Furniture
        </Link>
      </div>
      <div>
        {user ? (
          <>
            <span className="mr-4">Welcome, {user.email}</span>
            <button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
