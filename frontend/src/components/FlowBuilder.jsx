import React, { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, { Controls, Background, MarkerType, applyNodeChanges, applyEdgeChanges, MiniMap, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { CityNode, NoteNode, StickerNode, HubNode, DayBannerNode, AttractionNode, BudgetNode } from './CustomNodes';
import CustomEdge from './CustomEdge';
import { MapPin, Maximize, Minimize, Settings2, MoveRight, Trash2, Pencil, Camera, Utensils, Tent, Copy, RotateCcw, LayoutGrid, Download, CalendarDays, Star, IndianRupee } from 'lucide-react';
import { useOnSelectionChange } from 'reactflow';

function FlowContent({ nodes, setNodes, edges, setEdges, isFullscreen, setIsFullscreen }) {
  const nodeTypes = useMemo(() => ({ cityNode: CityNode, noteNode: NoteNode, stickerNode: StickerNode, hubNode: HubNode, dayBannerNode: DayBannerNode, attractionNode: AttractionNode, budgetNode: BudgetNode }), []);
  const edgeTypes = useMemo(() => ({ customEdge: CustomEdge }), []);

  const [selectedElement, setSelectedElement] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawSource, setDrawSource] = useState(null);
  const [edgeIntensity, setEdgeIntensity] = useState(300);

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      if (nodes.length > 0) setSelectedElement({ ...nodes[0], type: nodes[0].type || 'node' });
      else if (edges.length > 0) setSelectedElement({ ...edges[0], type: 'edge' });
      else setSelectedElement(null);
    }
  });

  const onNodesChange = useCallback((changes) => setNodes(nds => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes) => setEdges(eds => applyEdgeChanges(changes, eds)), [setEdges]);

  const updateEdgeData = (id, field, value) => {
    setEdges(eds => eds.map(e => e.id === id ? { ...e, data: { ...e.data, [field]: value } } : e));
  };

  const deleteEdge = (id) => setEdges(eds => eds.filter(e => e.id !== id));

  const onConnect = useCallback(
    (params) => setEdges(eds => {
      const existingEdges = eds.filter(e =>
        (e.source === params.source && e.target === params.target) ||
        (e.source === params.target && e.target === params.source)
      );
      const edgeIndex = existingEdges.length;
      const customId = `e-${params.source}-${params.target}-${Date.now()}`;
      return [...eds, {
        ...params, id: customId, type: 'customEdge',
        data: { transport: '', transportDetails: '', onDataChange: updateEdgeData, onDeleteEdge: deleteEdge, edgeIndex },
        animated: false,
        style: { stroke: '#1b4332', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#1b4332', width: 22, height: 22 }
      }];
    }),
    [setEdges]
  );

  const updateNodeDataField = (id, field, value) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n));
  };

  const deleteNode = (id) => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    setSelectedElement(null);
  };

  const duplicateNode = (node) => {
    if (!node) return;
    const newNode = {
      ...node,
      id: `${node.type}-copy-${Date.now()}`,
      position: { x: node.position.x + 60, y: node.position.y + 60 },
      data: { ...node.data }
    };
    setNodes(nds => [...nds, newNode]);
  };

  const autoLayout = () => {
    setNodes(nds => nds.map((n, idx) => ({
      ...n,
      position: { x: 100 + idx * 850, y: 150 + (idx % 2 === 0 ? 0 : 250) }
    })));
  };

  const clearCanvas = () => {
    if (nodes.length === 0 && edges.length === 0) return;
    if (window.confirm('Clear all nodes and routes from the canvas?')) {
      setNodes([]);
      setEdges([]);
      setSelectedElement(null);
    }
  };

  const exportJSON = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'itinerary-flow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const addDayBanner = () => {
    const dayNum = nodes.filter(n => n.type === 'dayBannerNode').length + 1;
    setNodes(nds => nds.concat({
      id: `dayBanner-${Date.now()}`, type: 'dayBannerNode',
      position: { x: 100, y: 50 + (nds.length * 20) },
      data: { dayNumber: String(dayNum), subtitle: '', color: '#081c15', onChangeField: updateNodeDataField, onDeleteNode: deleteNode }
    }));
  };

  const addAttraction = () => {
    setNodes(nds => nds.concat({
      id: `attraction-${Date.now()}`, type: 'attractionNode',
      position: { x: 300 + nds.length * 60, y: 300 },
      data: { label: '', category: '', note: '', rating: 0, onChangeField: updateNodeDataField, onDeleteNode: deleteNode }
    }));
  };

  const addBudgetNode = () => {
    setNodes(nds => nds.concat({
      id: `budget-${Date.now()}`, type: 'budgetNode',
      position: { x: 300 + nds.length * 60, y: 300 },
      data: { label: '', hotel: '', food: '', transport: '', misc: '', onChangeField: updateNodeDataField, onDeleteNode: deleteNode }
    }));
  };

  const addCityNode = () => {
    setNodes(nds => nds.concat({
      id: `cityNode-${Date.now()}`, type: 'cityNode',
      position: { x: 200 + nds.length * 200, y: 250 },
      data: { label: '', rooms: '', food: '', activity: '', color: '#1b4332', onChangeField: updateNodeDataField, onDeleteNode: deleteNode }
    }));
  };

  const addHubNode = () => {
    setNodes(nds => nds.concat({
      id: `hub-${Date.now()}`, type: 'hubNode',
      position: { x: 200 + nds.length * 200, y: 250 },
      data: { label: '', arrivalTime: '', departureTime: '', color: '#000', onChangeField: updateNodeDataField, onDeleteNode: deleteNode }
    }));
  };

  const addNoteNode = () => {
    setNodes(nds => nds.concat({
      id: `noteNode-${Date.now()}`, type: 'noteNode',
      position: { x: 200 + nds.length * 200, y: 250 },
      data: { label: '', color: '#ffb703', onChangeField: updateNodeDataField, onDeleteNode: deleteNode }
    }));
  };

  const addSticker = (type) => {
    setNodes(nds => nds.concat({
      id: `sticker-${Date.now()}`, type: 'stickerNode',
      position: { x: 300 + nds.length * 100, y: 350 },
      data: { iconType: type, color: '#1b4332', onDeleteNode: deleteNode }
    }));
  };

  const onNodeClick = useCallback((event, node) => {
    if (isDrawingMode) {
      if (!drawSource) {
        setDrawSource(node.id);
      } else {
        if (drawSource !== node.id) onConnect({ source: drawSource, target: node.id });
        setDrawSource(null);
      }
    }
  }, [isDrawingMode, drawSource, onConnect]);

  const processedNodes = nodes.map(n => ({
    ...n,
    data: { ...n.data, onChangeField: updateNodeDataField, onDeleteNode: deleteNode, isDrawingActive: isDrawingMode, isDrawingSource: drawSource === n.id },
    style: drawSource === n.id ? { boxShadow: '0 0 20px #ffb703', border: '3px solid #ffb703', zIndex: 1000 } : {}
  }));

  const processedEdges = edges.map(e => {
    const color = e.data?.color || '#1b4332';
    return {
      ...e,
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 22, height: 22 },
      style: { ...e.style, stroke: color, strokeWidth: 3 },
      data: { ...e.data, onDataChange: updateEdgeData, onDeleteEdge: deleteEdge, customArc: edgeIntensity }
    };
  });

  // ── Mini toolbar shown even outside fullscreen ──
  const miniToolbar = !isFullscreen && (
    <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 100, display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: 'calc(100% - 80px)' }}>
      <button type="button" onClick={addCityNode} title="Add City Stop" style={miniBtn('#1b4332', 'white')}>
        <MapPin size={13} /> City
      </button>
      <button type="button" onClick={addHubNode} title="Add Hub Point" style={miniBtn('#ae2012', 'white')}>
        Hub
      </button>
      <button type="button" onClick={addNoteNode} title="Add Note" style={miniBtn('#ffb703', '#000')}>
        Note
      </button>
      <button type="button" onClick={addDayBanner} title="Add Day Banner" style={miniBtn('#081c15', 'white')}>
        <CalendarDays size={13} /> Day
      </button>
      <button type="button" onClick={addAttraction} title="Add Attraction" style={miniBtn('#b45309', 'white')}>
        <Star size={13} /> POI
      </button>
      <button type="button" onClick={addBudgetNode} title="Add Budget Card" style={miniBtn('#2d6a4f', 'white')}>
        <IndianRupee size={13} /> Budget
      </button>
      <button type="button" onClick={() => { setIsDrawingMode(!isDrawingMode); setDrawSource(null); }} title="Draw Route" style={miniBtn(isDrawingMode ? '#ffb703' : '#fff', '#000', isDrawingMode)}>
        <Pencil size={13} /> {isDrawingMode ? 'Drawing...' : 'Route'}
      </button>
      <button type="button" onClick={autoLayout} title="Auto Layout" style={miniBtn('#fff', '#000')}>
        <LayoutGrid size={13} /> Layout
      </button>
      <button type="button" onClick={exportJSON} title="Export as JSON" style={miniBtn('#fff', '#1e3a5f')}>
        <Download size={13} /> Export
      </button>
      <button type="button" onClick={clearCanvas} title="Clear Canvas" style={miniBtn('#fff', '#ae2012')}>
        <RotateCcw size={13} /> Clear
      </button>
    </div>
  );

  const flowContent = (
    <div
      className={isDrawingMode ? 'cartography-canvas' : ''}
      style={isFullscreen
        ? { position: 'fixed', inset: 0, zIndex: 10000, background: '#f5f1e9', display: 'flex' }
        : { height: '100%', width: '100%', position: 'relative', overflow: 'hidden', background: '#f5f1e9' }
      }
    >

      {/* Fullscreen toggle */}
      <div style={{ position: 'absolute', top: 14, right: (isFullscreen && selectedElement) ? 320 : 14, zIndex: 100, transition: 'right 0.3s' }}>
        <button type="button" onClick={() => setIsFullscreen(!isFullscreen)} style={{ background: '#fff', color: '#000', border: '2px solid #000', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '3px 3px 0px #000' }}>
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {/* Mini toolbar (non-fullscreen) */}
      {miniToolbar}

      {/* Left panel (fullscreen only) */}
      {isFullscreen && (
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '280px' }}>
          <button type="button" onClick={addCityNode} style={fullBtn('#1b4332', 'white')}>
            <MapPin size={16} /> Add City Stop
          </button>
          <button type="button" onClick={addHubNode} style={fullBtn('#ae2012', 'white')}>
            + Add Hub Point
          </button>
          <button type="button" onClick={addNoteNode} style={fullBtn('#ffb703', '#000')}>
            Add Note
          </button>
          <button type="button" onClick={addDayBanner} style={fullBtn('#081c15', 'white')}>
            <CalendarDays size={16} /> Day Banner
          </button>
          <button type="button" onClick={addAttraction} style={{ ...fullBtn('#b45309', 'white') }}>
            <Star size={16} /> Attraction / POI
          </button>
          <button type="button" onClick={addBudgetNode} style={fullBtn('#2d6a4f', 'white')}>
            <IndianRupee size={16} /> Budget Card
          </button>
          <button type="button" onClick={() => { setIsDrawingMode(!isDrawingMode); setDrawSource(null); }} style={fullBtn(isDrawingMode ? '#ffb703' : '#fff', '#000')}>
            <Pencil size={16} /> {isDrawingMode ? 'Drawing Route...' : 'Draw Route'}
          </button>
          <button type="button" onClick={exportJSON} style={fullBtn('#fff', '#1e3a5f')}>
            <Download size={16} /> Export JSON
          </button>

          {/* Sticker grid */}
          <div style={{ background: '#fff', border: '2px dotted #000', padding: '12px', borderRadius: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' }}>
            <button onClick={() => addSticker('camera')} style={stickerBtn()} title="Photo Spot"><Camera size={18} /></button>
            <button onClick={() => addSticker('food')} style={stickerBtn()} title="Food Stop"><Utensils size={18} /></button>
            <button onClick={() => addSticker('camp')} style={stickerBtn()} title="Campsite"><Tent size={18} /></button>
            <button onClick={() => addSticker('marker')} style={stickerBtn()} title="Marker"><MapPin size={18} /></button>
            <button onClick={() => addSticker('sun')} style={stickerBtn()} title="Sunny">☀️</button>
            <button onClick={() => addSticker('rain')} style={stickerBtn()} title="Rain">🌧️</button>
            <button onClick={() => addSticker('snow')} style={stickerBtn()} title="Snow">❄️</button>
            <button onClick={() => addSticker('danger')} style={stickerBtn()} title="Hazard">⚠️</button>
          </div>

          <div style={{ background: '#fff', border: '2px solid #000', padding: '14px', borderRadius: '16px', fontSize: '0.7rem', fontWeight: 700, color: '#333', lineHeight: 1.6, boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#1b4332', display: 'block', marginBottom: '4px', fontWeight: 900, fontSize: '0.65rem' }}>TIP</span>
            {isDrawingMode ? 'Click a start node, then an end node to draw a route.' : 'Drag nodes to reposition. Use Draw Route to connect stops.'}
          </div>
        </div>
      )}

      {/* Right inspector panel (fullscreen + element selected) */}
      {isFullscreen && selectedElement && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '290px', background: '#fff', borderLeft: '3px solid #000', zIndex: 110, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', boxShadow: '-8px 0 24px rgba(0,0,0,0.08)' }}>
          <div style={{ borderBottom: '2px solid #000', paddingBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={18} />
            <span style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'capitalize' }}>
              {selectedElement.type === 'edge' ? 'Route' : selectedElement.type.replace('Node', '')} Options
            </span>
          </div>

          <button onClick={autoLayout} style={{ background: '#ffb703', color: '#000', border: '2px solid #000', padding: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '10px', cursor: 'pointer', boxShadow: '3px 3px 0px #000', fontSize: '0.8rem' }}>
            <MoveRight size={16} /> Auto Layout
          </button>

          {/* Node tools */}
          {['cityNode', 'hubNode', 'noteNode', 'stickerNode', 'dayBannerNode', 'attractionNode', 'budgetNode'].includes(selectedElement.type) && (
            <>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '10px' }}>Color</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['#1b4332', '#081c15', '#2d6a4f', '#ae2012', '#ffb703', '#1e6091', '#8338ec', '#000'].map(c => (
                    <button key={c} onClick={() => updateNodeDataField(selectedElement.id, 'color', c)} style={{ height: '32px', background: c, border: '2px solid #000', cursor: 'pointer', borderRadius: '8px' }} />
                  ))}
                </div>
              </div>

              {selectedElement.type === 'stickerNode' && (
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '10px' }}>Size</label>
                  <input type="range" min="20" max="120" value={selectedElement.data?.size || 28} onChange={e => updateNodeDataField(selectedElement.id, 'size', parseInt(e.target.value))} style={{ width: '100%', accentColor: '#1b4332' }} />
                </div>
              )}

              <button onClick={() => duplicateNode(selectedElement)} style={{ background: '#f0f4f2', color: '#1b4332', border: '2px solid #000', padding: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                <Copy size={16} /> Duplicate Node
              </button>

              <button onClick={() => deleteNode(selectedElement.id)} style={{ marginTop: 'auto', background: '#ae2012', color: '#fff', border: '2px solid #000', padding: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                <Trash2 size={16} /> Delete Node
              </button>
            </>
          )}

          {/* Edge tools */}
          {selectedElement.type === 'edge' && (
            <>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px' }}>Route Curve</label>
                <input type="range" min="50" max="600" value={edgeIntensity} onChange={e => setEdgeIntensity(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#1b4332' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', fontWeight: 900, marginTop: '4px', color: '#666' }}>
                  <span>Direct</span><span>Scenic</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px' }}>Transport Mode</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[{ icon: '✈️', label: 'FLIGHT' }, { icon: '🚌', label: 'BUS' }, { icon: '🚆', label: 'TRAIN' }, { icon: '🚗', label: 'CAB' }].map(tk => (
                    <button key={tk.label} onClick={() => updateEdgeData(selectedElement.id, 'transport', tk.label)} style={{ flex: 1, padding: '10px 6px', background: '#f8fdfa', border: '1.5px solid #ddd', fontSize: '1rem', borderRadius: '8px', cursor: 'pointer' }} title={tk.label}>{tk.icon}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px' }}>Line Style</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => updateEdgeData(selectedElement.id, 'lineStyle', 'solid')} style={{ flex: 1, padding: '10px', background: '#fff', border: '2px solid #000', fontWeight: 900, fontSize: '0.7rem', borderRadius: '8px', cursor: 'pointer' }}>Solid</button>
                  <button onClick={() => updateEdgeData(selectedElement.id, 'lineStyle', 'dashed')} style={{ flex: 1, padding: '10px', background: '#fff', border: '2px solid #000', fontWeight: 900, fontSize: '0.7rem', borderRadius: '8px', cursor: 'pointer' }}>Dashed</button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px' }}>Route Color</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['#000', '#1b4332', '#ae2012', '#ffb703', '#1e6091', '#8338ec'].map(c => (
                    <button key={c} onClick={() => updateEdgeData(selectedElement.id, 'color', c)} style={{ height: '30px', background: c, border: '2px solid #000', cursor: 'pointer', borderRadius: '6px' }} />
                  ))}
                </div>
              </div>

              <button onClick={() => deleteEdge(selectedElement.id)} style={{ marginTop: 'auto', background: '#ae2012', color: '#fff', border: '2px solid #000', padding: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                <Trash2 size={16} /> Delete Route
              </button>
            </>
          )}
        </div>
      )}

      <ReactFlow
        nodes={processedNodes}
        edges={processedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        style={{ background: '#f5f1e9' }}
      >
        <Background color="#000" gap={30} size={1} variant="cross" style={{ opacity: 0.08 }} />
        <Controls style={{ background: '#fff', border: '2px solid #000', borderRadius: 0, padding: '4px' }} />
        <MiniMap style={{ background: '#fff', border: '2px solid #000', borderRadius: '12px' }} maskColor="rgba(0,0,0,0.08)" nodeColor="#1b4332" />
      </ReactFlow>
    </div>
  );

  return isFullscreen ? createPortal(flowContent, document.body) : flowContent;
}

// ── Style helpers ──────────────────────────────────────────────────────────────
const miniBtn = (bg, color, active = false) => ({
  padding: '7px 12px', background: bg, color, border: `1.5px solid ${active ? '#000' : 'rgba(0,0,0,0.15)'}`,
  borderRadius: '8px', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', whiteSpace: 'nowrap'
});

const fullBtn = (bg, color) => ({
  padding: '16px 20px', background: bg, color, border: '2px solid #000',
  borderRadius: '16px', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.5px',
  display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '5px 5px 0px #000', cursor: 'pointer'
});

const stickerBtn = () => ({
  background: 'none', border: 'none', cursor: 'pointer', color: '#1b4332',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px',
  borderRadius: '8px', fontSize: '1rem'
});

export default function FlowBuilder(props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  return (
    <ReactFlowProvider>
      <FlowContent {...props} isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />
    </ReactFlowProvider>
  );
}
