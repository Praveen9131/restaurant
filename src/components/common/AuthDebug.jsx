import { useAuth } from '../../context/AuthContext';

const AuthDebug = () => {
  const { user, isAdmin, loading, clearAuthState, logout } = useAuth();

  // Only show in development
  if (import.meta.env.DEV !== true) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <div className="font-bold mb-2">🔧 Auth Debug</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? 'Yes' : 'No'}</div>
      <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
      {user && (
        <div className="mt-2">
          <div>Name: {user.firstName || user.username}</div>
          <div>Email: {user.email}</div>
          <div>isStaff: {user.isStaff ? 'Yes' : 'No'}</div>
          <div>isSuperuser: {user.isSuperuser ? 'Yes' : 'No'}</div>
        </div>
      )}
      <div className="mt-2 space-y-1">
        <button
          onClick={clearAuthState}
          className="block w-full bg-red-500 text-white px-2 py-1 rounded text-xs"
        >
          Clear Auth
        </button>
        <button
          onClick={handleLogout}
          className="block w-full bg-orange-500 text-white px-2 py-1 rounded text-xs"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;
