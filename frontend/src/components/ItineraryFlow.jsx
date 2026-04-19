import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactFlow, { Background, useReactFlow, ReactFlowProvider } from 'reactflow';
import axios from 'axios';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { CityNode, NoteNode, StickerNode, HubNode } from './CustomNodes';
import CustomEdge from './CustomEdge';
import { Heart, ZoomIn, ZoomOut, Maximize, Minimize, Send, Trash2, MapPin, Calendar, Wallet, Navigation, Download, RotateCw, Crosshair } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getUserAuthHeader } from '../utils/auth';

function FlowContent({ place, onLike }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const flowInstanceRef = useRef(null);
  const containerRef = useRef(null);
  const flowCanvasRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const savedUser = JSON.parse(localStorage.getItem('travel_user') || '{}');
  const [likedBy, setLikedBy] = useState(Array.isArray(place.likedBy) ? place.likedBy : []);
  const [comments, setComments] = useState(place.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const isMobile = window.innerWidth < 768;

  // Re-fit when toggling fullscreen or rotating — wait for layout to settle
  useEffect(() => {
    if (flowInstanceRef.current) {
      const timer = setTimeout(() => {
        flowInstanceRef.current.fitView({ padding: 0.2, duration: 300 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, isRotated]);

  // Lock body scroll when expanded; reset rotation on collapse
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsRotated(false);
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

  // animated:false + forced markerEnd so arrows always show (same as admin FlowBuilder)
  const readOnlyEdges = useMemo(() =>
    (place.edges || []).map(e => ({
      ...e,
      type: 'customEdge',
      animated: false,
      selectable: true,
      markerEnd: { type: 'arrowclosed', color: e.data?.color || '#1b4332', width: 22, height: 22 },
      data: { ...e.data, readOnly: true }
    })), [place.edges]);

  const handleLike = async () => {
    const currentUser = JSON.parse(localStorage.getItem('travel_user') || '{}');
    if (isLiking || !currentUser.name) return;
    setIsLiking(true);
    try {
      const res = await axios.post(`/api/places/${place._id}/like`, { user: currentUser.name }, { headers: getUserAuthHeader() });
      const newLikedBy = Array.isArray(res.data.likedBy) ? res.data.likedBy : [];
      if (newLikedBy.includes(currentUser.name) && !likedBy.includes(currentUser.name)) {
        confetti({
          particleCount: 80, spread: 70, origin: { y: 0.8 },
          colors: ['#FF5D73', '#FFE600', '#FFFFFF', '#1b4332']
        });
      }
      setLikedBy(newLikedBy);
      if (onLike) onLike(place._id, newLikedBy);
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
      }, { headers: getUserAuthHeader() });
      setComments(res.data);
      setNewComment('');
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await axios.delete(`/api/places/${place._id}/comment/${commentId}`, { headers: getUserAuthHeader() });
      setComments(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDownloadPDF = () => {
    if (isDownloading) return;
    setIsDownloading(true);

    // Fit all nodes into view before printing
    if (flowInstanceRef.current) {
      flowInstanceRef.current.fitView({ padding: 0.12, duration: 0 });
    }

    // Give a ref ID so print CSS can isolate this container
    if (containerRef.current) containerRef.current.setAttribute('id', 'itinerary-print-root');

    // Inject @media print styles: hide everything else, show only this container
    const style = document.createElement('style');
    style.id = '__itinerary_print_style__';
    style.textContent = `
      @media print {
        @page { margin: 0; size: landscape; }
        body * { visibility: hidden !important; }
        #itinerary-print-root,
        #itinerary-print-root * { visibility: visible !important; }
        #itinerary-print-root {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 999999 !important;
          overflow: hidden !important;
          background: white !important;
        }
        .pdf-hide,
        .react-flow__controls,
        .react-flow__attribution,
        .react-flow__panel { visibility: hidden !important; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
      // Clean up after the print dialog closes
      setTimeout(() => {
        style.remove();
        if (containerRef.current) containerRef.current.removeAttribute('id');
        setIsDownloading(false);
      }, 1500);
    }, 250);
  };

  const flowHeight = isMobile ? '55vw' : '520px';

  const containerStyle = {
    width: '100%',
    position: 'relative',
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: isMobile ? '20px' : '40px',
    boxShadow: '0 40px 80px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #081c15 0%, #1b4332 60%, #2d6a4f 100%)',
        flexShrink: 0,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '-20px', bottom: '-40px', width: '120px', height: '120px', background: 'rgba(255,183,3,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Top row: route + expand button */}
        <div style={{
          padding: isMobile ? '16px 18px 12px' : '28px 40px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'relative', zIndex: 2,
        }}>
          <div>
            {/* FROM → TO route */}
            {place.from ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', fontWeight: 700, color: 'rgba(216,243,220,0.6)', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>
                  {place.from.toUpperCase()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffb703' }}>
                  <div style={{ width: isMobile ? '20px' : '32px', height: '1px', background: 'rgba(255,183,3,0.5)' }} />
                  <Navigation size={isMobile ? 11 : 13} color="#ffb703" />
                  <div style={{ width: isMobile ? '20px' : '32px', height: '1px', background: 'rgba(255,183,3,0.5)' }} />
                </div>
                <span style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', fontWeight: 700, color: '#ffb703', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>
                  {place.name.toUpperCase()}
                </span>
              </div>
            ) : null}
            <h2 style={{
              fontSize: isMobile ? '1.6rem' : '2.2rem', color: '#fff', margin: 0,
              fontWeight: 400, textTransform: 'uppercase', letterSpacing: '3px',
              fontFamily: "'Bebas Neue', cursive", lineHeight: 1,
            }}>
              {place.name}
            </h2>
            {place.description && !isMobile && (
              <p style={{ margin: '8px 0 0', color: 'rgba(216,243,220,0.55)', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 400, maxWidth: '480px', lineHeight: 1.5 }}>
                {place.description}
              </p>
            )}
          </div>

          <div className="pdf-hide" style={{ display: 'flex', gap: isMobile ? '6px' : '8px', alignItems: 'center', flexShrink: 0 }}>
            {/* PDF Download */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              style={{
                background: isDownloading ? 'rgba(255,183,3,0.15)' : 'rgba(255,183,3,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,183,3,0.45)',
                padding: isMobile ? '9px' : '10px 20px',
                borderRadius: isMobile ? '12px' : '50px', color: '#ffb703',
                fontSize: '0.7rem',
                fontWeight: 700, letterSpacing: '1px',
                cursor: isDownloading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '7px',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s ease',
                opacity: isDownloading ? 0.7 : 1,
              }}>
              {isDownloading
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : isMobile ? <Download size={14} /> : <><Download size={12} /> SAVE</>}
            </button>
            {/* Expand */}
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: isMobile ? '9px' : '10px 20px',
                borderRadius: isMobile ? '12px' : '50px', color: 'white',
                fontSize: '0.7rem',
                fontWeight: 700, letterSpacing: '1px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '7px',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              {isMobile ? <Maximize size={14} /> : <><Maximize size={12} /> EXPAND</>}
            </button>
          </div>
        </div>

        {/* Trip meta badges */}
        <div style={{
          padding: isMobile ? '0 14px 14px' : '0 40px 24px',
          display: 'flex', gap: isMobile ? '6px' : '10px', flexWrap: 'wrap',
          position: 'relative', zIndex: 2,
        }}>
          {place.days && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', padding: isMobile ? '5px 10px' : '6px 14px', borderRadius: '50px' }}>
              <Calendar size={10} color="#ffb703" />
              <span style={{ fontSize: isMobile ? '0.58rem' : '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>{place.days.toUpperCase()}</span>
            </div>
          )}
          {place.budgetRange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', padding: isMobile ? '5px 10px' : '6px 14px', borderRadius: '50px' }}>
              <Wallet size={10} color="#ffb703" />
              <span style={{ fontSize: isMobile ? '0.58rem' : '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>{place.budgetRange.toUpperCase()}</span>
            </div>
          )}
          {place.distance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', padding: isMobile ? '5px 10px' : '6px 14px', borderRadius: '50px' }}>
              <MapPin size={10} color="#ffb703" />
              <span style={{ fontSize: isMobile ? '0.58rem' : '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>{place.distance.toUpperCase()}</span>
            </div>
          )}
          {place.nodes?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,183,3,0.15)', border: '1px solid rgba(255,183,3,0.3)', padding: isMobile ? '5px 10px' : '6px 14px', borderRadius: '50px' }}>
              <span style={{ fontSize: isMobile ? '0.58rem' : '0.62rem', fontWeight: 700, color: '#ffb703', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>{place.nodes.length} STOPS</span>
            </div>
          )}
        </div>
      </div>

      {/* ── FLOW CANVAS ── */}
      <div ref={flowCanvasRef} style={isExpanded ? (isRotated ? {
        position: 'fixed',
        width: '100vh', height: '100vw',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        zIndex: 9999, overflow: 'visible',
        background: 'linear-gradient(135deg, #f0f7f2 0%, #f7faf8 100%)',
      } : {
        position: 'fixed', inset: 0, zIndex: 9999,
        width: '100vw', height: '100vh', overflow: 'hidden',
        background: 'linear-gradient(135deg, #f0f7f2 0%, #f7faf8 100%)',
      }) : {
        height: flowHeight,
        minHeight: isMobile ? '240px' : '400px',
        width: '100%', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #f0f7f2 0%, #f7faf8 100%)',
      }}>
        {place.nodes?.length > 0 ? (
          <ReactFlow
            nodes={readOnlyNodes}
            edges={readOnlyEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(instance) => {
              flowInstanceRef.current = instance;
              instance.fitView({ padding: 0.25, duration: 400 });
            }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            minZoom={0.05}
            maxZoom={3}
          >
            <Background color="#c8ddd0" gap={40} size={1} />
          </ReactFlow>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(27,67,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={28} color="#1b4332" style={{ opacity: 0.4 }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1b4332', opacity: 0.3, letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>NO ITINERARY NODES YET</div>
              <div style={{ fontSize: '0.65rem', color: '#999', marginTop: '6px', fontFamily: "'DM Sans', sans-serif" }}>This trip hasn't been mapped yet.</div>
            </div>
          </div>
        )}

        {/* ── CONTROLS ── */}
        {isExpanded ? (
          /* Fullscreen: all buttons together, centered at bottom */
          <div className="pdf-hide" style={{
            position: 'absolute', bottom: '90px', left: '50%',
            transform: 'translateX(-50%)', zIndex: 10,
            display: 'flex', gap: '8px', alignItems: 'center',
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
            borderRadius: '20px', padding: '8px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid rgba(27,67,50,0.1)',
          }}>
            <button onClick={() => zoomIn()} style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '10px', color: '#1b4332', cursor: 'pointer', display: 'flex' }}>
              <ZoomIn size={18} />
            </button>
            <button onClick={() => zoomOut()} style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '10px', color: '#1b4332', cursor: 'pointer', display: 'flex' }}>
              <ZoomOut size={18} />
            </button>
            <button onClick={() => flowInstanceRef.current?.fitView({ padding: 0.25, duration: 400 })} style={{ background: '#1b4332', border: 'none', padding: '8px', borderRadius: '10px', color: '#fff', cursor: 'pointer', display: 'flex' }}>
              <Crosshair size={18} />
            </button>
            <div style={{ width: '1px', height: '24px', background: 'rgba(27,67,50,0.15)', margin: '0 2px' }} />
            <button
              onClick={() => setIsRotated(r => !r)}
              style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '10px', color: '#ffb703', cursor: 'pointer', display: 'flex' }}>
              <RotateCw size={18} />
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              style={{ background: '#081c15', border: 'none', padding: '8px 14px', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif" }}>
              <Minimize size={14} /> EXIT
            </button>
          </div>
        ) : (
          /* Normal card: just zoom controls, bottom-left */
          <div className="pdf-hide" style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10, display: 'flex', gap: '8px' }}>
            <button onClick={() => zoomIn()} style={{ background: '#fff', border: '1px solid rgba(27,67,50,0.12)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px', borderRadius: '12px', color: '#1b4332', cursor: 'pointer', display: 'flex' }}>
              <ZoomIn size={16} />
            </button>
            <button onClick={() => zoomOut()} style={{ background: '#fff', border: '1px solid rgba(27,67,50,0.12)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px', borderRadius: '12px', color: '#1b4332', cursor: 'pointer', display: 'flex' }}>
              <ZoomOut size={16} />
            </button>
            <button onClick={() => flowInstanceRef.current?.fitView({ padding: 0.25, duration: 400 })} style={{ background: '#1b4332', border: 'none', boxShadow: '0 4px 12px rgba(27,67,50,0.3)', padding: '10px', borderRadius: '12px', color: '#fff', cursor: 'pointer', display: 'flex' }}>
              <Crosshair size={16} />
            </button>
          </div>
        )}
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

export default function ItineraryFlow({ place, onLike }) {
  if (!place) return null;
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <ReactFlowProvider>
        <FlowContent place={place} onLike={onLike} />
      </ReactFlowProvider>
    </>
  );
}
