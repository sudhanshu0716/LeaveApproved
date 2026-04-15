import React, { useMemo, useState } from 'react';
import ReactFlow, { Background, useReactFlow, ReactFlowProvider } from 'reactflow';
import axios from 'axios';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { CityNode, NoteNode, StickerNode, HubNode } from './CustomNodes';
import CustomEdge from './CustomEdge';
import { Heart, MessageSquare, ZoomIn, ZoomOut, Maximize, Send, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

function FlowContent({ place }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const savedUser = JSON.parse(localStorage.getItem('travel_user') || '{}');
  const [likedBy, setLikedBy] = useState(Array.isArray(place.likedBy) ? place.likedBy : []);
  const [comments, setComments] = useState(place.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isLiked = savedUser.name ? likedBy.includes(savedUser.name) : false;

  const nodeTypes = useMemo(() => ({
    cityNode: CityNode,
    noteNode: NoteNode,
    stickerNode: StickerNode,
    hubNode: HubNode
  }), []);

  const edgeTypes = useMemo(() => ({
    customEdge: CustomEdge
  }), []);

  const readOnlyNodes = useMemo(() => 
    place.nodes.map(n => ({ 
      ...n, 
      draggable: false,
      selectable: true,
      data: { ...n.data, readOnly: true } 
    })), [place.nodes]);

  const readOnlyEdges = useMemo(() => 
    (place.edges || []).map(e => ({ 
      ...e, 
      type: 'customEdge', 
      animated: true,
      selectable: true,
      data: { ...e.data, readOnly: true } 
    })), [place.edges]);

  const handleLike = async () => {
    const currentUser = JSON.parse(localStorage.getItem('travel_user') || '{}');
    if (isLiking || !currentUser.name) {
      if(!currentUser.name) alert('Traveler identity missing. Please enter your name on the home page first!');
      return;
    }
    
    setIsLiking(true);
    try {
      const res = await axios.post(`/api/places/${place._id}/like`, { user: currentUser.name });
      const newLikedBy = Array.isArray(res.data.likedBy) ? res.data.likedBy : [];
      
      if (newLikedBy.includes(currentUser.name) && !likedBy.includes(currentUser.name)) {
        confetti({
          particleCount: 80, spread: 70, origin: { y: 0.8 },
          colors: ['#FF5D73', '#FFE600', '#FFFFFF', '#1b4332']
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
    <div className="vibrant-mission-panel" style={{ 
      padding: '0', width: '100%', position: 'relative', background: '#fff', 
      border: '1px solid #eee', borderRadius: '40px',
      boxShadow: '0 40px 80px rgba(0,0,0,0.1)', overflow: 'hidden' 
    }}>
      <div style={{ 
        padding: '30px 45px', borderBottom: '1px solid #edf5ee', 
        background: 'linear-gradient(135deg, #1b4332, #2d6a4f)', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', overflow: 'hidden' 
      }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 2 }}>
            <div style={{ background: '#ffb703', padding: '12px', borderRadius: '15px', boxShadow: '0 8px 20px rgba(255, 183, 3, 0.4)' }}>
              <Maximize size={22} color="#1b4332" />
            </div>
            <h2 className="title" style={{ fontSize: '1.8rem', color: '#fff', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {place.name}
            </h2>
         </div>
         
         <button 
           onClick={toggleFullScreen}
           style={{ 
             background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
             border: '1px solid rgba(255,255,255,0.2)', padding: '12px 30px', 
             borderRadius: '50px', color: 'white', fontSize: '0.8rem', 
             fontWeight: 900, letterSpacing: '1px', cursor: 'pointer',
             display: 'flex', alignItems: 'center', gap: '12px',
             transition: 'all 0.3s ease', position: 'relative', zIndex: 2
           }}
           className="glass-btn-vibrant"
         >
           {isFullscreen ? 'EXIT_FULLSCREEN' : 'ENGAGE_FULLSCREEN'} <Send size={14} style={{ transform: 'rotate(-45deg)' }} />
         </button>
         <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
      </div>
      
      <div style={{ height: '600px', width: '100%', overflow: 'hidden', position: 'relative', background: '#fafafa' }}>
        <ReactFlow
          nodes={readOnlyNodes}
          edges={readOnlyEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
        >
          <Background color="#ccc" gap={40} size={1} />
          
          <div className="itinerary-controls" style={{ position: 'absolute', bottom: '30px', left: '30px', zIndex: 10, display: 'flex', gap: '15px' }}>
            <button onClick={() => zoomIn()} style={{ background: '#fff', border: '1px solid #ddd', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', padding: '14px', borderRadius: '18px', color: '#1b4332', cursor: 'pointer' }}><ZoomIn size={22}/></button>
            <button onClick={() => zoomOut()} style={{ background: '#fff', border: '1px solid #ddd', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', padding: '14px', borderRadius: '18px', color: '#1b4332', cursor: 'pointer' }}><ZoomOut size={22}/></button>
            <button onClick={() => fitView()} style={{ background: '#fff', border: '1px solid #ddd', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', padding: '14px', borderRadius: '18px', color: '#1b4332', cursor: 'pointer' }}><Maximize size={22}/></button>
          </div>
        </ReactFlow>
      </div>

      <div style={{ padding: '24px 40px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: '24px', alignItems: 'center' }}>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleLike}
          style={{ 
            background: isLiked ? '#FF5D73' : '#f8f9fa', 
            color: isLiked ? '#fff' : '#1b4332', 
            border: isLiked ? 'none' : '1.5px solid #eee', 
            padding: '12px 28px', borderRadius: '20px',
            fontWeight: 900, display: 'flex', alignItems: 'center', 
            gap: '12px', boxShadow: isLiked ? '0 10px 20px rgba(255,93,115,0.3)' : 'none',
            cursor: 'pointer'
          }}
        >
          <Heart fill={isLiked ? "white" : "none"} size={22} color={isLiked ? "white" : "#FF5D73"} />
          <span style={{ fontSize: '1.1rem' }}>{likedBy.length}</span>
        </motion.button>
        <div style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#999' }}>
          {comments.length} TRAVELER REVIEWS
        </div>
      </div>

      <div style={{ padding: '40px', background: '#fcfdfc', borderTop: '1px solid #edf5ee' }}>
        <form onSubmit={handleComment} style={{ display: 'flex', gap: '20px', marginBottom: '35px' }}>
          <input 
            className="nodrag" 
            placeholder="SHARE YOUR TRAVEL INSIGHTS..." 
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            style={{ 
              flex: 1, padding: '20px 25px', fontSize: '1rem', background: '#fff', 
              border: '1.5px solid #eee', borderRadius: '24px', color: '#333', 
              outline: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.02)', fontWeight: '600'
            }}
          />
          <button type="submit" style={{ background: '#1b4332', color: '#fff', border: 'none', padding: '0 40px', borderRadius: '24px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 25px rgba(27,67,50,0.2)' }}>
            SEND_POST
          </button>
        </form>

        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '15px' }}>
          {comments.map((c, i) => (
            <div key={c._id || i} style={{ border: '1px solid #eee', padding: '24px', borderRadius: '28px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 5px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', gap: '18px' }}>
                <div style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1b4332', fontWeight: 900 }}>
                  {c.user.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1b4332', letterSpacing: '1px', marginBottom: '6px' }}>{c.user.toUpperCase()}</div>
                  <div style={{ color: '#444', lineHeight: '1.5', fontSize: '1rem', fontWeight: '500' }}>{c.text}</div>
                </div>
              </div>
              {c.user === savedUser.name && (
                <button onClick={() => handleDeleteComment(c._id)} style={{ background: 'none', border: 'none', color: '#ff5d73', cursor: 'pointer', padding: '8px' }}>
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
          {comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontWeight: 600 }}>
              No travel logs yet. Be the first to brief others on this mission!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ItineraryFlow({ place }) {
  if (!place) return null;
  return (
    <ReactFlowProvider>
      <FlowContent place={place} />
    </ReactFlowProvider>
  );
}
