import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, Plus, Settings, Store, Laptop } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ComponentType<any>;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onViewChange: (view: string) => void;
  onOpenOnboarding: () => void;
  token: string | null;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onViewChange,
  onOpenOnboarding,
  token
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch users for search index
  useEffect(() => {
    if (isOpen && token) {
      fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(err => console.error('Failed to load search index', err));
    }
  }, [isOpen, token]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static commands list
  const staticCommands: CommandItem[] = [
    {
      id: 'go_dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View global operational metrics & grids',
      category: 'Navigation',
      icon: Compass,
      action: () => { onViewChange('dashboard'); onClose(); }
    },
    {
      id: 'go_ahhar',
      title: 'Open Ahhar.AI Workspace',
      subtitle: 'Manage restaurant nodes & configuration',
      category: 'Navigation',
      icon: Store,
      action: () => { onViewChange('products'); onClose(); }
    },
    {
      id: 'go_settings',
      title: 'Open Settings',
      subtitle: 'Manage platform & configuration',
      category: 'Navigation',
      icon: Settings,
      action: () => { onViewChange('settings'); onClose(); }
    },
    {
      id: 'action_create_customer',
      title: 'Register New User Profile',
      subtitle: 'Launch the sliding onboarding wizard',
      category: 'Actions',
      icon: Plus,
      action: () => { onOpenOnboarding(); onClose(); }
    }
  ];

  // Filter command list based on search query
  const getFilteredItems = (): CommandItem[] => {
    const q = search.toLowerCase();
    
    // Add dynamic user searches
    const dynamicCommands: CommandItem[] = users.map(u => ({
      id: `user_${u._id}`,
      title: `View User: ${u.name}`,
      subtitle: `${u.email} • Role: ${u.role}`,
      category: 'Users',
      icon: Laptop,
      action: () => {
        onViewChange('products'); // Jump to Ahhar workspace
        onClose();
        // Trigger select event
        window.dispatchEvent(new CustomEvent('select-restaurant', { detail: u.name }));
      }
    }));

    const all = [...staticCommands, ...dynamicCommands];
    
    if (!q) return all;
    return all.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  };

  const filteredItems = getFilteredItems();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  // Adjust scroll when navigating
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        const listHeight = listRef.current.clientHeight;
        const elemTop = activeElement.offsetTop;
        const elemHeight = activeElement.clientHeight;
        
        if (elemTop + elemHeight > listRef.current.scrollTop + listHeight) {
          listRef.current.scrollTop = elemTop + elemHeight - listHeight;
        } else if (elemTop < listRef.current.scrollTop) {
          listRef.current.scrollTop = elemTop;
        }
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group items by category
  const categories: { [key: string]: CommandItem[] } = {};
  filteredItems.forEach(item => {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  });


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
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '80px 24px 24px',
      zIndex: 1000,
    }} onClick={onClose}>
      
      <div style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-premium)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '450px',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()} className="animate-scale-up">
        
        {/* Search input header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <Search size={20} style={{ color: 'var(--text-secondary)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search database users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontFamily: 'var(--font-sans)',
              background: 'transparent'
            }}
          />
          <div style={{
            padding: '2px 6px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}>
            ESC
          </div>
        </div>

        {/* Command Items List */}
        <div 
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px'
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontFamily: 'var(--font-mono)'
            }}>
              No results found for "{search}"
            </div>
          ) : (
            Object.keys(categories).map((category) => (
              <div key={category}>
                {/* Category Heading */}
                <div style={{
                  padding: '8px 12px 4px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)'
                }}>
                  {category}
                </div>

                {/* Category Items */}
                {categories[category].map((item) => {
                  const Icon = item.icon;
                  const currentFlatIndex = filteredItems.findIndex(i => i.id === item.id);
                  const isSelected = currentFlatIndex === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--text-primary)' : 'transparent',
                        color: isSelected ? 'var(--bg-primary)' : 'var(--text-primary)',
                        transition: 'background-color var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Icon size={18} style={{ opacity: 0.8 }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>
                            {item.title}
                          </span>
                          <span style={{ 
                            fontSize: '11px', 
                            color: isSelected ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-secondary)' 
                          }}>
                            {item.subtitle}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '4px',
                          padding: '2px 6px'
                        }}>
                          ↵ Enter
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
