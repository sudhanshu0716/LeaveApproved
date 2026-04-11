import React, { useMemo, useState } from 'react';
import ReactFlow, { Background, useReactFlow, ReactFlowProvider } from 'reactflow';
import axios from 'axios';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { ReadOnlyCityNode, ReadOnlyEdge } from './CustomNodes';
import { Heart, MessageSquare, ZoomIn, ZoomOut, Maximize, Send, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

function FlowContent({ place }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const savedUser = JSON.parse(localStorage.getItem('travel_user') || '{}');
  const [likedBy, setLikedBy] = useState(Array.isArray(place.likedBy) ? place.likedBy : []);
  const [comments, setComments] = useState(place.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);

  const isLiked = savedUser.name ? likedBy.includes(savedUser.name) : false;

  const nodeTypes = useMemo(() => ({ cityNode: ReadOnlyCityNode }), []);
  const edgeTypes = useMemo(() => ({ customEdge: ReadOnlyEdge }), []);

  const handleLike = async () => {
    // Re-verify the user on every click to ensure reliability
    const currentUser = JSON.parse(localStorage.getItem('travel_user') || '{}');
    if (isLiking || !currentUser.name) {
      if(!currentUser.name) alert('Traveler identity missing. Please enter your name on the home page first!');
      return;
    }
    
    setIsLiking(true);
    try {
      const res = await axios.post(`/api/places/${place._id}/like`, { user: currentUser.name });
      const newLikedBy = Array.isArray(res.data.likedBy) ? res.data.likedBy : [];
      
      // Animation only on true new Like (not toggle-off)
      if (newLikedBy.includes(currentUser.name) && !likedBy.includes(currentUser.name)) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#FF5D73', '#FFE600', '#FFFFFF', '#000000']
        });
      }
      
      setLikedBy(newLikedBy);
    } catch (err) { 
      console.error("Like Error:", err);
      alert('Network error. Failed to record your appreciation.');
    }
    setIsLiking(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`/api/places/${place._id}/comment`, {
        user: savedUser.name || 'Anonymous Traveler',
        text: newComment
      });
      setComments(res.data);
      setNewComment('');
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (commentId) => {
    if(!window.confirm('Remove your review?')) return;
    try {
      const res = await axios.delete(`/api/places/${place._id}/comment/${commentId}`);
      setComments(res.data);
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
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleLike}
          style={{ background: isLiked ? '#FF5D73' : '#fff', color: isLiked ? '#fff' : '#000', border: '3px solid #000', padding: '8px 16px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '3px 3px 0px #000' }}
        >
          <motion.div
            animate={{ scale: isLiked ? [1, 1.5, 1] : 1 }}
            transition={{ duration: 0.3, type: 'spring' }}
          >
            <Heart fill={isLiked ? "white" : "none"} size={20} />
          </motion.div>
          {likedBy.length}
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

        <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '5px' }}>
          {comments.map((c, i) => (
            <div key={c._id || i} style={{ border: '2px solid #000', padding: '10px', background: '#fff', boxShadow: '3px 3px 0px #000', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#FF5D73' }}>{c.user}</span>
                <p style={{ margin: '3px 0 0', fontWeight: 'bold', fontSize: '0.85rem' }}>{c.text}</p>
              </div>
              {c.user === savedUser.name && (
                <button onClick={() => handleDeleteComment(c._id)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: '2px' }}>
                   <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          {comments.length === 0 && <p style={{ fontSize: '0.8rem', fontWeight: 900, opacity: 0.5, textAlign: 'center' }}>NO REVIEWS YET. BE THE FIRST!</p>}
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
