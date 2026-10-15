import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Sparkles, 
  AlertCircle, 
  ChefHat, 
  RefreshCw, 
  CheckCircle2, 
  ArrowLeft,
  Eye,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { CameraCapture } from './components/CameraCapture.tsx';
import { IngredientTable } from './components/IngredientTable.tsx';
import { RecipeSection } from './components/RecipeSection.tsx';
import { PhotoViewerModal } from './components/PhotoViewerModal.tsx';
import { IngredientItem, AnalysisResponseData, RecipeSuggestion } from './types.ts';

const LOCAL_STORAGE_KEY = 'kitchenlens_analysis_v1';

export default function App() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [sceneDescription, setSceneDescription] = useState<string>('');
  const [detectedEnvironment, setDetectedEnvironment] = useState<string>('');
  const [recipeSuggestions, setRecipeSuggestions] = useState<RecipeSuggestion[]>([]);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);

  // Photo viewer modal
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Restore saved session if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
          setIngredients(parsed.items);
          setSceneDescription(parsed.sceneDescription || '');
          setDetectedEnvironment(parsed.detectedEnvironment || '');
          if (parsed.savedImage) {
            setCapturedImage(parsed.savedImage);
          }
          if (parsed.recipeSuggestions && parsed.recipeSuggestions.length > 0) {
            setRecipeSuggestions(parsed.recipeSuggestions);
          } else {
            handleGenerateRecipes(parsed.items);
          }
        }
      }
    } catch (e) {
      console.warn('Could not restore session:', e);
    }
  }, []);

  // Save changes to localStorage
  const handleUpdateItems = (newItems: IngredientItem[]) => {
    setIngredients(newItems);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          items: newItems,
          sceneDescription,
          detectedEnvironment,
          recipeSuggestions,
          savedImage: capturedImage,
        })
      );
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  // Trigger Gemini Analysis
  const handleAnalyzeImage = async (base64: string, mimeType: string, locationHint: string) => {
    setCapturedImage(base64);
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress('Uploading image to Gemini Vision...');

    const stages = [
      'Scanning scene and identifying food items...',
      'Recognizing produce, packages, and groceries...',
      'Estimating quantities and counts available...',
      'Formulating tabular inventory...',
    ];

    let stageIdx = 0;
    const progressInterval = setInterval(() => {
      if (stageIdx < stages.length) {
        setAnalysisProgress(stages[stageIdx]);
        stageIdx++;
      }
    }, 1100);

    try {
      const response = await fetch('/api/analyze-ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          locationContext: locationHint,
        }),
      });

      clearInterval(progressInterval);
      const rawText = await response.text();
      let result: any;

      try {
        result = JSON.parse(rawText);
      } catch (jsonErr) {
        // Handle non-JSON HTML error pages (e.g. 413, 502, 504)
        if (response.status === 413) {
          throw new Error('Image size is too large for the network gateway. Please try taking a closer photo or select another photo.');
        } else if (response.status === 504 || response.status === 502) {
          throw new Error('The vision analysis timed out. Please tap "Analyze & Estimate Quantities" to retry.');
        } else if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}. Please try again.`);
        }
        throw new Error('Unable to parse server response. Please try scanning again.');
      }

      if (!response.ok || !result.success) {
        throw new Error(result?.error || 'Failed to analyze ingredients. Please retry.');
      }

      const data: AnalysisResponseData = result.data;
      const parsedItems = data.items || [];
      setIngredients(parsedItems);
      setSceneDescription(data.sceneDescription || '');
      setDetectedEnvironment(data.detectedEnvironment || '');
      setRecipeSuggestions([]);

      // Persist in localStorage
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            items: parsedItems,
            sceneDescription: data.sceneDescription,
            detectedEnvironment: data.detectedEnvironment,
            recipeSuggestions: [],
            savedImage: base64,
          })
        );
      } catch (e) {
        console.warn('Could not cache analysis:', e);
      }

      // Automatically generate at least 3 recipe proposals right after ingredient identification
      if (parsedItems.length > 0) {
        handleGenerateRecipes(parsedItems);
      }
    } catch (err: any) {
      console.error('Error during analysis:', err);
      clearInterval(progressInterval);
      setError(err.message || 'An error occurred while analyzing the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  // Generate at least 3 recipe ideas based strictly on available ingredients
  const handleGenerateRecipes = async (itemsToUse: IngredientItem[] = ingredients) => {
    if (!itemsToUse || itemsToUse.length === 0) return;
    setIsRecipeLoading(true);
    setRecipeError(null);
    try {
      const res = await fetch('/api/suggest-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: itemsToUse }),
      });
      const raw = await res.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error('Unable to read recipe suggestions. Please tap Regenerate to try again.');
      }
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to generate recipes');
      }
      const newRecipes: RecipeSuggestion[] = data.recipes || [];
      setRecipeSuggestions(newRecipes);
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...parsed, recipeSuggestions: newRecipes }));
        }
      } catch (e) {}
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      setRecipeError(err.message || 'Could not generate recipes from ingredients.');
    } finally {
      setIsRecipeLoading(false);
    }
  };

  const handleNewScan = () => {
    setIngredients([]);
    setSceneDescription('');
    setDetectedEnvironment('');
    setRecipeSuggestions([]);
    setCapturedImage(null);
    setError(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
  };

  const hasResults = ingredients.length > 0;

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onNewScan={handleNewScan}
        hasResults={hasResults}
        itemCount={ingredients.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm">Analysis Note</h4>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Overlay / Progress Banner */}
        {isAnalyzing && (
          <div className="bg-white rounded-3xl border border-emerald-200/90 shadow-md p-8 text-center space-y-5 animate-in fade-in duration-200">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-extrabold text-stone-900">
                Analyzing Your Food Photo
              </h3>
              <p className="text-sm font-semibold text-emerald-700 mt-1 min-h-[24px]">
                {analysisProgress}
              </p>
              <p className="text-xs text-stone-500 mt-2">
                Gemini 3.8 Flash is isolating individual ingredients, containers, and packaging to estimate counts and volume.
              </p>
            </div>

            {capturedImage && (
              <div className="relative max-w-xs mx-auto aspect-16/9 rounded-xl overflow-hidden border border-stone-200 shadow-inner bg-stone-900">
                <img
                  src={capturedImage}
                  alt="Analyzing Target"
                  className="w-full h-full object-cover opacity-60"
                />
                {/* Visual Scanner Bar Animation */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-md"></div>
              </div>
            )}
          </div>
        )}

        {/* View Mode Router */}
        {!isAnalyzing && (
          <>
            {!hasResults ? (
              /* State A: Photo Capture / Upload / Preset Selection */
              <CameraCapture
                onImageSelected={handleAnalyzeImage}
                isAnalyzing={isAnalyzing}
              />
            ) : (
              /* State B: Results Displayed in Tabular Form */
              <div className="space-y-6">
                {/* Back / Retake Navigation Bar */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleNewScan}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 py-1.5 px-3 rounded-lg hover:bg-stone-200/60 transition"
                  >
                    <ArrowLeft className="w-4 h-4" /> Scan Another Image
                  </button>

                  <div className="flex items-center gap-2">
                    {capturedImage && (
                      <button
                        onClick={() => setIsPhotoModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 py-1.5 px-3 rounded-xl transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect Scanned Photo
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. Ingredients Identified & Quantities in Tabular Form */}
                <IngredientTable
                  items={ingredients}
                  sceneDescription={sceneDescription}
                  detectedEnvironment={detectedEnvironment}
                  onUpdateItems={handleUpdateItems}
                  onOpenRecipes={() => {
                    document.getElementById('recipe-ideas-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onOpenPhotoViewer={() => setIsPhotoModalOpen(true)}
                  hasPhoto={!!capturedImage}
                />

                {/* 2. Recipe Ideas - Follows immediately after ingredients list in main view */}
                <RecipeSection
                  recipes={recipeSuggestions}
                  currentIngredients={ingredients}
                  isLoading={isRecipeLoading}
                  onRegenerate={() => handleGenerateRecipes(ingredients)}
                  error={recipeError}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-stone-200 bg-white/60 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>KitchenLens Vision Engine</span>
          </div>
          <p className="text-stone-400">
            Powered by Google Gemini multimodal vision. Quantities and nutrition values are AI estimates based on visual cues.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <PhotoViewerModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        imageUrl={capturedImage}
        title={detectedEnvironment ? `${detectedEnvironment} Photo` : 'Captured Food Photo'}
      />
    </div>
  );
}
