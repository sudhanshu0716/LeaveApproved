import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactFlow, { Background, useReactFlow, ReactFlowProvider } from 'reactflow';
import axios from 'axios';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { CityNode, NoteNode, StickerNode, HubNode } from './CustomNodes';
import CustomEdge from './CustomEdge';
import { Heart, ZoomIn, ZoomOut, Maximize, Minimize, Send, Trash2, X } from 'lucide-react';
import confetti from 'canvas-confetti';

function FlowContent({ place }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const flowInstanceRef = useRef(null);
  const savedUser = JSON.parse(localStorage.getItem('travel_user') || '{}');
  const [likedBy, setLikedBy] = useState(Array.isArray(place.likedBy) ? place.likedBy : []);
  const [comments, setComments] = useState(place.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = window.innerWidth < 768;

  // Re-fit when toggling fullscreen — wait for CSS transition to finish
  useEffect(() => {
    if (flowInstanceRef.current) {
      const timer = setTimeout(() => {
        flowInstanceRef.current.fitView({ padding: 0.2, duration: 300 });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Lock body scroll when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

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
      if (!currentUser.name) alert('Profile missing. Please enter your name on the home page first!');
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
    if (!window.confirm('Remove your review?')) return;
    try {
      const res = await axios.delete(`/api/places/${place._id}/comment/${commentId}`);
      setComments(res.data);
    } catch (err) { console.error(err); }
  };

  const flowHeight = isExpanded
    ? '100%'
    : isMobile ? '55vw' : '520px';

  const containerStyle = isExpanded ? {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } : {
    width: '100%',
    position: 'relative',
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: isMobile ? '20px' : '40px',
    boxShadow: '0 40px 80px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      {/* ── HEADER ── */}
      <div style={{
        padding: isMobile ? '14px 18px' : '24px 40px',
        borderBottom: '1px solid #edf5ee',
        background: 'linear-gradient(135deg, #1b4332, #2d6a4f)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
          <div style={{ background: '#ffb703', padding: isMobile ? '8px' : '12px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(255,183,3,0.4)' }}>
            <Maximize size={isMobile ? 16 : 20} color="#1b4332" />
          </div>
          <h2 style={{
            fontSize: isMobile ? '1.2rem' : '1.6rem', color: '#fff', margin: 0,
            fontWeight: 400, textTransform: 'uppercase', letterSpacing: '2px',
            fontFamily: "'Bebas Neue', cursive",
          }}>
            {place.name}
          </h2>
        </div>

        <button
          onClick={() => setIsExpanded(e => !e)}
          style={{
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.25)',
            padding: isMobile ? '8px 14px' : '10px 24px',
            borderRadius: '50px', color: 'white',
            fontSize: isMobile ? '0.62rem' : '0.75rem',
            fontWeight: 700, letterSpacing: '1px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: "'DM Sans', sans-serif",
            position: 'relative', zIndex: 2,
          }}>
          {isExpanded
            ? <><Minimize size={13} /> EXIT FULL SCREEN</>
            : <><Maximize size={13} /> FULL SCREEN</>}
        </button>

        <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '140px', height: '140px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%', pointerEvents: 'none' }} />
      </div>

      {/* ── FLOW CANVAS ── */}
      <div style={{
        height: flowHeight,
        minHeight: isExpanded ? 0 : (isMobile ? '240px' : '400px'),
        flex: isExpanded ? 1 : undefined,
        width: '100%', overflow: 'hidden', position: 'relative', background: '#f7f9f8'
      }}>
        <ReactFlow
          nodes={readOnlyNodes}
          edges={readOnlyEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={(instance) => {
            flowInstanceRef.current = instance;
            // fitView fires after ReactFlow finishes measuring all nodes
            instance.fitView({ padding: 0.25, duration: 400 });
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          minZoom={0.05}
          maxZoom={3}
        >
          <Background color="#dde5e0" gap={40} size={1} />
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10, display: 'flex', gap: '10px' }}>
            <button onClick={() => zoomIn()} style={{ background: '#fff', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px', borderRadius: '12px', color: '#1b4332', cursor: 'pointer', display: 'flex' }}>
              <ZoomIn size={18} />
            </button>
            <button onClick={() => zoomOut()} style={{ background: '#fff', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px', borderRadius: '12px', color: '#1b4332', cursor: 'pointer', display: 'flex' }}>
              <ZoomOut size={18} />
            </button>
            <button onClick={() => flowInstanceRef.current?.fitView({ padding: 0.25, duration: 400 })} style={{ background: '#1b4332', border: 'none', boxShadow: '0 4px 12px rgba(27,67,50,0.25)', padding: '10px', borderRadius: '12px', color: '#fff', cursor: 'pointer', display: 'flex' }}>
              <Maximize size={18} />
            </button>
          </div>
        </ReactFlow>
      </div>

      {/* ── LIKES + COMMENT COUNT ── */}
      <div style={{ padding: isMobile ? '14px 20px' : '20px 36px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleLike}
          style={{
            background: isLiked ? '#FF5D73' : '#f8f9fa',
            color: isLiked ? '#fff' : '#1b4332',
            border: isLiked ? 'none' : '1.5px solid #eee',
            padding: isMobile ? '10px 20px' : '12px 28px', borderRadius: '16px',
            fontWeight: 900, display: 'flex', alignItems: 'center',
            gap: '10px', boxShadow: isLiked ? '0 6px 16px rgba(255,93,115,0.3)' : 'none',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
          <Heart fill={isLiked ? "white" : "none"} size={18} color={isLiked ? "white" : "#FF5D73"} />
          <span style={{ fontSize: '1rem', fontWeight: 900 }}>{likedBy.length}</span>
        </motion.button>
        <div style={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#999', fontFamily: "'DM Sans', sans-serif" }}>
          {comments.length} REVIEWS
        </div>
      </div>

      {/* ── COMMENTS ── */}
      <div style={{
        padding: isMobile ? '20px' : '32px 36px',
        background: '#fcfdfc', borderTop: '1px solid #edf5ee',
        maxHeight: isExpanded ? (isMobile ? '40vh' : '35vh') : undefined,
        overflowY: isExpanded ? 'auto' : undefined,
        flexShrink: 0,
      }}>
        <form onSubmit={handleComment} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            className="nodrag"
            placeholder="Share your thoughts about this trip..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            style={{
              flex: 1, padding: isMobile ? '14px 18px' : '16px 22px',
              fontSize: '0.9rem', background: '#fff',
              border: '1.5px solid #eee', borderRadius: '16px', color: '#333',
              outline: 'none', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            }}
          />
          <button type="submit" style={{
            background: '#1b4332', color: '#fff', border: 'none',
            padding: isMobile ? '0 18px' : '0 28px',
            borderRadius: '16px', fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Send size={14} style={{ transform: 'rotate(-45deg)' }} />
            {!isMobile && 'POST'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {comments.map((c, i) => (
            <div key={c._id || i} style={{ border: '1px solid #eee', padding: isMobile ? '16px' : '20px', borderRadius: '20px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1b4332', fontWeight: 900, fontSize: '0.85rem', flexShrink: 0 }}>
                  {c.user.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#1b4332', letterSpacing: '1px', marginBottom: '4px', fontFamily: "'DM Sans', sans-serif" }}>{c.user.toUpperCase()}</div>
                  <div style={{ color: '#444', lineHeight: '1.5', fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif" }}>{c.text}</div>
                </div>
              </div>
              {c.user === savedUser.name && (
                <button onClick={() => handleDeleteComment(c._id)} style={{ background: 'none', border: 'none', color: '#ff5d73', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
          {comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '28px', color: '#999', fontWeight: 600, fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>
              No reviews yet — be the first to share your thoughts!
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
