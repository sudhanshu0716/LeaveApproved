// Mission Cartography Protocol: High-Fidelity Sync Active
import React from 'react';
import { Handle, Position, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { motion } from 'framer-motion';
import { MapPin, Building, Utensils, Camera, Plus, Clock, X, ChevronRight, Pencil, Tent, GraduationCap, Sun, CloudRain, Snowflake, AlertTriangle, Star, DollarSign, CalendarDays, IndianRupee } from 'lucide-react';

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

  const fieldRow = (icon, value, placeholder, key) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
      <span style={{ color: nodeColor, flexShrink: 0, opacity: 0.85 }}>{icon}</span>
      {isReadOnly ? (
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: value ? '#222' : '#bbb' }}>{value || placeholder}</span>
      ) : (
        <input className="nodrag" value={value || ''} onChange={e => updateData(key, e.target.value)} placeholder={placeholder}
          style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.88rem', fontWeight: 600, color: '#222', fontFamily: 'inherit' }} />
      )}
    </div>
  );

  return (
    <div style={{ minWidth: '300px', maxWidth: '340px', background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.07)' }}>

      <Handle type="target" position={Position.Left} style={{ background: nodeColor, width: '12px', height: '12px', border: '2px solid white', borderRadius: '50%', opacity: isReadOnly ? 0 : 1 }} />

      {/* Header */}
      <div style={{ background: nodeColor, padding: '18px 20px 16px', position: 'relative' }}>
        {!isReadOnly && data?.onDeleteNode && (
          <button type="button" onClick={handleDeleteNode} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.2)', color: '#fff', border: 'none', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
            <X size={14} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <MapPin size={16} color="rgba(255,255,255,0.7)" />
          {isReadOnly ? (
            <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{data.label || 'DESTINATION'}</span>
          ) : (
            <input className="nodrag" value={data.label || ''} onChange={e => updateData('label', e.target.value)} placeholder="City name"
              style={{ border: 'none', background: 'transparent', outline: 'none', color: '#fff', fontWeight: 900, fontSize: '1.15rem', width: '100%', textTransform: 'uppercase', fontFamily: 'inherit' }} />
          )}
        </div>
        {/* Arrival / Departure row */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Arrival', key: 'arrivalTime', val: data.arrivalTime },
            { label: 'Departure', key: 'departureTime', val: data.departureTime },
          ].map(({ label, key, val }) => (
            <div key={key} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '8px 10px' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{label}</div>
              {isReadOnly ? (
                <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#fff' }}>{val || '--:--'}</div>
              ) : (
                <input className="nodrag" value={val || ''} onChange={e => updateData(key, e.target.value)} placeholder="HH:MM"
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 900, fontSize: '0.95rem', width: '100%', color: '#fff', fontFamily: 'inherit' }} />
              )}
            </div>
          ))}
          {/* Day badge */}
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '52px' }}>
            <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Day</div>
            {isReadOnly ? (
              <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#fff' }}>{data.markerDay || '—'}</div>
            ) : (
              <input className="nodrag" value={data.markerDay || ''} onChange={e => updateData('markerDay', e.target.value)} placeholder="1"
                style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 900, fontSize: '0.95rem', width: '100%', color: '#fff', textAlign: 'center', fontFamily: 'inherit' }} />
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {fieldRow(<Building size={15} />, data.rooms, 'Hotel / Stay', 'rooms')}
        {fieldRow(<Utensils size={15} />, data.food, 'Food / Restaurant', 'food')}
        {fieldRow(<Camera size={15} />, data.activity, 'Activity / Sightseeing', 'activity')}

        {/* Extra fields */}
        {(data.customFields || []).map((field, idx) => (field !== null && field !== undefined) && (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f0faf4', borderRadius: '10px', borderLeft: `3px solid ${nodeColor}` }}>
            <ChevronRight size={12} style={{ color: nodeColor, flexShrink: 0 }} />
            {isReadOnly ? (
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333', flex: 1 }}>{field}</span>
            ) : (
              <input className="nodrag" value={field} onChange={e => updateCustomField(idx, e.target.value)} placeholder="Add detail..."
                style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.82rem', fontWeight: 600, color: '#333', fontFamily: 'inherit' }} />
            )}
            {!isReadOnly && (
              <button type="button" onClick={() => { const f = [...(data.customFields || [])]; f.splice(idx, 1); updateData('customFields', f); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ae2012', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {!isReadOnly && (
          <button type="button" onClick={() => updateData('customFields', [...(data.customFields || []), ''])} className="nodrag"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', background: '#f0faf4', color: nodeColor, border: `1.5px dashed ${nodeColor}`, borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', opacity: 0.8 }}>
            <Plus size={13} /> Add Detail
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: nodeColor, width: '12px', height: '12px', border: '2px solid white', borderRadius: '50%', opacity: isReadOnly ? 0 : 1 }} />
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

// ── DAY BANNER NODE ────────────────────────────────────────────────────────────
export function DayBannerNode({ data, id }) {
  const isReadOnly = data.readOnly;
  const updateData = (key, val) => { if (data?.onChangeField) data.onChangeField(id, key, val); };
  const handleDelete = () => { if (data?.onDeleteNode) data.onDeleteNode(id); };
  const dayColors = ['#081c15', '#1b4332', '#2d6a4f', '#40916c', '#ae2012', '#1e3a5f'];
  const bg = data.color || '#081c15';

  return (
    <div style={{ minWidth: '480px', background: bg, border: '3px solid #000', borderRadius: '16px', overflow: 'hidden', boxShadow: '6px 6px 0px rgba(0,0,0,0.9)', position: 'relative' }}>
      {!isReadOnly && (
        <button type="button" onClick={handleDelete} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,0,0,0.15)', color: '#fff', border: 'none', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <X size={14} />
        </button>
      )}
      <Handle type="target" position={Position.Left} style={{ background: '#fff', width: '12px', height: '12px', border: '2px solid #000', borderRadius: 0, opacity: isReadOnly ? 0 : 1 }} />

      <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
          <CalendarDays size={18} color="#ffb703" />
          {isReadOnly ? (
            <span style={{ fontWeight: 900, fontSize: '1.6rem', color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>DAY {data.dayNumber || '1'}</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 900, fontSize: '1.4rem', color: '#fff' }}>DAY</span>
              <input className="nodrag" value={data.dayNumber || ''} onChange={e => updateData('dayNumber', e.target.value)} placeholder="1" style={{ width: '40px', background: 'transparent', border: 'none', color: '#ffb703', fontWeight: 900, fontSize: '1.4rem', outline: 'none', textAlign: 'center' }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          {isReadOnly ? (
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>{data.subtitle || ''}</div>
          ) : (
            <input className="nodrag" value={data.subtitle || ''} onChange={e => updateData('subtitle', e.target.value)} placeholder="e.g. Bangalore → Madurai (overnight bus)" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '0.95rem', outline: 'none', width: '100%', padding: '4px 0' }} />
          )}
        </div>
      </div>

      {!isReadOnly && (
        <div style={{ padding: '0 28px 16px', display: 'flex', gap: '8px' }}>
          {dayColors.map(c => (
            <button key={c} onClick={() => updateData('color', c)} style={{ width: '22px', height: '22px', background: c, border: data.color === c ? '2px solid #ffb703' : '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', cursor: 'pointer' }} />
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#fff', width: '12px', height: '12px', border: '2px solid #000', borderRadius: 0, opacity: isReadOnly ? 0 : 1 }} />
    </div>
  );
}

// ── ATTRACTION / POI NODE ──────────────────────────────────────────────────────
export function AttractionNode({ data, id }) {
  const isReadOnly = data.readOnly;
  const updateData = (key, val) => { if (data?.onChangeField) data.onChangeField(id, key, val); };
  const handleDelete = () => { if (data?.onDeleteNode) data.onDeleteNode(id); };

  const ratingStars = data.rating || 0;

  return (
    <div style={{ minWidth: '240px', background: '#fffbf0', border: '2px solid #000', borderRadius: '16px', overflow: 'hidden', boxShadow: '5px 5px 0px rgba(0,0,0,0.85)', position: 'relative' }}>
      {!isReadOnly && (
        <button type="button" onClick={handleDelete} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,0,0,0.1)', color: '#ae2012', border: 'none', borderRadius: '8px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <X size={13} />
        </button>
      )}
      <Handle type="target" position={Position.Left} style={{ background: '#ffb703', width: '10px', height: '10px', border: '2px solid #000', opacity: isReadOnly ? 0 : 1 }} />

      {/* Header */}
      <div style={{ background: '#ffb703', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #000' }}>
        <Star size={18} color="#081c15" fill="#081c15" />
        {isReadOnly ? (
          <span style={{ fontWeight: 900, fontSize: '1rem', color: '#081c15', textTransform: 'uppercase' }}>{data.label || 'ATTRACTION'}</span>
        ) : (
          <input className="nodrag" value={data.label || ''} onChange={e => updateData('label', e.target.value)} placeholder="Attraction Name" style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 900, fontSize: '0.95rem', color: '#081c15', textTransform: 'uppercase', width: '100%' }} />
        )}
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Category / Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={13} color="#888" />
          {isReadOnly ? (
            <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 700 }}>{data.category || ''}</span>
          ) : (
            <input className="nodrag" value={data.category || ''} onChange={e => updateData('category', e.target.value)} placeholder="e.g. National Park, Waterfall, Temple" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', color: '#666', fontWeight: 700, flex: 1 }} />
          )}
        </div>

        {/* Note */}
        {isReadOnly ? (
          data.note ? <p style={{ margin: 0, fontSize: '0.8rem', color: '#555', lineHeight: 1.5 }}>{data.note}</p> : null
        ) : (
          <textarea className="nodrag" value={data.note || ''} onChange={e => updateData('note', e.target.value)} placeholder="Quick note (timing, entry fee, tips...)" style={{ border: '1px solid #eee', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', color: '#555', resize: 'none', height: '60px', outline: 'none', fontFamily: 'inherit' }} />
        )}

        {/* Star rating */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#999', marginRight: '4px' }}>MUST VISIT</span>
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} type="button" onClick={() => !isReadOnly && updateData('rating', i)} style={{ background: 'none', border: 'none', cursor: isReadOnly ? 'default' : 'pointer', padding: '1px' }}>
              <Star size={14} color="#ffb703" fill={i <= ratingStars ? '#ffb703' : 'transparent'} />
            </button>
          ))}
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#ffb703', width: '10px', height: '10px', border: '2px solid #000', opacity: isReadOnly ? 0 : 1 }} />
    </div>
  );
}

// ── BUDGET NODE ────────────────────────────────────────────────────────────────
export function BudgetNode({ data, id }) {
  const isReadOnly = data.readOnly;
  const updateData = (key, val) => { if (data?.onChangeField) data.onChangeField(id, key, val); };
  const handleDelete = () => { if (data?.onDeleteNode) data.onDeleteNode(id); };

  const hotel = parseFloat(data.hotel) || 0;
  const food = parseFloat(data.food) || 0;
  const transport = parseFloat(data.transport) || 0;
  const misc = parseFloat(data.misc) || 0;
  const total = hotel + food + transport + misc;

  const rows = [
    { key: 'hotel', label: 'Stay', icon: '🏨', color: '#1b4332' },
    { key: 'food', label: 'Food', icon: '🍽️', color: '#ae2012' },
    { key: 'transport', label: 'Transport', icon: '🚌', color: '#1e3a5f' },
    { key: 'misc', label: 'Misc', icon: '📦', color: '#666' },
  ];

  return (
    <div style={{ minWidth: '260px', background: '#fff', border: '2px solid #000', borderRadius: '16px', overflow: 'hidden', boxShadow: '5px 5px 0px rgba(0,0,0,0.85)', position: 'relative' }}>
      {!isReadOnly && (
        <button type="button" onClick={handleDelete} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,0,0,0.1)', color: '#ae2012', border: 'none', borderRadius: '8px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <X size={13} />
        </button>
      )}
      <Handle type="target" position={Position.Left} style={{ background: '#1b4332', width: '10px', height: '10px', border: '2px solid #000', opacity: isReadOnly ? 0 : 1 }} />

      {/* Header */}
      <div style={{ background: '#1b4332', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #000' }}>
        <IndianRupee size={18} color="#ffb703" />
        {isReadOnly ? (
          <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'white' }}>{data.label || 'BUDGET BREAKDOWN'}</span>
        ) : (
          <input className="nodrag" value={data.label || ''} onChange={e => updateData('label', e.target.value)} placeholder="Budget Label (e.g. Day 2)" style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 900, fontSize: '0.9rem', color: 'white', width: '100%' }} />
        )}
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rows.map(row => (
          <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', width: '20px' }}>{row.icon}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: row.color, width: '60px', flexShrink: 0 }}>{row.label}</span>
            {isReadOnly ? (
              <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#081c15', marginLeft: 'auto' }}>₹{parseFloat(data[row.key]) || 0}</span>
            ) : (
              <input className="nodrag" type="number" value={data[row.key] || ''} onChange={e => updateData(row.key, e.target.value)} placeholder="0" style={{ flex: 1, border: '1px solid #eee', borderRadius: '6px', padding: '5px 8px', fontSize: '0.85rem', fontWeight: 700, outline: 'none', textAlign: 'right' }} />
            )}
          </div>
        ))}

        {/* Total */}
        <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '2px dashed #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1b4332', letterSpacing: '0.5px' }}>TOTAL</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#081c15' }}>₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#1b4332', width: '10px', height: '10px', border: '2px solid #000', opacity: isReadOnly ? 0 : 1 }} />
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
