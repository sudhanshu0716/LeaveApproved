import React from 'react';
import { Handle, Position, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { motion } from 'framer-motion';
import { MapPin, Building, Utensils, Camera, Plus, Clock, X, ChevronRight, Pencil, Tent, GraduationCap, Sun, CloudRain, Snowflake, AlertTriangle } from 'lucide-react';

const getContrastColor = (hexColor) => {
  if (!hexColor || hexColor === 'transparent') return '#000';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000' : '#fff';
};

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

  const nodeColor = data.color || '#1b4332';

  return (
    <div style={{
      minWidth: '320px',
      padding: '0',
      overflow: 'hidden',
      border: '2px solid #000',
      boxShadow: '8px 8px 0px rgba(0,0,0,1)',
      background: '#fff',
      borderRadius: '0px'
    }}>
      {data?.onDeleteNode && (
        <button type="button" onClick={handleDeleteNode} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,0,0,0.1)', color: '#9e2a2b', border: 'none', borderRadius: '12px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <X size={18} />
        </button>
      )}

      <Handle type="target" position={Position.Left} style={{ background: nodeColor, width: '12px', height: '12px', border: '2px solid #000', borderRadius: 0 }} />
      
      {/* Premium Header */}
      <div style={{ background: nodeColor, color: '#fff', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: '4px 12px', borderRadius: '10px', backdropFilter: 'blur(4px)' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>MARKER DAY</span>
          <input 
            className="nodrag"
            value={data.markerDay || ''}
            onChange={(e) => updateData('markerDay', e.target.value)}
            style={{ width: '60px', background: 'transparent', border: 'none', color: '#fff', fontWeight: '900', outline: 'none', textAlign: 'center', fontSize: '0.7rem' }}
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
      
      <Handle type="source" position={Position.Right} style={{ background: nodeColor, width: '12px', height: '12px', border: '2px solid #000', borderRadius: 0 }} />
    </div>
  );
}

export function ReadOnlyCityNode({ data }) {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{ 
        width: '400px', 
        background: 'white', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid #eee',
        borderRadius: '32px',
        overflow: 'hidden'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      
      {/* Vibrant Header */}
      <div style={{ background: '#1b4332', color: 'white', padding: '30px', position: 'relative' }}>
         <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
               <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', padding: '6px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '1px' }}>
                 DAY {data.markerDay || 'X'}
               </span>
               <div style={{ color: '#ffb703' }}>
                 <MapPin size={24} fill="#ffb703" />
               </div>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{data.label || 'Destination'}</h3>
         </div>
      </div>
 
      {/* Logistics Telemetry */}
      <div style={{ display: 'flex', background: '#f8fdf9', borderBottom: '1px solid #edf5ee' }}>
         <div style={{ flex: 1, padding: '20px 24px', borderRight: '1px solid #edf5ee' }}>
           <div style={{ fontSize: '0.6rem', fontWeight: '900', textTransform: 'uppercase', color: '#1b4332', opacity: 0.5, letterSpacing: '1.5px', marginBottom: '6px' }}>ARRIVAL</div>
           <div style={{ fontSize: '1.3rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', color: '#2d6a4f' }}>
             <Clock size={16} /> {data.arrivalTime || '--:--'}
           </div>
         </div>
         <div style={{ flex: 1, padding: '20px 24px' }}>
           <div style={{ fontSize: '0.6rem', fontWeight: '900', textTransform: 'uppercase', color: '#1b4332', opacity: 0.5, letterSpacing: '1.5px', marginBottom: '6px' }}>DEPARTURE</div>
           <div style={{ fontSize: '1.3rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', color: '#2d6a4f' }}>
             <Clock size={16} /> {data.departureTime || '--:--'}
           </div>
         </div>
      </div>
 
      {/* Discovery Points */}
      <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '22px', background: 'white' }}>
        {[
          { icon: <Building size={18} />, label: 'SANCTUARY', value: data.rooms, color: '#4361ee' },
          { icon: <Utensils size={18} />, label: 'CULINARY', value: data.food, color: '#f72585' },
          { icon: <Camera size={18} />, label: 'EXPEDITION', value: data.activity, color: '#4cc9f0' }
        ].map((item, i) => item.value && (
          <div key={i} style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
            <div style={{ color: item.color, background: `${item.color}15`, padding: '10px', borderRadius: '12px' }}>{item.icon}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: '900', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>{item.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#333' }}>{item.value}</div>
            </div>
          </div>
        ))}
 
        {data.customFields && data.customFields.filter(f => f).length > 0 && (
          <div style={{ marginTop: '10px', padding: '20px', background: '#f0f4f8', borderRadius: '20px', borderLeft: '5px solid #1b4332' }}>
             {data.customFields.filter(f => f).map((field, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '0.9rem', fontWeight: '600', color: '#444', marginBottom: idx === data.customFields.length-1 ? 0 : '14px' }}>
                   <div style={{ color: '#1b4332', marginTop: '4px' }}><ChevronRight size={14} /></div>
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
export function NoteNode({ data, id }) {
  const updateData = (key, val) => {
     if(data?.onChangeField) data.onChangeField(id, key, val);
  };

  const handleDeleteNode = () => {
    if(data?.onDeleteNode) data.onDeleteNode(id);
  };

  return (
    <div style={{
      padding: '20px',
      background: '#fffbe6',
      border: '2px solid #000',
      boxShadow: '6px 6px 0px rgba(0,0,0,1)',
      minWidth: '200px',
      position: 'relative'
    }}>
       <button type="button" onClick={handleDeleteNode} style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#000', color: '#fff', border: 'none', borderRadius: '5px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={14} />
       </button>
       <Handle type="target" position={Position.Top} style={{ background: '#000', borderRadius: 0 }} />
       <textarea 
          className="nodrag"
          value={data.label || ''}
          onChange={(e) => updateData('label', e.target.value)}
          placeholder="MISSION NOTE..."
          style={{ width: '100%', height: '80px', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'monospace', resize: 'none' }}
       />
       <Handle type="source" position={Position.Bottom} style={{ background: '#000', borderRadius: 0 }} />
    </div>
  );
}

export function StickerNode({ data, id }) {
  const handleDeleteNode = () => { if(data?.onDeleteNode) data.onDeleteNode(id); };
  const size = data.size || 28;
  
  const icons = {
    camera: <Camera size={size} />,
    food: <Utensils size={size} />,
    camp: <Tent size={size} />,
    marker: <MapPin size={size} />,
    sun: <Sun size={size} />,
    rain: <CloudRain size={size} />,
    snow: <Snowflake size={size} />,
    danger: <AlertTriangle size={size} />
  };

  return (
    <div style={{ position: 'relative', cursor: 'grab', padding: '10px' }} className="float-3d">
       <button type="button" onClick={handleDeleteNode} style={{ position: 'absolute', top: -5, right: -5, background: '#ae2012', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>×</button>
       <div style={{ color: data.color || '#1b4332', filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.2))' }}>
         {icons[data.iconType] || icons.marker}
       </div>
    </div>
  );
}

export function HubNode({ data, id }) {
  const updateData = (key, val) => { if(data?.onChangeField) data.onChangeField(id, key, val); };
  const handleDeleteNode = () => { if(data?.onDeleteNode) data.onDeleteNode(id); };
  const nodeColor = data.color || '#1b4332';
  const textColor = getContrastColor(nodeColor);

  return (
    <div style={{ 
      minWidth: '280px', 
      background: '#fff', 
      border: '3px solid #000', 
      boxShadow: '10px 10px 0px rgba(0,0,0,1)',
      overflow: 'hidden',
      borderRadius: '24px'
    }}>
        <div style={{ background: nodeColor, padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '3px solid #000' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <MapPin size={22} color={textColor} />
             <input className="nodrag" value={data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="DESTINATION NAME" style={{ border: 'none', background: 'transparent', outline: 'none', color: textColor, fontWeight: '950', fontSize: '1.2rem', width: '100%', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }} />
             <button type="button" onClick={handleDeleteNode} style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', opacity: 0.5 }}><X size={18} /></button>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: '4px 12px', borderRadius: '10px' }}>
             <span style={{ fontSize: '0.55rem', fontWeight: '900', color: textColor, textTransform: 'uppercase' }}>MARKER DAY</span>
             <input className="nodrag" value={data.markerDay || ''} onChange={(e) => updateData('markerDay', e.target.value)} style={{ width: '50px', background: 'transparent', border: 'none', color: textColor, fontWeight: '900', outline: 'none', textAlign: 'center', fontSize: '0.65rem' }} placeholder="-" />
           </div>
        </div>
       <div style={{ display: 'flex', borderTop: '2px solid #000' }}>
         <div style={{ flex: 1, padding: '10px 15px', borderRight: '2px solid #000' }}>
           <div style={{ fontSize: '0.5rem', fontWeight: 900, opacity: 0.6, textTransform: 'uppercase', marginBottom: '4px' }}>ARRIVAL</div>
           <input className="nodrag" value={data.arrivalTime || ''} onChange={(e) => updateData('arrivalTime', e.target.value)} placeholder="00:00" style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '900', fontSize: '0.8rem', width: '100%' }} />
         </div>
         <div style={{ flex: 1, padding: '10px 15px' }}>
           <div style={{ fontSize: '0.5rem', fontWeight: 900, opacity: 0.6, textTransform: 'uppercase', marginBottom: '4px' }}>DEPARTURE</div>
           <input className="nodrag" value={data.departureTime || ''} onChange={(e) => updateData('departureTime', e.target.value)} placeholder="00:00" style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '900', fontSize: '0.8rem', width: '100%' }} />
         </div>
       </div>
       <Handle type="target" position={Position.Left} style={{ background: '#000', borderRadius: 0, width: '12px', height: '12px', left: '-7px' }} />
       <Handle type="source" position={Position.Right} style={{ background: '#000', borderRadius: 0, width: '12px', height: '12px', right: '-7px' }} />
    </div>
  );
}
