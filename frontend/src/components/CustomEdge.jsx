import React from 'react';
import { EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

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
  const dynamicArc = Math.max(100, length * 0.3); // Ensure a dramatic curve relative to distance
  
  let autoOffsetAmount = 0;
  if (edgeIndex === 0) {
      // Auto-arc primary edges to avoid slicing linearly placed nodes (Return flights go under, Outbound goes over)
      autoOffsetAmount = isReturn ? dynamicArc : -dynamicArc;
  } else {
      // For multiple overlapping edges, mathematically stack them with alternating massive arcs
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
      // Because a quadratic curve apex moves half the displacement of its control point, 
      // we double the literal dragged pixels to sync the arc visually perfectly!
      data.onDataChange(id, 'customOffsetX', customOffsetX + info.offset.x * 2);
      data.onDataChange(id, 'customOffsetY', customOffsetY + info.offset.y * 2);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div style={{ position: 'absolute', left: labelX, top: labelY, pointerEvents: 'all', zIndex: 1000 }} className="nopan">
          <motion.div
            drag
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{
              x: '-50%', y: '-50%',
              background: '#FFE600',
              padding: '5px 10px',
              border: '3px solid #000',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '4px 4px 0px #000',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              width: '140px',
              cursor: 'grab'
            }}
          >
            {data?.onDeleteEdge && (
               <button type="button" onClick={handleDelete} style={{ position: 'absolute', top: -15, right: -15, background: '#FF5D73', color: '#fff', border: '3px solid #000', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                 <X size={14} strokeWidth={4} />
               </button>
            )}

          <select
            value={data?.direction || 'Outbound'}
            onChange={(e) => {
              if (data?.onDataChange) data.onDataChange(id, 'direction', e.target.value);
            }}
            style={{ border: 'none', borderBottom: '2px solid #000', background: 'transparent', outline: 'none', width: '100%', fontWeight: 900, fontFamily: 'Space Grotesk', fontSize: '10px', cursor: 'inherit' }}
          >
            <option value="Outbound">➡️ Outbound</option>
            <option value="Return">⬅️ Return Trip</option>
            <option value="Connecting">🔄 Connecting</option>
          </select>

          <input 
            value={data?.transport || ''} 
            onChange={(e) => {
              if (data?.onDataChange) data.onDataChange(id, 'transport', e.target.value);
            }} 
            placeholder="Transport Mode"
            style={{ border: 'none', borderBottom: '2px solid #000', background: 'transparent', outline: 'none', width: '100%', fontWeight: 900, fontFamily: 'Space Grotesk' }}
          />
          <input 
            value={data?.transportDetails || ''} 
            onChange={(e) => {
              if (data?.onDataChange) data.onDataChange(id, 'transportDetails', e.target.value);
            }} 
            placeholder="Flight # / Train #"
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontWeight: 700, fontFamily: 'Space Grotesk', fontSize: '10px' }}
          />
        </motion.div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
