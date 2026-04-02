import React from 'react';
import FormatNotes from './FormatNotes';
import { FM, FH } from '../../components/SharedUI';

export default function CRMKanbanCard({ customer, act, onClick, isDragging }) {
  const c = customer;
  const rep = act.find((a) => a.id === c.assigned_to);
  const repInitial = rep ? rep.name.charAt(0).toUpperCase() : '?';

  // Days in current stage
  const updatedDate = c.updated_at ? new Date(c.updated_at) : new Date(c.created_at || Date.now());
  const daysInStage = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        padding: '10px 12px',
        cursor: 'grab',
        transition: 'box-shadow .15s, transform .15s',
        boxShadow: isDragging ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
        opacity: isDragging ? 0.9 : 1,
      }}
    >
      {/* Name + Rep initial */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {c.first_name} {c.last_name}
        </div>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: rep ? '#2563eb' : '#fca5a5',
          color: '#fff', fontFamily: FM, fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }} title={rep?.name || 'Unassigned'}>
          {repInitial}
        </div>
      </div>

      {/* Unit of interest */}
      {c.unit_of_interest && (
        <div style={{
          fontFamily: FM, fontSize: 10, color: 'var(--text-secondary)',
          marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {c.unit_of_interest}
        </div>
      )}

      {/* Bottom row: phone, days, FORMAT badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {c.phone && (
          <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{c.phone}</span>
        )}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <FormatNotes customer={c} compact />
          {daysInStage > 0 && (
            <span style={{
              fontFamily: FM, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
              background: daysInStage > 7 ? '#fef2f2' : daysInStage > 3 ? '#fef3c7' : 'var(--bg-tertiary)',
              color: daysInStage > 7 ? '#b91c1c' : daysInStage > 3 ? '#d97706' : 'var(--text-muted)',
            }}>
              {daysInStage}d
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
