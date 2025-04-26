import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const AudioWave = ({ isPlaying, color = "#9BEB3D" }) => {
  const NUM_BARS = 30;
  const bars = Array.from({ length: NUM_BARS });
  
  // Generate a unique delay for each bar
  const getRandomDelay = (index) => {
    return -(index * 0.1) % 1;
  };
  
  return (
    <div className="flex items-center justify-center h-12 gap-[2px]">
      {bars.map((_, index) => (
        <motion.div
          key={index}
          className="w-[3px] h-1 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            height: isPlaying 
              ? ["20%", `${Math.random() * 60 + 40}%`, "20%"] 
              : "20%"
          }}
          transition={{
            duration: 1.2,
            repeat: isPlaying ? Infinity : 0,
            ease: "easeInOut",
            delay: isPlaying ? getRandomDelay(index) : 0,
          }}
        />
      ))}
    </div>
  );
};

// More sophisticated version with Canvas for better performance
const AudioWaveCanvas = ({ isPlaying, color = "#9BEB3D" }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const NUM_BARS = 60;
  const bars = useRef(
    Array.from({ length: NUM_BARS }).map(() => ({
      height: 2,
      direction: 1
    }))
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas dimensions accounting for device pixel ratio
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const drawBars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = 2;
      const gap = 2;
      const totalWidth = NUM_BARS * (barWidth + gap);
      let x = (canvas.width / dpr - totalWidth) / 2;
      
      bars.current.forEach((bar, i) => {
        if (isPlaying) {
          // Update bar height with a smooth animation
          if (bar.direction > 0) {
            bar.height += Math.random() * 1.5;
            if (bar.height > 30) bar.direction = -1;
          } else {
            bar.height -= Math.random() * 1.5;
            if (bar.height < 2) bar.direction = 1;
          }
        } else {
          // When not playing, smoothly return to minimum height
          if (bar.height > 2) {
            bar.height -= 0.5;
          }
        }
        
        // Draw the bar
        ctx.beginPath();
        ctx.roundRect(
          x, 
          (canvas.height / dpr) / 2 - bar.height / 2, 
          barWidth, 
          bar.height,
          1
        );
        ctx.fillStyle = color;
        ctx.fill();
        
        x += barWidth + gap;
      });
      
      animationRef.current = requestAnimationFrame(drawBars);
    };
    
    drawBars();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-16"
    />
  );
};

export { AudioWave, AudioWaveCanvas };
