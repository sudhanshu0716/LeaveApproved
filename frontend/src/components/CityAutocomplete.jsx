import { useState } from 'react';
import axios from 'axios';

/**
 * CityAutocomplete — ArcGIS-backed city search with India dedup filter.
 * Props:
 *   value, onChange(val), placeholder, inputStyle, accentColor, onFocus, onBlur
 */
export default function CityAutocomplete({ value, onChange, onValidChange, placeholder = 'Search city...', inputStyle = {}, accentColor = '#ffb703', onFocus, onBlur }) {
  const [sugs, setSugs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSugs = (text) => {
    clearTimeout(window._cityAcTimer);
    if (text.length < 2) { setSugs([]); return; }
    setLoading(true);
    window._cityAcTimer = setTimeout(async () => {
      try {
        const r = await axios.get(
          `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?text=${encodeURIComponent(text)}&f=json&maxSuggestions=8&countryCode=IND&category=City`
        );
        if (r.data.suggestions) {
          const seen = new Set();
          setSugs(r.data.suggestions
            .filter(s => s.text.split(',').length <= 3)
            .filter(s => {
              const key = s.text.split(',')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            }));
        }
      } catch { setSugs([]); }
      setLoading(false);
    }, 280);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={e => { onChange(e.target.value); if (onValidChange) onValidChange(false); fetchSugs(e.target.value); }}
          placeholder={placeholder}
          autoComplete="off"
          style={{ ...inputStyle, paddingRight: loading ? '38px' : inputStyle.paddingRight }}
          onFocus={e => { if (onFocus) onFocus(e); }}
          onBlur={e => { setTimeout(() => setSugs([]), 150); if (onBlur) onBlur(e); }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            width: '14px', height: '14px', border: `2px solid ${accentColor}44`, borderTopColor: accentColor,
            borderRadius: '50%', animation: 'spin 0.7s linear infinite', pointerEvents: 'none' }} />
        )}
      </div>

      {sugs.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 9999,
          background: 'rgba(8,20,14,0.98)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', overflow: 'hidden', backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
          {sugs.map((sug, i) => (
            <button key={i} type="button"
              onMouseDown={() => { onChange(sug.text.split(',')[0].trim()); if (onValidChange) onValidChange(true); setSugs([]); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '10px 14px', background: 'transparent', border: 'none',
                borderBottom: i < sugs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = `${accentColor}12`}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={`${accentColor}88`} strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5-8 13-8 13S4 15 4 10a8 8 0 0 1 8-8z"/>
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', color: 'white', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sug.text.split(',')[0]}
                </div>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sug.text.split(',').slice(1).join(',').trim()}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
