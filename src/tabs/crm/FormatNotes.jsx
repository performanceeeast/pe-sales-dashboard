import React, { useState } from 'react';
import { styles, FM, FH } from '../../components/SharedUI';

const { card, cardHead: cH, input: inp } = styles;

const FORMAT_FIELDS = [
  { id: 'format_family', label: 'Family', icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66', placeholder: 'Married, kids who ride, family trail riding...' },
  { id: 'format_occupation', label: 'Occupation', icon: '\uD83D\uDCBC', placeholder: 'Construction, farming, factory schedule...' },
  { id: 'format_recreation', label: 'Recreation', icon: '\u26FA', placeholder: 'Hunts, rides at Busco, camping...' },
  { id: 'format_motivation', label: 'Motivation', icon: '\uD83C\uDFAF', placeholder: 'More power, utility for land, riding with friends...' },
  { id: 'format_animals', label: 'Animals', icon: '\uD83D\uDC34', placeholder: 'Horses, fence lines, dogs, animal transport...' },
  { id: 'format_teams', label: 'Teams/Transport', icon: '\uD83D\uDE9A', placeholder: 'NC State fan, rides with group, truck/trailer setup...' },
];

export { FORMAT_FIELDS };

export default function FormatNotes({ customer, onUpdate, compact = false }) {
  const [editMode, setEditMode] = useState(false);
  const c = customer;
  const formatCount = FORMAT_FIELDS.filter((f) => c[f.id] && c[f.id].trim()).length;
  const isGood = formatCount >= 2;

  // Compact badge for Kanban cards and list view
  if (compact) {
    return (
      <span title={`FORMAT: ${formatCount}/6 filled`} style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '1px 6px', borderRadius: 3, fontSize: 9, fontFamily: FM, fontWeight: 700,
        background: isGood ? '#dcfce7' : '#fef2f2',
        color: isGood ? '#16a34a' : '#b91c1c',
      }}>
        F {formatCount}/6
      </span>
    );
  }

  // Full FORMAT panel for customer detail
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{
        ...cH,
        background: isGood ? '#f0fdf4' : '#fefce8',
        borderBottomColor: isGood ? '#bbf7d0' : '#fde68a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: isGood ? '#16a34a' : '#d97706', display: 'flex', alignItems: 'center', gap: 6 }}>
          FORMAT NOTES
          <span style={{
            fontFamily: FM, fontSize: 10, fontWeight: 700,
            padding: '1px 8px', borderRadius: 10,
            background: isGood ? '#dcfce7' : '#fef2f2',
            color: isGood ? '#16a34a' : '#b91c1c',
          }}>
            {formatCount}/6
          </span>
        </span>
        <button onClick={() => setEditMode(!editMode)} style={{
          background: 'none', border: 'none', fontFamily: FM, fontSize: 9,
          color: isGood ? '#16a34a' : '#d97706', cursor: 'pointer', fontWeight: 700,
        }}>
          {editMode ? 'DONE' : 'EDIT ALL'}
        </button>
      </div>

      <div style={{ padding: 14 }}>
        {!isGood && (
          <div style={{
            background: '#fef2f2', borderRadius: 6, padding: '6px 10px', marginBottom: 10,
            fontFamily: FM, fontSize: 10, color: '#b91c1c', fontWeight: 600,
          }}>
            Minimum 2 FORMAT fields required for 1-Star eligibility
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: editMode ? 8 : 4 }}>
          {FORMAT_FIELDS.map((f) => {
            const val = c[f.id] || '';
            const filled = val.trim().length > 0;

            if (editMode) {
              return (
                <div key={f.id}>
                  <label style={{
                    fontFamily: FM, fontSize: 8, fontWeight: 700, letterSpacing: 1,
                    color: '#d97706', display: 'block', marginBottom: 2,
                  }}>
                    {f.icon} {f.label.toUpperCase()}
                  </label>
                  <input
                    value={val}
                    onChange={(e) => onUpdate({ [f.id]: e.target.value })}
                    style={inp}
                    placeholder={f.placeholder}
                  />
                </div>
              );
            }

            return (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '5px 8px', borderRadius: 4,
                background: filled ? 'transparent' : 'var(--brand-red-soft)',
                cursor: 'pointer',
              }}
                onClick={() => !filled && setEditMode(true)}
              >
                <span style={{ fontSize: 12, flexShrink: 0, width: 20, textAlign: 'center' }}>{f.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: FM, fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
                    color: filled ? '#d97706' : 'var(--text-muted)',
                    marginBottom: 1,
                  }}>
                    {f.label.toUpperCase()}
                  </div>
                  {filled ? (
                    <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.3 }}>{val}</div>
                  ) : (
                    <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Not yet filled — tap to add
                    </div>
                  )}
                </div>
                {filled && (
                  <span style={{ color: '#16a34a', fontSize: 11, flexShrink: 0 }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
