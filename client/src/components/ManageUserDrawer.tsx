import React, { useState, useEffect } from 'react';
import { X, User, KeyRound, Trash2 } from 'lucide-react';

interface ManageUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  user: any;
  onUpdateComplete: () => void;
}

export default function ManageUserDrawer({
  isOpen,
  onClose,
  token,
  user,
  onUpdateComplete
}: ManageUserDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'danger'>('profile');

  // Profile edit state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [product, setProduct] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Security reset state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState(false);

  // Danger delete state
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [error, setError] = useState('');

  // Reset form states when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'admin');
      setProduct(user.product || '');
      setPassword('');
      setConfirmPassword('');
      setDeleteInput('');
      setError('');
      setProfileSuccess(false);
      setSecuritySuccess(false);
      setActiveTab('profile');
    }
  }, [user, isOpen]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    setProfileLoading(true);
    setProfileSuccess(false);
    setError('');

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, role, product: product || null })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user profile');
      }

      setProfileSuccess(true);
      onUpdateComplete();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    setSecurityLoading(true);
    setSecuritySuccess(false);
    setError('');

    try {
      const response = await fetch(`/api/users/${user._id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSecuritySuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!token || !user) return;

    if (deleteInput !== user.name) {
      setError(`Please type "${user.name}" to confirm deletion`);
      return;
    }

    if (!confirm(`Are you absolutely sure you want to delete user account "${user.name}"? This action is irreversible.`)) {
      return;
    }

    setDeleteLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      onUpdateComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 500
    }} onClick={onClose}>

      <div style={{
        width: '100%',
        maxWidth: '520px',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-premium)'
      }} onClick={(e) => e.stopPropagation()} className="animate-slide-in">

        {/* Drawer Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '20px' }}>Manage User Node</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
              Modify privileges, reset database passwords, or remove user access
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '4px 8px'
        }}>
          <button
            onClick={() => { setActiveTab('profile'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: activeTab === 'profile' ? 'bold' : 'normal',
              color: activeTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'profile' ? '2px solid var(--text-primary)' : 'none',
              cursor: 'pointer'
            }}
          >
            Profile Details
          </button>
          <button
            onClick={() => { setActiveTab('security'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: activeTab === 'security' ? 'bold' : 'normal',
              color: activeTab === 'security' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'security' ? '2px solid var(--text-primary)' : 'none',
              cursor: 'pointer'
            }}
          >
            Reset Password
          </button>
          <button
            onClick={() => { setActiveTab('danger'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: activeTab === 'danger' ? 'bold' : 'normal',
              color: activeTab === 'danger' ? '#000000' : 'var(--text-secondary)',
              borderBottom: activeTab === 'danger' ? '2px solid #000000' : 'none',
              cursor: 'pointer'
            }}
          >
            Danger Zone
          </button>
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {error && (
            <div style={{
              padding: '12px',
              border: '1px solid #000',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
              color: '#000',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)'
            }}>
              ⚠️ Error: {error}
            </div>
          )}

          {/* TAB 1: Edit Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
              {profileSuccess && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '8px'
                }}>
                  ✓ User profile details updated successfully.
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="input-premium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-premium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Role & Access Privilege
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-premium"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="admin">Administrator (admin)</option>
                  <option value="Owner">Account Owner (Owner)</option>
                  <option value="thinkdifferent">System Node (thinkdifferent)</option>
                  <option value="developer">Developer (developer)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Assign to Product
                </label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="input-premium"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">— Unassigned —</option>
                  <option value="ahhar">◈  Ahhar.AI</option>
                  <option value="hub">◇  ThinkDifferent Hub</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={profileLoading}
                style={{ marginTop: '12px', width: '100%' }}
              >
                <User size={16} />
                {profileLoading ? 'Updating details...' : 'Update User details'}
              </button>
            </form>
          )}

          {/* TAB 2: Reset Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
              {securitySuccess && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '8px'
                }}>
                  ✓ Password has been reset and encrypted successfully.
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-premium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-premium"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={securityLoading}
                style={{ marginTop: '12px', width: '100%' }}
              >
                <KeyRound size={16} />
                {securityLoading ? 'Setting password...' : 'Commit New Password'}
              </button>
            </form>
          )}

          {/* TAB 3: Danger Zone */}
          {activeTab === 'danger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade">
              <div style={{
                border: '1px solid #000000',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#000', fontWeight: 'bold' }}>
                  <Trash2 size={18} />
                  <span>Remove Access Credentials</span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  This will permanently delete user account <strong>{user.name}</strong> from MongoDB. They will immediately lose access to the ThinkDifferent  iHub telemetry dashboards.
                </p>

                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Type user's name <strong>{user.name}</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    placeholder={user.name}
                    className="input-premium"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    style={{ border: '1px solid #000' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={deleteInput !== user.name || deleteLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: deleteInput === user.name ? '#000000' : 'transparent',
                    color: deleteInput === user.name ? '#ffffff' : 'var(--text-tertiary)',
                    border: '1px solid #000000',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'bold',
                    cursor: deleteInput === user.name ? 'pointer' : 'not-allowed',
                    gap: '8px',
                    marginTop: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trash2 size={16} />
                  {deleteLoading ? 'Deleting account...' : 'Permanently Delete User'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
