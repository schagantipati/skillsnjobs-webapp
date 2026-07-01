import { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

const ACTION_COLORS = {
  'Login':            { bg: '#ECFDF5', color: '#065F46', icon: '🔑' },
  'Login failed':     { bg: '#FEF2F2', color: '#991B1B', icon: '⚠️' },
  'User registered':  { bg: '#EFF6FF', color: '#1E40AF', icon: '✨' },
  'Profile updated':  { bg: '#FFF7ED', color: '#92400E', icon: '✏️' },
};

function badge(action) {
  const s = ACTION_COLORS[action] || { bg: '#F1F5F9', color: '#445074', icon: '📋' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
      {s.icon} {action}
    </span>
  );
}

function rolePill(role) {
  if (!role) return <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, background: '#EFF6FF', color: '#1E5FBF', padding: '2px 7px', borderRadius: 20 }}>
      {role.replace(/_/g, ' ')}
    </span>
  );
}

const ACTIONS = ['All', 'Login', 'Login failed', 'User registered', 'Profile updated'];
const PAGE_SIZE = 50;

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(0);

  const load = useCallback(async (f, p) => {
    setLoading(true); setErr('');
    try {
      const params = { limit: PAGE_SIZE, offset: p * PAGE_SIZE };
      if (f !== 'All') params.action = f;
      const data = await api.auditLogs(params);
      setRows(data.rows);
      setTotal(data.total);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter, page); }, [filter, page, load]);

  function changeFilter(f) { setFilter(f); setPage(0); }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p>Login history, profile changes, and admin actions across the platform.</p>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {ACTIONS.map(a => (
          <button key={a} onClick={() => changeFilter(a)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1.5px solid', cursor: 'pointer',
              borderColor: filter === a ? '#1E5FBF' : '#DDE3EE',
              background: filter === a ? '#1E5FBF' : '#fff',
              color: filter === a ? '#fff' : '#445074',
              transition: 'all .15s' }}>
            {ACTION_COLORS[a]?.icon} {a}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#7886A6' }}>
          {total} total event{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 130px 110px 140px 110px 120px', background: '#0F2545', padding: '9px 16px', gap: 8 }}>
          {['#', 'User', 'Action', 'Role', 'Entity', 'IP', 'Time'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#7886A6', fontSize: 13 }}>Loading…</div>
        ) : err ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#EF4444', fontSize: 13 }}>{err}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#7886A6', fontSize: 13 }}>No audit events yet.</div>
        ) : (
          rows.map((r, i) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 130px 110px 140px 110px 120px', padding: '10px 16px', gap: 8, alignItems: 'center', borderBottom: '1px solid #EEF2F8', background: i % 2 === 0 ? '#fff' : '#FAFBFD' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{r.id}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1E3D' }}>{r.user_name || '—'}</div>
                {r.detail && <div style={{ fontSize: 11, color: '#7886A6', marginTop: 1 }}>{r.detail}</div>}
              </div>
              <div>{badge(r.action)}</div>
              <div>{rolePill(r.user_role)}</div>
              <div style={{ fontSize: 12, color: '#445074' }}>
                {r.entity ? <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{r.entity}</span> : '—'}
                {r.entity_id ? <span style={{ color: '#9CA3AF' }}> #{r.entity_id}</span> : ''}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>{r.ip || '—'}</div>
              <div style={{ fontSize: 11, color: '#7886A6' }}>
                {r.created_at ? new Date(r.created_at + 'Z').toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #EEF2F8', background: '#F8FAFC' }}>
            <span style={{ fontSize: 12, color: '#7886A6' }}>
              Page {page + 1} of {totalPages} · showing {rows.length} of {total}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
