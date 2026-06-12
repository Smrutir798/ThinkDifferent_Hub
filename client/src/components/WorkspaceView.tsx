import { useState, useEffect } from 'react';
import { Search, Plus, Calendar, X, Trash2, Github } from 'lucide-react';
import ManageUserDrawer from './ManageUserDrawer.tsx';

interface WorkspaceViewProps {
  token: string | null;
  onOpenOnboarding: () => void;
  refreshTrigger: number;
}

const PRODUCTS = [
  { key: 'ahhar', label: 'Ahhar.AI',           icon: '◈' },
  { key: 'hub',   label: 'ThinkDifferent Hub',  icon: '◇' },
];

export default function WorkspaceView({ token, onOpenOnboarding, refreshTrigger }: WorkspaceViewProps) {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeProduct, setActiveProduct] = useState('ahhar');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);

  // Supabase Member CRUD drawer states
  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Developer');
  const [memberStatus, setMemberStatus] = useState('Active');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberConfirmPassword, setMemberConfirmPassword] = useState('');
  const [memberAvatarUrl, setMemberAvatarUrl] = useState('');
  const [memberGithubUsername, setMemberGithubUsername] = useState('');
  const [memberDrawerTab, setMemberDrawerTab] = useState<'profile' | 'password' | 'danger'>('profile');
  const [memberDeleteConfirm, setMemberDeleteConfirm] = useState('');
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState(false);

  const handleManage = (u: any) => {
    setSelectedUser(u);
    setIsManageOpen(true);
  };

  const handleNewMember = () => {
    setSelectedMember(null);
    setMemberName('');
    setMemberEmail('');
    setMemberRole('Developer');
    setMemberStatus('Active');
    setMemberPassword('');
    setMemberConfirmPassword('');
    setMemberAvatarUrl('');
    setMemberGithubUsername('');
    setMemberDrawerTab('profile');
    setMemberDeleteConfirm('');
    setDrawerError('');
    setDrawerSuccess(false);
    setIsMemberDrawerOpen(true);
  };

  const handleEditMember = (m: any) => {
    setSelectedMember(m);
    setMemberName(m.name);
    setMemberEmail(m.email);
    setMemberRole(m.role);
    setMemberStatus(m.status || 'Active');
    setMemberPassword('');
    setMemberConfirmPassword('');
    setMemberAvatarUrl(m.avatar_url || '');
    setMemberGithubUsername(m.github_username || '');
    setMemberDrawerTab('profile');
    setMemberDeleteConfirm('');
    setDrawerError('');
    setDrawerSuccess(false);
    setIsMemberDrawerOpen(true);
  };

  const fetchRestaurants = () => {
    if (!token) return;
    setLoading(true);

    if (activeProduct === 'hub') {
      // Query members from Supabase members API
      let url = `/api/members`;
      if (search) url += `?search=${encodeURIComponent(search)}`;

      fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Map Supabase members to matching table structure
            setRestaurants(data.map((m: any) => ({
              _id: m.id,
              name: m.name,
              email: m.email,
              role: m.role,
              product: 'hub',
              status: m.status || 'Active',
              createdAt: m.created_at,
              avatar_url: m.avatar_url,
              github_username: m.github_username
            })));
          }
        })
        .catch(err => console.error('Error fetching Supabase members:', err))
        .finally(() => setLoading(false));
    } else {
      // Query standard MongoDB users API
      let url = `/api/users?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setRestaurants(data); })
        .catch(err => console.error('Error fetching users:', err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchRestaurants(); }, [search, token, refreshTrigger, activeProduct]);

  useEffect(() => {
    const handleSelectRestaurant = (e: any) => {
      const name = e.detail;
      if (name) setSearch(name);
    };
    const handleSelectTab = (e: any) => {
      if (e.detail) setActiveProduct(e.detail);
    };
    window.addEventListener('select-restaurant', handleSelectRestaurant);
    window.addEventListener('select-workspace-tab', handleSelectTab);
    return () => {
      window.removeEventListener('select-restaurant', handleSelectRestaurant);
      window.removeEventListener('select-workspace-tab', handleSelectTab);
    };
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const clearFilters = () => setSearch('');

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const isEdit = !!selectedMember;

    if (!isEdit) {
      if (memberPassword !== memberConfirmPassword) {
        setDrawerError('Passwords do not match');
        return;
      }
      if (memberPassword && memberPassword.length < 4) {
        setDrawerError('Password must be at least 4 characters long');
        return;
      }
    }

    setDrawerLoading(true);
    setDrawerError('');
    setDrawerSuccess(false);

    try {
      const payload: any = {
        name: memberName,
        email: memberEmail,
        role: memberRole,
        status: memberStatus,
        avatar_url: memberAvatarUrl || null,
        github_username: memberGithubUsername || null
      };
      
      if (!isEdit && memberPassword) {
        payload.password = memberPassword;
      }

      const response = await fetch(isEdit ? `/api/members/${selectedMember._id}` : '/api/members', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save member details');
      }

      setDrawerSuccess(true);
      fetchRestaurants();
      setTimeout(() => setIsMemberDrawerOpen(false), 800);
    } catch (err: any) {
      setDrawerError(err.message || 'Something went wrong');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleMemberResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedMember) return;

    if (memberPassword !== memberConfirmPassword) {
      setDrawerError('Passwords do not match');
      return;
    }

    if (memberPassword.length < 4) {
      setDrawerError('Password must be at least 4 characters long');
      return;
    }

    setDrawerLoading(true);
    setDrawerError('');
    setDrawerSuccess(false);

    try {
      const response = await fetch(`/api/members/${selectedMember._id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: memberPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setDrawerSuccess(true);
      setMemberPassword('');
      setMemberConfirmPassword('');
    } catch (err: any) {
      setDrawerError(err.message || 'Something went wrong');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleMemberDelete = async () => {
    if (!token || !selectedMember) return;
    if (memberDeleteConfirm !== selectedMember.name) {
      setDrawerError(`Please type "${selectedMember.name}" to confirm deletion`);
      return;
    }
    if (!confirm(`Are you absolutely sure you want to remove member "${selectedMember.name}"?`)) return;

    setDrawerLoading(true);
    setDrawerError('');
    try {
      const response = await fetch(`/api/members/${selectedMember._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete member');
      }
      fetchRestaurants();
      setIsMemberDrawerOpen(false);
    } catch (err: any) {
      setDrawerError(err.message || 'Something went wrong');
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade">

      {/* Workspace Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>User Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage platform user profiles, authorization roles, and sandbox namespaces.
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={activeProduct === 'hub' ? handleNewMember : onOpenOnboarding}
        >
          <Plus size={16} />
          {activeProduct === 'hub' ? 'New Member' : 'New User'}
        </button>
      </div>

      {/* Product Selector — Ahhar.AI / ThinkDifferent Hub */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        width: 'fit-content',
      }}>
        {PRODUCTS.map((p, i) => {
          const isActive = activeProduct === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setActiveProduct(p.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                border: 'none',
                borderRight: i < PRODUCTS.length - 1 ? '1px solid var(--border-color)' : 'none',
                backgroundColor: isActive ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.02em',
                transition: 'background-color 0.18s ease, color 0.18s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>{p.icon}</span>
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Table Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: 'var(--bg-secondary)',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder={activeProduct === 'hub' ? "Search by member name, email, or role..." : "Search by user name, email, or role..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-premium"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {search && (
            <button
              onClick={clearFilters}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-primary)', fontSize: '13px',
                fontFamily: 'var(--font-mono)', textDecoration: 'underline',
                cursor: 'pointer', padding: '4px 8px'
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Main SaaS Table */}
      <div className="table-container">
        <table className="table-premium">
          <thead>
            <tr>
              <th>{activeProduct === 'hub' ? 'Member Name' : 'User Name'}</th>
              <th>Email Address</th>
              <th>Role Privilege</th>
              <th>Product</th>
              <th>{activeProduct === 'hub' ? 'Joined Date' : 'Registration Date'}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {activeProduct === 'hub' ? 'Syncing members database...' : 'Syncing users database...'}
                </td>
              </tr>
            ) : restaurants.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {activeProduct === 'hub' ? 'No member entries found.' : 'No user entries found.'}
                </td>
              </tr>
            ) : (
              restaurants.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Avatar */}
                      {u.avatar_url ? (
                        <img 
                          src={u.avatar_url} 
                          alt={u.name}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--text-primary)',
                          color: 'var(--bg-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          fontFamily: 'var(--font-mono)',
                          flexShrink: 0
                        }}>
                          {u.name ? u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '14px' }}>{u.name}</span>
                        {u.github_username && (
                          <a 
                            href={`https://github.com/${u.github_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '11px', 
                              fontFamily: 'var(--font-mono)', 
                              color: 'var(--text-secondary)',
                              textDecoration: 'none',
                              width: 'fit-content'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                          >
                            <Github size={10} />
                            <span>@{u.github_username}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${
                      u.role === 'admin' || u.role === 'Owner' || u.role === 'Admin' ? 'badge-active' : 'badge-pending'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {u.product === 'ahhar' ? 'Ahhar.AI' : u.product === 'hub' ? 'ThinkDifferent Hub' : 'Unassigned'}
                      </span>
                      {activeProduct === 'hub' && (
                        <span className={`badge ${
                          u.status === 'Active' ? 'badge-active' : 'badge-pending'
                        }`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {u.status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} />
                      {formatDate(u.createdAt)}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => activeProduct === 'hub' ? handleEditMember(u) : handleManage(u)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MongoDB Manage Drawer */}
      <ManageUserDrawer
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        token={token}
        user={selectedUser}
        onUpdateComplete={fetchRestaurants}
      />

      {/* Supabase Member Manage Drawer */}
      {isMemberDrawerOpen && (
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
        }} onClick={() => setIsMemberDrawerOpen(false)}>

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

            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '20px' }}>{selectedMember ? 'Modify Member Node' : 'Register New Member'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                  Modify Supabase database records for ThinkDifferent Hub
                </p>
              </div>
              <button onClick={() => setIsMemberDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation (Only show if editing) */}
            {selectedMember && (
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                padding: '4px 8px'
              }}>
                <button
                  onClick={() => { setMemberDrawerTab('profile'); setDrawerError(''); setDrawerSuccess(false); }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    background: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: memberDrawerTab === 'profile' ? 'bold' : 'normal',
                    color: memberDrawerTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderBottom: memberDrawerTab === 'profile' ? '2px solid var(--text-primary)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  Member Details
                </button>
                <button
                  onClick={() => { setMemberDrawerTab('password'); setDrawerError(''); setDrawerSuccess(false); }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    background: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: memberDrawerTab === 'password' ? 'bold' : 'normal',
                    color: memberDrawerTab === 'password' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderBottom: memberDrawerTab === 'password' ? '2px solid var(--text-primary)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  Reset Password
                </button>
                <button
                  onClick={() => { setMemberDrawerTab('danger'); setDrawerError(''); setDrawerSuccess(false); }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    background: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: memberDrawerTab === 'danger' ? 'bold' : 'normal',
                    color: memberDrawerTab === 'danger' ? '#000000' : 'var(--text-secondary)',
                    borderBottom: memberDrawerTab === 'danger' ? '2px solid #000000' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  Danger Zone
                </button>
              </div>
            )}

            {/* Form Body */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {drawerError && (
                <div style={{
                  padding: '12px',
                  border: '1px solid #000',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: '#000',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  ⚠️ Error: {drawerError}
                </div>
              )}

              {drawerSuccess && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  ✓ Operation completed successfully.
                </div>
              )}

              {memberDrawerTab === 'profile' && (
                <form onSubmit={handleMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="input-premium"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="e.g. Steve Wozniak"
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
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="woz@thinkdifferent.com"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Role Assignment
                    </label>
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      className="input-premium"
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="Developer">Developer</option>
                      <option value="Designer">Designer</option>
                      <option value="Maintainer">Maintainer</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Status Code
                    </label>
                    <select
                      value={memberStatus}
                      onChange={(e) => setMemberStatus(e.target.value)}
                      className="input-premium"
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending Approval</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Avatar Image URL
                    </label>
                    <input
                      type="url"
                      className="input-premium"
                      value={memberAvatarUrl}
                      onChange={(e) => setMemberAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or dicebear URL"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      className="input-premium"
                      value={memberGithubUsername}
                      onChange={(e) => setMemberGithubUsername(e.target.value)}
                      placeholder="e.g. woz"
                    />
                  </div>

                  {!selectedMember && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Password
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="input-premium"
                          value={memberPassword}
                          onChange={(e) => setMemberPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="input-premium"
                          value={memberConfirmPassword}
                          onChange={(e) => setMemberConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={drawerLoading}
                    style={{ marginTop: '12px', width: '100%' }}
                  >
                    {drawerLoading ? 'Saving changes...' : selectedMember ? 'Commit Changes' : 'Register Member'}
                  </button>
                </form>
              )}

              {memberDrawerTab === 'password' && selectedMember && (
                <form onSubmit={handleMemberResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input-premium"
                      value={memberPassword}
                      onChange={(e) => setMemberPassword(e.target.value)}
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
                      value={memberConfirmPassword}
                      onChange={(e) => setMemberConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={drawerLoading}
                    style={{ marginTop: '12px', width: '100%' }}
                  >
                    {drawerLoading ? 'Setting password...' : 'Commit New Password'}
                  </button>
                </form>
              )}

              {memberDrawerTab === 'danger' && selectedMember && (
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
                      <span>Remove Member Profile</span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      This will permanently delete member profile <strong>{selectedMember.name}</strong> from your Supabase database.
                    </p>

                    <div style={{ marginTop: '8px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Type member's name <strong>{selectedMember.name}</strong> to confirm:
                      </label>
                      <input
                        type="text"
                        placeholder={selectedMember.name}
                        className="input-premium"
                        value={memberDeleteConfirm}
                        onChange={(e) => setMemberDeleteConfirm(e.target.value)}
                        style={{ border: '1px solid #000' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleMemberDelete}
                      disabled={memberDeleteConfirm !== selectedMember.name || drawerLoading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: memberDeleteConfirm === selectedMember.name ? '#000000' : 'transparent',
                        color: memberDeleteConfirm === selectedMember.name ? '#ffffff' : 'var(--text-tertiary)',
                        border: '1px solid #000000',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 'bold',
                        cursor: memberDeleteConfirm === selectedMember.name ? 'pointer' : 'not-allowed',
                        gap: '8px',
                        marginTop: '12px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Trash2 size={16} />
                      {drawerLoading ? 'Removing member...' : 'Permanently Delete Member'}
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
              <button className="btn-secondary" onClick={() => setIsMemberDrawerOpen(false)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
