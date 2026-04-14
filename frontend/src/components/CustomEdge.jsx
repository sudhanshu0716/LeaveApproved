import React from 'react';
import { EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { motion } from 'framer-motion';
import { X, Plane, ArrowRightLeft } from 'lucide-react';

export default function CustomEdge({
  id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd, data
}) {
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
  const dynamicArc = Math.max(100, length * 0.3);
  
  let autoOffsetAmount = 0;
  if (edgeIndex === 0) {
      autoOffsetAmount = isReturn ? dynamicArc : -dynamicArc;
  } else {
      autoOffsetAmount = (edgeIndex % 2 === 0 ? 1 : -1) * Math.ceil(edgeIndex / 2) * dynamicArc;
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
    if (data?.onDataChange) {
      data.onDataChange(id, 'customOffsetX', customOffsetX + info.offset.x * 2);
      data.onDataChange(id, 'customOffsetY', customOffsetY + info.offset.y * 2);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: 'var(--primary-green)', strokeWidth: 3, opacity: 0.4 }} />
      <EdgeLabelRenderer>
        <div style={{ position: 'absolute', left: labelX, top: labelY, pointerEvents: 'all', zIndex: 1000 }} className="nopan">
          <motion.div
            drag
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="glass-panel"
            style={{
              x: '-50%', y: '-50%',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '180px',
              cursor: 'grab',
              background: 'white',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: 'var(--shadow-premium)'
            }}
          >
            {data?.onDeleteEdge && (
               <button type="button" onClick={handleDelete} style={{ position: 'absolute', top: -10, right: -10, background: '#9e2a2b', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                 <X size={14} />
               </button>
            )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
            <ArrowRightLeft size={14} color="var(--primary-green)" />
            <select
              value={data?.direction || 'Outbound'}
              onChange={(e) => {
                if (data?.onDataChange) data.onDataChange(id, 'direction', e.target.value);
              }}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontWeight: '900', fontSize: '0.7rem', color: 'var(--primary-green)', cursor: 'inherit' }}
            >
              <option value="Outbound">OUTBOUND</option>
              <option value="Return">RETURN TRIP</option>
              <option value="Connecting">CONNECTING</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
               <Plane size={12} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--primary-green)', opacity: 0.6 }} />
               <input 
                className="modern-input"
                value={data?.transport || ''} 
                onChange={(e) => {
                  if (data?.onDataChange) data.onDataChange(id, 'transport', e.target.value);
                }} 
                placeholder="Mode"
                style={{ padding: '6px 10px 6px 28px', fontSize: '0.75rem' }}
              />
            </div>
            <input 
              className="modern-input"
              value={data?.transportDetails || ''} 
              onChange={(e) => {
                if (data?.onDataChange) data.onDataChange(id, 'transportDetails', e.target.value);
              }} 
              placeholder="Ref / Flight #"
              style={{ padding: '6px 10px', fontSize: '0.7rem', opacity: 0.8 }}
            />
          </div>
        </motion.div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
