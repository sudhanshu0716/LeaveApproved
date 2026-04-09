import React, { useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';

// Beautiful SVG of a realistic commercial jet
const CommercialPlane = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="150" height="150" style={{ transform: 'rotate(45deg)' }}>
    <path fill="#ffffff" stroke="#000" strokeWidth="15" d="M510,256c-2.3-5.2-6.5-9.3-11.8-11.2l-146.4-53.5L245.9,26c-2.5-4.2-6.4-7.5-11-9.3 c-4.7-1.7-9.8-1.8-14.5-0.1c-14.4,5.2-56.1,20.3-66.2,24c-3.7,1.4-6.8,4.1-8.7,7.5c-1.9,3.5-2.4,7.5-1.5,11.3 l36.1,123.5l-69.7,2.2l-37-47.3c-2.9-3.7-7.4-5.8-12.2-5.7L25.3,132.1c-6.8,0.1-13,4.2-16.1,10.3c-3,6.2-2.1,13.6,2.2,19 l54.8,69.5l0.1,52L11.5,352.4c-4.3,5.5-5.2,12.8-2.2,19c3,6.1,9.2,10.1,16.1,10.3l35.5,0.1c4.8,0,9.3-2.1,12.2-5.7l37-47.3 l69.7,2.2l-36.1,123.5c-0.9,3.9-0.3,7.9,1.5,11.3c1.9,3.5,5,6.1,8.7,7.5c10.1,3.7,51.8,18.8,66.2,24c4.7,1.7,9.8,1.6,14.5-0.1 c4.7-1.8,8.5-5.1,11-9.3l105.9-165.3l146.4-53.5c5.3-1.9,9.5-6.1,11.8-11.3C512.2,265.5,512.2,260,510,256z" />
  </svg>
);

// High quality dynamic skydiver
const Skydiver = () => (
  <svg viewBox="0 0 200 300" width="100">
    <path d="M 10 100 Q 100 -20 190 100 Z" fill="#FFE600" stroke="#000" strokeWidth="8" />
    <path d="M 10 100 L 190 100" stroke="#000" strokeWidth="8" />
    <line x1="20" y1="100" x2="90" y2="200" stroke="#000" strokeWidth="4" />
    <line x1="60" y1="100" x2="95" y2="200" stroke="#000" strokeWidth="4" />
    <line x1="140" y1="100" x2="105" y2="200" stroke="#000" strokeWidth="4" />
    <line x1="180" y1="100" x2="110" y2="200" stroke="#000" strokeWidth="4" />
    <circle cx="100" cy="205" r="14" fill="#FF5D73" stroke="#000" strokeWidth="4" />
    <rect x="90" y="222" width="20" height="35" fill="#90E0EF" rx="5" stroke="#000" strokeWidth="4" />
    <path d="M 90 225 L 70 195" stroke="#000" strokeWidth="6" strokeLinecap="round" />
    <path d="M 110 225 L 130 195" stroke="#000" strokeWidth="6" strokeLinecap="round" />
    <path d="M 95 258 L 85 290" stroke="#000" strokeWidth="8" strokeLinecap="round" />
    <path d="M 105 258 L 115 290" stroke="#000" strokeWidth="8" strokeLinecap="round" />
  </svg>
);

// Puffy Clouds
const CloudSvg = () => (
  <svg viewBox="0 0 512 512" width="200" style={{ filter: 'drop-shadow(6px 6px 0px #000)' }}>
    <path fill="#ffffff" stroke="#000" strokeWidth="15" d="M400,256c0-61.9-50.1-112-112-112c-20.1,0-38.9,5.3-55,14.6 C216.7,119.5,176.7,96,131.2,96C58.8,96,0,154.8,0,227.2c0,61.9,42.6,114.2,100,128.5V368h300v-12.3 C467.4,342.3,512,291.9,512,230.4C512,175,463.1,130,400,130v126H400z" />
  </svg>
);

function Cloud({ top, left, scale, driftDuration }) {
  const ref = useRef();
  useEffect(() => {
    gsap.to(ref.current, {
      x: "-=100",
      y: "+=20",
      duration: driftDuration,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }, [driftDuration]);

  return (
    <div ref={ref} style={{ position: 'absolute', top, left, transform: `scale(${scale})`, opacity: 0.8, zIndex: 1 }}>
      <CloudSvg />
    </div>
  );
}

export default function AnimatedBackground() {
  const planeRef = useRef();
  const skydiverRef = useRef();
  const wrapperRef = useRef();

  useEffect(() => {
    // Make sure we have our refs
    if (!planeRef.current || !skydiverRef.current) return;

    // We animate inside the bounding box of vw/vh
    const w = window.innerWidth;
    const h = window.innerHeight;

    const tlPlane = gsap.timeline({ repeat: -1 });

    // Plane starts bottom-left off screen
    tlPlane.set(planeRef.current, { x: -200, y: h + 100, rotation: -30, opacity: 1 });
    
    // Takeoff climb
    tlPlane.to(planeRef.current, { x: w * 0.3, y: h * 0.4, duration: 4, ease: "power1.inOut" });

    // Loop-de-loop
    tlPlane.to(planeRef.current, { rotation: -360, duration: 2, ease: "none" }, "-=1");
    tlPlane.to(planeRef.current, { x: w * 0.5, y: h * 0.2, duration: 1 }, "-=1.5");

    // Skydiver ejection point! 
    // At t ~= 3.5, we pop out the skydiver
    
    // Plane finishes loop and barrel rolls away to the right
    tlPlane.to(planeRef.current, { x: w + 200, y: h * 0.1, duration: 4, ease: "power2.in" });
    tlPlane.to(planeRef.current, { rotation: 0, duration: 4 }, "-=4");
    
    // Hide plane to wait for next cycle
    tlPlane.to(planeRef.current, { opacity: 0, duration: 0.1 });
    tlPlane.to({}, { duration: 6 }); // Wait for skydiver to land before repeating
    

    const tlSkydiver = gsap.timeline({ repeat: -1 });
    
    tlSkydiver.set(skydiverRef.current, { x: w * 0.5, y: h * 0.2, scale: 0, opacity: 0 });
    tlSkydiver.to({}, { duration: 3.5 }); // Wait for plane loop crest
    
    // Pop! Parachute deploys
    tlSkydiver.to(skydiverRef.current, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" });
    
    // Float down gracefully
    tlSkydiver.to(skydiverRef.current, { y: h + 200, duration: 8, ease: "power1.in" }, "-=0.4");
    tlSkydiver.to(skydiverRef.current, { x: `+=${w * 0.1}`, rotation: 10, yoyo: true, repeat: 5, duration: 1.3, ease: "sine.inOut" }, "-=8");
    
    // Reset sync
    tlSkydiver.to({}, { duration: 2.1 }); 

  }, []);

  const cloudsData = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 60}%`,
      left: `${Math.random() * 90}%`,
      scale: 0.5 + Math.random() * 0.8,
      driftDuration: 10 + Math.random() * 10
    }));
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none', background: 'transparent', overflow: 'hidden' }}>
      
      {cloudsData.map((c) => (
        <Cloud key={c.id} {...c} />
      ))}

      <div ref={planeRef} style={{ position: 'absolute', zIndex: 2 }}>
        <CommercialPlane />
      </div>

      <div ref={skydiverRef} style={{ position: 'absolute', zIndex: 3 }}>
        <Skydiver />
      </div>

    </div>
  );
}
