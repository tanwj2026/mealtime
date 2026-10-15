export interface IngredientItem {
  id: string;
  name: string;
  category: string;
  quantityEstimate: string;
  count?: number | null;
  unit?: string;
  confidence: 'High' | 'Medium' | 'Low' | string;
  freshness: 'Fresh' | 'Ripe - Use Soon' | 'Good Condition' | 'Shelf-stable' | 'Check Expiry' | string;
  storageLocation?: string;
  notes?: string;
  checked?: boolean;
}

export interface RecipeIngredientItem {
  name: string;
  amountUsed: string;          // e.g. "2 medium (~240g)"
  availableAmount: string;     // e.g. "4 medium available"
  calories: number;            // e.g. 44
  caloriesBasis?: string;      // e.g. "~18 kcal per 100g"
  category?: string;
}

export interface RecipeSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes?: number;
  difficulty: 'Easy' | 'Medium' | 'Advanced' | string;
  totalCalories: number;
  caloriesPerServing: number;
  macroNutrients?: {
    protein: string;
    carbs: string;
    fat: string;
    fiber?: string;
  };
  ingredientsUsed: RecipeIngredientItem[];
  additionalPantryStaplesNeeded?: string[]; // salt, pepper, oil, water
  remainingIngredientsSummary?: string;    // what remains in the fridge/table
  instructions: string[];
  imageUrl?: string;
  imagePrompt?: string;
  visualDishDescription?: string;
  chefTip?: string;
}

export interface AnalysisResponseData {
  sceneDescription: string;
  detectedEnvironment: string;
  totalItemCount: number;
  items: IngredientItem[];
  recipeSuggestions?: RecipeSuggestion[];
}

export interface SamplePreset {
  id: string;
  title: string;
  subtitle: string;
  tag: 'Fridge' | 'Tabletop' | 'Pantry' | 'Countertop';
  imageUrl: string;
  description: string;
}
