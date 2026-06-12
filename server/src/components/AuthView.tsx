import React, { useState } from 'react';
import { LogIn, ShieldAlert, ArrowRight } from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (token: string, user: { name: string; email: string; role: string }) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { name, email, password, role: 'Owner' };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success
      localStorage.setItem('td_token', data.token);
      localStorage.setItem('td_user', JSON.stringify(data.user));
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('owner@thinkdifferent.com');
    setPassword('password123');
    setIsLogin(true);
    setError('');
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px',
        boxShadow: 'var(--shadow-lg)'
      }} className="animate-scale-up">
        
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            fontSize: '24px',
            marginBottom: '16px'
          }}>
            T
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>ThinkDifferent OS</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {isLogin ? 'Sign in to access your dashboard' : 'Create an administrative owner profile'}
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--text-primary)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--text-primary)'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                className="input-premium"
                placeholder="Steve Jobs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-premium"
              placeholder="owner@thinkdifferent.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              className="input-premium"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '14px' }}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          marginTop: '24px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px'
        }}>
          {isLogin ? (
            <button
              onClick={() => setIsLogin(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Need an account? Register instead
            </button>
          ) : (
            <button
              onClick={() => setIsLogin(true)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Already registered? Sign in instead
            </button>
          )}

          {isLogin && (
            <button
              onClick={handleQuickFill}
              style={{
                background: 'none',
                border: '1px dashed var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogIn size={12} />
              Quick Fill Demo Credentials
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
