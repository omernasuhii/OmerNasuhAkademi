import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, ChevronLeft, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { tourService } from '../services/tourService';

export interface TourStep {
  targetId?: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  badge?: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  tourKey?: string; // key to save in localStorage when completed/skipped
  onNextTour?: () => void;
  nextTourLabel?: string;
  onStepChange?: (stepIndex: number, currentStep: TourStep) => void;
}

export function OnboardingTour({ steps, isOpen, onClose, onComplete, tourKey, onNextTour, nextTourLabel, onStepChange }: OnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const currentStep = steps[currentStepIndex];

  // Reset step index and exit modal when tour opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setShowExitConfirm(false);
    }
  }, [isOpen]);

  // Function to calculate target element bounding rect
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !currentStep?.targetId) {
      setTargetRect(null);
      return;
    }

    const el = document.getElementById(currentStep.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen && currentStep) {
      if (onStepChange) {
        onStepChange(currentStepIndex, currentStep);
      }
      
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }

      updateTargetRect();

      // Poll periodically for element rendering / layout shifts after route navigation
      let attempts = 0;
      const interval = setInterval(() => {
        updateTargetRect();
        attempts++;
        if (attempts > 15) {
          clearInterval(interval);
        }
      }, 100);

      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect, true);

      return () => {
        clearInterval(interval);
        window.removeEventListener('resize', updateTargetRect);
        window.removeEventListener('scroll', updateTargetRect, true);
      };
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIndex, currentStep, onStepChange, updateTargetRect]);

  if (!isOpen || !steps || steps.length === 0) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    if (tourKey) {
      tourService.markTourCompleted(tourKey);
    }
    if (onComplete) onComplete();
    if (onNextTour) {
      onNextTour();
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    if (tourKey) {
      tourService.markTourCompleted(tourKey);
    }
    onClose();
  };

  // Tooltip positioning logic relative to target element or screen center
  const getTooltipStyle = () => {
    if (!targetRect || currentStep?.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    if (window.innerWidth < 768) {
      // On mobile, position at top or bottom depending on target element's position to avoid overlap
      const isTargetInBottomHalf = targetRect.top + (targetRect.height / 2) > window.innerHeight / 2;
      return isTargetInBottomHalf
        ? { top: 'env(safe-area-inset-top, 24px)', left: '16px', right: '16px', width: 'auto' }
        : { bottom: 'env(safe-area-inset-bottom, 24px)', left: '16px', right: '16px', width: 'auto', top: 'auto' };
    }

    const padding = 16;
    const tooltipWidth = 380;
    const tooltipHeight = 250; // estimate
    const pos = currentStep?.position || 'bottom';

    let top = 0;
    let left = 0;

    if (pos === 'bottom') {
      top = targetRect.bottom + padding;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    } else if (pos === 'top') {
      top = targetRect.top - padding - tooltipHeight;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    } else if (pos === 'left') {
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - padding - tooltipWidth;
    } else if (pos === 'right') {
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.right + padding;
    }

    // Clamp inside viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  // SVG cutout path for spotlight effect
  const getSvgPath = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!targetRect) {
      return `M 0 0 H ${w} V ${h} H 0 Z`;
    }
    const tw = Math.max(0, targetRect.width + 16);
    const th = Math.max(0, targetRect.height + 16);
    const r = Math.min(16, tw / 2, th / 2); // corner radius bounded by dimensions
    const t = Math.max(0, targetRect.top - 8);
    const l = Math.max(0, targetRect.left - 8);

    return `M 0 0 H ${w} V ${h} H 0 Z M ${l + r} ${t} h ${tw - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${th - 2 * r} a ${r} ${r} 0 0 1 -${r} ${r} h -${tw - 2 * r} a ${r} ${r} 0 0 1 -${r} -${r} v -${th - 2 * r} a ${r} ${r} 0 0 1 ${r} -${r} Z`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
        {/* SVG Cutout Backdrop - Dark overlay with clear hole over target element (NO BLUR) */}
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none z-[9998]"
          style={{ width: '100vw', height: '100vh' }}
        >
          <path
            d={getSvgPath()}
            fill="rgba(2, 6, 23, 0.85)"
            fillRule="evenodd"
          />
        </svg>

        {/* Non-clickable backdrop overlay (prevents accidental tour closing on outside click) */}
        <div
          className="fixed inset-0 z-[9997]"
        />

        {/* Highlight spotlight border around target element */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              top: `${Math.max(0, targetRect.top - 8)}px`,
              left: `${Math.max(0, targetRect.left - 8)}px`,
              width: `${targetRect.width + 16}px`,
              height: `${targetRect.height + 16}px`,
            }}
            className="fixed rounded-2xl ring-4 ring-emerald-400 bg-transparent shadow-[0_0_40px_rgba(16,185,129,0.5)] pointer-events-none z-[9999] transition-all duration-300"
          />
        )}

        {/* Tooltip Floating Card */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          style={{...getTooltipStyle(), position: 'fixed'}}
          className="z-[10000] w-[calc(100vw-32px)] md:w-[400px] max-h-[calc(100vh-100px)] overflow-y-auto bg-slate-900 border border-emerald-500/30 shadow-2xl rounded-2xl md:rounded-3xl p-4 md:p-6 text-white flex flex-col gap-3 md:gap-4 scrollbar-hide"
        >
          {/* Top accent gradient bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentStep.badge || `Adım ${currentStepIndex + 1} / ${steps.length}`}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1 leading-snug">{currentStep.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowExitConfirm(true)}
                className="text-[11px] font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
                title="Turu Sonlandır"
              >
                Turu Sonlandır
              </button>
              <button
                onClick={() => setShowExitConfirm(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Turu Kapat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content Description */}
          <p className="text-sm text-slate-300 font-medium leading-relaxed bg-slate-950/50 p-3.5 rounded-2xl border border-white/5">
            {currentStep.description}
          </p>

          {/* Step dots & Controls */}
          <div className="flex flex-col gap-4 pt-4 border-t border-white/10 mt-2">
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-6 bg-emerald-400'
                      : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  title={`Adım ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                {!isFirstStep && (
                  <button
                    onClick={handlePrev}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Önceki Adım"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-105 bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 min-h-[44px]"
                >
                  {isLastStep ? (
                    <>
                      <span>{onNextTour ? (nextTourLabel || "Sonraki Bölüm") : "Turu Tamamla"}</span>
                      {onNextTour ? <ChevronRight size={16} /> : <CheckCircle2 size={16} />}
                    </>
                  ) : (
                    <>
                      <span>Sonraki</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Exit Confirmation Warning Modal */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/60 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Turu Sonlandır?</h4>
                <p className="text-sm text-slate-400 mt-1">
                  Tanıtım turunu sonlandırmak istediğinize emin misiniz? Dilediğiniz zaman turu tekrar başlatabilirsiniz.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Devam Et
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    handleSkip();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-600/20"
                >
                  Evet, Sonlandır
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
