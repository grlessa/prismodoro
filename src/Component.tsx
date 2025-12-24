/**
 * PrismodoroUI Component
 * 
 * A high-end monochrome Pomodoro timer focusing on flow states and positive reinforcement.
 * Features:
 * - Industrial minimalist aesthetic (Black/White/1px lines)
 * - "The Horizon Line" progress visualization
 * - Flow Mode: Overtime tracking after target completion
 * - Positive reinforcement summary screen
 * - Setup Dashboard for session configuration
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, ArrowRight, RotateCcw, Settings, Check, Eye, EyeOff } from 'lucide-react';

// --- Types ---

export type TimerStatus = 'idle' | 'setup' | 'running' | 'paused' | 'flow' | 'summary' | 'break' | 'breakEnd';
export type FocusMode = 'classic' | 'prisma';

export interface PrismodoroProps {
  /** Default target duration in minutes. Default: 25 */
  defaultMinutes?: number;
  /** Callback when session is finished */
  onFinish?: (totalMinutes: number) => void;
}

// --- Utils ---

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const playAlarmSound = () => {
  // Create a brief beep sound using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    // Fallback: if Web Audio API fails, silently fail
    console.warn('Could not play alarm sound:', error);
  }
};

// --- Sub-components ---

const ControlButton = ({ 
  onClick, 
  icon: Icon, 
  label, 
  active = false,
  className = '',
  onHover,
  onLeave,
  inverted = false
}: { 
  onClick: () => void; 
  icon?: React.ElementType; 
  label?: string;
  active?: boolean;
  className?: string;
  onHover?: () => void;
  onLeave?: () => void;
  inverted?: boolean;
}) => {
  const borderClass = inverted ? 'border-black/20' : 'border-white/20';
  const hoverClass = inverted 
    ? 'hover:bg-black hover:text-white hover:border-black' 
    : 'hover:bg-white hover:text-black hover:border-white';
  const activeClass = inverted
    ? (active ? 'bg-black text-white' : 'text-black bg-white')
    : (active ? 'bg-white text-black' : 'text-white bg-black');
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        group flex items-center justify-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 border ${borderClass}
        ${hoverClass} transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${activeClass}
        ${className}
      `}
    >
      {Icon && <Icon size={16} className="transition-transform group-hover:scale-110" />}
      <span className="text-xs md:text-base font-medium tracking-widest uppercase">{label}</span>
    </button>
  );
};

const LevelButton = ({
  minutes,
  selected,
  onClick,
  onHover,
  onLeave
}: {
  minutes: number;
  selected: boolean;
  onClick: () => void;
  onHover?: () => void;
  onLeave?: () => void;
}) => (
    <button
    onClick={onClick}
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
    className={`
      px-3 py-2 md:px-6 md:py-3 text-xs md:text-sm font-bold border transition-all duration-300 tracking-wider flex-1 md:flex-none
      ${selected 
        ? 'border-white text-white bg-white/10' 
        : 'border-white/20 text-white/40 hover:border-white/60 hover:text-white'}
    `}
  >
    <span className="md:hidden">{minutes}m</span>
    <span className="hidden md:inline">{minutes === 15 ? 'BAIXO' : minutes === 25 ? 'MÉDIO' : 'ALTO'} ({minutes}m)</span>
  </button>
);

// --- Main Component ---

export function PrismodoroUI({ defaultMinutes = 25, onFinish }: PrismodoroProps) {
  // State
  const [status, setStatus] = useState<TimerStatus>('setup');
  const [targetMinutes, setTargetMinutes] = useState(defaultMinutes);
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
  const [flowTime, setFlowTime] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [focusMode, setFocusMode] = useState<FocusMode>('classic');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [helpText, setHelpText] = useState<string>('');
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [breakDuration, setBreakDuration] = useState(0);
  const [previousTargetMinutes, setPreviousTargetMinutes] = useState(defaultMinutes);
  const [previousFocusMode, setPreviousFocusMode] = useState<FocusMode>('classic');
  // Counter for completed Pomodoro cycles
  // IMPORTANT: This counter resets to 0 on every page reload/refresh.
  // Each browser session starts fresh - previous sessions don't accumulate.
  // This prevents infinite break times from accumulating across sessions.
  const [pomodoroCycles, setPomodoroCycles] = useState(0);
  
  // Pomodoro configuration constants
  const BREAK_RATIO = 0.2; // 20% of focus time for short breaks
  const LONG_BREAK_RATIO = 0.6; // 60% of focus time for long breaks
  const CYCLES_BEFORE_LONG_BREAK = 4; // Number of cycles before long break
  
  // Helper for status text
  const handleHover = (text: string) => setHelpText(text);
  const clearHover = () => setHelpText('');

  // --- MISSING LOGIC RESTORED ---
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = targetMinutes * 60;

  // Ensure cycle counter starts at 0 on component mount (page load/refresh)
  // This guarantees that each browser session starts fresh
  useEffect(() => {
    setPomodoroCycles(0);
  }, []); // Empty dependency array = runs only on mount

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update timeLeft when targetMinutes changes in setup
  useEffect(() => {
    if (status === 'setup' || status === 'idle') {
      setTimeLeft(targetMinutes * 60);
    }
  }, [targetMinutes, status]);

  // Timer Logic
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Clear interval before state transition to prevent continuation
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            // Check Focus Mode
            if (focusMode === 'classic') {
              // Classic Mode: Play alarm and stop immediately when time is up
              playAlarmSound();
              setTotalFocusTime(targetMinutes * 60);
              // Increment Pomodoro cycle counter when session completes
              setPomodoroCycles(prev => prev + 1);
              setStatus('summary');
              return 0;
            } else {
              // Prisma Mode: Switch to Flow State (Overtime)
              setStatus('flow');
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (status === 'flow') {
      timerRef.current = setInterval(() => {
        setFlowTime((prev) => prev + 1);
      }, 1000);
    } else if (status === 'break') {
      timerRef.current = setInterval(() => {
        setBreakTimeLeft((prev) => {
          if (prev <= 1) {
            // Clear interval before state transition
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // Optional: play a gentle sound when break ends
            setStatus('breakEnd');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, focusMode, targetMinutes]);

  // Handlers
  const handleInitialize = () => setStatus('setup');
  
  const handleStartFocus = () => {
    setStatus('running');
  };
  
  const handlePause = () => setStatus('paused');
  
  const handleStop = () => {
    // Calculate total time spent
    const elapsed = totalDuration - timeLeft + flowTime;
    setTotalFocusTime(elapsed);
    // Increment Pomodoro cycle counter when session is manually stopped (if significant time was spent)
    if (elapsed >= targetMinutes * 60 * 0.8) { // Count as cycle if at least 80% of target was completed
      setPomodoroCycles(prev => prev + 1);
    }
    setStatus('summary');
  };

  const handleReset = () => {
    setStatus('setup');
    setTargetMinutes(defaultMinutes);
    setTimeLeft(defaultMinutes * 60);
    setFlowTime(0);
    setTotalFocusTime(0);
    setPomodoroCycles(0); // Reset cycle counter
  };

  const handleFinishSession = () => {
    if (onFinish) onFinish(Math.ceil(totalFocusTime / 60));
    handleReset();
  };

  const handleStartBreak = () => {
    // Save previous configuration before break
    setPreviousTargetMinutes(targetMinutes);
    setPreviousFocusMode(focusMode);
    
    // Calculate break duration using proportional formula (works for ANY focus time: presets or custom)
    // D = 0.2 × F for short breaks (20% of focus time) - applies to classic and prisma modes
    // L = 0.6 × F for long breaks after 4 cycles (60% of focus time)
    // This formula works for any value: 1 minute, 120 minutes, or any custom time
    const isLongBreak = pomodoroCycles >= CYCLES_BEFORE_LONG_BREAK;
    const breakRatio = isLongBreak ? LONG_BREAK_RATIO : BREAK_RATIO;
    // targetMinutes contains the current focus time (preset OR custom slider value)
    const breakMinutes = Math.round(targetMinutes * breakRatio);
    
    setBreakDuration(breakMinutes * 60);
    setBreakTimeLeft(breakMinutes * 60);
    setStatus('break');
  };

  const handleContinueAfterBreak = () => {
    // Restore previous configuration and start timer
    setTargetMinutes(previousTargetMinutes);
    setFocusMode(previousFocusMode);
    setTimeLeft(previousTargetMinutes * 60);
    setFlowTime(0);
    setTotalFocusTime(0);
    // Reset cycle counter after long break (cycle 4+), otherwise keep counting
    if (pomodoroCycles >= CYCLES_BEFORE_LONG_BREAK) {
      setPomodoroCycles(0);
    }
    setStatus('running');
  };

  const handleGoToSetupAfterBreak = () => {
    // Reset and go to setup
    handleReset();
  };

  // Derived Values
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const isFlowState = status === 'flow';
  // -----------------------------

  // Update default status message based on current state if no hover
  const getStatusMessage = () => {
    if (helpText) return helpText;
    
    switch (status) {
      case 'setup': return "STATUS: AGUARDANDO CONFIGURAÇÃO DA SESSÃO.";
      case 'running': return "STATUS: SESSÃO EM PROGRESSO. MANTENHA O FOCO.";
      case 'paused': return "STATUS: SISTEMA EM PAUSA.";
      case 'flow': return "STATUS: MODO FLUXO ATIVO. REGISTRANDO TEMPO EXTRA.";
      case 'summary': return "STATUS: SESSÃO FINALIZADA. ANÁLISE COMPLETA.";
      case 'break': return "STATUS: MODO DESCANSO ATIVO. RECUPERANDO ENERGIA.";
      case 'breakEnd': return "STATUS: DESCANSO CONCLUÍDO. AGUARDANDO DECISÃO.";
      default: return "STATUS: SISTEMA PRONTO.";
    }
  };

  const isBreakMode = status === 'break' || status === 'breakEnd';
  const mainBgClass = isBreakMode ? 'bg-white' : 'bg-black';
  const mainTextClass = isBreakMode ? 'text-black' : 'text-white';

  return (
    <div className={`relative w-full h-screen ${mainBgClass} ${mainTextClass} overflow-hidden font-sans select-none flex flex-col justify-center items-center`}>
      
      {/* Background Ambience - Keep it pure black */}
      
      {/* Main Content Area */}
      <div className="relative w-full max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">

        {/* Fixed Header with Logo */}
        <div className="absolute top-8 left-0 w-full flex flex-col items-center z-50 pointer-events-none select-none">
          <img 
            src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/c6e5d5ea-12a1-4ea1-8c0f-c3edfebb4f78/1766529906408-01dc55b1/prisma-logo-png.png" 
            alt="Prismodoro Logo" 
            className={`w-16 h-16 md:w-20 md:h-20 mb-2 md:mb-4 opacity-90 ${isBreakMode ? 'invert' : ''}`}
          />
          <span className={`text-base md:text-xl font-mono tracking-[0.4em] ${mainTextClass} font-bold uppercase`}>
            Prismodoro
          </span>
        </div>

        {/* --- DYNAMIC FOOTER STATUS (TERMINAL STYLE) --- */}
        <div className="absolute bottom-8 md:bottom-10 left-0 w-full text-center z-30 pointer-events-none">
          <motion.div 
            key={getStatusMessage()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-[10px] md:text-xs font-mono ${isBreakMode ? 'text-black/30' : 'text-white/30'} tracking-widest uppercase`}
          >
            {getStatusMessage()}
          </motion.div>
        </div>

        {/* --- STATE: SUMMARY --- */}
        <AnimatePresence>
          {status === 'summary' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-6"
            >
              <div className="w-full max-w-md border border-white/10 p-6 md:p-12 bg-black text-center relative overflow-hidden">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />

                <motion.h2 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-6xl font-light tracking-tighter mb-2"
                >
                  {Math.ceil(totalFocusTime / 60)} <span className="text-xl md:text-2xl text-white/50 font-normal tracking-normal ml-1">MIN DE FOCO</span>
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60 mb-12 text-sm tracking-wide"
                >
                  Cada minuto conta. Muito bem.
                </motion.p>

                <div className="flex flex-col gap-4">
                  <ControlButton onClick={handleStartBreak} label="Descansar" icon={RotateCcw} />
                  <button 
                    onClick={handleFinishSession}
                    className="text-xs text-white/40 hover:text-white transition-colors uppercase tracking-widest mt-4"
                  >
                    Encerrar Sessão
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- STATE: BREAK END (Choice Screen) --- */}
        <AnimatePresence>
          {status === 'breakEnd' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white p-6"
            >
              <div className="w-full max-w-md border border-black/10 p-6 md:p-12 bg-white text-center relative overflow-hidden">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-black" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-black" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-black" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-black" />

                <motion.h2 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-4xl font-light tracking-tighter mb-4 text-black"
                >
                  Descanso Concluído
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-black/60 mb-12 text-sm tracking-wide"
                >
                  Deseja continuar com a sessão anterior ({previousTargetMinutes}min) ou configurar uma nova?
                </motion.p>

                <div className="flex flex-col gap-4">
                  <ControlButton 
                    onClick={handleContinueAfterBreak} 
                    label="Continuar Sessão" 
                    icon={ArrowRight} 
                    inverted={true}
                    active
                  />
                  <ControlButton 
                    onClick={handleGoToSetupAfterBreak} 
                    label="Nova Sessão" 
                    icon={Settings} 
                    inverted={true}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- STATE: BREAK --- */}
        <AnimatePresence>
          {status === 'break' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center"
            >
              {/* Break Horizon Line (Black on white) */}
              <motion.div 
                className="absolute top-1/2 left-0 w-full -translate-y-1/2 pointer-events-none z-0"
                animate={{ opacity: 1 }}
              >
                {/* Base line (faint black) */}
                <div className="w-full h-[1px] bg-black/10 absolute top-0 left-0" />
                
                {/* Progress line (black) */}
                <motion.div 
                  className="h-[1px] bg-black absolute top-0 left-0 relative"
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: breakDuration > 0 ? `${((breakDuration - breakTimeLeft) / breakDuration) * 100}%` : '0%',
                    boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                  }}
                  transition={{
                    width: { duration: 0.5, ease: "linear" },
                    boxShadow: { duration: 0.2 }
                  }}
                >
                  {/* Leading edge glow */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[100px] h-[20px] bg-gradient-to-r from-transparent to-black/20 blur-md transform translate-x-1/2" />
                </motion.div>
              </motion.div>

              {/* Break Timer Display */}
              <div className="absolute top-1/2 -translate-y-[200px] w-full flex flex-col items-center gap-4 z-20">
                <div className="w-full text-center text-7xl md:text-9xl font-mono tracking-wider text-black select-none whitespace-nowrap leading-none">
                  <span className="font-bold">{formatTime(breakTimeLeft).split(':')[0]}</span>
                  <span className="font-normal opacity-50">:{formatTime(breakTimeLeft).split(':')[1]}</span>
                </div>
                <p className="text-black/60 text-sm tracking-wide uppercase">
                  Tempo de descanso
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- STATE: IDLE / SETUP / RUNNING / PAUSED / FLOW --- */}
        <div className={`transition-all duration-1000 flex flex-col h-full justify-center relative ${status === 'summary' || status === 'break' || status === 'breakEnd' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          
          {/* Top Info - Only visible in Flow State */}
          {!isBreakMode && (
            <div className="absolute top-1/2 -translate-y-[120px] left-0 w-full text-center z-10 pointer-events-none">
              <AnimatePresence>
                {isFlowState && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-xs font-bold tracking-[0.3em] text-white uppercase mb-2">Estado de Fluxo Ativo</span>
                    <div className="text-5xl font-light tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                      + {formatTime(flowTime)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* THE HORIZON LINE */}
          {/* Always present but behaves differently in Setup vs Running */}
          {!isBreakMode && (
            <motion.div 
              className="absolute top-1/2 left-0 w-full -translate-y-1/2 pointer-events-none z-0"
              animate={{ opacity: status === 'setup' ? 0.1 : 1 }}
            >
              {/* Base line (faint) */}
              <div className="w-full h-[1px] bg-white/10 absolute top-0 left-0" />
              
              {/* Progress line */}
              <motion.div 
                className="h-[1px] bg-white absolute top-0 left-0 relative"
                initial={{ width: '0%' }}
                animate={{ 
                  width: isFlowState ? '100%' : (status === 'setup' || status === 'idle' ? '0%' : `${progress}%`),
                  boxShadow: isFlowState 
                    ? ['0 0 10px rgba(255,255,255,0.5)', '0 0 30px rgba(255,255,255,0.8)', '0 0 10px rgba(255,255,255,0.5)'] 
                    : '0 0 2px rgba(255,255,255,0.5)'
                }}
                transition={{
                  width: { duration: 0.5, ease: "linear" },
                  boxShadow: isFlowState ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }
                }}
              >
                {/* Leading edge glow - Only in Running mode */}
                {(status === 'running' || status === 'paused') && !isFlowState && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[100px] h-[20px] bg-gradient-to-r from-transparent to-white/20 blur-md transform translate-x-1/2" />
                )}
              </motion.div>
            </motion.div>
          )}

          {/* CENTRAL CONTENT AREA - SWAPS BASED ON STATE */}
          <div className="relative z-10 w-full flex flex-col items-center justify-center">
            
            {/* 2. SETUP STATE: Dashboard */}
            <AnimatePresence>
              {status === 'setup' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4 }}
                  className="w-full flex flex-col items-center gap-8 md:gap-12"
                >
                  {/* Giant Timer Display */}
                  <div className="w-full text-center text-7xl md:text-9xl font-mono tracking-wider text-white mb-4 md:mb-8 select-none whitespace-nowrap leading-none">
                    <span className="font-bold">{targetMinutes.toString().padStart(2, '0')}</span><span className="opacity-50 font-normal">:00</span>
                  </div>

                  {/* Controls Container */}
                  <div className="w-full max-w-md flex flex-col items-center gap-6">
                    
                    {/* Mode Switcher: Presets vs Custom */}
                    {!isCustomMode ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex w-full md:w-auto gap-2 md:gap-4 justify-center"
                      >
                        {[15, 25, 50].map((min) => (
                          <LevelButton 
                            key={min} 
                            minutes={min} 
                            selected={targetMinutes === min} 
                            onClick={() => setTargetMinutes(min)} 
                            onHover={() => handleHover(
                              min === 15 ? "CONFIG: SESSÃO CURTA (15M). IDEAL PARA ATIVAÇÃO." :
                              min === 25 ? "CONFIG: CICLO PADRÃO (25M). EQUILÍBRIO PERFEITO." :
                              "CONFIG: SESSÃO LONGA (50M). IMERSÃO PROFUNDA."
                            )}
                            onLeave={clearHover}
                          />
                        ))}
                        <button
                          className="px-3 py-2 md:px-4 md:py-2 text-[10px] md:text-xs font-mono border border-white/20 text-white/40 hover:border-white/60 hover:text-white transition-all duration-300"
                          onClick={() => {
                            setIsCustomMode(true);
                            // Set a default custom start if we are currently on a preset, or keep current if it's weird
                            if ([15, 25, 50].includes(targetMinutes)) {
                              setTargetMinutes(30);
                            }
                          }}
                          onMouseEnter={() => handleHover("CONFIG: DEFINIR DURAÇÃO PERSONALIZADA.")}
                          onMouseLeave={clearHover}
                        >
                          <span className="md:hidden">...</span>
                          <span className="hidden md:inline">PERSONALIZAR</span>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full flex flex-col items-center gap-4"
                      >
                        {/* Custom Slider UI */}
                        <div className="w-full relative group">
                          {/* Track */}
                          <div className="h-px w-full bg-white/20 group-hover:bg-white/40 transition-colors" />
                          
                          {/* Slider Input */}
                          <input
                            type="range"
                            min="1"
                            max="120"
                            step="1"
                            value={targetMinutes}
                            onChange={(e) => setTargetMinutes(parseInt(e.target.value))}
                            onMouseEnter={() => handleHover("CONFIG: ARRASTE PARA DEFINIR A DURAÇÃO EXATA.")}
                            onMouseLeave={clearHover}
                            className="absolute inset-0 w-full h-8 opacity-0 cursor-pointer z-10"
                          />
                          
                          {/* Thumb Visual (Calculated Position) */}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black border border-white transform -translate-x-1/2 pointer-events-none transition-transform duration-75"
                            style={{ left: `${((targetMinutes - 1) / (119)) * 100}%` }}
                          />

                          {/* Min/Max Labels */}
                          <div className="absolute -bottom-6 left-0 text-[10px] font-mono text-white/30">1m</div>
                          <div className="absolute -bottom-6 right-0 text-[10px] font-mono text-white/30">120m</div>
                        </div>

                        <button
                          onClick={() => setIsCustomMode(false)}
                          className="mt-4 text-[10px] tracking-[0.2em] text-white/40 hover:text-white transition-colors"
                          onMouseEnter={() => handleHover("COMANDO: RETORNAR AOS PRESETS.")}
                          onMouseLeave={clearHover}
                        >
                          VOLTAR
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Mode Switch */}
                  <div className="flex items-center gap-4 text-sm font-medium tracking-widest mt-4">
                    <span className="text-white/40">MODO:</span>
                    <button 
                      onClick={() => setFocusMode('classic')}
                      onMouseEnter={() => handleHover("MODO CLÁSSICO: ALARME NO ZERO. BOM PARA ROTINA RÍGIDA.")}
                      onMouseLeave={clearHover}
                      className={`transition-colors hover:text-white ${focusMode === 'classic' ? 'text-white border-b border-white' : 'text-white/40'}`}
                    >
                      CLÁSSICO
                    </button>
                    <span className="text-white/20">/</span>
                    <button 
                      onClick={() => setFocusMode('prisma')}
                      onMouseEnter={() => handleHover("MODO PRISMA: SEM INTERRUPÇÕES. ENTRA EM FLUXO APÓS O ZERO.")}
                      onMouseLeave={clearHover}
                      className={`transition-colors hover:text-white ${focusMode === 'prisma' ? 'text-white border-b border-white' : 'text-white/40'}`}
                    >
                      PRISMA
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3. RUNNING STATE: Minimal Timer (Below Horizon) */}
            {!isBreakMode && (
              <AnimatePresence>
                {(status === 'running' || status === 'paused') && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-1/2 translate-y-[60px] flex flex-col items-center gap-4 z-20"
                  >
                    <div className={`text-sm font-mono tracking-widest text-white/40 transition-opacity duration-500 ${isBlindMode ? 'opacity-0 blur-sm' : 'opacity-100'}`}>
                      {formatTime(timeLeft)}
                    </div>
                    
                    <button
                      onClick={() => setIsBlindMode(!isBlindMode)}
                      onMouseEnter={() => handleHover(isBlindMode ? "COMANDO: REVELAR CRONÔMETRO." : "COMANDO: MODO CEGO. OCULTAR NÚMEROS.")}
                      onMouseLeave={clearHover}
                      className="text-white/20 hover:text-white transition-colors p-2"
                    >
                      {isBlindMode ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            
          </div>

          {/* BOTTOM ACTIONS AREA */}
          <div className="absolute bottom-20 md:bottom-24 left-0 w-full flex justify-center gap-4 md:gap-6 z-20 px-4">
            
            {/* Setup -> Running */}
            {status === 'setup' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xs md:w-auto">
                <ControlButton 
                  onClick={handleStartFocus} 
                  icon={ArrowRight} 
                  label="Iniciar Foco" 
                  active 
                  className="w-full md:w-auto"
                  onHover={() => handleHover("COMANDO: INICIALIZAR SEQUÊNCIA DE FOCO.")}
                  onLeave={clearHover}
                />
              </motion.div>
            )}
            
            {/* Running Controls */}
            {(status === 'running' || status === 'paused') && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                <ControlButton 
                  onClick={status === 'running' ? handlePause : handleStartFocus} 
                  icon={status === 'running' ? Pause : Play} 
                  label={status === 'running' ? "Pausar" : "Retomar"}
                  className="border-white/10 text-white/60 hover:text-white hover:border-white/40"
                  onHover={() => handleHover(status === 'running' ? "COMANDO: CONGELAR TEMPORIZADOR." : "COMANDO: RETOMAR CONTAGEM.")}
                  onLeave={clearHover}
                />
                <ControlButton 
                  onClick={handleStop} 
                  icon={Square} 
                  label="Parar" 
                  className="border-white/10 text-white/60 hover:text-white hover:border-white/40"
                  onHover={() => handleHover("COMANDO: ABORTAR SESSÃO E GERAR RELATÓRIO.")}
                  onLeave={clearHover}
                />
              </motion.div>
            )}

            {/* Flow Mode Controls */}
            {isFlowState && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ControlButton 
                  onClick={handleStop} 
                  icon={Square} 
                  label="Encerrar Fluxo" 
                  active 
                  onHover={() => handleHover("COMANDO: FINALIZAR ESTADO DE FLUXO.")}
                  onLeave={clearHover}
                />
              </motion.div>
            )}

            {/* Break Mode Controls */}
            {status === 'break' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-20 md:bottom-24 left-0 w-full flex justify-center gap-4 md:gap-6 z-50 px-4"
              >
                <ControlButton 
                  onClick={handleReset} 
                  icon={ArrowRight} 
                  label="Pular Descanso" 
                  inverted={true}
                  onHover={() => handleHover("COMANDO: ENCERRAR DESCANSO E RETORNAR AO SETUP.")}
                  onLeave={clearHover}
                />
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default PrismodoroUI;
