import { useState, useEffect } from 'react';
import { Database, ShieldCheck, User, Terminal, HardDrive } from 'lucide-react';

interface SettingsViewProps {
  token: string | null;
  user: { name: string; email: string; role: string } | null;
}

export default function SettingsView({ token, user }: SettingsViewProps) {
  const [dbInfo, setDbInfo] = useState({
    status: 'checking',
    type: 'unknown',
    uri: '',
    path: ''
  });

  useEffect(() => {
    if (!token) return;

    // Simple fetch check to database health
    fetch('/api/health')
      .then(res => res.json())
      .then(() => {
        // Mock check on backend mode
        setDbInfo({
          status: 'Operational',
          type: 'MongoDB Atlas / Local Fallback',
          uri: 'process.env.MONGODB_URI',
          path: 'server/data/db_fallback.json'
        });
      })
      .catch(() => {
        setDbInfo({
          status: 'Offline',
          type: 'None',
          uri: '',
          path: ''
        });
      });
  }, [token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade">

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Configure ThinkDifferent  iHub variables, sub-product routes, and database connections.
        </p>
      </div>

      {/* Database State Section */}
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Database size={20} />
          <h3 style={{ fontSize: '16px' }}>Database Connection Parameters</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Connection Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 600 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dbInfo.status === 'Offline' ? '#ccc' : '#000' }}></div>
              {dbInfo.status}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Storage Provider
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>
              {dbInfo.type}
            </div>
          </div>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <HardDrive size={14} />
            <strong>Local JSON File Fallback Details:</strong>
          </div>
          <div>Location: <span style={{ textDecoration: 'underline' }}>{dbInfo.path}</span></div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            * Automatically active when MONGODB_URI is empty. All additions, registration, and logs commit directly to this file.
          </div>
        </div>
      </div>

      {/* User Profile details */}
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <User size={20} />
          <h3 style={{ fontSize: '16px' }}>Administrator Profile</h3>
        </div>

        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ width: '120px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Full Name:</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{user.name}</span>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ width: '120px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Email:</span>
              <span style={{ fontSize: '14px' }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ width: '120px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Role Privilege:</span>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 'bold' }}>{user.role}</span>
            </div>
          </div>
        )}
      </div>

      {/* Developer Environment Logs Info */}
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Terminal size={20} />
          <h3 style={{ fontSize: '16px' }}>Developer Console Orchestrator</h3>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
          ThinkDifferent OS registers a keyboard shortcut hook dynamically across your workspace context.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          border: '1px solid var(--text-primary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px'
        }}>
          <ShieldCheck size={16} />
          <span>Press <kbd style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', border: '1px solid #000', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)' }}>Ctrl + K</kbd> to launch the global Command Palette from any page.</span>
        </div>
      </div>

    </div>
  );
}
