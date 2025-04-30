
import React, { useEffect, useRef } from 'react';
import { Cloud, Sun, Star, Moon } from 'lucide-react';

interface CloudObject {
  x: number;
  y: number;
  speed: number;
  element: JSX.Element;
  opacity: number;
  scale: number;
}

const AiSky: React.FC = () => {
  const skyRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<CloudObject[]>([]);
  const animationRef = useRef<number>();
  
  const createCloud = (count: number) => {
    const newClouds: CloudObject[] = [];
    
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 100; // random x position (0-100%)
      const y = Math.random() * 30 + 5; // random y position (5-35%)
      const speed = Math.random() * 0.02 + 0.01; // random speed
      const opacity = Math.random() * 0.4 + 0.2; // random opacity (0.2-0.6)
      const scale = Math.random() * 0.8 + 0.6; // random scale (0.6-1.4)
      
      // Randomly select between different sky elements
      const elementType = Math.floor(Math.random() * 10);
      let element: JSX.Element;
      
      if (elementType < 6) {
        element = <Cloud className="text-white/80" />;
      } else if (elementType < 8) {
        element = <Sun className="text-yellow-200" />;
      } else if (elementType < 9) {
        element = <Star className="text-yellow-100" />;
      } else {
        element = <Moon className="text-gray-100" />;
      }
      
      newClouds.push({ x, y, speed, element, opacity, scale });
    }
    
    return newClouds;
  };
  
  const animate = () => {
    if (!skyRef.current) return;
    
    cloudsRef.current = cloudsRef.current.map(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x < -10) {
        cloud.x = 110;
        cloud.y = Math.random() * 30 + 5;
      }
      return cloud;
    });
    
    animationRef.current = requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    // Create initial clouds
    cloudsRef.current = createCloud(15);
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      ref={skyRef} 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
      
      {cloudsRef.current.map((cloud, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: `${cloud.x}%`,
            top: `${cloud.y}%`,
            opacity: cloud.opacity,
            transform: `scale(${cloud.scale})`,
            transition: 'transform 0.5s ease-out'
          }}
        >
          {cloud.element}
        </div>
      ))}
    </div>
  );
};

export default AiSky;
