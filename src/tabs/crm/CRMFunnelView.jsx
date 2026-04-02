import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { styles, FM, FH } from '../../components/SharedUI';

const { card, cardHead: cH } = styles;

export default function CRMFunnelView({ customers, pipelines, getPipeline }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {Object.entries(pipelines).map(([pipelineId, pl]) => {
        const plCustomers = customers.filter((c) => getPipeline(c.lead_source) === pipelineId);
        const stageData = pl.stages.map((s) => {
          const count = plCustomers.filter((c) => c.status === s.id).length;
          return { name: s.label, count, color: s.color };
        });
        const total = plCustomers.length;

        return (
          <div key={pipelineId} style={{ ...card, flex: 1, minWidth: 300 }}>
            <div style={{ ...cH, borderBottomColor: pl.color + '60' }}>
              <span style={{ color: pl.color }}>{pl.label} FUNNEL ({total})</span>
            </div>
            <div style={{ padding: 16 }}>
              {/* Funnel bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {stageData.map((s, idx) => {
                  const pct = total > 0 ? (s.count / total * 100) : 0;
                  const convRate = idx > 0 && stageData[idx - 1].count > 0
                    ? Math.round(s.count / stageData[idx - 1].count * 100)
                    : null;
                  return (
                    <div key={s.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: s.color, letterSpacing: 0.5 }}>{s.name}</span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {convRate !== null && (
                            <span style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)' }}>{convRate}% conv</span>
                          )}
                          <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>{s.count}</span>
                        </div>
                      </div>
                      <div style={{
                        height: 20, borderRadius: 4, overflow: 'hidden',
                        background: 'var(--progress-bg)',
                      }}>
                        <div style={{
                          width: `${Math.max(pct, 2)}%`, height: '100%',
                          background: s.color, borderRadius: 4,
                          transition: 'width .4s ease',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {pct > 15 && (
                            <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: '#fff' }}>
                              {Math.round(pct)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary stats */}
              <div style={{
                display: 'flex', justifyContent: 'space-around', padding: '10px 0',
                borderTop: '1px solid var(--border-primary)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: FH, fontSize: 20, fontWeight: 700, color: pl.color, lineHeight: 1 }}>{total}</div>
                  <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)' }}>TOTAL</div>
                </div>
                {stageData.length >= 2 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: FH, fontSize: 20, fontWeight: 700, color: '#16a34a', lineHeight: 1 }}>
                      {total > 0 ? Math.round(stageData[stageData.length - 1].count / total * 100) : 0}%
                    </div>
                    <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)' }}>CONV RATE</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
