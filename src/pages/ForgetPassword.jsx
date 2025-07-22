import { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setMessage(null);
    setError(null);

    try {
      const res = await axios.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'Reset link sent to your email.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 px-4">
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">🔐 Forgot Password</h2>

        {message && <div className="bg-green-100 text-green-800 text-sm px-4 py-2 rounded mb-4">{message}</div>}
        {error && <div className="bg-red-100 text-red-800 text-sm px-4 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={isSending}
            className={`w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition ${
              isSending ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {isSending ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <button
          className="mt-4 text-sm text-blue-500 hover:underline"
          onClick={() => navigate('/login')}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}
