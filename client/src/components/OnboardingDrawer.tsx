import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Server, Play, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onOnboardingComplete: () => void;
}

export default function OnboardingDrawer({
  isOpen,
  onClose,
  token,
  onOnboardingComplete
}: OnboardingDrawerProps) {
  const [step, setStep] = useState(1);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [product, setProduct] = useState('');
  const [provisionSandbox, setProvisionSandbox] = useState(true);

  // Terminal Simulator State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [compiling, setCompiling] = useState(false);
  const [compileComplete, setCompileComplete] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Run terminal logs sequence when step 4 is loaded
  useEffect(() => {
    if (step === 4 && !compiling && !compileComplete) {
      runSimulation();
    }
  }, [step]);

  // Scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const runSimulation = () => {
    setCompiling(true);
    setTerminalLogs([]);
    
    const logs = [
      `[sys] Compiling security context for user registration...`,
      `[sys] Allocating administrative credentials token...`,
      `[crypt] Initializing Blowfish bcrypt encryption node...`,
      `[crypt] Hashing password with work-factor salt level 10...`,
      `[crypt] Hash compilation SUCCESS: dynamic signature verified.`,
      `[db] Handshaking with MongoDB Atlas cluster...`,
      `[db] Inserting document into collection: 'users'...`,
      `[net] Mapping cluster role definitions to: role='${role}'...`,
      `[net] Directing tenant authorization routing: ALLOW.`,
      `[sys] Sandbox user provisioning workflow completed.`,
      `[sys] User account is now ACTIVE in replica set.`
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setTerminalLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setCompiling(false);
        setCompileComplete(true);
      }
    }, 400);
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    if (!token) return;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          product: product || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register database user');
      }

      // Refresh parents
      onOnboardingComplete();
      
      // Reset states
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('admin');
      setProduct('');
      setStep(1);
      setCompileComplete(false);
      onClose();
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      alert(err.message || 'Failed to register user. Please try again.');
    }
  };

  if (!isOpen) return null;

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
            <h2 style={{ fontSize: '20px' }}>Register Database User</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
              Create and configure credentials directly in MongoDB
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div style={{
          padding: '20px 24px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 'bold',
                  backgroundColor: step > i ? 'var(--text-primary)' : step === i ? 'var(--text-primary)' : 'transparent',
                  color: step > i ? 'var(--bg-primary)' : step === i ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  transition: 'background-color 0.2s, color 0.2s'
                }}>
                  {step > i ? <Check size={14} /> : i}
                </div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: step === i ? 600 : 400,
                  color: step === i ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                  {i === 1 ? 'Profile' : i === 2 ? 'Security' : i === 3 ? 'Access' : 'Launch'}
                </span>
              </div>
              {i < 4 && <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>}
            </React.Fragment>
          ))}
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Step 1: User Profile</h3>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Steve Jobs"
                  className="input-premium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. steve@apple.com"
                  className="input-premium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2: Security Credentials */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Step 2: Password Setup</h3>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Password *
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
                  Confirm Password *
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
            </div>
          )}

          {/* STEP 3: Setup Configuration */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Step 3: Role & Privilege Level</h3>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Database Role Level
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

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '10px',
                padding: '16px',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                <input
                  type="checkbox"
                  id="sandbox"
                  checked={provisionSandbox}
                  onChange={(e) => setProvisionSandbox(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#000000', cursor: 'pointer' }}
                />
                <label htmlFor="sandbox" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Automatically map cluster developer namespaces
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: Simulated build */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} />
                <h3 style={{ fontSize: '16px' }}>Step 4: Encrypting and Provisioning</h3>
              </div>

              <div className="terminal-console" style={{ height: '260px' }}>
                {terminalLogs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '6px' }}>{log}</div>
                ))}
                {compiling && (
                  <div>
                    [sys] hashing passwords...
                    <span className="terminal-cursor"></span>
                  </div>
                )}
                {!compiling && compileComplete && (
                  <div style={{ color: '#ffffff', fontWeight: 'bold', marginTop: '10px' }}>
                    ✔ ACCOUNT REGISTRATION COMPLETED successfully. Node live.
                  </div>
                )}
              </div>

              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)'
              }}>
                Once you click "Deploy Tenant", the user will commit to your MongoDB 'users' table, and immediately render in the database directory.
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          {step > 1 && step < 4 && (
            <button className="btn-secondary" onClick={handlePrev}>
              <ArrowLeft size={16} />
              Back
            </button>
          )}
          
          <div style={{ marginLeft: 'auto' }}>
            {step < 4 ? (
              <button
                className="btn-primary"
                onClick={handleNext}
                disabled={(!name || !email) && step === 1}
                style={{ opacity: ((!name || !email) && step === 1) ? 0.5 : 1 }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={handleFinish}
                disabled={compiling || !compileComplete}
                style={{
                  opacity: (compiling || !compileComplete) ? 0.5 : 1,
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Play size={16} />
                Register User Profile
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
