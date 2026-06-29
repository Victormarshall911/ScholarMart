import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, FileText, Activity, LogOut, Trash2, CheckCircle, Lock, RefreshCw } from 'lucide-react';
import api from '../services/api';
import Toast from '../services/toast';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [reportedListings, setReportedListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, modRes, repRes] = await Promise.all([
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/admin/moderation').catch(() => ({ data: [] })),
        api.get('/admin/all-reports').catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data || []);
      setReportedListings(modRes.data || []);
      setReports(repRes.data || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      Toast.show('Failed to load some admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await api.post(`/admin/users/${userId}/status`, { status: newStatus });
      Toast.show(`User account marked as ${newStatus}`, 'success');
      setUsers(users.map(u => u.id === userId ? { ...u, account_status: newStatus } : u));
    } catch (err) {
      Toast.show('Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      Toast.show('User deleted successfully', 'success');
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      Toast.show('Failed to delete user', 'error');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new default password for this user:', 'Scholar123!');
    if (!newPassword) return;
    try {
      await api.post(`/admin/users/${userId}/reset-password`, { newPassword });
      Toast.show('Password reset successfully', 'success');
    } catch (err) {
      Toast.show('Failed to reset password', 'error');
    }
  };

  const handleModerateListing = async (productId, action) => {
    try {
      await api.post(`/admin/moderation/${productId}`, { action });
      Toast.show(`Listing ${action} successfully`, 'success');
      setReportedListings(reportedListings.filter(p => p.id !== productId));
    } catch (err) {
      Toast.show('Failed to moderate listing', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.campus || '').toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <section className="view-container active" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Platform Administration</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Logged in as <strong style={{ color: 'var(--primary-green)' }}>{user?.email}</strong> (Super Admin)</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchAllData} 
            className="btn btn-outline btn-sm" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '12px', padding: '8px 14px' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button 
            onClick={onLogout} 
            className="btn btn-sm" 
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '12px', padding: '8px 14px', fontWeight: 700 }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('overview')} 
          style={{ padding: '10px 18px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'overview' ? 'var(--primary-green)' : 'transparent', color: activeTab === 'overview' ? '#fff' : 'var(--text-secondary)' }}
        >
          <Activity size={16} /> Overview Stats
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{ padding: '10px 18px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'users' ? 'var(--primary-green)' : 'transparent', color: activeTab === 'users' ? '#fff' : 'var(--text-secondary)' }}
        >
          <Users size={16} /> Users ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('moderation')} 
          style={{ padding: '10px 18px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'moderation' ? 'var(--primary-green)' : 'transparent', color: activeTab === 'moderation' ? '#fff' : 'var(--text-secondary)' }}
        >
          <ShieldAlert size={16} /> Moderation ({reportedListings.length})
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          style={{ padding: '10px 18px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'reports' ? 'var(--primary-green)' : 'transparent', color: activeTab === 'reports' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FileText size={16} /> Reports Logs ({reports.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px auto', display: 'block' }} />
          Loading platform administration data...
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="var(--primary-green)" /> Total Registered Users
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{users.length}</div>
              </div>
              <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={16} color="var(--primary-orange)" /> Pending Moderation
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{reportedListings.length}</div>
              </div>
              <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="var(--danger)" /> User Complaints
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{reports.length}</div>
              </div>
            </div>
          )}

          {/* USERS MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px', overflowX: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Search user name, email, or campus..." 
                  value={searchUser} 
                  onChange={e => setSearchUser(e.target.value)}
                  style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>User</th>
                    <th style={{ padding: '12px' }}>Role</th>
                    <th style={{ padding: '12px' }}>Campus</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>No users found matching search.</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name || 'No Name'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: u.role === 'admin' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)', color: u.role === 'admin' ? '#8b5cf6' : 'var(--primary-green)' }}>
                          {u.role ? u.role.toUpperCase() : 'BUYER'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{u.campus || 'Main Campus'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: u.account_status === 'suspended' ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                          {u.account_status === 'suspended' ? '🚫 Suspended' : '✅ Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {u.role !== 'admin' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              onClick={() => handleToggleStatus(u.id, u.account_status)} 
                              className="btn btn-sm"
                              style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: u.account_status === 'suspended' ? 'var(--primary-green)' : 'var(--primary-orange)', color: '#fff', borderRadius: '8px' }}
                              title="Toggle Suspension"
                            >
                              {u.account_status === 'suspended' ? 'Activate' : 'Suspend'}
                            </button>
                            <button 
                              onClick={() => handleResetPassword(u.id)} 
                              className="btn btn-sm"
                              style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }}
                              title="Reset Password"
                            >
                              <Lock size={12} /> Reset
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)} 
                              className="btn btn-sm"
                              style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px' }}
                              title="Delete User"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MODERATION TAB */}
          {activeTab === 'moderation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reportedListings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                  ✅ No reported or flagged listings requiring moderation. Clean platform!
                </div>
              ) : reportedListings.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name} (₦{Number(item.price).toLocaleString()})</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Vendor: {item.vendor_name || 'Student'} | Campus: {item.campus || 'Main'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleModerateListing(item.id, 'approve')} 
                      className="btn btn-sm"
                      style={{ backgroundColor: 'var(--primary-green)', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button 
                      onClick={() => handleModerateListing(item.id, 'remove')} 
                      className="btn btn-sm"
                      style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REPORTS LOGS TAB */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                  📝 No user reports filed.
                </div>
              ) : reports.map((rep, idx) => (
                <div key={idx} style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)', backgroundColor: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '8px' }}>🚨 Report #{rep.id || idx + 1}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{rep.created_at ? new Date(rep.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '4px 0' }}><strong>Reason:</strong> {rep.reason || 'Spam / Scam behavior'}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Reported Item/User ID: {rep.target_id || rep.product_id || rep.user_id || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
