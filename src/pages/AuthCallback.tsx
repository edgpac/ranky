import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const error = params.get('error');
    if (error) {
      navigate('/signup?error=' + error);
      return;
    }
    // Server sets a session cookie — just redirect to dashboard
    navigate('/dashboard');
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Connecting your Google account...</p>
      </div>
    </div>
  );
}
