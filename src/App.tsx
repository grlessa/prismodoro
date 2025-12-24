import React from 'react';
import PrismodoroUI from './Component';

export default function App() {
  return (
    <div className="w-full h-screen bg-black">
      {/* 
        For demo purposes, we set targetMinutes to 0.1 (6 seconds) 
        so you can quickly see the Flow State transition in preview.
        In a real app, this would be 25 minutes.
      */}
      <PrismodoroUI targetMinutes={25} />
    </div>
  );
}
