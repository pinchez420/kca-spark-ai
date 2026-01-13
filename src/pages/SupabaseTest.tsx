import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Testing Supabase connection...');
  const [details, setDetails] = useState<any>({});

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Check environment variables
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        setDetails({ url: url ? '✓ Set' : '✗ Missing', key: key ? '✓ Set' : '✗ Missing' });

        if (!url || !key) {
          throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
        }

        if (url.includes('undefined') || url.includes('your-project')) {
          throw new Error('Invalid Supabase URL - please configure .env file');
        }

        // Test connection
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        setStatus('success');
        setMessage('Supabase connection successful!');
        console.log('[SupabaseTest] Session:', data.session);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message);
        console.error('[SupabaseTest] Error:', error);
      }
    };

    testConnection();
  }, []);

  const handleSignup = async () => {
    setStatus('loading');
    setMessage('Testing signup...');
    setDetails({});

    try {
      const testEmail = `test${Date.now()}@students.kcau.ac.ke`;
      const testPassword = 'TestPassword123';

      console.log('[SupabaseTest] Attempting signup with:', testEmail);

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User',
            role: 'student',
          },
        },
      });

      console.log('[SupabaseTest] Signup result:', { data, error });

      if (error) {
        setStatus('error');
        setMessage(error.message);
        setDetails({ 
          code: error.code,
          name: error.name,
          status: error.status 
        });
      } else {
        setStatus('success');
        setMessage('Signup test successful!');
        setDetails({ 
          user: data.user?.id,
          session: data.session ? 'created' : 'null (email confirmation needed)'
        });
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        
        <div className={`p-4 rounded-lg mb-4 ${
          status === 'loading' ? 'bg-blue-100 text-blue-800' :
          status === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          <p className="font-medium">{message}</p>
        </div>

        {Object.entries(details).length > 0 && (
          <div className="bg-gray-100 rounded p-4 mb-4 text-sm">
            <h3 className="font-medium mb-2">Details:</h3>
            {Object.entries(details).map(([key, value]) => (
              <p key={key} className="text-gray-600">
                {key}: {String(value)}
              </p>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleSignup}
            disabled={status === 'loading'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'loading' ? 'Testing...' : 'Test Signup'}
          </button>
          
          <a href="/" className="block text-center text-blue-600 hover:underline">
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}

