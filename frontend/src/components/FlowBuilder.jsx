import React, { useCallback, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, { Controls, Background, MarkerType, applyNodeChanges, applyEdgeChanges, MiniMap, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { CityNode, NoteNode, StickerNode, HubNode } from './CustomNodes';
import CustomEdge from './CustomEdge';
import { MapPin, Maximize, Minimize, Settings2, Palette, Share2, Type, MoveRight, Trash2, Pencil, Camera, Utensils, Tent } from 'lucide-react';
import { useOnSelectionChange } from 'reactflow';

function FlowContent({ nodes, setNodes, edges, setEdges, isFullscreen, setIsFullscreen }) {
  const nodeTypes = useMemo(() => ({ cityNode: CityNode, noteNode: NoteNode, stickerNode: StickerNode, hubNode: HubNode }), []);
  const edgeTypes = useMemo(() => ({ customEdge: CustomEdge }), []);

  const [selectedElement, setSelectedElement] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawSource, setDrawSource] = useState(null);
  const [edgeIntensity, setEdgeIntensity] = useState(300); // Curvature control

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      if(nodes.length > 0) setSelectedElement({ ...nodes[0], type: nodes[0].type || 'node' });
      else if(edges.length > 0) setSelectedElement({ ...edges[0], type: 'edge' });
      else setSelectedElement(null);
    }
  });

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const updateEdgeData = (id, field, value) => {
    setEdges(eds => eds.map(e => {
      if(e.id === id) { 
        return { ...e, data: { ...e.data, [field]: value } }; 
      }
      return e;
    }));
  };

  const deleteEdge = (id) => {
    setEdges((eds) => eds.filter(e => e.id !== id));
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => {
      // Find how many edges already exist between these two nodes to prevent overlap
      const existingEdges = eds.filter(e => 
        (e.source === params.source && e.target === params.target) || 
        (e.source === params.target && e.target === params.source)
      );
      const edgeIndex = existingEdges.length;
      
      const customId = `e-${params.source}-${params.target}-${Date.now()}`;
      return [...eds, { 
        ...params, 
        id: customId,
        type: 'customEdge',
        data: { transport: '', transportDetails: '', onDataChange: updateEdgeData, onDeleteEdge: deleteEdge, edgeIndex },
        animated: true, 
        style: { stroke: '#000', strokeWidth: 4 }, 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#000' } 
      }];
    }),
    [setEdges]
  );

  const updateNodeDataField = (id, field, value) => {
    setNodes(nds => nds.map(n => {
      if(n.id === id) { 
        return { ...n, data: { ...n.data, [field]: value } }; 
      }
      return n;
    }));
  };

  const deleteNode = (id) => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
  };

  const refineLayout = () => {
    setNodes(nds => nds.map((n, idx) => ({
      ...n,
      position: { 
        x: 100 + idx * 850, 
        y: 150 + (idx % 2 === 0 ? 0 : 250)
      }
    })));
  };

  const addCityNode = () => {
    const newNode = {
      id: `cityNode-${Date.now()}`,
      type: 'cityNode',
      position: { x: 400, y: 300 },
      data: { 
        label: '', rooms: '', food: '', activity: '', color: '#1b4332',
        onChangeField: updateNodeDataField,
        onDeleteNode: deleteNode
      }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addHubNode = () => {
    const newNode = {
      id: `hub-${Date.now()}`,
      type: 'hubNode',
      position: { x: 400, y: 300 },
      data: { 
        label: '', arrivalTime: '', departureTime: '', color: '#000',
        onChangeField: updateNodeDataField,
        onDeleteNode: deleteNode
      }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addNoteNode = () => {
    const newNode = {
      id: `noteNode-${Date.now()}`,
      type: 'noteNode',
      position: { x: 400, y: 300 },
      data: { 
        label: '',
        color: '#ffb703',
        onChangeField: updateNodeDataField,
        onDeleteNode: deleteNode
      }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addSticker = (type) => {
    const newNode = {
      id: `sticker-${Date.now()}`,
      type: 'stickerNode',
      position: { x: 500, y: 300 },
      data: { 
        iconType: type,
        color: '#1b4332',
        onDeleteNode: deleteNode
      }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onNodeClick = useCallback((event, node) => {
    if(isDrawingMode) {
      if(!drawSource) {
        setDrawSource(node.id);
      } else {
        if(drawSource !== node.id) {
          onConnect({ source: drawSource, target: node.id });
        }
        setDrawSource(null);
      }
    }
  }, [isDrawingMode, drawSource, onConnect]);


  const processedNodes = nodes.map(n => {
    const isSelected = drawSource === n.id;
    return {
      ...n,
      data: {
        ...n.data,
        onChangeField: updateNodeDataField,
        onDeleteNode: deleteNode,
        isDrawingActive: isDrawingMode,
        isDrawingSource: isSelected
      },
      style: isSelected ? { boxShadow: '0 0 20px #ffb703', border: '3px solid #ffb703', zIndex: 1000 } : {}
    };
  });

  const processedEdges = edges.map(e => ({
    ...e,
    data: {
      ...e.data,
      onDataChange: updateEdgeData,
      onDeleteEdge: deleteEdge,
      customArc: edgeIntensity
    }
  }));

  const flowContent = (
    <div className={isDrawingMode ? "cartography-canvas" : ""} style={
      isFullscreen 
        ? { position: 'fixed', inset: 0, zIndex: 10000, background: '#f5f1e9', display: 'flex' }
        : { height: '700px', width: '100%', border: '2px solid #000', borderRadius: '40px', position: 'relative', overflow: 'hidden', background: '#f5f1e9', boxShadow: '20px 20px 0px rgba(0,0,0,0.1)' }
    }>
      
      {/* TACTICAL OVERLAY */}
      <div style={{ position: 'absolute', top: 25, right: (isFullscreen && selectedElement) ? 320 : 25, zIndex: 100, display: 'flex', gap: '10px', transition: 'all 0.3s ease' }}>
         <button 
           type="button" 
           onClick={() => setIsFullscreen(!isFullscreen)} 
           style={{ background: '#fff', color: '#000', border: '2px solid #000', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '4px 4px 0px #000' }}
         >
           {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
         </button>
      </div>

      {/* LEFT CONTROL PANEL (FULLSCREEN ONLY) */}
      {isFullscreen && (
        <div style={{ position: 'absolute', top: 25, left: 25, zIndex: 100, display: 'flex', gap: '15px', flexDirection: 'column', maxWidth: '300px' }}>
          <button 
             type="button" 
             className="premium-choice" 
             style={{ padding: '18px 25px', background: '#1b4332', color: '#fff', border: '2px solid #000', borderRadius: '18px', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '6px 6px 0px #000' }} 
             onClick={addCityNode}
          >
             <MapPin size={18}/> INITIALIZE_WAYPOINT
          </button>

          <button 
             type="button" 
             className="premium-choice" 
             style={{ padding: '18px 25px', background: '#ae2012', color: '#fff', border: '2px solid #000', borderRadius: '18px', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '6px 6px 0px #000' }} 
             onClick={addHubNode}
          >
             <Share2 size={18}/> INITIALIZE_NEXUS
          </button>
          
          <button 
             type="button" 
             className="premium-choice" 
             style={{ padding: '18px 25px', background: '#ffb703', color: '#000', border: '2px solid #000', borderRadius: '18px', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '6px 6px 0px #000' }} 
             onClick={addNoteNode}
          >
             <Type size={18}/> FIELD_NOTE
          </button>

          <button 
             type="button" 
             className="premium-choice" 
             style={{ padding: '18px 25px', background: isDrawingMode ? '#ffb703' : '#fff', color: '#000', border: '2px solid #000', borderRadius: '18px', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '6px 6px 0px #000', transition: 'all 0.2s' }} 
             onClick={() => { setIsDrawingMode(!isDrawingMode); setDrawSource(null); }}
          >
             <Pencil size={18}/> {isDrawingMode ? 'DRAW_TRAIL_ACTIVE' : 'EXPEDITION_PEN'}
          </button>

          {/* STICKER PALETTE */}
          <div style={{ background: '#fff', border: '2px dotted #000', padding: '15px', borderRadius: '18px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', boxShadow: '6px 6px 0px rgba(0,0,0,0.05)' }}>
             <button onClick={() => addSticker('camera')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1b4332' }} title="Photo Op"><Camera size={20}/></button>
             <button onClick={() => addSticker('food')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1b4332' }} title="Culinary"><Utensils size={20}/></button>
             <button onClick={() => addSticker('camp')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1b4332' }} title="Basecamp"><Tent size={20}/></button>
             <button onClick={() => addSticker('marker')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1b4332' }} title="Checkpoint"><MapPin size={20}/></button>
             <button onClick={() => addSticker('sun')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffb703' }} title="Clear Sky">☀️</button>
             <button onClick={() => addSticker('rain')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e6091' }} title="Storm Alert">🌧️</button>
             <button onClick={() => addSticker('snow')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000' }} title="Snowfall">❄️</button>
             <button onClick={() => addSticker('danger')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ae2012' }} title="Hazard">⚠️</button>
          </div>

          <div style={{ background: '#fff', border: '2px solid #000', padding: '15px', borderRadius: '18px', fontSize: '0.65rem', fontWeight: 900, color: '#000', lineHeight: '1.6', letterSpacing: '1px', boxShadow: '6px 6px 0px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#1b4332', display: 'block', marginBottom: '8px', fontSize: '0.55rem' }}>CARTOGRAPHER_TIP:</span>
            {isDrawingMode ? 'CLICK START NODE, THEN END NODE TO FORGE TRAIL.' : 'DRAG PINS TO RE-MAP. USE EXPEDITION_PEN FOR QUICK ROUTING.'}
          </div>
        </div>
      )}

      {/* RIGHT TOOL HUB (FULLSCREEN ONLY) */}
      {isFullscreen && selectedElement && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '300px', background: '#fff', borderLeft: '4px solid #000', zIndex: 110, padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}>
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <Settings2 size={20} color="#000" />
               <span style={{ fontWeight: 950, fontSize: '0.8rem', letterSpacing: '2px', color: '#000', textTransform: 'uppercase' }}>{selectedElement.type.replace('Node', '').toUpperCase()}_KIT</span>
            </div>

            <button onClick={refineLayout} style={{ background: '#ffb703', color: '#000', border: '2px solid #000', padding: '15px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '4px 4px 0px #000' }}>
               <MoveRight size={18} /> REFINE_BLUEPRINT
            </button>

            {/* NODE TOOLS */}
            {(['cityNode', 'hubNode', 'noteNode', 'stickerNode'].includes(selectedElement.type)) && (
              <>
                 <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block', marginBottom: '10px', color: '#000' }}>ELEMENT_COLOR</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {['#1b4332', '#081c15', '#2d6a4f', '#ae2012', '#ffb703', '#1e6091', '#8338ec', '#000'].map(c => (
                        <button key={c} onClick={() => updateNodeDataField(selectedElement.id, 'color', c)} style={{ height: '35px', background: c, border: '2px solid #000', cursor: 'pointer', borderRadius: '8px' }} />
                      ))}
                    </div>
                 </div>

                 {selectedElement.type === 'stickerNode' && (
                   <div>
                      <label style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block', marginBottom: '10px', color: '#000' }}>MARKER_SCALE</label>
                      <input 
                        type="range" 
                        min="20" 
                        max="120" 
                        value={selectedElement.data?.size || 28} 
                        onChange={(e) => updateNodeDataField(selectedElement.id, 'size', parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#1b4332', cursor: 'pointer' }}
                      />
                   </div>
                 )}

                <button onClick={() => deleteNode(selectedElement.id)} style={{ marginTop: 'auto', background: '#ae2012', color: '#fff', border: '2px solid #000', padding: '15px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '12px', cursor: 'pointer' }}>
                   <Trash2 size={18} /> PURGE_WAYPOINT
                </button>
              </>
            )}

            {selectedElement.type === 'edge' && (
              <>
                <div>
                   <label style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block', marginBottom: '10px', color: '#000' }}>EXPEDITION_TRAIL_ARC</label>
                   <input 
                     type="range" 
                     min="50" 
                     max="600" 
                     value={edgeIntensity} 
                     onChange={(e) => setEdgeIntensity(parseInt(e.target.value))}
                     style={{ width: '100%', accentColor: '#1b4332', cursor: 'pointer' }}
                   />
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', fontWeight: 900, marginTop: '5px', color: '#000' }}>
                     <span>DIRECT</span>
                     <span>SCENIC</span>
                   </div>
                </div>
                <div>
                   <label style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block', marginBottom: '10px', color: '#000' }}>TRAIL_TRANSIT_PRESETS</label>
                   <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                     {[
                       { icon: '✈️', label: 'FLIGHT' },
                       { icon: '🚌', label: 'BUS' },
                       { icon: '🚆', label: 'TRAIN' },
                       { icon: '🚗', label: 'CAB' }
                     ].map(tk => (
                       <button key={tk.label} onClick={() => updateEdgeData(selectedElement.id, 'transport', tk.label)} style={{ flex: 1, padding: '10px', background: '#f8fdfa', border: '1px solid #000', fontSize: '1rem', borderRadius: '8px', cursor: 'pointer' }}>{tk.icon}</button>
                     ))}
                   </div>
                </div>
                <div>
                   <label style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block', marginBottom: '10px', color: '#000' }}>TRAIL_STYLE</label>
                   <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => updateEdgeData(selectedElement.id, 'lineStyle', 'solid')} style={{ flex: 1, padding: '10px', background: '#fff', border: '2px solid #000', fontWeight: 900, fontSize: '0.7rem' }}>SOLID</button>
                      <button onClick={() => updateEdgeData(selectedElement.id, 'lineStyle', 'dashed')} style={{ flex: 1, padding: '10px', background: '#fff', border: '2px solid #000', fontWeight: 900, fontSize: '0.7rem' }}>DASHED</button>
                   </div>
                </div>
                <div>
                   <label style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block', marginBottom: '10px', color: '#000' }}>TRAIL_INTENSITY_COLOR</label>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                     {['#000', '#1b4332', '#ae2012', '#ffb703', '#1e6091', '#8338ec'].map(c => (
                       <button key={c} onClick={() => updateEdgeData(selectedElement.id, 'color', c)} style={{ height: '35px', background: c, border: '2px solid #000', cursor: 'pointer', borderRadius: '8px' }} />
                     ))}
                   </div>
                </div>
                <button onClick={() => deleteEdge(selectedElement.id)} style={{ marginTop: 'auto', background: '#ae2012', color: '#fff', border: '2px solid #000', padding: '15px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '12px', cursor: 'pointer' }}>
                  <Trash2 size={18} /> PURGE_TRAIL
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
        className={isDrawingMode ? "cartography-canvas" : ""}
        style={{ background: '#f5f1e9' }}
      >
        <Background color="#000" gap={30} size={1} variant="cross" style={{ opacity: 0.1 }} />
        <Controls style={{ background: '#fff', border: '2px solid #000', borderRadius: 0, padding: '5px' }} />
        <MiniMap 
           style={{ background: '#fff', border: '2px solid #000', borderRadius: '15px' }} 
           maskColor="rgba(0,0,0,0.1)"
           nodeColor="#1b4332"
        />
      </ReactFlow>
    </div>
  );

  return isFullscreen ? createPortal(flowContent, document.body) : flowContent;
}

export default function FlowBuilder(props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  return (
    <ReactFlowProvider>
      <FlowContent {...props} isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />
    </ReactFlowProvider>
  );
}
