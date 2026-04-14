import React from 'react';
import { Handle, Position, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { motion } from 'framer-motion';
import { MapPin, Building, Utensils, Camera, Plus, Clock, X, ChevronRight } from 'lucide-react';

const getTransportIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('flight') || t.includes('plane') || t.includes('air')) return '✈️';
  if (t.includes('bus')) return '🚌';
  if (t.includes('train')) return '🚆';
  if (t.includes('car') || t.includes('taxi') || t.includes('cab')) return '🚕';
  if (t.includes('boat') || t.includes('ship') || t.includes('cruise') || t.includes('ferry')) return '🚢';
  if (t.includes('walk') || t.includes('foot')) return '🚶‍♂️';
  if (t.includes('bike') || t.includes('cycle')) return '🚲';
  return '🚀';
};

export function CityNode({ data, id }) {
  const updateData = (key, val) => {
    if(data?.onChangeField) {
      data.onChangeField(id, key, val);
    }
  };

  const handleDeleteNode = () => {
    if(data?.onDeleteNode) data.onDeleteNode(id);
  };

  const addCustomField = () => {
    const fields = data.customFields || [];
    updateData('customFields', [...fields, '']);
  };

  const updateCustomField = (index, val) => {
    const fields = [...(data.customFields || [])];
    fields[index] = val;
    updateData('customFields', fields);
  };

  return (
    <div className="glass-panel" style={{
      minWidth: '320px',
      padding: '0',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.4)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      background: 'rgba(255, 255, 255, 0.95)'
    }}>
      {data?.onDeleteNode && (
        <button type="button" onClick={handleDeleteNode} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,0,0,0.1)', color: '#9e2a2b', border: 'none', borderRadius: '12px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <X size={18} />
        </button>
      )}

      <Handle type="target" position={Position.Left} style={{ background: 'var(--primary-green)', width: '12px', height: '12px', border: '2px solid #fff' }} />
      
      {/* Premium Header */}
      <div style={{ background: 'var(--primary-green)', color: '#fff', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={20} className="float-3d" />
          <input 
            className="nodrag"
            value={data.label || ''} 
            onChange={(e) => updateData('label', e.target.value)} 
            placeholder="DESTINATION NAME"
            style={{ border: 'none', background: 'transparent', outline: 'none', color: '#fff', fontWeight: '900', fontSize: '1.2rem', width: '100%', textTransform: 'uppercase' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start', padding: '4px 12px', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.8 }}>MARKER DAY</span>
          <input 
            className="nodrag"
            value={data.day || ''}
            onChange={(e) => updateData('day', e.target.value)}
            style={{ width: '30px', background: 'transparent', border: 'none', color: 'var(--accent-gold)', fontWeight: '900', outline: 'none', textAlign: 'center' }}
            placeholder="-"
          />
        </div>
      </div>

      {/* Time Matrix */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#fff' }}>
         <div style={{ flex: 1, padding: '16px 24px', borderRight: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Arrival</div>
            <input className="nodrag" value={data.arrivalTime || ''} onChange={(e) => updateData('arrivalTime', e.target.value)} placeholder="00:00" style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '900', fontSize: '1.1rem', width: '100%', color: 'var(--primary-green)' }} />
         </div>
         <div style={{ flex: 1, padding: '16px 24px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Departure</div>
            <input className="nodrag" value={data.departureTime || ''} onChange={(e) => updateData('departureTime', e.target.value)} placeholder="00:00" style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '900', fontSize: '1.1rem', width: '100%', color: 'var(--primary-green)' }} />
         </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Building size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary-green)' }} /> 
          <input className="nodrag modern-input" value={data.rooms || ''} onChange={(e) => updateData('rooms', e.target.value)} placeholder="Hotel / Sanctuary" style={{ paddingLeft: '40px', fontSize: '0.9rem' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <Utensils size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary-green)' }} /> 
          <input className="nodrag modern-input" value={data.food || ''} onChange={(e) => updateData('food', e.target.value)} placeholder="Fine Dining / Local Eats" style={{ paddingLeft: '40px', fontSize: '0.9rem' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <Camera size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary-green)' }} /> 
          <input className="nodrag modern-input" value={data.activity || ''} onChange={(e) => updateData('activity', e.target.value)} placeholder="Expedition / Sightseeing" style={{ paddingLeft: '40px', fontSize: '0.9rem' }} />
        </div>

        {/* Dynamic Detail Injector */}
        {(data.customFields || []).map((field, idx) => (
           <div key={idx} style={{ position: 'relative' }}>
             <ChevronRight size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--accent-gold)' }} />
             <input className="nodrag modern-input" value={field} onChange={(e) => updateCustomField(idx, e.target.value)} placeholder="Supplemental detail..." style={{ paddingLeft: '40px', fontSize: '0.85rem', background: 'var(--accent-mint)', border: 'none' }} />
           </div>
        ))}
        
        <button type="button" onClick={addCustomField} className="nodrag glass-btn" style={{ background: 'var(--accent-mint)', color: 'var(--primary-green)', border: 'none', fontSize: '0.8rem', justifyContent: 'center' }}>
           <Plus size={16} /> ATTACH SUPPLEMENTARY DATA
        </button>
      </div>
      
      <Handle type="source" position={Position.Right} style={{ background: 'var(--primary-green)', width: '12px', height: '12px', border: '2px solid #fff' }} />
    </div>
  );
}

export function ReadOnlyCityNode({ data }) {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass-panel"
      style={{
        minWidth: '340px',
        padding: '0',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: 'var(--shadow-premium)',
        border: '1px solid rgba(255,255,255,0.3)'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      
      {/* Visitor Header */}
      <div style={{ background: 'var(--primary-green)', color: 'white', padding: '24px', position: 'relative', overflow: 'hidden' }}>
         <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
               <span style={{ background: 'var(--accent-gold)', color: 'var(--primary-green)', padding: '4px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900' }}>
                 DAY {data.day || 'X'}
               </span>
               <MapPin size={24} className="float-3d" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{data.label || 'Destination'}</h3>
         </div>
         <div style={{ position: 'absolute', right: '-10%', bottom: '-10%', opacity: 0.1, transform: 'rotate(-15deg)' }}>
            <MapPin size={120} />
         </div>
      </div>

      {/* Logistics Overlay */}
      <div style={{ display: 'flex', background: 'var(--accent-mint)', color: 'var(--primary-green)' }}>
         <div style={{ flex: 1, padding: '16px 24px', borderRight: '1px solid rgba(27, 67, 50, 0.1)' }}>
           <div style={{ fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.7, marginBottom: '2px' }}>Arrival</div>
           <div style={{ fontSize: '1.3rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Clock size={16} /> {data.arrivalTime || '--:--'}
           </div>
         </div>
         <div style={{ flex: 1, padding: '16px 24px' }}>
           <div style={{ fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.7, marginBottom: '2px' }}>Departure</div>
           <div style={{ fontSize: '1.3rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Clock size={16} /> {data.departureTime || '--:--'}
           </div>
         </div>
      </div>

      {/* Discovery Points */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {[
          { icon: <Building size={18} />, label: 'Sanctuary', value: data.rooms },
          { icon: <Utensils size={18} />, label: 'Culinary', value: data.food },
          { icon: <Camera size={18} />, label: 'Expedition', value: data.activity }
        ].map((item, i) => item.value && (
          <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--primary-green)', marginTop: '2px' }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-dark)' }}>{item.value}</div>
            </div>
          </div>
        ))}

        {data.customFields && data.customFields.filter(f => f).length > 0 && (
          <div style={{ marginTop: '4px', padding: '16px', background: '#f8fdfa', borderRadius: '16px', borderLeft: '4px solid var(--accent-gold)' }}>
             {data.customFields.filter(f => f).map((field, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-green)', marginBottom: idx === data.customFields.length-1 ? 0 : '10px' }}>
                   <MapPin size={14} style={{ marginTop: '3px', flexShrink: 0 }} />
                   <span>{field}</span>
                </div>
             ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </motion.div>
  );
}

export function ReadOnlyEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }) {
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
  
  const autoOffsetAmount = (edgeIndex % 2 === 0 ? 1 : -1) * Math.ceil(edgeIndex / 2) * 80;
  const controlX = sourceX + dx/2 + nx * autoOffsetAmount + customOffsetX;
  const controlY = sourceY + dy/2 + ny * autoOffsetAmount + customOffsetY;
  const edgePath = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;
  const labelX = sourceX + dx/2 + nx * (autoOffsetAmount * 0.5) + (customOffsetX * 0.5); 
  const labelY = sourceY + dy/2 + ny * (autoOffsetAmount * 0.5) + (customOffsetY * 0.5);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: 'rgba(27, 67, 50, 0.4)', strokeWidth: 3 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: 'var(--accent-gold)',
            padding: '12px 24px',
            borderRadius: '16px',
            fontSize: '0.85rem',
            fontWeight: '900',
            color: 'var(--primary-green)',
            boxShadow: 'var(--shadow-premium)',
            border: '1px solid rgba(255,255,255,0.4)',
            pointerEvents: 'all'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
            {data?.direction && data.direction !== 'Outbound' && (
               <span style={{ fontSize: '0.6rem', background: 'var(--primary-green)', color: 'white', padding: '2px 8px', borderRadius: '6px', marginBottom: '4px' }}>
                 {data.direction.toUpperCase()}
               </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               {getTransportIcon(data?.transport)} <span>{data?.transport || 'TRAVEL'}</span>
            </div>
            {data?.transportDetails && (
              <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: '700' }}>{data.transportDetails}</span>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
