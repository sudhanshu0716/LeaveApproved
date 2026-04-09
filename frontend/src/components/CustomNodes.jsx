import React from 'react';
import { Handle, Position, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { motion } from 'framer-motion';
import { MapPin, Building, Utensils, Camera, Plus, Clock, X } from 'lucide-react';

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
    <div style={{
      background: '#fff',
      border: '4px solid #000',
      boxShadow: '6px 6px 0px #000',
      minWidth: '280px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {data?.onDeleteNode && (
        <button type="button" onClick={handleDeleteNode} style={{ position: 'absolute', top: -15, right: -15, background: '#FF5D73', color: '#fff', border: '3px solid #000', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 10 }}>
          <X size={16} strokeWidth={4} />
        </button>
      )}

      <Handle type="target" position={Position.Left} style={{ background: '#000', width: '12px', height: '12px', border: '2px solid #fff', borderRadius: 0, left: '-8px' }} />
      
      {/* Header - Boarding Pass Style */}
      <div style={{ background: '#FF5D73', color: '#fff', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '4px solid #000', fontWeight: '900', textTransform: 'uppercase' }}>
        <MapPin size={20} />
        <input 
          className="nodrag"
          value={data.label || ''} 
          onChange={(e) => updateData('label', e.target.value)} 
          placeholder="ENTER DESTINATION"
          style={{ border: 'none', background: 'transparent', outline: 'none', color: '#fff', fontWeight: '900', textTransform: 'uppercase', width: '100%', flex: 1 }}
        />
        <div style={{ background: '#000', color: '#fff', padding: '2px 6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '4px' }}>DAY</span>
          <input 
            className="nodrag"
            value={data.day || ''}
            onChange={(e) => updateData('day', e.target.value)}
            style={{ width: '25px', background: 'transparent', border: 'none', color: '#FF90E8', fontWeight: '900', outline: 'none', textAlign: 'center' }}
            placeholder="-"
          />
        </div>
      </div>

      {/* Boarding Pass Flight Times */}
      <div style={{ display: 'flex', borderBottom: '4px solid #000', background: '#FFE600', fontWeight: 'bold' }}>
         <div style={{ flex: 1, padding: '5px 10px', borderRight: '4px solid #000', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>Arrival</span>
            <input className="nodrag" value={data.arrivalTime || ''} onChange={(e) => updateData('arrivalTime', e.target.value)} placeholder="00:00" style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '900', fontSize: '1rem', width: '100%' }} />
         </div>
         <div style={{ flex: 1, padding: '5px 10px', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>Departure</span>
            <input className="nodrag" value={data.departureTime || ''} onChange={(e) => updateData('departureTime', e.target.value)} placeholder="00:00" style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '900', fontSize: '1rem', width: '100%' }} />
         </div>
      </div>

      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8f8f8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Building size={16} /> 
          <input className="nodrag" value={data.rooms || ''} onChange={(e) => updateData('rooms', e.target.value)} placeholder="Hotel / Room" style={{ border: '2px solid #000', padding: '4px', width: '100%', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Utensils size={16} /> 
          <input className="nodrag" value={data.food || ''} onChange={(e) => updateData('food', e.target.value)} placeholder="Places to Eat" style={{ border: '2px solid #000', padding: '4px', width: '100%', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Camera size={16} /> 
          <input className="nodrag" value={data.activity || ''} onChange={(e) => updateData('activity', e.target.value)} placeholder="Places to Visit" style={{ border: '2px solid #000', padding: '4px', width: '100%', outline: 'none' }} />
        </div>

        {/* Dynamic Extra Details */}
        {(data.customFields || []).map((field, idx) => (
           <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
             <span style={{ fontSize: '12px', fontWeight: 'bold' }}>•</span>
             <input className="nodrag" value={field} onChange={(e) => updateCustomField(idx, e.target.value)} placeholder="Extra detail..." style={{ border: '2px solid #000', padding: '4px', width: '100%', outline: 'none', background: '#e0ffe0' }} />
           </div>
        ))}
        <button type="button" onClick={addCustomField} className="nodrag" style={{ background: '#000', color: '#fff', border: 'none', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 'bold' }}>
           <Plus size={16} /> ADD DETAIL
        </button>
      </div>
      
      <Handle type="source" position={Position.Right} style={{ background: '#000', width: '12px', height: '12px', border: '2px solid #fff', borderRadius: 0, right: '-8px' }} />
    </div>
  );
}

export function ReadOnlyCityNode({ data }) {
  return (
    <motion.div 
      initial={{ scale: 0, y: 50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
      whileHover={{ scale: 1.05, rotate: 0 }}
      className="mobile-node"
      style={{
        background: '#fff',
        border: '4px solid #000',
        boxShadow: '10px 10px 0px #000',
        minWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transform: 'rotate(-1deg)'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#000', width: '12px', height: '12px', border: '2px solid #fff', borderRadius: 0, left: '-8px' }} />
      
      {/* Boarding Pass Header */}
      <div style={{ background: '#FF5D73', color: '#000', borderBottom: '4px solid #000', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', textTransform: 'uppercase' }}>
           <MapPin size={24} /> {data.label || 'Unknown'}
         </h3>
         {data.day && (
           <div style={{ background: '#000', color: '#FF90E8', padding: '4px 10px', fontWeight: '900', fontSize: '1.2rem', boxShadow: '2px 2px 0px #fff', border: '2px solid #fff' }}>
             D-{data.day}
           </div>
         )}
      </div>

      {/* Boarding Pass Times Component (Always Displayed) */}
      <div style={{ display: 'flex', borderBottom: '4px solid #000', background: '#FFE600', color: '#000' }}>
         <div style={{ flex: 1, padding: '10px', borderRight: '4px solid #000', display: 'flex', flexDirection: 'column' }}>
           <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Arrival</span>
           <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{data.arrivalTime || '--:--'}</span>
         </div>
         <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column' }}>
           <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Departure</span>
           <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{data.departureTime || '--:--'}</span>
         </div>
      </div>

      {/* Details Area */}
      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#90E0EF' }}>
        {data.rooms && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
            <Building size={20} /> {data.rooms}
          </div>
        )}
        {data.food && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
            <Utensils size={20} /> {data.food}
          </div>
        )}
        {data.activity && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
            <Camera size={20} /> {data.activity}
          </div>
        )}

        {/* Dynamic Extra Details Readonly */}
        {data.customFields && data.customFields.length > 0 && (
          <div style={{ marginTop: '5px', paddingTop: '10px', borderTop: '2px dashed #000', display: 'flex', flexDirection: 'column', gap: '6px' }}>
             {data.customFields.map((field, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                   <span style={{ marginTop: '2px' }}>👉</span>
                   <span>{field}</span>
                </div>
             ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#000', width: '12px', height: '12px', border: '2px solid #fff', borderRadius: 0, right: '-8px' }} />
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
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#FFE600',
            padding: '10px 20px',
            border: '4px solid #000',
            borderRadius: '0px',
            fontSize: '1.2rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            pointerEvents: 'all',
            boxShadow: '6px 6px 0px #000',
            transformOrigin: 'center',
            rotate: '-2deg'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
            {data?.direction && data.direction !== 'Outbound' && (
               <span style={{ fontSize: '0.65rem', color: data.direction === 'Return' ? '#fff' : '#000', background: data.direction === 'Return' ? '#FF5D73' : '#fff', padding: '2px 6px', border: '2px solid #000', borderRadius: '4px', marginBottom: '2px', letterSpacing: '1px' }}>
                 {data.direction === 'Return' ? '⬅️ RETURN' : '🔄 CONNECTING'}
               </span>
            )}
            <span>{data?.transport || 'Travel'} {getTransportIcon(data?.transport)}</span>
            {data?.transportDetails && (
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{data.transportDetails}</span>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
