import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, { Controls, Background, MarkerType, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import { CityNode } from './CustomNodes';
import CustomEdge from './CustomEdge';
import { MapPin, Maximize, Minimize } from 'lucide-react';

export default function FlowBuilder({ nodes, setNodes, edges, setEdges }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const nodeTypes = useMemo(() => ({ cityNode: CityNode }), []);
  const edgeTypes = useMemo(() => ({ customEdge: CustomEdge }), []);

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
      const edgeIndex = eds.filter(e => e.source === params.source && e.target === params.target).length;
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

  const addCityNode = () => {
    const newNode = {
      id: `cityNode-${Date.now()}`,
      type: 'cityNode',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { 
        label: '', rooms: '', food: '', activity: '',
        onChangeField: updateNodeDataField,
        onDeleteNode: deleteNode
      }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const processedNodes = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      onChangeField: updateNodeDataField,
      onDeleteNode: deleteNode
    }
  }));

  const processedEdges = edges.map(e => ({
    ...e,
    data: {
      ...e.data,
      onDataChange: updateEdgeData,
      onDeleteEdge: deleteEdge
    }
  }));

  return (
    <div style={
      isFullscreen 
        ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: '#F0F0F0', border: '8px solid #000' }
        : { height: '500px', width: '100%', border: '4px solid #000', borderRadius: '0px', position: 'relative', overflow: 'hidden', background: '#F0F0F0', boxShadow: '6px 6px 0px #000' }
    }>
      
      <button 
        type="button" 
        onClick={() => setIsFullscreen(!isFullscreen)} 
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, background: '#000', color: '#fff', border: 'none', padding: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '4px 4px 0px #FF5D73' }}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', gap: '0.8rem', flexDirection: 'column' }}>
        <button type="button" className="btn-outline" style={{ padding: '10px', fontSize: '1rem', background: '#FFE600' }} onClick={addCityNode}>
           <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
             <MapPin size={20}/> + Add Place Node
           </div>
        </button>
        
        <div style={{ background: '#fff', border: '3px solid #000', padding: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          Drag a connection line from right-to-left handles between places. <br/>A transport box will appear on the line!
        </div>
      </div>

      <ReactFlow
        nodes={processedNodes}
        edges={processedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color="#000" gap={20} size={1.5} />
        <Controls style={{ border: '3px solid #000', borderRadius: 0 }} />
      </ReactFlow>
    </div>
  );
}
