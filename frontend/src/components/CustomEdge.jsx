import React from 'react';
import { EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';

const EMOJI = (mode = '') => {
  const t = mode.toLowerCase();
  if (t.includes('flight') || t.includes('air') || t.includes('plane')) return '✈️';
  if (t.includes('train')) return '🚆';
  if (t.includes('metro')) return '🚇';
  if (t.includes('bus')) return '🚌';
  if (t.includes('car') || t.includes('cab')) return '🚕';
  if (t.includes('auto')) return '🛺';
  if (t.includes('bike') || t.includes('scooter') || t.includes('cycle')) return '🛵';
  if (t.includes('enfield') || t.includes('motorbike') || t.includes('motorcycle')) return '🏍️';
  if (t.includes('ferry') || t.includes('boat') || t.includes('houseboat')) return '⛵';
  if (t.includes('walk') || t.includes('trek') || t.includes('hike')) return '🥾';
  if (t.includes('jeep') || t.includes('safari')) return '🚙';
  return '🚀';
};

// Support both old single-transport format and new options[] format
function getOptions(data) {
  if (data?.options?.length > 0) return data.options;
  if (data?.transport) return [{ mode: data.transport, details: data.transportDetails || '' }];
  return [];
}

export default function CustomEdge({
  id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd, data
}) {
  const isReadOnly = data?.readOnly;
  const customOffsetX = data?.customOffsetX || 0;
  const customOffsetY = data?.customOffsetY || 0;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  let nx = 0, ny = 0;
  if (length > 0) { nx = -dy / length; ny = dx / length; }

  const isReturn = data?.direction === 'Return' || targetX < sourceX - 20;
  const dynamicArc = data?.customArc || Math.max(100, length * 0.3);
  const autoOffsetAmount = isReturn ? dynamicArc : -dynamicArc;

  const controlX = sourceX + dx / 2 + nx * autoOffsetAmount + customOffsetX;
  const controlY = sourceY + dy / 2 + ny * autoOffsetAmount + customOffsetY;
  const edgePath = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;

  const labelX = sourceX + dx / 2 + nx * (autoOffsetAmount * 0.5) + customOffsetX * 0.5;
  const labelY = sourceY + dy / 2 + ny * (autoOffsetAmount * 0.5) + customOffsetY * 0.5;

  const edgeColor = data?.color || '#1b4332';
  const edgeStyle = data?.lineStyle === 'dashed' ? { strokeDasharray: '8 8' } : {};

  const options = getOptions(data);

  const setOptions = (newOpts) => {
    if (data?.onDataChange) data.onDataChange(id, 'options', newOpts);
  };
  const updateRow = (idx, field, val) =>
    setOptions(options.map((o, i) => i === idx ? { ...o, [field]: val } : o));
  const addRow = () => setOptions([...options, { mode: '', details: '' }]);
  const removeRow = (idx) => setOptions(options.filter((_, i) => i !== idx));
  const handleDelete = () => { if (data?.onDeleteEdge) data.onDeleteEdge(id); };
  const handleDragEnd = (_, info) => {
    if (!isReadOnly && data?.onDataChange) {
      data.onDataChange(id, 'customOffsetX', customOffsetX + info.offset.x * 2);
      data.onDataChange(id, 'customOffsetY', customOffsetY + info.offset.y * 2);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd}
        style={{ ...style, ...edgeStyle, stroke: edgeColor, strokeWidth: 3, opacity: 1 }} />

      <EdgeLabelRenderer>
        <div style={{
          position: 'absolute', left: labelX, top: labelY,
          transform: 'translate(-50%, -50%)',
          pointerEvents: isReadOnly ? 'none' : 'all', zIndex: 1000,
        }} className="nopan">
          <motion.div
            drag={!isReadOnly}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{
              background: '#fff',
              border: `2px solid ${edgeColor}`,
              borderRadius: '12px',
              boxShadow: isReadOnly ? `4px 4px 0 ${edgeColor}` : '0 4px 16px rgba(0,0,0,0.12)',
              minWidth: '200px',
              maxWidth: '280px',
              overflow: 'hidden',
              cursor: isReadOnly ? 'default' : 'grab',
            }}
          >
            {/* Header */}
            <div style={{
              background: edgeColor, padding: '5px 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Route · {options.length} option{options.length !== 1 ? 's' : ''}
              </span>
              {!isReadOnly && (
                <button type="button" onClick={handleDelete}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', opacity: 0.8 }}>
                  <X size={10} color="white" />
                </button>
              )}
            </div>

            {/* Options grid */}
            <div style={{ padding: '8px' }}>
              {/* Column headers */}
              {options.length > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '4px', marginBottom: '4px',
                  padding: '0 4px',
                }}>
                  <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Mode</span>
                  <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Details</span>
                </div>
              )}

              {/* Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: isReadOnly ? '1fr 1fr' : '1fr 1fr 18px',
                    gap: '4px',
                    alignItems: 'center',
                    background: '#f8f9fa',
                    borderRadius: '7px',
                    padding: '4px 6px',
                  }}>
                    {/* Mode cell */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', flexShrink: 0 }}>{EMOJI(opt.mode)}</span>
                      {isReadOnly ? (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#111', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {opt.mode || '—'}
                        </span>
                      ) : (
                        <input
                          className="nodrag"
                          value={opt.mode}
                          onChange={e => updateRow(idx, 'mode', e.target.value)}
                          placeholder="TRAIN…"
                          style={{
                            border: 'none', background: 'transparent', outline: 'none',
                            fontSize: '0.63rem', fontWeight: 800, color: '#111',
                            textTransform: 'uppercase', width: '100%', fontFamily: 'inherit',
                          }}
                        />
                      )}
                    </div>

                    {/* Details cell */}
                    {isReadOnly ? (
                      <span style={{ fontSize: '0.6rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {opt.details || '—'}
                      </span>
                    ) : (
                      <input
                        className="nodrag"
                        value={opt.details}
                        onChange={e => updateRow(idx, 'details', e.target.value)}
                        placeholder="5h · ₹600"
                        style={{
                          border: 'none', background: 'transparent', outline: 'none',
                          fontSize: '0.6rem', color: '#555', width: '100%', fontFamily: 'inherit',
                        }}
                      />
                    )}

                    {/* Remove button */}
                    {!isReadOnly && (
                      <button type="button" onClick={() => removeRow(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', opacity: 0.35 }}>
                        <X size={9} color="#333" />
                      </button>
                    )}
                  </div>
                ))}

                {options.length === 0 && !isReadOnly && (
                  <div style={{ fontSize: '0.58rem', color: '#bbb', textAlign: 'center', padding: '4px 0', fontStyle: 'italic' }}>
                    No options yet
                  </div>
                )}
              </div>

              {/* Add row button */}
              {!isReadOnly && (
                <button type="button" onClick={addRow}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    width: '100%', marginTop: '6px',
                    background: 'transparent', border: `1px dashed ${edgeColor}50`,
                    borderRadius: '6px', padding: '4px', cursor: 'pointer',
                    fontSize: '0.57rem', color: edgeColor, fontWeight: 700, fontFamily: 'inherit',
                  }}>
                  <Plus size={9} /> Add option
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
