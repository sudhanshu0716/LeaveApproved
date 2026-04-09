import React, { useMemo, useState } from 'react';
import ReactFlow, { Background, useReactFlow, ReactFlowProvider } from 'reactflow';
import axios from 'axios';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { ReadOnlyCityNode, ReadOnlyEdge } from './CustomNodes';
import { Heart, MessageSquare, ZoomIn, ZoomOut, Maximize, Send } from 'lucide-react';

function FlowContent({ place }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [likes, setLikes] = useState(place.likes || 0);
  const [comments, setComments] = useState(place.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);

  const nodeTypes = useMemo(() => ({ cityNode: ReadOnlyCityNode }), []);
  const edgeTypes = useMemo(() => ({ customEdge: ReadOnlyEdge }), []);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await axios.post(`/api/places/${place._id}/like`);
      setLikes(res.data.likes);
    } catch (err) { console.error(err); }
    setIsLiking(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const savedUser = JSON.parse(localStorage.getItem('travel_user') || '{}');
      const res = await axios.post(`/api/places/${place._id}/comment`, {
        user: savedUser.name || 'Anonymous Traveler',
        text: newComment
      });
      setComments(res.data);
      setNewComment('');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="glass-card" style={{ padding: '0', width: '100%', position: 'relative', background: '#E2E2E2', border: '4px solid #000', boxShadow: '10px 10px 0px #000', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '4px solid #000', background: '#FFE600', position: 'relative', overflow: 'hidden' }}>
         <h2 className="title" style={{ textAlign: 'center', fontSize: '2rem', color: '#000', margin: 0, position: 'relative', zIndex: 1 }}>
           🗺️ BLUEPRINT: {place.name}
         </h2>
      </div>
      
      <div style={{ height: '400px', width: '100%', overflow: 'hidden', position: 'relative' }}>
        <ReactFlow
          nodes={place.nodes.map(n => ({ ...n, draggable: false }))}
          edges={(place.edges || []).map(e => ({
            ...e,
            type: 'customEdge',
            animated: true,
            style: { stroke: '#000', strokeWidth: 5 }
          }))}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background color="#000" gap={30} size={1} />
          
          <div className="itinerary-controls" style={{ position: 'absolute', bottom: '15px', left: '15px', zIndex: 10, display: 'flex', gap: '8px' }}>
            <button onClick={() => zoomIn()} style={{ background: '#fff', border: '2px solid #000', padding: '8px', boxShadow: '3px 3px 0px #000' }}><ZoomIn size={18}/></button>
            <button onClick={() => zoomOut()} style={{ background: '#fff', border: '2px solid #000', padding: '8px', boxShadow: '3px 3px 0px #000' }}><ZoomOut size={18}/></button>
            <button onClick={() => fitView()} style={{ background: '#FFE600', border: '2px solid #000', padding: '8px', boxShadow: '3px 3px 0px #000' }}><Maximize size={18}/></button>
          </div>
        </ReactFlow>
      </div>

      <div style={{ padding: '1rem', background: '#fff', borderTop: '4px solid #000', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleLike}
          style={{ background: '#FF5D73', color: '#fff', border: '3px solid #000', padding: '8px 16px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '3px 3px 0px #000' }}
        >
          <Heart fill={likes > 0 ? "white" : "none"} size={20} /> {likes}
        </motion.button>
        <div style={{ flex: 1, fontWeight: 900, fontSize: '0.9rem' }}>{comments.length} REVIEWS</div>
      </div>

      <div style={{ padding: '1rem', background: '#f0f0f0', borderTop: '2px solid #000' }}>
        <form onSubmit={handleComment} style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          <input 
            className="input-field" 
            placeholder="Review this plan..." 
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
          />
          <button type="submit" style={{ background: '#000', color: '#fff', border: 'none', padding: '0 15px', fontWeight: 900 }}>
            <Send size={16} />
          </button>
        </form>

        <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {comments.map((c, i) => (
            <div key={i} style={{ border: '2px solid #000', padding: '8px', background: '#fff', boxShadow: '2px 2px 0px #000' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#FF5D73' }}>{c.user}</span>
              <p style={{ margin: '3px 0 0', fontWeight: 'bold', fontSize: '0.85rem' }}>{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ItineraryFlow({ place }) {
  if (!place.nodes || place.nodes.length === 0) return null;
  return (
    <ReactFlowProvider>
      <FlowContent place={place} />
    </ReactFlowProvider>
  );
}
