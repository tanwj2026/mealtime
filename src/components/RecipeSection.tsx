import React, { useState } from 'react';
import { 
  ChefHat, 
  Clock, 
  Flame, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Scale, 
  ShieldCheck, 
  Utensils, 
  Info,
  Maximize2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { RecipeSuggestion, IngredientItem } from '../types.ts';

interface RecipeSectionProps {
  recipes: RecipeSuggestion[];
  currentIngredients: IngredientItem[];
  isLoading: boolean;
  onRegenerate: () => void;
  error?: string | null;
}

export const RecipeSection: React.FC<RecipeSectionProps> = ({
  recipes,
  currentIngredients,
  isLoading,
  onRegenerate,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; title: string } | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<{ [key: number]: boolean }>({ 0: true, 1: true, 2: true });

  const toggleSteps = (idx: number) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const currentRecipe = recipes[activeTab] || recipes[0];

  return (
    <section id="recipe-ideas-section" className="space-y-5 pt-2">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="absolute right-24 -top-10 w-28 h-28 rounded-full bg-emerald-500/10 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <ChefHat className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Recipe Ideas
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Guaranteed ≤ Photo Amounts
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
                Recipes proposed by Gemini strictly using your detected ingredients. Every ingredient specifies estimated calories based on the portion used.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isLoading || currentIngredients.length === 0}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-900 bg-white hover:bg-emerald-50 active:scale-95 transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Creating 3 Recipes...' : 'Get 3 New Recipe Ideas'}</span>
            </button>
          </div>
        </div>

        {/* Quick Recipe Switcher Tabs inside header */}
        {recipes.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/15 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 mr-1 shrink-0">
              Proposals ({recipes.length}):
            </span>
            {recipes.map((r, idx) => {
              const isSelected = idx === activeTab;
              return (
                <button
                  key={r.id || idx}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-white text-emerald-950 shadow-md font-extrabold scale-102'
                      : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-white/20 text-white'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="truncate max-w-[130px] sm:max-w-[180px]">{r.title}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-emerald-100 text-emerald-900' : 'bg-black/20 text-emerald-200'
                    }`}
                  >
                    {r.totalCalories} kcal
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button
            onClick={onRegenerate}
            className="font-bold underline text-rose-700 hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-4 shadow-xs">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
              <ChefHat className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div>
            <h4 className="font-extrabold text-stone-900 text-base">
              Generating 3 tailored recipes from your available ingredients...
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              Calculating per-item calories, matching real dish visuals, and ensuring amounts do not exceed photo inventory.
            </p>
          </div>
        </div>
      )}

      {/* Active Featured Recipe Display */}
      {!isLoading && recipes.length > 0 && currentRecipe && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Main Recipe Card */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Recipe Dish Image */}
              <div className="lg:col-span-5 relative bg-stone-900 aspect-16/10 lg:aspect-auto min-h-[260px] group overflow-hidden">
                {currentRecipe.imageUrl ? (
                  <>
                    <img
                      src={currentRecipe.imageUrl}
                      alt={currentRecipe.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                    {/* Zoom button */}
                    <button
                      type="button"
                      onClick={() =>
                        setEnlargedImage({
                          url: currentRecipe.imageUrl!,
                          title: currentRecipe.title,
                        })
                      }
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition shadow-md"
                      title="Enlarge final dish view"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-3 left-3 text-white text-xs font-semibold flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Plated Dish Preview</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-stone-400 text-center">
                    <Utensils className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-xs">Previewing {currentRecipe.title}</span>
                  </div>
                )}
              </div>

              {/* Recipe Overview & Nutritional Highlights */}
              <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {currentRecipe.difficulty || 'Easy'}
                    </span>
                    {currentRecipe.prepTimeMinutes && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-lg">
                        <Clock className="w-3 h-3 text-stone-500" />
                        ~{currentRecipe.prepTimeMinutes}m prep
                      </span>
                    )}
                    <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-lg">
                      {currentRecipe.servings || 2} {currentRecipe.servings === 1 ? 'serving' : 'servings'}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                    {currentRecipe.title}
                  </h3>
                  {currentRecipe.subtitle && (
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">
                      {currentRecipe.subtitle}
                    </p>
                  )}

                  <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                    {currentRecipe.description}
                  </p>
                </div>

                {/* Total Calories & Macro Nutrition Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-stone-50 border border-amber-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-1.5 text-amber-950 font-extrabold text-base">
                      <Flame className="w-4 h-4 text-amber-600" />
                      <span>{currentRecipe.totalCalories} Total Dish Calories</span>
                    </div>
                    <span className="text-xs font-extrabold text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-full border border-amber-300 self-start sm:self-auto">
                      ~{currentRecipe.caloriesPerServing} kcal / serving
                    </span>
                  </div>

                  {/* Macronutrient chips */}
                  {currentRecipe.macroNutrients && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 text-center">
                      <div className="bg-white/90 rounded-xl p-1.5 border border-amber-200/60 shadow-2xs">
                        <span className="block text-[10px] uppercase font-bold text-stone-500">Protein</span>
                        <span className="text-xs font-extrabold text-stone-800">{currentRecipe.macroNutrients.protein}</span>
                      </div>
                      <div className="bg-white/90 rounded-xl p-1.5 border border-amber-200/60 shadow-2xs">
                        <span className="block text-[10px] uppercase font-bold text-stone-500">Carbs</span>
                        <span className="text-xs font-extrabold text-stone-800">{currentRecipe.macroNutrients.carbs}</span>
                      </div>
                      <div className="bg-white/90 rounded-xl p-1.5 border border-amber-200/60 shadow-2xs">
                        <span className="block text-[10px] uppercase font-bold text-stone-500">Fat</span>
                        <span className="text-xs font-extrabold text-stone-800">{currentRecipe.macroNutrients.fat}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Strict Ingredient Breakdown Table with Calories Per Item */}
            <div className="p-5 sm:p-7 border-t border-stone-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    Ingredients Used & Per-Item Calorie Calculation
                  </h4>
                  <p className="text-xs text-stone-500">
                    Calculated for each portion used • Constrained to ≤ your photo's available stock.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
                  {currentRecipe.ingredientsUsed?.length || 0} Ingredients Used
                </span>
              </div>

              {/* Table of items */}
              <div className="overflow-x-auto border border-stone-200/80 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-[11px] uppercase tracking-wider font-bold bg-stone-50/80">
                      <th className="py-2.5 px-3.5">Ingredient</th>
                      <th className="py-2.5 px-3.5">Amount Used</th>
                      <th className="py-2.5 px-3.5">Stock Available in Photo</th>
                      <th className="py-2.5 px-3.5 text-right">Calories</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {currentRecipe.ingredientsUsed?.map((ing, iIdx) => (
                      <tr key={iIdx} className="hover:bg-emerald-50/30 transition">
                        {/* Name */}
                        <td className="py-3 px-3.5 font-bold text-stone-900">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{ing.name}</span>
                          </div>
                        </td>

                        {/* Amount Used */}
                        <td className="py-3 px-3.5">
                          <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80 text-xs sm:text-sm">
                            {ing.amountUsed}
                          </span>
                        </td>

                        {/* Available in Photo */}
                        <td className="py-3 px-3.5 text-stone-600 text-xs">
                          <span className="font-medium text-stone-700 bg-stone-100/70 px-2 py-0.5 rounded-md">
                            {ing.availableAmount}
                          </span>
                        </td>

                        {/* Calories for this item */}
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 text-xs sm:text-sm">
                              <Flame className="w-3 h-3 text-amber-500" />
                              {ing.calories} kcal
                            </span>
                            {ing.caloriesBasis && (
                              <span className="text-[10px] text-stone-400 mt-0.5 font-mono">
                                {ing.caloriesBasis}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-stone-200 bg-stone-50 font-bold text-xs sm:text-sm">
                      <td colSpan={3} className="py-2.5 px-3.5 text-stone-700">
                        Total Sum of Ingredient Calories:
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-amber-950 font-extrabold text-sm sm:text-base">
                        {currentRecipe.totalCalories} kcal
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Leftover stock note */}
              {currentRecipe.remainingIngredientsSummary && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-600 flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-800">Remaining Stock:</strong>{' '}
                    {currentRecipe.remainingIngredientsSummary}
                  </div>
                </div>
              )}

              {/* Additional basic staples needed */}
              {currentRecipe.additionalPantryStaplesNeeded && currentRecipe.additionalPantryStaplesNeeded.length > 0 && (
                <div className="text-xs text-stone-500">
                  <span className="font-semibold text-stone-700">Basic kitchen staples needed:</span>{' '}
                  {currentRecipe.additionalPantryStaplesNeeded.join(', ')}
                </div>
              )}
            </div>

            {/* Preparation Steps */}
            <div className="p-5 sm:p-7 border-t border-stone-100 bg-stone-50/50 space-y-3.5">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSteps(activeTab)}
              >
                <h4 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  Cooking Instructions
                </h4>
                <button
                  type="button"
                  className="text-stone-500 hover:text-stone-800 p-1"
                >
                  {expandedSteps[activeTab] !== false ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {expandedSteps[activeTab] !== false && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  {currentRecipe.instructions?.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {sIdx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Chef Tip */}
              {currentRecipe.chefTip && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950">
                  <strong className="font-bold flex items-center gap-1.5 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Chef's Pro Tip:
                  </strong>
                  {currentRecipe.chefTip}
                </div>
              )}
            </div>
          </div>

          {/* Quick Grid Preview of the other 2 recipe ideas */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Other Recipe Proposals for these Ingredients:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {recipes.map((rec, rIdx) => {
                const isSelected = rIdx === activeTab;
                return (
                  <div
                    key={rec.id || rIdx}
                    onClick={() => setActiveTab(rIdx)}
                    className={`rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-stone-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {rec.imageUrl && (
                        <div className="aspect-16/9 rounded-xl overflow-hidden bg-stone-100 mb-3 relative">
                          <img
                            src={rec.imageUrl}
                            alt={rec.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white">
                            Idea #{rIdx + 1}
                          </span>
                        </div>
                      )}
                      <h5 className="font-bold text-stone-900 text-sm">{rec.title}</h5>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">
                        {rec.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 font-extrabold text-amber-800">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        {rec.totalCalories} kcal
                      </span>
                      <span className="font-bold text-emerald-700 text-[11px]">
                        {isSelected ? '✓ Viewing' : 'View Details →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={enlargedImage.url}
              alt={enlargedImage.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="flex items-center justify-between text-white mt-3 px-2">
              <span className="font-bold text-sm">{enlargedImage.title}</span>
              <button
                onClick={() => setEnlargedImage(null)}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
