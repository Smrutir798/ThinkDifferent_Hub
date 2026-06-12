
import { 
  LayoutDashboard, 
  Users, 
  HelpCircle, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  user: { name: string; email: string; role: string } | null;
  onLogout: () => void;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  isCollapsed, 
  setIsCollapsed,
  user,
  onLogout
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', name: 'Users', icon: Users },
    { id: 'support', name: 'Support', icon: HelpCircle },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: isCollapsed ? '76px' : '260px',
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      transition: 'width var(--transition-smooth)'
    }}>
      
      {/* Brand Header */}
      <div style={{
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        padding: isCollapsed ? '0' : '0 24px',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            fontSize: '16px',
            flexShrink: 0
          }}>
            T
          </div>
          {!isCollapsed && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '16px',
              letterSpacing: '-0.03em',
              whiteSpace: 'nowrap'
            }}>
              ThinkDifferent
            </span>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{
        flex: 1,
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto'
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={isCollapsed ? item.name : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '12px',
                padding: '12px',
                width: '100%',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: isActive ? 'var(--text-primary)' : 'transparent',
                color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color var(--transition-fast), color var(--transition-fast)'
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!isCollapsed && (
                <span style={{
                  fontSize: '14px',
                  fontWeight: isActive ? 500 : 400
                }}>
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session and Action Area */}
      <div style={{
        borderTop: '1px solid var(--border-color)',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Toggle Collapse */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '10px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color var(--transition-fast)'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* User Card */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: '10px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-secondary)',
            overflow: 'hidden'
          }}>
            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.name}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase'
                }}>
                  {user.role}
                </span>
              </div>
            )}

            <button
              onClick={onLogout}
              title="Log Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color var(--transition-fast)'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
