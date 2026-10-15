import React from 'react';
import { Sparkles, Utensils, RotateCcw, Camera } from 'lucide-react';

interface HeaderProps {
  onNewScan: () => void;
  hasResults: boolean;
  itemCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onNewScan, hasResults, itemCount }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-stone-900 leading-none">
                Kitchen<span className="text-emerald-600">Lens</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-2.5 h-2.5" /> Gemini Vision
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">AI Ingredient & Quantity Estimator</p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {hasResults && (
            <>
              {typeof itemCount === 'number' && (
                <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  {itemCount} {itemCount === 1 ? 'Ingredient' : 'Ingredients'}
                </div>
              )}
              <button
                onClick={onNewScan}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition active:scale-95"
                title="Scan another photo"
              >
                <Camera className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden xs:inline">New Scan</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
