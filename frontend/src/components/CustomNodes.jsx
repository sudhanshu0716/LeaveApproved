// Mission Cartography Protocol: High-Fidelity Sync Active
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
  const isReadOnly = data.readOnly;
  const updateData = (key, val) => {
    if(data?.onChangeField) {
      data.onChangeField(id, key, val);
    }
  };

  const handleDeleteNode = () => {
    if(data?.onDeleteNode) data.onDeleteNode(id);
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
      {!isReadOnly && data?.onDeleteNode && (
        <button type="button" onClick={handleDeleteNode} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,0,0,0.1)', color: '#9e2a2b', border: 'none', borderRadius: '12px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <X size={18} />
        </button>
      )}

      <Handle type="target" position={Position.Left} style={{ background: nodeColor, width: '12px', height: '12px', border: '2px solid #000', borderRadius: 0, opacity: isReadOnly ? 0 : 1 }} />
      
      {/* Premium Header */}
      <div style={{ background: nodeColor, color: '#fff', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={20} className="float-3d" />
          {isReadOnly ? (
            <div style={{ fontWeight: '900', fontSize: '1.2rem', width: '100%', textTransform: 'uppercase' }}>{data.label || 'DESTINATION'}</div>
          ) : (
            <input 
              className="nodrag"
              value={data.label || ''} 
              onChange={(e) => updateData('label', e.target.value)} 
              placeholder="DESTINATION NAME"
              style={{ border: 'none', background: 'transparent', outline: 'none', color: '#fff', fontWeight: '900', fontSize: '1.2rem', width: '100%', textTransform: 'uppercase' }}
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: '4px 12px', borderRadius: '10px', backdropFilter: 'blur(4px)' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>MARKER DAY</span>
          {isReadOnly ? (
            <div style={{ width: '40px', fontWeight: '900', fontSize: '0.7rem' }}>{data.markerDay || 'X'}</div>
          ) : (
            <input 
              className="nodrag"
              value={data.markerDay || ''}
              onChange={(e) => updateData('markerDay', e.target.value)}
              style={{ width: '40px', background: 'transparent', border: 'none', color: '#fff', fontWeight: '900', outline: 'none', textAlign: 'center', fontSize: '0.7rem' }}
              placeholder="-"
            />
          )}
        </div>
      </div>

      {/* Time Matrix */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#fff' }}>
         <div style={{ flex: 1, padding: '16px 24px', borderRight: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Arrival</div>
            {isReadOnly ? (
              <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--primary-green)' }}>{data.arrivalTime || '--:--'}</div>
            ) : (
              <input className="nodrag" value={data.arrivalTime || ''} onChange={(e) => updateData('arrivalTime', e.target.value)} placeholder="00:00" style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '900', fontSize: '1.1rem', width: '100%', color: 'var(--primary-green)' }} />
            )}
         </div>
         <div style={{ flex: 1, padding: '16px 24px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Departure</div>
            {isReadOnly ? (
              <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--primary-green)' }}>{data.departureTime || '--:--'}</div>
            ) : (
              <input className="nodrag" value={data.departureTime || ''} onChange={(e) => updateData('departureTime', e.target.value)} placeholder="00:00" style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '900', fontSize: '1.1rem', width: '100%', color: 'var(--primary-green)' }} />
            )}
         </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Building size={16} style={{ color: 'var(--primary-green)' }} /> 
          {isReadOnly ? (
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>{data.rooms || '---'}</div>
          ) : (
            <input className="nodrag modern-input" value={data.rooms || ''} onChange={(e) => updateData('rooms', e.target.value)} placeholder="Hotel / Sanctuary" style={{ flex: 1, fontSize: '0.9rem' }} />
          )}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Utensils size={16} style={{ color: 'var(--primary-green)' }} /> 
          {isReadOnly ? (
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>{data.food || '---'}</div>
          ) : (
            <input className="nodrag modern-input" value={data.food || ''} onChange={(e) => updateData('food', e.target.value)} placeholder="Fine Dining / Local Eats" style={{ flex: 1, fontSize: '0.9rem' }} />
          )}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Camera size={16} style={{ color: 'var(--primary-green)' }} /> 
          {isReadOnly ? (
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>{data.activity || '---'}</div>
          ) : (
            <input className="nodrag modern-input" value={data.activity || ''} onChange={(e) => updateData('activity', e.target.value)} placeholder="Activity / Sightseeing" style={{ flex: 1, fontSize: '0.9rem' }} />
          )}
        </div>

        {/* Dynamic Detail Injector */}
        {(data.customFields || []).map((field, idx) => field && (
           <div key={idx} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--accent-mint)', padding: '8px 12px', borderRadius: '8px' }}>
             <ChevronRight size={14} style={{ color: 'var(--accent-gold)' }} />
             {isReadOnly ? (
               <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>{field}</div>
             ) : (
               <input className="nodrag" value={field} onChange={(e) => updateCustomField(idx, e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.85rem' }} />
             )}
           </div>
        ))}
        
        {!isReadOnly && (
          <button type="button" onClick={() => updateData('customFields', [...(data.customFields || []), ''])} className="nodrag glass-btn" style={{ background: 'var(--accent-mint)', color: 'var(--primary-green)', border: 'none', fontSize: '0.8rem', justifyContent: 'center' }}>
             <Plus size={16} /> ATTACH SUPPLEMENTARY DATA
          </button>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} style={{ background: nodeColor, width: '12px', height: '12px', border: '2px solid #000', borderRadius: 0, opacity: isReadOnly ? 0 : 1 }} />
    </div>
  );
}

export function NoteNode({ data, id }) {
  const isReadOnly = data.readOnly;
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
       {!isReadOnly && (
         <button type="button" onClick={handleDeleteNode} style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#000', color: '#fff', border: 'none', borderRadius: '5px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
            <X size={14} />
         </button>
       )}
       <Handle type="target" position={Position.Top} style={{ background: '#000', borderRadius: 0, opacity: isReadOnly ? 0 : 1 }} />
       {isReadOnly ? (
         <div style={{ width: '100%', minHeight: '80px', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#333' }}>{data.label || ''}</div>
       ) : (
         <textarea 
            className="nodrag"
            value={data.label || ''}
            onChange={(e) => updateData('label', e.target.value)}
            placeholder="ADD NOTE..."
            style={{ width: '100%', height: '80px', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'monospace', resize: 'none' }}
         />
       )}
       <Handle type="source" position={Position.Bottom} style={{ background: '#000', borderRadius: 0, opacity: isReadOnly ? 0 : 1 }} />
    </div>
  );
}

export function StickerNode({ data, id }) {
  const isReadOnly = data.readOnly;
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
    <div style={{ position: 'relative', cursor: isReadOnly ? 'default' : 'grab', padding: '10px' }} className="float-3d">
       {!isReadOnly && (
         <button type="button" onClick={handleDeleteNode} style={{ position: 'absolute', top: -5, right: -5, background: '#ae2012', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>×</button>
       )}
       <div style={{ color: data.color || '#1b4332', filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.2))' }}>
         {icons[data.iconType] || icons.marker}
       </div>
    </div>
  );
}

export function HubNode({ data, id }) {
  const isReadOnly = data.readOnly;
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
             {isReadOnly ? (
               <div style={{ fontWeight: '950', fontSize: '1.2rem', width: '100%', textTransform: 'uppercase', color: textColor }}>{data.label || 'DESTINATION'}</div>
             ) : (
               <input className="nodrag" value={data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="DESTINATION NAME" style={{ border: 'none', background: 'transparent', outline: 'none', color: textColor, fontWeight: '950', fontSize: '1.2rem', width: '100%', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }} />
             )}
             {!isReadOnly && (
               <button type="button" onClick={handleDeleteNode} style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', opacity: 0.5 }}><X size={18} /></button>
             )}
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', padding: '4px 12px', borderRadius: '10px' }}>
             <span style={{ fontSize: '0.55rem', fontWeight: '900', color: textColor, textTransform: 'uppercase' }}>MARKER DAY</span>
             {isReadOnly ? (
               <div style={{ width: '40px', fontWeight: '900', fontSize: '0.65rem', color: textColor }}>{data.markerDay || 'X'}</div>
             ) : (
               <input className="nodrag" value={data.markerDay || ''} onChange={(e) => updateData('markerDay', e.target.value)} style={{ width: '50px', background: 'transparent', border: 'none', color: textColor, fontWeight: '900', outline: 'none', textAlign: 'center', fontSize: '0.65rem' }} placeholder="-" />
             )}
           </div>
        </div>
       <div style={{ display: 'flex', borderTop: '2px solid #000', color: '#000' }}>
         <div style={{ flex: 1, padding: '10px 15px', borderRight: '2px solid #000' }}>
           <div style={{ fontSize: '0.5rem', fontWeight: 900, opacity: 0.6, textTransform: 'uppercase', marginBottom: '4px' }}>ARRIVAL</div>
           {isReadOnly ? (
             <div style={{ fontWeight: '900', fontSize: '0.8rem', color: '#000' }}>{data.arrivalTime || '--:--'}</div>
           ) : (
             <input className="nodrag" value={data.arrivalTime || ''} onChange={(e) => updateData('arrivalTime', e.target.value)} placeholder="00:00" style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '900', fontSize: '0.8rem', width: '100%', color: '#000' }} />
           )}
         </div>
         <div style={{ flex: 1, padding: '10px 15px' }}>
           <div style={{ fontSize: '0.5rem', fontWeight: 900, opacity: 0.6, textTransform: 'uppercase', marginBottom: '4px' }}>DEPARTURE</div>
           {isReadOnly ? (
             <div style={{ fontWeight: '900', fontSize: '0.8rem', color: '#000' }}>{data.departureTime || '--:--'}</div>
           ) : (
             <input className="nodrag" value={data.departureTime || ''} onChange={(e) => updateData('departureTime', e.target.value)} placeholder="00:00" style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '900', fontSize: '0.8rem', width: '100%', color: '#000' }} />
           )}
         </div>
       </div>
       <Handle type="target" position={Position.Left} style={{ background: '#000', borderRadius: 0, width: '12px', height: '12px', left: '-7px', opacity: isReadOnly ? 0 : 1 }} />
       <Handle type="source" position={Position.Right} style={{ background: '#000', borderRadius: 0, width: '12px', height: '12px', right: '-7px', opacity: isReadOnly ? 0 : 1 }} />
    </div>
  );
}
