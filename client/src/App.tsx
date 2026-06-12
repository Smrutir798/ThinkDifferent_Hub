import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

// Components
import Sidebar from './components/Sidebar.tsx';
import CommandPalette from './components/CommandPalette.tsx';
import OnboardingDrawer from './components/OnboardingDrawer.tsx';
import AuthView from './components/AuthView.tsx';

// Views
import DashboardView from './components/DashboardView.tsx';
import WorkspaceView from './components/WorkspaceView.tsx';
import SettingsView from './components/SettingsView.tsx';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('td_token'));
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOnboardingDrawerOpen, setIsOnboardingDrawerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Read user details
  useEffect(() => {
    const rawUser = localStorage.getItem('td_user');
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch (err) {
        console.error('Failed to parse user session', err);
      }
    }
  }, [token]);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('td_token');
    localStorage.removeItem('td_user');
    setToken(null);
    setUser(null);
  };

  const handleOnboardingComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // If not authenticated, render Login/Register
  if (!token) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  // Breadcrumbs title helper
  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'products': return 'User Directory';
      case 'support': return 'Support Nodes';
      case 'settings': return 'System Settings';
      default: return 'Workspace';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* Sidebar (Left Navigation Panel) */}
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <div style={{
        flex: 1,
        marginLeft: isSidebarCollapsed ? '76px' : '260px',
        transition: 'margin-left var(--transition-smooth)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0 // Prevents flex child overflowing
      }}>
        
        {/* Top Navigation Bar */}
        <header style={{
          height: '72px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 90
        }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>ThinkDifferent</span>
            <span style={{ color: 'var(--text-tertiary)' }}>/</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getBreadcrumbTitle()}</span>
          </div>

          {/* Center search bar lookalike */}
          <button 
            onClick={() => setIsCommandPaletteOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '320px',
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              transition: 'border-color var(--transition-fast)'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--text-primary)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} />
              <span>Search commands...</span>
            </div>
            <kbd style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '1px 5px',
              backgroundColor: 'var(--bg-primary)'
            }}>
              Ctrl+K
            </kbd>
          </button>

          {/* Right Area Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#000000' }}></div>
              <span>Atlas Active</span>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main style={{ flex: 1, padding: '40px 32px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {currentView === 'dashboard' && (
            <DashboardView 
              onViewChange={setCurrentView}
              token={token}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentView === 'products' && (
            <WorkspaceView 
              token={token}
              onOpenOnboarding={() => setIsOnboardingDrawerOpen(true)}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView 
              token={token}
              user={user}
            />
          )}

          {/* Support Node View Placeholder */}
          {currentView === 'support' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h1 style={{ fontSize: '28px' }}>Support Center</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Connect directly with ThinkDifferent Hub cluster operators.</p>
              <div style={{
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-secondary)',
                fontFamily: 'var(--font-mono)'
              }}>
                <div>[support-node] Connection tunnel operational</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '12px' }}>
                  Please email developers@thinkdifferent.com for sandbox custom configurations.
                </div>
              </div>
            </div>
          )}


        </main>
      </div>

      {/* Global Modals / Drawers overlays */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onViewChange={setCurrentView}
        onOpenOnboarding={() => setIsOnboardingDrawerOpen(true)}
        token={token}
      />

      <OnboardingDrawer 
        isOpen={isOnboardingDrawerOpen}
        onClose={() => setIsOnboardingDrawerOpen(false)}
        token={token}
        onOnboardingComplete={handleOnboardingComplete}
      />

    </div>
  );
}
