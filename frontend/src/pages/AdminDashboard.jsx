import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../services/toast';

export default function AdminDashboard({ user, onLogout }) {
  const [activePane, setActivePane] = useState('dashboard');
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
    dashboard: 'Admin Dashboard',
    users: 'Users Management',
    listings: 'Listing Moderation',
    reports: 'Community Reports',
    settings: 'Settings & Campuses',
  };

  return (
    <section className="view-container active" style={{ padding: 0, height: '100%' }}>
      <div style={{ display: 'flex', height: '100%', minHeight: '80vh' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: '200px', flexShrink: 0,
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          padding: '16px 0'
        }}>
          <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-green)' }}>🛡️ Admin</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{user?.email}</div>
          </div>

          {sideItems.map(item => (
            <button
              key={item.id}
              onClick={() => loadPane(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 20px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 700, textAlign: 'left', width: '100%',
                backgroundColor: activePane === item.id ? 'rgba(16,185,129,0.12)' : 'transparent',
                color: activePane === item.id ? 'var(--primary-green)' : 'var(--text-secondary)',
                borderLeft: activePane === item.id ? '3px solid var(--primary-green)' : '3px solid transparent',
              }}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}

          <div style={{ marginTop: 'auto', padding: '16px' }}>
            <button
              onClick={onLogout}
              style={{
                width: '100%', padding: '10px', border: '1px solid rgba(239,68,68,0.4)',
                backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444',
                borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
              }}
            >
              🚪 Logout
            </button>
          </div>
        </aside>

        {/* ── MAIN AREA ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Mobile title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {titleMap[activePane]}
            </h1>
            <button
              onClick={() => loadPane(activePane)}
              style={{ padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              Loading...
            </div>
          ) : (
            <>
              {/* ── DASHBOARD PANE ── */}
              {activePane === 'dashboard' && (
                <div>
                  {/* Stats Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    {[
                      { label: 'Total Users',    value: analytics.totalUsers    || 0, icon: '👥', color: '#10b981' },
                      { label: 'Active Listings',value: analytics.totalListings || 0, icon: '🏪', color: '#3b82f6' },
                      { label: 'Deals Done',     value: analytics.totalDeals    || 0, icon: '🤝', color: '#f59e0b' },
                      { label: 'Pending Reports',value: analytics.totalReports  || 0, icon: '⚠️', color: '#ef4444' },
                    ].map(stat => (
                      <div key={stat.label} style={{ backgroundColor: 'var(--surface)', padding: '18px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <span>{stat.icon}</span>{stat.label}
                        </div>
                        <div style={{ fontSize: '30px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Deals List */}
                  <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px' }}>🤝 Recent Student Deals</h3>
                    {deals.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px', fontSize: '13px' }}>No student deals placed on campus yet.</p>
                    ) : deals.map(deal => (
                      <div key={deal.id} style={{ padding: '14px', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                          <img src={deal.images?.[0] || '/uploads/products/placeholder.webp'} alt={deal.product_name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '14px' }}>{deal.product_name}</div>
                            <div style={{ color: 'var(--primary-green)', fontWeight: 700 }}>₦{Number(deal.amount).toLocaleString()}</div>
                          </div>
                          <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', backgroundColor: deal.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: deal.status === 'completed' ? 'var(--primary-green)' : '#f59e0b' }}>
                            {deal.status}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <div><strong style={{ color: 'var(--primary-green)' }}>Buyer:</strong> {deal.buyer?.name || 'Walk-in'} · {deal.buyer?.whatsapp || 'N/A'}</div>
                          <div><strong style={{ color: '#f59e0b' }}>Vendor:</strong> {deal.vendor?.name} · {deal.vendor?.whatsapp || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── USERS PANE ── */}
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
                const campuses = [...new Set(users.map(u => u.campus).filter(Boolean))].sort();
                const total = filtered.length;
                const pages = Math.ceil(total / perPage) || 1;
                const pageUsers = filtered.slice((userPage - 1) * perPage, userPage * perPage);
                const active = users.filter(u => u.status === 'active').length;
                const suspended = users.filter(u => u.status === 'suspended' || u.status === 'banned').length;
                const vendors = users.filter(u => u.role === 'vendor').length;

                const handleSort = (field) => setUserSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
                const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

                const quickStatus = async (userId, status) => {
                  try {
                    await api.post(`/admin/users/${userId}/status`, { status });
                    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
                    Toast.show(`Account marked as ${status}`, 'success');
                  } catch { Toast.show('Failed to update status', 'error'); }
                };

                const resetPw = async (u) => {
                  const pw = prompt(`Reset password for ${u.name} (min 8 chars):`);
                  if (!pw || pw.length < 8) return;
                  try {
                    await api.post(`/admin/users/${u.id}/reset-password`, { newPassword: pw });
                    Toast.show('Password reset!', 'success');
                  } catch { Toast.show('Failed to reset password', 'error'); }
                };

                const deleteUser = async (u) => {
                  if (!window.confirm(`Permanently delete ${u.name}?`)) return;
                  try {
                    await api.delete(`/admin/users/${u.id}`);
                    setUsers(prev => prev.filter(x => x.id !== u.id));
                    Toast.show('User deleted', 'success');
                  } catch { Toast.show('Failed to delete user', 'error'); }
                };

                const exportCSV = () => {
                  const rows = [['ID','Name','Email','WhatsApp','Role','Status','Campus','Deals','Joined'],
                    ...filtered.map(u => [u.id, u.name, u.email, u.whatsapp_number||'', u.role, u.status, u.campus||'', u.deals_completed||0, u.created_at ? new Date(u.created_at).toLocaleDateString('en-NG') : ''])
                  ].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([rows], { type: 'text/csv' })), download: `users_${Date.now()}.csv` });
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  Toast.show(`Exported ${filtered.length} users`, 'success');
                };

                const thStyle = (field) => ({
                  padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700,
                  color: userSort.field === field ? 'var(--primary-green)' : 'var(--text-secondary)',
                  cursor: field ? 'pointer' : 'default', whiteSpace: 'nowrap',
                  borderBottom: '2px solid var(--border)', userSelect: 'none'
                });

                return (
                  <div>
                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
                      {[['Total', users.length, '#3b82f6'], ['Active', active, '#10b981'], ['Suspended', suspended, '#ef4444'], ['Vendors', vendors, '#f59e0b']].map(([l, v, c]) => (
                        <div key={l} style={{ backgroundColor: 'var(--surface)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>{l}</div>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Search + Filters */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <input value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} placeholder="🔍 Search name or email..." style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontSize: '13px' }} />
                      {[['userRoleFilter', ['', 'buyer', 'vendor', 'admin'], userRoleFilter, setUserRoleFilter, 'All Roles'],
                        ['userStatusFilter', ['', 'active', 'suspended', 'banned'], userStatusFilter, setUserStatusFilter, 'All Status'],
                        ['userCampusFilter', ['', ...campuses], userCampusFilter, setUserCampusFilter, 'All Campuses'],
                      ].map(([key, opts, val, setter, placeholder]) => (
                        <select key={key} value={val} onChange={e => { setter(e.target.value); setUserPage(1); }} style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}>
                          {opts.map(o => <option key={o} value={o}>{o || placeholder}</option>)}
                        </select>
                      ))}
                      <button onClick={exportCSV} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>📥 CSV</button>
                    </div>

                    {/* Table */}
                    <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th style={thStyle(null)}><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? new Set(pageUsers.map(u => u.id)) : new Set())} /></th>
                            {[['name','Name'],['email','Email'],['role','Role'],['status','Status'],['campus','Campus'],['deals_completed','Deals'],['created_at','Joined']].map(([f,l]) => (
                              <th key={f} style={thStyle(f)} onClick={() => handleSort(f)}>{l} {userSort.field===f ? (userSort.dir==='asc'?'↑':'↓') : ''}</th>
                            ))}
                            <th style={thStyle(null)}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageUsers.length === 0 ? (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No users match your filters.</td></tr>
                          ) : pageUsers.map(u => {
                            const isSusp = u.status === 'suspended' || u.status === 'banned';
                            const statusColor = { active: '#10b981', suspended: '#ef4444', banned: '#ef4444', pending: '#f59e0b' }[u.status] || '#10b981';
                            return (
                              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: selectedIds.has(u.id) ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                                <td style={{ padding: '10px 12px' }}><input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{u.whatsapp_number || '—'}</div>
                                </td>
                                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px' }}>{u.email}</td>
                                <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{u.role?.toUpperCase()}</span></td>
                                <td style={{ padding: '10px 12px' }}><span style={{ fontWeight: 700, color: statusColor, fontSize: '11px' }}>{u.status === 'active' ? '🟢' : '🔴'} {u.status}</span></td>
                                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{u.campus || '—'}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary-green)' }}>{u.deals_completed || 0}</td>
                                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'2-digit' }) : '—'}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  {u.role !== 'admin' && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <button onClick={() => setDetailUser(u)} style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-hover)', cursor: 'pointer', color: 'var(--text-primary)' }}>👁️</button>
                                      <button onClick={() => quickStatus(u.id, isSusp ? 'active' : 'suspended')} style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: 'none', backgroundColor: isSusp ? '#10b981' : '#f59e0b', color: '#fff', cursor: 'pointer' }}>{isSusp ? '✓' : '🚫'}</button>
                                      <button onClick={() => resetPw(u)} style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-hover)', cursor: 'pointer', color: 'var(--text-primary)' }}>🔄</button>
                                      <button onClick={() => deleteUser(u)} style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: 'none', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>Showing {Math.min((userPage-1)*perPage+1, total)}–{Math.min(userPage*perPage, total)} of {total} users</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button disabled={userPage<=1} onClick={() => setUserPage(p=>p-1)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: userPage<=1?'default':'pointer', opacity: userPage<=1?0.4:1 }}>‹</button>
                        {Array.from({ length: Math.min(pages,5) }, (_,i) => {
                          const p = Math.max(1, Math.min(pages-4, userPage-2)) + i;
                          return <button key={p} onClick={() => setUserPage(p)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: p===userPage?'var(--primary-green)':'var(--surface)', color: p===userPage?'#fff':'var(--text-primary)', cursor: 'pointer', fontWeight: p===userPage?800:400 }}>{p}</button>;
                        })}
                        <button disabled={userPage>=pages} onClick={() => setUserPage(p=>p+1)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: userPage>=pages?'default':'pointer', opacity: userPage>=pages?0.4:1 }}>›</button>
                      </div>
                    </div>

                    {/* User Detail Modal */}
                    {detailUser && (
                      <div onClick={() => setDetailUser(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--surface)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '440px', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div>
                              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', color: 'var(--primary-green)', marginBottom: '8px' }}>
                                {detailUser.portrait ? <img src={detailUser.portrait} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : detailUser.name?.substring(0,2).toUpperCase()}
                              </div>
                              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{detailUser.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{detailUser.email}</div>
                            </div>
                            <button onClick={() => setDetailUser(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '20px' }}>
                            {[['Role', detailUser.role], ['Status', detailUser.status], ['University', detailUser.university||'COOU'], ['Campus', detailUser.campus||'—'], ['WhatsApp', detailUser.whatsapp_number||'—'], ['Deals Done', detailUser.deals_completed||0], ['Active Listings', detailUser.active_listings||0], ['Joined', detailUser.created_at ? new Date(detailUser.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—']].map(([l,v]) => (
                              <div key={l} style={{ backgroundColor: 'var(--background)', padding: '10px', borderRadius: '10px' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 600, marginBottom: '2px' }}>{l}</div>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{v}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => { const isSusp = detailUser.status==='suspended'||detailUser.status==='banned'; quickStatus(detailUser.id, isSusp?'active':'suspended'); setDetailUser(null); }} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: (detailUser.status==='suspended'||detailUser.status==='banned')?'#10b981':'#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                              {(detailUser.status==='suspended'||detailUser.status==='banned') ? '✓ Activate' : '🚫 Suspend'}
                            </button>
                            <button onClick={() => { resetPw(detailUser); setDetailUser(null); }} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>🔄 Reset PW</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              {/* ── MODERATION PANE ── */}
              {activePane === 'listings' && (() => {
                const moderateProduct = async (id, action) => {
                  try {
                    await api.post(`/admin/moderation/${id}`, { action });
                    setReportedListings(prev => prev.filter(p => p.id !== id));
                    Toast.show(`Listing ${action === 'approve' ? 'approved & cleared' : 'banned/removed'}`, 'success');
                  } catch { Toast.show('Moderation failed', 'error'); }
                };

                return (
                  <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🏪</span> Flagged & Reported Product Listings ({reportedListings.length})
                    </h3>
                    {reportedListings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                        No active reported or flagged product listings. Clean queue!
                      </div>
                    ) : reportedListings.map(p => (
                      <div key={p.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', marginBottom: '12px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>{p.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>(ID: #{p.id})</span>
                          </div>
                          <div style={{ fontWeight: 800, color: 'var(--primary-green)', fontSize: '15px' }}>₦{Number(p.price).toLocaleString()}</div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                          <div><strong style={{ color: 'var(--text-primary)' }}>Vendor:</strong> {p.vendor?.name} ({p.vendor?.email})</div>
                          <div style={{ marginTop: '4px' }}><strong style={{ color: 'var(--text-primary)' }}>Description:</strong> {p.description || 'None provided'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                          <button onClick={() => moderateProduct(p.id, 'approve')} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary-green)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>✓ Clear Flags (Approve)</button>
                          <button onClick={() => moderateProduct(p.id, 'reject')} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>🚫 Ban / Remove Listing</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ── REPORTS PANE ── */}
              {activePane === 'reports' && (
                <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚠️</span> Community Reports Queue ({reports.length})
                  </h3>
                  {reports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                      No pending community reports. Everything is peaceful!
                    </div>
                  ) : reports.map(r => {
                    const targetText = r.reported_product_id
                      ? `Product: ${r.reported_product_name} (ID: #${r.reported_product_id})`
                      : `Seller: ${r.reported_user_name} (ID: #${r.reported_user_id})`;
                    return (
                      <div key={r.id || Math.random()} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid #ef4444', backgroundColor: 'var(--background)', marginBottom: '12px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                          <span><strong style={{ color: 'var(--text-primary)' }}>Reporter:</strong> {r.reporter_name} ({r.reporter_email})</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</span>
                        </div>
                        <div style={{ marginBottom: '6px', fontWeight: 700, color: '#ef4444' }}>Target: {targetText}</div>
                        <div style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Reason:</strong> {r.reason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* ── SETTINGS PANE ── */}
              {activePane === 'settings' && (() => {
                const addUniv = async () => {
                  if (!univCode || !univName) return Toast.show('Code and Name required', 'warning');
                  try {
                    await api.post('/admin/universities', { code: univCode, name: univName });
                    setUniversities(p => [...p, { code: univCode, name: univName }]);
                    setUnivCode(''); setUnivName('');
                    Toast.show('University added!', 'success');
                  } catch { Toast.show('Failed to add university', 'error'); }
                };

                const addCampus = async () => {
                  if (!campusUnivCode || !campusName) return Toast.show('Select University & enter Campus Name', 'warning');
                  try {
                    await api.post('/admin/campuses', { university_code: campusUnivCode, name: campusName });
                    setCampuses(p => [...p, { university_code: campusUnivCode, name: campusName }]);
                    setCampusName('');
                    Toast.show('Campus added!', 'success');
                  } catch { Toast.show('Failed to add campus', 'error'); }
                };

                const addCat = async () => {
                  if (!catName) return Toast.show('Category name required', 'warning');
                  try {
                    await api.post('/categories', { name: catName });
                    setCategories(p => [...p, { name: catName, created_at: new Date().toISOString() }]);
                    setCatName('');
                    Toast.show('Category added!', 'success');
                  } catch { Toast.show('Failed to add category', 'error'); }
                };

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {/* Add University */}
                    <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px' }}>🏛️ Add University</h3>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>University Code (e.g. UNN, COOU)</label>
                        <input value={univCode} onChange={e => setUnivCode(e.target.value.toUpperCase())} placeholder="e.g. UNN" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontSize: '13px' }} />
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>University Name</label>
                        <input value={univName} onChange={e => setUnivName(e.target.value)} placeholder="e.g. University of Nigeria" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontSize: '13px' }} />
                      </div>
                      <button onClick={addUniv} style={{ width: '100%', padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary-green)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>+ Add University</button>
                    </div>

                    {/* Add Campus */}
                    <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px' }}>🏫 Add Campus</h3>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Select University</label>
                        <select value={campusUnivCode} onChange={e => setCampusUnivCode(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontSize: '13px' }}>
                          <option value="" disabled>Select a University</option>
                          {universities.map(u => <option key={u.code} value={u.code}>{u.name} ({u.code})</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Campus Name</label>
                        <input value={campusName} onChange={e => setCampusName(e.target.value)} placeholder="e.g. Nsukka Campus" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontSize: '13px' }} />
                      </div>
                      <button onClick={addCampus} style={{ width: '100%', padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>+ Add Campus</button>
                    </div>

                    {/* Add Category */}
                    <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px' }}>🏷️ Add Product Category</h3>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Category Name</label>
                        <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Electronics, Books" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontSize: '13px' }} />
                      </div>
                      <button onClick={addCat} style={{ width: '100%', padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>+ Add Category</button>
                    </div>

                    {/* List Universities & Campuses */}
                    <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px', gridColumn: '1 / -1' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px' }}>📌 Current Universities & Campuses</h3>
                      {universities.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No universities registered yet.</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                          {universities.map(u => {
                            const uCampuses = campuses.filter(c => c.university_code === u.code);
                            return (
                              <div key={u.code} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{u.name}</span>
                                  <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--primary-green)' }}>{u.code}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {uCampuses.length === 0 ? <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>No campuses added</span> : uCampuses.map(c => (
                                    <span key={c.name} style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>📍 {c.name}</span>
                                  ))}
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
