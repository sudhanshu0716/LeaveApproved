import React from 'react';
import { EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { motion } from 'framer-motion';
import { X, Plane, ArrowRightLeft } from 'lucide-react';

export default function CustomEdge({
  id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd, data
}) {
  const isReadOnly = data?.readOnly;
  const edgeIndex = data?.edgeIndex || 0;
  const customOffsetX = data?.customOffsetX || 0;
  const customOffsetY = data?.customOffsetY || 0;
  
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  let nx = 0, ny = 0;
  if(length > 0) {
      nx = -dy / length;
      ny = dx / length;
  }
  
  const isReturn = data?.direction === 'Return';
  const dynamicArc = data?.customArc || Math.max(100, length * 0.3);
  
  let autoOffsetAmount = 0;
  if (edgeIndex === 0) {
      autoOffsetAmount = isReturn ? dynamicArc : -dynamicArc;
  } else {
      const bundleMultiplier = 120; 
      autoOffsetAmount = (edgeIndex % 2 === 0 ? 1 : -1) * Math.ceil(edgeIndex / 2) * bundleMultiplier;
  }
  
  const controlX = sourceX + dx/2 + nx * autoOffsetAmount + customOffsetX;
  const controlY = sourceY + dy/2 + ny * autoOffsetAmount + customOffsetY;
  
  const edgePath = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;
  const labelX = sourceX + dx/2 + nx * (autoOffsetAmount * 0.5) + (customOffsetX * 0.5); 
  const labelY = sourceY + dy/2 + ny * (autoOffsetAmount * 0.5) + (customOffsetY * 0.5);

  const handleDelete = () => {
    if (data?.onDeleteEdge) data.onDeleteEdge(id);
  };

  const handleDragEnd = (event, info) => {
    if (!isReadOnly && data?.onDataChange) {
      data.onDataChange(id, 'customOffsetX', customOffsetX + info.offset.x * 2);
      data.onDataChange(id, 'customOffsetY', customOffsetY + info.offset.y * 2);
    }
  };

  const edgeColor = data?.color || '#000';
  const edgeStyle = data?.lineStyle === 'dashed' ? { strokeDasharray: '8 8' } : {};

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, ...edgeStyle, stroke: edgeColor, strokeWidth: 3, opacity: 1 }} />
      <EdgeLabelRenderer>
        {/* Outer div centres the label on the curve point; inner motion.div handles drag */}
        <div style={{ position: 'absolute', left: labelX, top: labelY, transform: 'translate(-50%, -50%)', pointerEvents: isReadOnly ? 'none' : 'all', zIndex: 1000 }} className="nopan">
          <motion.div
            drag={!isReadOnly}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="glass-panel"
            style={{
              padding: isReadOnly ? '10px 16px' : '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: isReadOnly ? '4px' : '10px',
              width: isReadOnly ? 'auto' : '160px',
              cursor: isReadOnly ? 'default' : 'grab',
              background: 'white',
              border: isReadOnly ? '2px solid #000' : '1.5px solid rgba(0,0,0,0.12)',
              boxShadow: isReadOnly ? '6px 6px 0px #000' : '0 4px 18px rgba(0,0,0,0.12)',
              borderRadius: isReadOnly ? '14px' : '14px'
            }}
          >
            {!isReadOnly && data?.onDeleteEdge && (
               <button type="button" onClick={handleDelete} style={{ position: 'absolute', top: -10, right: -10, background: '#9e2a2b', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                 <X size={14} />
               </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isReadOnly ? 'center' : 'stretch', color: '#000' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isReadOnly ? 'center' : 'flex-start' }}>
                 <span style={{ fontSize: isReadOnly ? '1.2rem' : '1rem' }}>
                    {(() => {
                       const t = (data?.transport || '').toLowerCase();
                       if (t.includes('flight')) return '✈️';
                       if (t.includes('train')) return '🚆';
                       if (t.includes('metro')) return '🚇';
                       if (t.includes('bus')) return '🚌';
                       if (t.includes('car') || t.includes('cab')) return '🚕';
                       if (t.includes('auto')) return '🛺';
                       if (t.includes('bike') || t.includes('scooter') || t.includes('cycle')) return '🛵';
                       if (t.includes('enfield') || t.includes('motorbike') || t.includes('motorcycle')) return '🏍️';
                       if (t.includes('ferry') || t.includes('boat') || t.includes('houseboat')) return '⛵';
                       if (t.includes('canoe') || t.includes('kayak') || t.includes('coracle') || t.includes('raft')) return '🚣';
                       if (t.includes('walk') || t.includes('trek') || t.includes('hike')) return '🥾';
                       if (t.includes('camel')) return '🐪';
                       if (t.includes('jeep') || t.includes('safari')) return '🚙';
                       return '🚀';
                     })()}
                 </span>
                 {isReadOnly ? (
                   <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.9rem', color: '#000' }}>{data?.transport || 'TRAVEL'}</span>
                 ) : (
                   <input 
                    className="modern-input"
                    value={data?.transport || ''} 
                    onChange={(e) => data?.onDataChange && data.onDataChange(id, 'transport', e.target.value)} 
                    placeholder="Mode"
                    style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1 }}
                  />
                 )}
              </div>
              
              {isReadOnly ? (
                data?.transportDetails && <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: '700', color: '#000' }}>{data.transportDetails}</span>
              ) : (
                <input 
                  className="modern-input"
                  value={data?.transportDetails || ''} 
                  onChange={(e) => data?.onDataChange && data.onDataChange(id, 'transportDetails', e.target.value)} 
                  placeholder="Ref / Flight #"
                  style={{ padding: '6px 10px', fontSize: '0.7rem', opacity: 0.8 }}
                />
              )}
            </div>
          </motion.div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
