import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface ResponsiveTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function ResponsiveTabs({ tabs, activeTab, onChange }: ResponsiveTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tabs.length);
  const [showMore, setShowMore] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const hiddenTabsRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const measure = () => {
      if (!containerRef.current || !hiddenTabsRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const tabElements = Array.from(hiddenTabsRef.current.children) as HTMLElement[];
      const moreButtonWidth = moreButtonRef.current?.offsetWidth || 150; // fallback width incl padding
      
      let currentWidth = 0;
      let newVisibleCount = 0;
      
      for (let i = 0; i < tabElements.length; i++) {
        const tabWidth = tabElements[i].offsetWidth + 24; // Including gap-6 (24px)
        
        // If it's the last item, we don't need the 'More' button width
        const isLastItem = i === tabElements.length - 1;
        const widthLimit = isLastItem ? containerWidth : containerWidth - moreButtonWidth;

        if (currentWidth + tabWidth <= widthLimit) {
          currentWidth += tabWidth;
          newVisibleCount++;
        } else {
          break;
        }
      }
      
      // Ensure at least 1 tab is visible if possible, but limit to total tabs
      setVisibleCount(Math.min(tabs.length, Math.max(1, newVisibleCount)));
      setIsMeasuring(false);
    };

    measure();
    
    const resizeObserver = new ResizeObserver(() => {
      setIsMeasuring(true);
      requestAnimationFrame(measure);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [tabs]);

  const visibleTabs = tabs.slice(0, visibleCount);
  const hiddenTabs = tabs.slice(visibleCount);
  
  return (
    <div className="relative w-full flex items-center min-w-0" ref={containerRef}>
      {/* Hidden container for measuring widths accurately */}
      {isMeasuring && (
        <div ref={hiddenTabsRef} className="absolute top-0 left-0 invisible flex gap-6 pointer-events-none whitespace-nowrap">
          {tabs.map(tab => (
            <button key={`measure-${tab}`} className="text-sm font-semibold whitespace-nowrap px-1">
              {tab}
            </button>
          ))}
        </div>
      )}
      
      {/* Hidden button to measure */}
      <div 
        ref={moreButtonRef} 
        className="absolute top-0 left-0 invisible shrink-0 ml-4 pl-4 border-l border-slate-800 flex items-center pointer-events-none"
      >
        <button className="text-sm font-medium whitespace-nowrap flex items-center gap-1">
          Daha Fazla <ChevronDown size={14} />
        </button>
      </div>

      <div className={`flex-1 flex items-center gap-6 overflow-hidden ${isMeasuring ? 'opacity-0' : 'opacity-100'}`}>
        {visibleTabs.map(tab => (
          <button 
            key={tab}
            onClick={() => onChange(tab)}
            className={`text-sm font-semibold whitespace-nowrap shrink-0 transition-colors relative pb-3 -mb-3 ${
              activeTab === tab 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-slate-400 hover:text-slate-300 border-b-2 border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {hiddenTabs.length > 0 && !isMeasuring && (
        <div className="relative shrink-0 ml-4 pl-4 border-l border-slate-800 flex items-center">
          <button 
            onClick={() => setShowMore(!showMore)}
            className={`text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 pb-1 -mb-1 ${
              hiddenTabs.includes(activeTab) ? 'text-blue-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            {hiddenTabs.includes(activeTab) ? activeTab : 'Daha Fazla'} <ChevronDown size={14} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>
          {showMore && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
              <div className="absolute top-full right-0 mt-3 w-56 max-h-96 overflow-y-auto bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl py-2 z-50 overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700">
                {hiddenTabs.map((item) => (
                   <button 
                     key={item} 
                     onClick={() => { onChange(item); setShowMore(false); }}
                     className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                       activeTab === item ? 'bg-slate-700/50 text-white font-bold' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                     }`}
                   >
                     {item}
                   </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
