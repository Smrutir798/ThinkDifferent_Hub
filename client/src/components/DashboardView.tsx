import { useState, useEffect } from 'react';
import { Laptop, Activity, Users } from 'lucide-react';

interface DashboardViewProps {
  onViewChange: (view: string) => void;
  token: string | null;
  refreshTrigger: number;
}

export default function DashboardView({ onViewChange, token, refreshTrigger }: DashboardViewProps) {
  const [metrics, setMetrics] = useState<any>({
    mrr: 0,
    totalMerchants: 0,
    activeNodes: 0,
    growth: 0,
    totalOrders: 0,
    monthlyData: []
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [chartMetric, setChartMetric] = useState<'revenue' | 'subscriptions'>('revenue');

  // Real-time telemetry wave state (animated)
  const [telemetry, setTelemetry] = useState<number[]>([35, 45, 30, 55, 40, 65, 50, 75, 60, 80, 65, 90]);
  const [currentLoad, setCurrentLoad] = useState(82);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const nextVal = Math.max(15, Math.min(95, prev[prev.length - 1] + (Math.random() * 20 - 10)));
        setCurrentLoad(Math.round(nextVal));
        return [...prev.slice(1), nextVal];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!token) return;

    // Fetch metrics
    const fetchMetrics = fetch('/api/metrics', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json());

    // Fetch activities
    const fetchActivities = fetch('/api/metrics/activities', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json());

    // Fetch members count
    const fetchMembers = fetch('/api/members', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json());

    Promise.all([fetchMetrics, fetchActivities, fetchMembers])
      .then(([metricsData, activitiesData, membersData]) => {
        if (metricsData && !metricsData.error) {
          setMetrics(metricsData);
        }
        if (Array.isArray(activitiesData)) {
          setActivities(activitiesData);
        }
        if (Array.isArray(membersData)) {
          setMembersCount(membersData.length);
        }
      })
      .catch(err => console.error('Error fetching dashboard data:', err))

  }, [token, refreshTrigger]);



  const generateTelemetryPath = () => {
    const width = 450;
    const height = 120;
    const dx = width / (telemetry.length - 1);
    return telemetry.reduce((path, val, idx) => {
      const x = idx * dx;
      const y = height - (val / 100) * height;
      return path + `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  const generateTelemetryFillPath = () => {
    const width = 450;
    const height = 120;
    const linePath = generateTelemetryPath();
    if (!linePath) return '';
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  };

  const renderMonthlyChart = () => {
    const data = metrics.monthlyData || [];
    if (data.length === 0) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>No telemetry available.</div>;

    const width = 450;
    const height = 120;
    const paddingLeft = 40;
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 20;

    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...data.map((m: any) => m[chartMetric === 'revenue' ? 'revenue' : 'subscriptions']), 1);
    const stepX = graphWidth / (data.length - 1);

    let linePath = '';
    data.forEach((m: any, idx: number) => {
      const x = paddingLeft + idx * stepX;
      const val = m[chartMetric === 'revenue' ? 'revenue' : 'subscriptions'];
      const y = paddingTop + graphHeight - (val / maxVal) * graphHeight;
      linePath += `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    const fillPath = linePath ? `${linePath} L ${paddingLeft + (data.length - 1) * stepX} ${paddingTop + graphHeight} L ${paddingLeft} ${paddingTop + graphHeight} Z` : '';

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="progressionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + graphHeight} stroke="var(--border-color)" strokeWidth="1" />
        
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = paddingTop + graphHeight * ratio;
          const labelVal = Math.round(maxVal * (1 - ratio));
          const labelStr = chartMetric === 'revenue' ? `$${labelVal}` : `${labelVal}`;
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }}>
                {labelStr}
              </text>
            </g>
          );
        })}

        {fillPath && <path d={fillPath} fill="url(#progressionGrad)" />}
        {linePath && <path d={linePath} fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

        {data.map((m: any, idx: number) => {
          const x = paddingLeft + idx * stepX;
          const val = m[chartMetric === 'revenue' ? 'revenue' : 'subscriptions'];
          const y = paddingTop + graphHeight - (val / maxVal) * graphHeight;
          return (
            <g key={idx}>
              <circle cx={x} cy={y} r="4" fill="#ffffff" stroke="#000000" strokeWidth="2" />
              <text x={x} y={y - 8} textAnchor="middle" style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fill: 'var(--text-primary)' }}>
                {chartMetric === 'revenue' ? `$${(val / 1000).toFixed(1)}k` : val}
              </text>
              <text x={x} y={height - 2} textAnchor="middle" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }}>
                {m.month}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }} className="animate-fade">

      {/* Hero Header */}
      <div>
        <h1 style={{ fontSize: '36px', marginBottom: '8px', fontWeight: 700 }}>
          ThinkDifferent  iHub
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', fontWeight: 400, maxWidth: '640px' }}>
          Manage products, customers, from one workspace.
        </p>
      </div>



      {/* Operational Directory Section */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          Operational Directory
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {/* Card: Ahhar.AI */}
          <div
            className="card-lift"
            onClick={() => onViewChange('products')}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  border: '1px solid var(--text-primary)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <Users size={22} />
                </div>
                <span className="badge badge-active">Active</span>
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Ahhar.AI</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
                Administrative console directory designed to manage authorization credentials, role privileges, and sandbox replica namespaces.
              </p>
            </div>
            <div style={{
              display: 'flex',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
              marginTop: '12px',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)'
            }}>
              <span>{metrics.totalMerchants} Active Users</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Manage Directory →</span>
            </div>
          </div>

          {/* Card: ThinkDifferent Hub */}
          <div
            className="card-lift"
            onClick={() => {
              onViewChange('products');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('select-workspace-tab', { detail: 'hub' }));
              }, 50);
            }}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  border: '1px solid var(--text-primary)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <Laptop size={22} />
                </div>
                <span className="badge badge-active">Active</span>
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>ThinkDifferent Hub</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
                Developer console orchestration panel connecting MongoDB Atlas subnets, compiling microservice scripts, and visualizing server telemetry.
              </p>
            </div>
            <div style={{
              display: 'flex',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
              marginTop: '12px',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)'
            }}>
              <span>{membersCount} Hub Members</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Manage Members →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry and Analytics Graphs */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          System Telemetry & Financial Progression
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px'
        }}>
          {/* Card: Financial Progression */}
          <div style={{ padding: '24px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Monthly Business Growth</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>Aggregated SaaS MRR and Active Subscriptions</p>
              </div>
              <div style={{ display: 'flex', gap: '4px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '2px', backgroundColor: 'var(--bg-secondary)' }}>
                <button
                  onClick={() => setChartMetric('revenue')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: 'none',
                    background: chartMetric === 'revenue' ? 'var(--text-primary)' : 'none',
                    color: chartMetric === 'revenue' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: chartMetric === 'revenue' ? 'bold' : 'normal'
                  }}
                >
                  MRR
                </button>
                <button
                  onClick={() => setChartMetric('subscriptions')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: 'none',
                    background: chartMetric === 'subscriptions' ? 'var(--text-primary)' : 'none',
                    color: chartMetric === 'subscriptions' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: chartMetric === 'subscriptions' ? 'bold' : 'normal'
                  }}
                >
                  Nodes
                </button>
              </div>
            </div>
            <div style={{ height: '140px', width: '100%', marginTop: '10px' }}>
              {renderMonthlyChart()}
            </div>
          </div>

          {/* Card: Active Telemetry Wave */}
          <div style={{ padding: '24px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Active Subnet Load</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>Real-time telemetry and cluster query throughput</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{currentLoad}%</div>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>CPU LOAD</div>
                </div>
                <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#000000' }}>{(currentLoad * 1.3 + 45).toFixed(0)} QPS</div>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Queries</div>
                </div>
              </div>
            </div>
            
            <div style={{ height: '140px', width: '100%', marginTop: '10px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 450 120" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="telemetryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000000" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal guidelines */}
                {[20, 60, 100].map((yVal, idx) => (
                  <line key={idx} x1="0" y1={yVal} x2="450" y2={yVal} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
                ))}

                {/* Area Gradient Fill */}
                <path d={generateTelemetryFillPath()} fill="url(#telemetryGrad)" style={{ transition: 'd 0.5s ease-in-out' }} />

                {/* Wave Line */}
                <path d={generateTelemetryPath()} fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'd 0.5s ease-in-out' }} />
                
                {/* Active pulsating beacon at the last point */}
                {telemetry.length > 0 && (
                  <circle
                    cx="450"
                    cy={120 - (telemetry[telemetry.length - 1] / 100) * 120}
                    r="4"
                    fill="#000000"
                    className="animate-fade"
                    style={{ animationDuration: '0.8s', animationIterationCount: 'infinite' }}
                  />
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Console */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <h2 style={{ fontSize: '20px' }}>Real-time Operational Logs</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            <Activity size={12} className="animate-fade" style={{ animationDuration: '1s', animationIterationCount: 'infinite' }} />
            <span>Cluster Streaming Live</span>
          </div>
        </div>
        <div className="terminal-console" style={{ height: '220px' }}>
          {activities.length === 0 ? (
            <div>[system] Waiting for events...<span className="terminal-cursor"></span></div>
          ) : (
            activities.map((act, idx) => (
              <div key={act._id || idx} style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>[{new Date(act.createdAt).toLocaleTimeString()}]</span>{' '}
                <span style={{ color: act.type === 'onboard' ? '#ffffff' : '#a3a3a3' }}>
                  {act.type === 'onboard' ? '▶ [onboard]' : '⚙ [system]'} {act.text}
                </span>
              </div>
            ))
          )}
          <div>[cluster-sandbox] idle<span className="terminal-cursor"></span></div>
        </div>
      </div>
    </div>
  );
}
