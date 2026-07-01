import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../services/toast';

export default function AdminDashboard({ user, onLogout }) {
  const [activePane, setActivePane] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [analytics, setAnalytics] = useState({ totalUsers: 0, totalListings: 0, totalDeals: 0, totalReports: 0 });
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [reportedListings, setReportedListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Users pane state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userCampusFilter, setUserCampusFilter] = useState('');
  const [userSort, setUserSort] = useState({ field: 'created_at', dir: 'desc' });
  const [userPage, setUserPage] = useState(1);
  const [perPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [detailUser, setDetailUser] = useState(null);

  // Settings pane state
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [univCode, setUnivCode] = useState('');
  const [univName, setUnivName] = useState('');
  const [campusUnivCode, setCampusUnivCode] = useState('');
  const [campusName, setCampusName] = useState('');
  const [catName, setCatName] = useState('');

  useEffect(() => { loadPane('dashboard'); }, []);

  const loadPane = async (pane) => {
    setActivePane(pane);
    setLoading(true);
    try {
      if (pane === 'dashboard') {
        const [statsRes, dealsRes] = await Promise.all([
          api.get('/admin/reports').catch(() => ({ data: {} })),
          api.get('/admin/deals').catch(() => ({ data: {} })),
        ]);
        setAnalytics(statsRes.data?.analytics || {});
        setDeals(dealsRes.data?.deals || []);
      } else if (pane === 'users') {
        const res = await api.get('/admin/users').catch(() => ({ data: {} }));
        setUsers(res.data?.users || []);
      } else if (pane === 'listings') {
        const res = await api.get('/admin/moderation').catch(() => ({ data: {} }));
        setReportedListings(res.data?.reportedProducts || []);
      } else if (pane === 'reports') {
        const res = await api.get('/admin/all-reports').catch(() => ({ data: {} }));
        setReports(res.data?.reports || []);
      } else if (pane === 'settings') {
        const [univRes, campRes, catRes] = await Promise.all([
          api.get('/auth/universities').catch(() => ({ data: {} })),
          api.get('/auth/campuses').catch(() => ({ data: {} })),
          api.get('/categories').catch(() => ({ data: {} })),
        ]);
        setUniversities(univRes.data?.universities || []);
        setCampuses(campRes.data?.campuses || []);
        setCategories(catRes.data?.categories || []);
      }
    } catch (e) {
      Toast.show('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sideItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'users',     icon: '👥', label: 'Users' },
    { id: 'listings',  icon: '🏪', label: 'Moderation' },
    { id: 'reports',   icon: '⚠️', label: 'Reports' },
    { id: 'settings',  icon: '⚙️', label: 'Settings' },
  ];

  const titleMap = {
    dashboard: 'Platform Insights',
    users: 'User Directory',
    listings: 'Moderation Queue',
    reports: 'Community Alerts',
    settings: 'Settings & Locations',
  };

  const handleSort = (field) => {
    setUserSort(s => ({
      field,
      dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  };

  const quickStatus = async (userId, status) => {
    try {
      await api.post(`/admin/users/${userId}/status`, { status });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
      if (detailUser && detailUser.id === userId) {
        setDetailUser(prev => ({ ...prev, status }));
      }
      Toast.show(`Account marked as ${status}`, 'success');
    } catch {
      Toast.show('Failed to update status', 'error');
    }
  };

  const resetPw = async (u) => {
    const pw = prompt(`Reset password for ${u.name} (min 8 chars):`);
    if (!pw || pw.length < 8) return;
    try {
      await api.post(`/admin/users/${u.id}/reset-password`, { newPassword: pw });
      Toast.show('Password reset successfully!', 'success');
    } catch {
      Toast.show('Failed to reset password', 'error');
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name}?`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      Toast.show('User deleted', 'success');
    } catch {
      Toast.show('Failed to delete user', 'error');
    }
  };

  const exportCSV = () => {
    const rows = [
      ['ID','Name','Email','WhatsApp','Role','Status','Campus','Deals','Joined'],
      ...users.map(u => [
        u.id, 
        u.name, 
        u.email, 
        u.whatsapp_number||'', 
        u.role, 
        u.status, 
        u.campus||'', 
        u.deals_completed||0, 
        u.created_at ? new Date(u.created_at).toLocaleDateString('en-NG') : ''
      ])
    ].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    
    const a = Object.assign(document.createElement('a'), { 
      href: URL.createObjectURL(new Blob([rows], { type: 'text/csv' })), 
      download: `users_export_${Date.now()}.csv` 
    });
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a);
    Toast.show(`Exported ${users.length} users successfully`, 'success');
  };

  return (
    <section className="view-container active" style={{ padding: 0, height: '100%' }}>
      <div style={{ display: 'flex', height: '100%', minHeight: '80vh' }}>

        {/* ── SIDEBAR (PREMIUM GRAPHITE / LIGHT) ── */}
        <aside style={{
          width: isCollapsed ? '64px' : '230px', 
          flexShrink: 0,
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', 
          flexDirection: 'column',
          padding: '16px 0',
          transition: 'width var(--transition-normal) ease',
          overflowX: 'hidden'
        }}>
          {/* Sidebar Header */}
          <div style={{ 
            padding: isCollapsed ? '0 12px 20px' : '0 20px 20px', 
            borderBottom: '1px solid var(--border)', 
            marginBottom: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isCollapsed ? 'center' : 'space-between' 
          }}>
            {!isCollapsed && (
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛡️</span> Scholar<span style={{ color: 'var(--primary-orange)' }}>Admin</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                  {user?.email}
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
              style={{
                background: 'var(--surface-hover)', 
                border: '1px solid var(--border)', 
                borderRadius: '10px',
                width: '32px', 
                height: '32px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-primary)'
              }}
            >
              {isCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 8px' }}>
            {sideItems.map(item => (
              <button
                key={item.id}
                onClick={() => loadPane(item.id)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isCollapsed ? '0' : '12px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: '12px', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '14px', 
                  fontWeight: 700, 
                  width: '100%',
                  borderRadius: '12px',
                  backgroundColor: activePane === item.id ? 'var(--primary-green-light)' : 'transparent',
                  color: activePane === item.id ? 'var(--primary-green)' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Sign Out Button at Bottom */}
          <div style={{ marginTop: 'auto', padding: '0 8px' }}>
            <button
              onClick={onLogout}
              title={isCollapsed ? "Logout" : undefined}
              style={{
                width: '100%', 
                padding: '12px', 
                border: '1px solid var(--danger-border)',
                backgroundColor: 'var(--danger-light)', 
                color: 'var(--danger)',
                borderRadius: '12px', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '13px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                transition: 'all var(--transition-fast)'
              }}
            >
              <span>🚪</span>
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* ── MAIN WORKSPACE AREA ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px', backgroundColor: 'var(--background)' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                {titleMap[activePane]}
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Manage student records, safety approvals, and campus metrics.
              </p>
            </div>
            <button
              onClick={() => loadPane(activePane)}
              className="btn btn-secondary btn-sm"
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🔄 Refresh Sync
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
              <div className="toast-spinner" style={{ margin: '0 auto 16px', borderTopColor: 'var(--primary-green)' }}></div>
              Synchronizing campus data...
            </div>
          ) : (
            <>
              {/* ── DASHBOARD INSIGHTS PANE ── */}
              {activePane === 'dashboard' && (
                <div>
                  {/* Analytic Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                    {[
                      { label: 'Verified Students', value: analytics.totalUsers    || 0, icon: '👥', color: 'var(--primary-green)', bg: 'var(--primary-green-light)' },
                      { label: 'Active Listings',   value: analytics.totalListings || 0, icon: '🏪', color: 'var(--color-hostels)', bg: 'var(--bg-hostels)' },
                      { label: 'Successful Deals',  value: analytics.totalDeals    || 0, icon: '🤝', color: 'var(--primary-orange)', bg: 'var(--primary-orange-light)' },
                      { label: 'Pending Reports',   value: analytics.totalReports  || 0, icon: '⚠️', color: 'var(--danger)', bg: 'var(--danger-light)' },
                    ].map(stat => (
                      <div 
                        key={stat.label} 
                        className="card" 
                        style={{ 
                          padding: '20px', 
                          borderRadius: '16px', 
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</span>
                          <span style={{ fontSize: '18px', padding: '6px', borderRadius: '10px', backgroundColor: stat.bg }}>{stat.icon}</span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Deals table */}
                  <div className="card" style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>🤝 Recent Campus Transactions</h3>
                    {deals.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px', fontSize: '13px' }}>No transactions recorded yet.</p>
                    ) : (
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Amount</th>
                              <th>Buyer Contact</th>
                              <th>Vendor Contact</th>
                              <th>Deal Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deals.map(deal => (
                              <tr key={deal.id}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img 
                                      src={deal.images?.[0] || '/uploads/products/placeholder.webp'} 
                                      alt="" 
                                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                                    />
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{deal.product_name}</span>
                                  </div>
                                </td>
                                <td style={{ fontWeight: 800, color: 'var(--primary-green)' }}>₦{Number(deal.amount).toLocaleString()}</td>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{deal.buyer?.name || 'Walk-in'}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{deal.buyer?.whatsapp || 'N/A'}</div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{deal.vendor?.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{deal.vendor?.whatsapp || 'N/A'}</div>
                                </td>
                                <td>
                                  <span style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '20px', 
                                    fontSize: '11px', 
                                    fontWeight: 700, 
                                    textTransform: 'uppercase', 
                                    backgroundColor: deal.status === 'completed' ? 'var(--primary-green-light)' : 'var(--primary-orange-light)', 
                                    color: deal.status === 'completed' ? 'var(--primary-green)' : 'var(--primary-orange)' 
                                  }}>
                                    {deal.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── USER DIRECTORY PANE ── */}
              {activePane === 'users' && (() => {
                const filtered = users.filter(u => {
                  const q = userSearch.toLowerCase();
                  if (q && !u.name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
                  if (userRoleFilter && u.role !== userRoleFilter) return false;
                  if (userStatusFilter && u.status !== userStatusFilter) return false;
                  if (userCampusFilter && u.campus !== userCampusFilter) return false;
                  return true;
                }).sort((a, b) => {
                  let av = a[userSort.field] ?? '', bv = b[userSort.field] ?? '';
                  if (typeof av === 'string') av = av.toLowerCase();
                  if (typeof bv === 'string') bv = bv.toLowerCase();
                  return userSort.dir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
                });
                
                const uniqueCampuses = [...new Set(users.map(u => u.campus).filter(Boolean))].sort();
                const total = filtered.length;
                const pages = Math.ceil(total / perPage) || 1;
                const pageUsers = filtered.slice((userPage - 1) * perPage, userPage * perPage);
                const activeCount = users.filter(u => u.status === 'active').length;
                const suspendedCount = users.filter(u => u.status === 'suspended' || u.status === 'banned').length;
                const vendorsCount = users.filter(u => u.role === 'vendor').length;

                const thStyle = (field) => ({
                  cursor: field ? 'pointer' : 'default',
                  userSelect: 'none',
                  whiteSpace: 'nowrap'
                });

                return (
                  <div>
                    {/* Tiny summary metrics row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                      {[
                        { label: 'Directory Total', val: users.length, color: 'var(--text-primary)' },
                        { label: 'Active Students', val: activeCount, color: 'var(--primary-green)' },
                        { label: 'Deactivated / Banned', val: suspendedCount, color: 'var(--danger)' },
                        { label: 'Campus Vendors', val: vendorsCount, color: 'var(--primary-orange)' }
                      ].map(metric => (
                        <div key={metric.label} className="card" style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: 0 }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>{metric.label}</div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: metric.color }}>{metric.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Filter controls row */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <input 
                        value={userSearch} 
                        onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} 
                        placeholder="Search student email, name..." 
                        className="form-input" 
                        style={{ flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '12px', fontSize: '13px' }} 
                      />
                      <select 
                        value={userRoleFilter} 
                        onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }} 
                        className="form-select" 
                        style={{ width: 'auto', padding: '10px 32px 10px 12px', borderRadius: '12px', fontSize: '13px' }}
                      >
                        <option value="">All Account Roles</option>
                        <option value="buyer">Buyers</option>
                        <option value="vendor">Sellers</option>
                        <option value="admin">Administrators</option>
                      </select>
                      <select 
                        value={userStatusFilter} 
                        onChange={e => { setUserStatusFilter(e.target.value); setUserPage(1); }} 
                        className="form-select" 
                        style={{ width: 'auto', padding: '10px 32px 10px 12px', borderRadius: '12px', fontSize: '13px' }}
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                      </select>
                      <select 
                        value={userCampusFilter} 
                        onChange={e => { setUserCampusFilter(e.target.value); setUserPage(1); }} 
                        className="form-select" 
                        style={{ width: 'auto', padding: '10px 32px 10px 12px', borderRadius: '12px', fontSize: '13px' }}
                      >
                        <option value="">All Campuses</option>
                        {uniqueCampuses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button 
                        onClick={exportCSV} 
                        className="btn btn-secondary" 
                        style={{ width: 'auto', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span>📥</span> Export CSV
                      </button>
                    </div>

                    {/* Table View */}
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>
                              <input 
                                type="checkbox" 
                                onChange={e => setSelectedIds(e.target.checked ? new Set(pageUsers.map(u => u.id)) : new Set())} 
                                style={{ cursor: 'pointer' }}
                              />
                            </th>
                            <th onClick={() => handleSort('name')} style={thStyle('name')}>
                              Name {userSort.field === 'name' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => handleSort('email')} style={thStyle('email')}>
                              Email {userSort.field === 'email' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => handleSort('role')} style={thStyle('role')}>
                              Role {userSort.field === 'role' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => handleSort('status')} style={thStyle('status')}>
                              Status {userSort.field === 'status' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => handleSort('campus')} style={thStyle('campus')}>
                              Campus {userSort.field === 'campus' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => handleSort('deals_completed')} style={thStyle('deals_completed')}>
                              Trades {userSort.field === 'deals_completed' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => handleSort('created_at')} style={thStyle('created_at')}>
                              Joined {userSort.field === 'created_at' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageUsers.length === 0 ? (
                            <tr>
                              <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No student accounts match this query.</td>
                            </tr>
                          ) : pageUsers.map(u => {
                            const isSusp = u.status === 'suspended' || u.status === 'banned';
                            const statusColor = isSusp ? 'var(--danger)' : 'var(--primary-green)';
                            return (
                              <tr key={u.id} style={{ backgroundColor: selectedIds.has(u.id) ? 'var(--primary-green-light)' : 'transparent' }}>
                                <td>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedIds.has(u.id)} 
                                    onChange={() => toggleSelect(u.id)} 
                                    style={{ cursor: 'pointer' }}
                                  />
                                </td>
                                <td>
                                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.whatsapp_number || 'No WhatsApp'}</div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                <td>
                                  <span style={{ 
                                    padding: '3px 8px', 
                                    borderRadius: '8px', 
                                    fontSize: '10px', 
                                    fontWeight: 800, 
                                    textTransform: 'uppercase', 
                                    backgroundColor: u.role === 'admin' ? 'var(--primary-orange-light)' : 'var(--primary-green-light)', 
                                    color: u.role === 'admin' ? 'var(--primary-orange)' : 'var(--primary-green)' 
                                  }}>
                                    {u.role}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontWeight: 700, color: statusColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor }}></span> {u.status}
                                  </span>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{u.campus || '—'}</td>
                                <td style={{ fontWeight: 800, color: 'var(--primary-green)' }}>{u.deals_completed || 0}</td>
                                <td style={{ color: 'var(--text-muted)' }}>
                                  {u.created_at ? new Date(u.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'2-digit' }) : '—'}
                                </td>
                                <td>
                                  {u.role !== 'admin' && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <button 
                                        onClick={() => setDetailUser(u)} 
                                        style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid var(--border)', background: 'var(--surface-hover)', cursor: 'pointer', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        title="View Details"
                                      >
                                        👁️
                                      </button>
                                      <button 
                                        onClick={() => quickStatus(u.id, isSusp ? 'active' : 'suspended')} 
                                        style={{ padding: '6px 10px', fontSize: '12px', border: 'none', background: isSusp ? 'var(--primary-green)' : 'var(--danger)', color: '#ffffff', cursor: 'pointer', borderRadius: '8px' }}
                                        title={isSusp ? "Activate Account" : "Deactivate Account"}
                                      >
                                        {isSusp ? '✓' : '🚫'}
                                      </button>
                                      <button 
                                        onClick={() => resetPw(u)} 
                                        style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid var(--border)', background: 'var(--surface-hover)', cursor: 'pointer', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        title="Reset Password"
                                      >
                                        🔑
                                      </button>
                                      <button 
                                        onClick={() => deleteUser(u)} 
                                        style={{ padding: '6px 10px', fontSize: '12px', border: 'none', background: 'var(--danger-light)', color: 'var(--danger)', cursor: 'pointer', borderRadius: '8px' }}
                                        title="Delete Account"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>Showing {Math.min((userPage-1)*perPage+1, total)}–{Math.min(userPage*perPage, total)} of {total} accounts</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          disabled={userPage<=1} 
                          onClick={() => setUserPage(p=>p-1)} 
                          className="btn btn-secondary btn-sm" 
                          style={{ width: 'auto', cursor: userPage<=1?'not-allowed':'pointer', opacity: userPage<=1?0.4:1 }}
                        >
                          ‹ Previous
                        </button>
                        {Array.from({ length: Math.min(pages, 5) }, (_,i) => {
                          const p = Math.max(1, Math.min(pages-4, userPage-2)) + i;
                          return (
                            <button 
                              key={p} 
                              onClick={() => setUserPage(p)} 
                              style={{ 
                                padding: '6px 12px', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border)', 
                                backgroundColor: p === userPage ? 'var(--primary-green)' : 'var(--surface)', 
                                color: p === userPage ? '#ffffff' : 'var(--text-primary)', 
                                cursor: 'pointer', 
                                fontWeight: p === userPage ? 800 : 500 
                              }}
                            >
                              {p}
                            </button>
                          );
                        })}
                        <button 
                          disabled={userPage>=pages} 
                          onClick={() => setUserPage(p=>p+1)} 
                          className="btn btn-secondary btn-sm" 
                          style={{ width: 'auto', cursor: userPage>=pages?'not-allowed':'pointer', opacity: userPage>=pages?0.4:1 }}
                        >
                          Next ›
                        </button>
                      </div>
                    </div>

                    {/* User Detail overlay Drawer */}
                    {detailUser && (
                      <div 
                        onClick={() => setDetailUser(null)} 
                        className="modal-overlay active" 
                        style={{ zIndex: 9999, display: 'flex', alignItems: 'center' }}
                      >
                        <div 
                          onClick={e => e.stopPropagation()} 
                          className="modal-card" 
                          style={{ 
                            maxWidth: '440px', 
                            borderRadius: '24px', 
                            border: '1px solid var(--border)',
                            position: 'relative'
                          }}
                        >
                          {/* Close details */}
                          <button 
                            onClick={() => setDetailUser(null)} 
                            className="modal-close-btn"
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--surface-hover)', border: 'none', cursor: 'pointer' }}
                          >
                            ✕
                          </button>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--primary-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px', color: 'var(--primary-green)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                              {detailUser.portrait ? <img src={detailUser.portrait} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : detailUser.name?.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{detailUser.name}</h3>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{detailUser.email}</p>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '24px' }}>
                            {[
                              ['Account Role', detailUser.role?.toUpperCase()], 
                              ['Status State', detailUser.status], 
                              ['School Code', detailUser.university||'COOU'], 
                              ['Campus Name', detailUser.campus||'—'], 
                              ['WhatsApp Link', detailUser.whatsapp_number||'—'], 
                              ['Trades Done', detailUser.deals_completed||0], 
                              ['Active items', detailUser.active_listings||0], 
                              ['Registered', detailUser.created_at ? new Date(detailUser.created_at).toLocaleDateString('en-NG') : '—']
                            ].map(([l, v]) => (
                              <div key={l} style={{ backgroundColor: 'var(--background)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{l}</div>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{v}</div>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => { const isSusp = detailUser.status==='suspended'||detailUser.status==='banned'; quickStatus(detailUser.id, isSusp?'active':'suspended'); setDetailUser(null); }} 
                              className="btn btn-primary" 
                              style={{ flex: 1, padding: '12px', fontSize: '13px', backgroundColor: (detailUser.status==='suspended'||detailUser.status==='banned')?'var(--primary-green)':'var(--danger)', color: '#ffffff' }}
                            >
                              {(detailUser.status==='suspended'||detailUser.status==='banned') ? '✓ Activate Account' : '🚫 Deactivate Account'}
                            </button>
                            <button 
                              onClick={() => { resetPw(detailUser); setDetailUser(null); }} 
                              className="btn btn-secondary" 
                              style={{ flex: 1, padding: '12px', fontSize: '13px' }}
                            >
                              🔑 Reset PW
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── LISTINGS MODERATION PANE ── */}
              {activePane === 'listings' && (() => {
                const moderateProduct = async (id, action) => {
                  try {
                    await api.post(`/admin/moderation/${id}`, { action });
                    setReportedListings(prev => prev.filter(p => p.id !== id));
                    Toast.show(`Listing ${action === 'approve' ? 'approved & cleared' : 'banned/removed'}`, 'success');
                  } catch {
                    Toast.show('Moderation action failed', 'error');
                  }
                };

                return (
                  <div className="card" style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                      <span>🏪</span> Active Moderation Queue ({reportedListings.length} Flagged)
                    </h3>
                    {reportedListings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                        <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '4px' }}>All Clear!</h4>
                        <p style={{ fontSize: '13px' }}>There are no flagged or reported listings pending moderation.</p>
                      </div>
                    ) : reportedListings.map(p => (
                      <div 
                        key={p.id} 
                        className="card" 
                        style={{ 
                          padding: '18px', 
                          borderRadius: '16px', 
                          border: '1px solid var(--border)', 
                          backgroundColor: 'var(--background)', 
                          marginBottom: '16px' 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>{p.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>#{p.id}</span>
                          </div>
                          <div style={{ fontWeight: 800, color: 'var(--primary-green)', fontSize: '15px' }}>₦{Number(p.price).toLocaleString()}</div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                          <div><strong>Vendor:</strong> {p.vendor?.name} ({p.vendor?.email})</div>
                          <div style={{ marginTop: '4px' }}><strong>Description:</strong> {p.description || 'No description provided'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                          <button 
                            onClick={() => moderateProduct(p.id, 'approve')} 
                            className="btn btn-primary btn-sm" 
                            style={{ width: 'auto', padding: '8px 16px' }}
                          >
                            ✓ Approve Listing
                          </button>
                          <button 
                            onClick={() => moderateProduct(p.id, 'reject')} 
                            className="btn" 
                            style={{ width: 'auto', padding: '8px 16px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)', cursor: 'pointer' }}
                          >
                            🚫 Ban Listing
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ── REPORTS QUEUE PANE ── */}
              {activePane === 'reports' && (
                <div className="card" style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <span>⚠️</span> Community Fraud & Report Logs ({reports.length})
                  </h3>
                  {reports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
                      <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '4px' }}>Zero Alerts</h4>
                      <p style={{ fontSize: '13px' }}>No reports have been filed by the community. Nice workspace environment!</p>
                    </div>
                  ) : reports.map(r => {
                    const targetText = r.reported_product_id
                      ? `Product Listing: ${r.reported_product_name} (ID: #${r.reported_product_id})`
                      : `User Profile: ${r.reported_user_name} (ID: #${r.reported_user_id})`;
                    return (
                      <div 
                        key={r.id || Math.random()} 
                        className="card" 
                        style={{ 
                          padding: '18px', 
                          borderRadius: '16px', 
                          border: '1px solid var(--border)', 
                          borderLeft: '4px solid var(--danger)', 
                          backgroundColor: 'var(--background)', 
                          marginBottom: '16px' 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                          <span><strong>Reporter:</strong> {r.reporter_name} ({r.reporter_email})</span>
                          <span style={{ color: 'var(--text-muted)' }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</span>
                        </div>
                        <div style={{ marginBottom: '8px', fontWeight: 800, color: 'var(--danger)', fontSize: '13px' }}>Target: {targetText}</div>
                        <div style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', lineHeight: '1.4' }}>
                          <strong>Reason:</strong> {r.reason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── SETTINGS & CAMPUSES PANE ── */}
              {activePane === 'settings' && (() => {
                const addUniv = async () => {
                  if (!univCode || !univName) return Toast.show('Code and Name required', 'warning');
                  try {
                    await api.post('/admin/universities', { code: univCode, name: univName });
                    setUniversities(p => [...p, { code: univCode, name: univName }]);
                    setUnivCode(''); setUnivName('');
                    Toast.show('University registered successfully!', 'success');
                  } catch {
                    Toast.show('Failed to add university', 'error');
                  }
                };

                const addCampus = async () => {
                  if (!campusUnivCode || !campusName) return Toast.show('Select University & enter Campus Name', 'warning');
                  try {
                    await api.post('/admin/campuses', { university_code: campusUnivCode, name: campusName });
                    setCampuses(p => [...p, { university_code: campusUnivCode, name: campusName }]);
                    setCampusName('');
                    Toast.show('Campus added successfully!', 'success');
                  } catch {
                    Toast.show('Failed to add campus', 'error');
                  }
                };

                const addCat = async () => {
                  if (!catName) return Toast.show('Category name required', 'warning');
                  try {
                    await api.post('/categories', { name: catName });
                    setCategories(p => [...p, { name: catName, created_at: new Date().toISOString() }]);
                    setCatName('');
                    Toast.show('Category added successfully!', 'success');
                  } catch {
                    Toast.show('Failed to add category', 'error');
                  }
                };

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {/* Add University card */}
                    <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>🏛️ Register University</h3>
                      <div className="form-group">
                        <label className="form-label">University Code</label>
                        <input 
                          value={univCode} 
                          onChange={e => setUnivCode(e.target.value.toUpperCase())} 
                          placeholder="e.g. COOU, UNN" 
                          className="form-input" 
                          style={{ padding: '10px 12px', fontSize: '13px' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label">Full Name</label>
                        <input 
                          value={univName} 
                          onChange={e => setUnivName(e.target.value)} 
                          placeholder="e.g. Chukwuemeka Odumegwu University" 
                          className="form-input" 
                          style={{ padding: '10px 12px', fontSize: '13px' }}
                        />
                      </div>
                      <button onClick={addUniv} className="btn btn-primary" style={{ padding: '12px' }}>+ Save University</button>
                    </div>

                    {/* Add Campus card */}
                    <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>🏫 Add Campus Site</h3>
                      <div className="form-group">
                        <label className="form-label">Select University Code</label>
                        <select 
                          value={campusUnivCode} 
                          onChange={e => setCampusUnivCode(e.target.value)} 
                          className="form-select" 
                          style={{ padding: '10px 32px 10px 12px', fontSize: '13px' }}
                        >
                          <option value="" disabled>Select University</option>
                          {universities.map(u => <option key={u.code} value={u.code}>{u.name} ({u.code})</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label">Campus Name</label>
                        <input 
                          value={campusName} 
                          onChange={e => setCampusName(e.target.value)} 
                          placeholder="e.g. Igbariam Campus" 
                          className="form-input" 
                          style={{ padding: '10px 12px', fontSize: '13px' }}
                        />
                      </div>
                      <button onClick={addCampus} className="btn btn-secondary" style={{ padding: '12px', border: '1px solid var(--primary-green)', color: 'var(--primary-green)' }}>+ Save Campus</button>
                    </div>

                    {/* Add Category card */}
                    <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>🏷️ Add Product Category</h3>
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label">Category Name</label>
                        <input 
                          value={catName} 
                          onChange={e => setCatName(e.target.value)} 
                          placeholder="e.g. Textbooks, Creative" 
                          className="form-input" 
                          style={{ padding: '10px 12px', fontSize: '13px' }}
                        />
                      </div>
                      <button onClick={addCat} className="btn btn-orange" style={{ padding: '12px' }}>+ Save Category</button>
                    </div>

                    {/* Universities list */}
                    <div className="card" style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>📌 Active Institutions & campus sites</h3>
                      {universities.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No universities registered yet.</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                          {universities.map(u => {
                            const uCampuses = campuses.filter(c => c.university_code === u.code);
                            return (
                              <div 
                                key={u.code} 
                                style={{ 
                                  padding: '16px', 
                                  borderRadius: '14px', 
                                  border: '1px solid var(--border)', 
                                  backgroundColor: 'var(--background)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{u.name}</span>
                                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, backgroundColor: 'var(--primary-green-light)', color: 'var(--primary-green)', border: '1px solid var(--primary-green)' }}>
                                    {u.code}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                                  {uCampuses.length === 0 ? (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No campus sites added yet</span>
                                  ) : (
                                    uCampuses.map(c => (
                                      <span 
                                        key={c.name} 
                                        style={{ 
                                          padding: '4px 10px', 
                                          borderRadius: '8px', 
                                          fontSize: '11px', 
                                          backgroundColor: 'var(--surface)', 
                                          border: '1px solid var(--border)', 
                                          color: 'var(--text-primary)',
                                          fontWeight: 600
                                        }}
                                      >
                                        📍 {c.name}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
