import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const AudioWaveform = ({ 
  waveformData, 
  progress = 0, 
  isPlaying = false,
  baseColor = 'rgba(155, 235, 61, 0.3)', 
  progressColor = 'rgba(155, 235, 61, 0.8)',
  height = 100
}) => {
  const canvasRef = useRef(null);
  
  // Draw the waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || !waveformData || waveformData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas dimensions with device pixel ratio for crisp rendering
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    const barWidth = canvasWidth / waveformData.length;
    const barMargin = barWidth > 4 ? 1 : 0; // Add margin if bars are wide enough
    const actualBarWidth = barWidth - barMargin;
    
    // Draw each bar in the waveform
    waveformData.forEach((value, index) => {
      const barHeight = (value / 100) * canvasHeight;
      const x = index * barWidth;
      const y = (canvasHeight - barHeight) / 2;
      
      // Determine color based on progress
      const normalizedProgress = Math.min(1, Math.max(0, progress));
      const isProgressed = index / waveformData.length < normalizedProgress;
      
      ctx.fillStyle = isProgressed ? progressColor : baseColor;
      ctx.fillRect(x, y, actualBarWidth, barHeight);
    });
  }, [waveformData, progress, baseColor, progressColor]);
  
  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      {/* Animated dots for playing state */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 w-full flex justify-center pb-2">
          <motion.div 
            className="flex space-x-1"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 h-1.5 rounded-full bg-primary"
                style={{ 
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.4 + (i * 0.3)
                }}
              />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AudioWaveform;
