import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChefHat, 
  Clock, 
  Flame, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  ShieldCheck, 
  ChevronRight, 
  Utensils, 
  Info,
  Maximize2
} from 'lucide-react';
import { RecipeSuggestion, IngredientItem } from '../types.ts';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: RecipeSuggestion[];
  currentIngredients: IngredientItem[];
  onUpdateRecipes?: (newRecipes: RecipeSuggestion[]) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  recipes: initialRecipes,
  currentIngredients,
  onUpdateRecipes,
}) => {
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>(initialRecipes || []);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; title: string } | null>(null);

  // Sync initial recipes
  useEffect(() => {
    if (initialRecipes && initialRecipes.length > 0) {
      setRecipes(initialRecipes);
    }
  }, [initialRecipes]);

  // If opened and no recipes yet, automatically fetch!
  useEffect(() => {
    if (isOpen && recipes.length === 0 && currentIngredients.length > 0 && !isLoading) {
      handleFetchRecipes();
    }
  }, [isOpen, recipes.length, currentIngredients.length]);

  if (!isOpen) return null;

  const handleFetchRecipes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/suggest-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: currentIngredients }),
      });
      const raw = await res.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}. Please tap Regenerate to try again.`);
        }
        throw new Error('Unable to read recipe suggestions. Please try again.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to generate recipes');
      }
      const fetchedRecipes: RecipeSuggestion[] = data.recipes || [];
      setRecipes(fetchedRecipes);
      setSelectedRecipeIndex(0);
      if (onUpdateRecipes) {
        onUpdateRecipes(fetchedRecipes);
      }
    } catch (err: any) {
      setError(err.message || 'Could not generate recipes from ingredients.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeRecipe = recipes[selectedRecipeIndex] || recipes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                  AI Recipe Proposals
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> ≤ Photo Quantities
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Recipes strictly limited to your detected photo amounts with per-item calorie estimates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFetchRecipes}
              disabled={isLoading || currentIngredients.length === 0}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 active:scale-95 transition flex items-center gap-1.5 disabled:opacity-50"
              title="Generate new recipes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Crafting...' : 'Regenerate'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="flex-1 font-medium">{error}</div>
              <button
                onClick={handleFetchRecipes}
                className="font-bold underline text-rose-700 hover:text-rose-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                  <ChefHat className="w-7 h-7 animate-pulse" />
                </div>
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-bold text-stone-900 text-sm">
                  Chef Gemini is calculating recipes...
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Enforcing strict quantity limits, calculating per-item calories, and generating dish previews.
                </p>
              </div>
            </div>
          )}

          {!isLoading && recipes.length > 0 && (
            <div className="space-y-6">
              {/* Recipe Selector Tabs (Horizontal scrollable on mobile) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {recipes.map((r, idx) => {
                  const isSelected = idx === selectedRecipeIndex;
                  return (
                    <button
                      key={r.id || idx}
                      type="button"
                      onClick={() => setSelectedRecipeIndex(idx)}
                      className={`px-3.5 py-2.5 rounded-2xl border text-left shrink-0 transition flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                          isSelected ? 'bg-white text-emerald-800' : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="max-w-[140px] sm:max-w-[180px] truncate">
                        <div className="text-xs truncate font-bold">{r.title}</div>
                        <div
                          className={`text-[10px] font-medium flex items-center gap-1 ${
                            isSelected ? 'text-emerald-100' : 'text-stone-500'
                          }`}
                        >
                          <Flame className="w-2.5 h-2.5" />
                          {r.caloriesPerServing || r.totalCalories} kcal/serv
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Recipe Card Details */}
              {activeRecipe && (
                <div className="space-y-6">
                  {/* Top Card: Dish Image + Core Info */}
                  <div className="rounded-3xl border border-stone-200 bg-white shadow-xs overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                      {/* Dish Image */}
                      <div className="md:col-span-5 relative bg-stone-900 aspect-4/3 md:aspect-auto group overflow-hidden">
                        {activeRecipe.imageUrl ? (
                          <>
                            <img
                              src={activeRecipe.imageUrl}
                              alt={activeRecipe.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                            
                            {/* Zoom button */}
                            <button
                              type="button"
                              onClick={() =>
                                setEnlargedImage({
                                  url: activeRecipe.imageUrl!,
                                  title: activeRecipe.title,
                                })
                              }
                              className="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition shadow-sm"
                              title="Enlarge final dish view"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="absolute bottom-3 left-3 text-white text-[11px] font-semibold flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-full">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              Final Plated Dish
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-6 text-stone-400 text-center">
                            <Utensils className="w-10 h-10 mb-2 opacity-50" />
                          </div>
                        )}
                      </div>

                      {/* Dish Summary Info */}
                      <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {activeRecipe.difficulty || 'Easy'}
                            </span>
                            {activeRecipe.prepTimeMinutes && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-lg">
                                <Clock className="w-3 h-3 text-stone-500" />
                                ~{activeRecipe.prepTimeMinutes}m prep
                              </span>
                            )}
                            <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-lg">
                              {activeRecipe.servings || 2} {activeRecipe.servings === 1 ? 'serving' : 'servings'}
                            </span>
                          </div>

                          <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                            {activeRecipe.title}
                          </h3>
                          {activeRecipe.subtitle && (
                            <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                              {activeRecipe.subtitle}
                            </p>
                          )}

                          <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                            {activeRecipe.description}
                          </p>
                        </div>

                        {/* Total Calorie & Macro Banner */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-stone-50 border border-amber-200/80">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-sm sm:text-base">
                              <Flame className="w-4 h-4 text-amber-600" />
                              <span>{activeRecipe.totalCalories} Total kcal</span>
                            </div>
                            <span className="text-xs font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                              ~{activeRecipe.caloriesPerServing} kcal / serving
                            </span>
                          </div>

                          {/* Macro pills */}
                          {activeRecipe.macroNutrients && (
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 text-center">
                              <div className="bg-white/80 rounded-xl p-1.5 border border-amber-200/50">
                                <span className="block text-[10px] uppercase font-bold text-stone-500">Protein</span>
                                <span className="text-xs font-bold text-stone-800">{activeRecipe.macroNutrients.protein}</span>
                              </div>
                              <div className="bg-white/80 rounded-xl p-1.5 border border-amber-200/50">
                                <span className="block text-[10px] uppercase font-bold text-stone-500">Carbs</span>
                                <span className="text-xs font-bold text-stone-800">{activeRecipe.macroNutrients.carbs}</span>
                              </div>
                              <div className="bg-white/80 rounded-xl p-1.5 border border-amber-200/50">
                                <span className="block text-[10px] uppercase font-bold text-stone-500">Fat</span>
                                <span className="text-xs font-bold text-stone-800">{activeRecipe.macroNutrients.fat}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Strict Ingredient Breakdown Table with Calories per item */}
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <h4 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                          <Scale className="w-4 h-4 text-emerald-600" />
                          Recipe Ingredients & Calorie Breakdown
                        </h4>
                        <p className="text-xs text-stone-500">
                          Every amount is strictly within your photo inventory. Calories calculated per item.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
                        {activeRecipe.ingredientsUsed?.length || 0} Ingredients Used
                      </span>
                    </div>

                    {/* Table of Recipe Ingredients */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-stone-200 text-stone-500 text-[11px] uppercase tracking-wider font-bold bg-stone-50/70">
                            <th className="py-2.5 px-3">Ingredient</th>
                            <th className="py-2.5 px-3">Amount Used in Recipe</th>
                            <th className="py-2.5 px-3">Photo Available Amount</th>
                            <th className="py-2.5 px-3 text-right">Estimated Calories</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {activeRecipe.ingredientsUsed?.map((ing, iIdx) => (
                            <tr key={iIdx} className="hover:bg-emerald-50/30 transition">
                              {/* Name */}
                              <td className="py-3 px-3 font-bold text-stone-900">
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{ing.name}</span>
                                </div>
                              </td>

                              {/* Amount Used */}
                              <td className="py-3 px-3">
                                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                                  {ing.amountUsed}
                                </span>
                              </td>

                              {/* Available in Photo */}
                              <td className="py-3 px-3 text-stone-500 text-xs">
                                <span className="text-stone-700 font-medium">
                                  {ing.availableAmount}
                                </span>
                              </td>

                              {/* Calories for this item */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="inline-flex items-center gap-1 font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-xs sm:text-sm">
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
                            <td colSpan={3} className="py-2.5 px-3 text-stone-700">
                              Total Caloric Sum of Ingredients:
                            </td>
                            <td className="py-2.5 px-3 text-right text-amber-900 font-extrabold text-sm">
                              {activeRecipe.totalCalories} kcal
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Leftover Inventory Summary */}
                    {activeRecipe.remainingIngredientsSummary && (
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-600 flex items-start gap-2">
                        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-stone-800">Remaining Inventory:</strong>{' '}
                          {activeRecipe.remainingIngredientsSummary}
                        </div>
                      </div>
                    )}

                    {/* Additional basic staples */}
                    {activeRecipe.additionalPantryStaplesNeeded && activeRecipe.additionalPantryStaplesNeeded.length > 0 && (
                      <div className="text-xs text-stone-500 pt-1">
                        <span className="font-semibold text-stone-700">Common pantry staples needed:</span>{' '}
                        {activeRecipe.additionalPantryStaplesNeeded.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Section 3: Preparation Instructions */}
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
                    <h4 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-emerald-600" />
                      Step-by-Step Instructions
                    </h4>
                    <div className="space-y-2.5">
                      {activeRecipe.instructions?.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50/70 hover:bg-stone-50 transition">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            {sIdx + 1}
                          </span>
                          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Chef Tip */}
                    {activeRecipe.chefTip && (
                      <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900">
                        <strong className="font-bold flex items-center gap-1.5 mb-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Chef's Secret Tip:
                        </strong>
                        {activeRecipe.chefTip}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoading && recipes.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <ChefHat className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="font-bold text-stone-800 text-base">No recipes generated yet</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Tap the button below to have Gemini propose recipes based on your photo's available ingredients.
              </p>
              <button
                type="button"
                onClick={handleFetchRecipes}
                className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                Generate Recipe Ideas
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 hidden sm:inline">
            All nutrition numbers and quantities are AI calculated based on photo data.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>

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
    </div>
  );
};
