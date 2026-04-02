import React, { useState } from 'react';
import CRMKanbanCard from './CRMKanbanCard';
import { FM, FH } from '../../components/SharedUI';

export default function CRMKanbanView({ customers, stages, pipelineColor, act, onOpenCustomer, onUpdateStatus }) {
  const [dragging, setDragging] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  function handleDragStart(e, customer) {
    setDragging(customer);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', customer.id);
  }

  function handleDragOver(e, stageId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  function handleDrop(e, stageId) {
    e.preventDefault();
    setDragOverStage(null);
    if (dragging && dragging.status !== stageId) {
      onUpdateStatus(dragging, stageId);
    }
    setDragging(null);
  }

  function handleDragEnd() {
    setDragging(null);
    setDragOverStage(null);
  }

  return (
    <div style={{
      display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8,
      WebkitOverflowScrolling: 'touch', minHeight: 400,
    }}>
      {stages.map((stage) => {
        const stageCustomers = customers.filter((c) => c.status === stage.id);
        const isOver = dragOverStage === stage.id;

        return (
          <div
            key={stage.id}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
            style={{
              flex: '0 0 240px',
              minWidth: 240,
              background: isOver ? stage.color + '10' : 'var(--bg-tertiary)',
              borderRadius: 10,
              border: isOver ? `2px dashed ${stage.color}` : '1px solid var(--border-primary)',
              transition: 'background .15s, border .15s',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Column header */}
            <div style={{
              padding: '10px 12px',
              borderBottom: `2px solid ${stage.color}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{
                fontFamily: FH, fontSize: 10, fontWeight: 700, letterSpacing: 1,
                color: stage.color, textTransform: 'uppercase',
              }}>
                {stage.label}
              </span>
              <span style={{
                fontFamily: FM, fontSize: 10, fontWeight: 700,
                color: 'var(--text-inverse)', background: stage.color,
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stageCustomers.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{
              padding: 8, flex: 1, display: 'flex', flexDirection: 'column', gap: 6,
              overflowY: 'auto', maxHeight: 600,
            }}>
              {stageCustomers.length === 0 && (
                <div style={{
                  padding: 16, textAlign: 'center',
                  fontFamily: FM, fontSize: 10, color: 'var(--text-muted)',
                  border: '1px dashed var(--border-primary)', borderRadius: 6,
                }}>
                  Drop leads here
                </div>
              )}
              {stageCustomers.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, c)}
                  onDragEnd={handleDragEnd}
                >
                  <CRMKanbanCard
                    customer={c}
                    act={act}
                    onClick={() => onOpenCustomer(c)}
                    isDragging={dragging?.id === c.id}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
