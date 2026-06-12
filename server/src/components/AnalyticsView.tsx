import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Users } from 'lucide-react';

interface MonthlyPoint {
  month: string;
  revenue: number;
  subscriptions: number;
  growth: number;
}

interface AnalyticsViewProps {
  token: string | null;
  refreshTrigger: number;
}

export default function AnalyticsView({ token, refreshTrigger }: AnalyticsViewProps) {
  const [data, setData] = useState<MonthlyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch metrics data containing progression points
  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    fetch('/api/metrics', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(stats => {
      if (stats && stats.monthlyData) {
        setData(stats.monthlyData);
      }
    })
    .catch(err => console.error('Failed to load analytics data', err))
    .finally(() => setLoading(false));
  }, [token, refreshTrigger]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  // SVG parameters
  const width = 680;
  const height = 280;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max values for scaling
  const maxRevenue = data.length > 0 ? Math.max(...data.map(d => d.revenue), 5000) : 5000;
  const maxSubscriptions = data.length > 0 ? Math.max(...data.map(d => d.subscriptions), 5) : 5;

  // Generate coordinates for Revenue (Area chart)
  const getRevenuePoints = () => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.revenue / maxRevenue) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
  };

  const getRevenueAreaPoints = () => {
    const linePoints = getRevenuePoints();
    if (!linePoints) return '';
    const startX = paddingLeft;
    const endX = paddingLeft + chartWidth;
    const bottomY = paddingTop + chartHeight;
    return `${startX},${bottomY} ${linePoints} ${endX},${bottomY}`;
  };

  // Generate coordinates for Subscriptions (Line chart)
  const getSubscriptionPoints = () => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.subscriptions / maxSubscriptions) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
  };

  // Mouse move handler for interactive crosshairs
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Calculate nearest data point index based on client coordinates
    const chartX = mouseX - paddingLeft;
    const stepWidth = chartWidth / (data.length - 1);
    let index = Math.round(chartX / stepWidth);
    
    if (index < 0) index = 0;
    if (index >= data.length) index = data.length - 1;

    setHoveredIndex(index);
    
    // Position of hover crosshair intersection
    const pointX = paddingLeft + index * stepWidth;
    const pointY = paddingTop + chartHeight - (data[index].revenue / maxRevenue) * chartHeight;
    setHoverPos({ x: pointX, y: pointY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Sum calculations
  const totalSubscriptions = data.length > 0 ? data[data.length - 1].subscriptions : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade">
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Analytics & Telemetry</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Historical charts tracing sub-product monthly recurring revenues and active node cluster licenses.
        </p>
      </div>

      {/* Overview Metric Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase' }}>Acquired MRR Total</span>
            <TrendingUp size={16} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {loading ? '---' : formatCurrency(data.length > 0 ? data[data.length - 1].revenue : 0)}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Current recurring monthly capacity
          </p>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Licenses</span>
            <Users size={16} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {loading ? '---' : `${totalSubscriptions} Active`}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Active sandbox tenants online
          </p>
        </div>
      </div>

      {/* Custom Interactive SVG Graph */}
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        backgroundColor: 'var(--bg-primary)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px' }}>Monthly Revenue Progression</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Black area line = Revenue (USD) • Dotted line = Subscriptions count
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#e5e5e5', border: '1px solid #000' }}></span>
            <span>MRR</span>
            <span style={{ display: 'inline-block', width: '10px', height: '2px', borderTop: '2px dotted #000' }}></span>
            <span>Licenses</span>
          </div>
        </div>

        {loading ? (
          <div style={{
            height: `${height}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            Reading telemetry historical records...
          </div>
        ) : data.length === 0 ? (
          <div style={{
            height: `${height}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            No progression data available in the current database.
          </div>
        ) : (
          <div style={{ position: 'relative', overflowX: 'auto' }}>
            <svg
              ref={svgRef}
              width="100%"
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
            >
              {/* Y Axis Gridlines & Labels (Revenue) */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingTop + chartHeight - ratio * chartHeight;
                const value = Math.round(ratio * maxRevenue);
                return (
                  <g key={idx}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft + chartWidth}
                      y2={y}
                      stroke="var(--border-color)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fill="var(--text-secondary)"
                    >
                      {formatCurrency(value).replace('.00', '')}
                    </text>
                  </g>
                );
              })}

              {/* Area Chart: Revenue (Background fill) */}
              <polygon
                points={getRevenueAreaPoints()}
                fill="rgba(0, 0, 0, 0.04)"
              />

              {/* Area Line Chart: Revenue */}
              <polyline
                points={getRevenuePoints()}
                fill="none"
                stroke="#000000"
                strokeWidth="2"
              />

              {/* Dotted Line Chart: Subscriptions */}
              <polyline
                points={getSubscriptionPoints()}
                fill="none"
                stroke="#666666"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* X Axis Labels */}
              {data.map((d, i) => {
                const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
                return (
                  <text
                    key={i}
                    x={x}
                    y={paddingTop + chartHeight + 20}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    fill="var(--text-primary)"
                  >
                    {d.month}
                  </text>
                );
              })}

              {/* Interactive Crosshair & Hover details */}
              {hoveredIndex !== null && (
                <g>
                  {/* Vertical line crosshair */}
                  <line
                    x1={hoverPos.x}
                    y1={paddingTop}
                    x2={hoverPos.x}
                    y2={paddingTop + chartHeight}
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  {/* Circle handle on Area chart */}
                  <circle
                    cx={hoverPos.x}
                    cy={hoverPos.y}
                    r="5"
                    fill="#000000"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Circle handle on Line chart */}
                  <circle
                    cx={hoverPos.x}
                    cy={paddingTop + chartHeight - (data[hoveredIndex].subscriptions / maxSubscriptions) * chartHeight}
                    r="4"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </svg>

            {/* Hover Floating Tooltip Modal */}
            {hoveredIndex !== null && (
              <div style={{
                position: 'absolute',
                left: `${hoverPos.x + 10}px`,
                top: `${hoverPos.y - 80}px`,
                backgroundColor: '#000000',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                pointerEvents: 'none',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '4px', fontWeight: 'bold' }}>
                  {data[hoveredIndex].month} Telemetry
                </div>
                <div>MRR: {formatCurrency(data[hoveredIndex].revenue)}</div>
                <div>Licenses: {data[hoveredIndex].subscriptions} Active</div>
                <div>Est. Growth: +{data[hoveredIndex].growth}%</div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
