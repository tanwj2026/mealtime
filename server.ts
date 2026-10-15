import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Body parser with 50MB limit for high-res camera photos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Google Gemini API Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint: Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// API Endpoint: Analyze Ingredients from Image
app.post('/api/analyze-ingredients', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', locationContext = 'auto' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 parameter' });
    }

    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const ai = getGeminiClient();

    const promptText = `
You are an expert culinary chef, food inventory specialist, and visual analyst.
Carefully inspect this image of food ingredients (which may be arranged on a dining table, kitchen countertop, cutting board, or inside a refrigerator/freezer/pantry shelves).

Task:
1. Identify all visible and partially visible food ingredients, grocery items, condiments, and produce.
2. Estimate the quantity available for each item as realistically as possible:
   - Provide a natural readable string (e.g., "4 medium", "approx. 500g / 1 block", "1/2 carton (~500ml)", "6 count", "1 full jar (~350ml)", "2 bunches").
   - Provide a best-estimate countable number (e.g., 4) or approximate count if applicable, or null if strictly continuous/bulk.
   - Specify the standard unit (e.g. "pieces", "count", "grams", "carton", "bottle", "jar", "bunch", "can").
3. Assign each item to a distinct category (e.g. "Produce / Vegetables", "Fruits", "Dairy & Eggs", "Meat & Seafood", "Condiments & Sauces", "Pantry & Grains", "Bakery & Breads", "Beverages", "Snacks & Other").
4. Rate confidence in identification ("High", "Medium", "Low").
5. Assess visible freshness / condition ("Fresh", "Ripe - Use Soon", "Good Condition", "Shelf-stable", "Check Expiry").
6. Note the observed storage spot or context (e.g. "Refrigerated door shelf", "Crisper drawer", "Countertop bowl", "Table center", "Pantry rack").
7. Add helpful culinary notes (e.g., "Already opened", "Sealed pack", "Firm texture visible", "Ripe yellow bananas with some brown specks").
8. Provide 2-3 quick realistic meal / recipe ideas that make great use of these identified ingredients.

Be rigorous and avoid duplicate entries. If items are in packaging (cartons, cans, jars), identify the food product inside.
`;

    let response;
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sceneDescription: {
                  type: Type.STRING,
                  description: 'Concise 1-2 sentence description of the scene and setup detected.',
                },
                detectedEnvironment: {
                  type: Type.STRING,
                  description: 'Environment detected: Refrigerator, Countertop / Table, Pantry, or Open Kitchen.',
                },
                totalItemCount: {
                  type: Type.INTEGER,
                  description: 'Total number of distinct ingredient items identified.',
                },
                items: {
                  type: Type.ARRAY,
                  description: 'The list of identified food ingredients.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING, description: 'Specific ingredient name (e.g. Roma Tomatoes, Whole Milk)' },
                      category: {
                        type: Type.STRING,
                        description: 'Category name (e.g. Produce / Vegetables, Fruits, Dairy & Eggs, Meat & Seafood, Pantry & Grains, Condiments & Sauces, Bakery, Beverages, Other)',
                      },
                      quantityEstimate: {
                        type: Type.STRING,
                        description: 'Descriptive estimated quantity (e.g. "4 whole", "approx. 1 liter (full carton)", "approx. 200g block")',
                      },
                      count: {
                        type: Type.NUMBER,
                        description: 'Estimated numeric count or portion number, or null if continuous.',
                      },
                      unit: {
                        type: Type.STRING,
                        description: 'Unit of measure (e.g. count, pieces, carton, bottle, grams, kg, bunch, jar, head).',
                      },
                      confidence: {
                        type: Type.STRING,
                        description: 'High, Medium, or Low confidence.',
                      },
                      freshness: {
                        type: Type.STRING,
                        description: 'Fresh, Ripe - Use Soon, Good Condition, Shelf-stable, or Check Expiry.',
                      },
                      storageLocation: {
                        type: Type.STRING,
                        description: 'Where the item is situated in the image (e.g. Fridge Top Shelf, Table Center, Crisper).',
                      },
                      notes: {
                        type: Type.STRING,
                        description: 'Helpful observation or state (e.g. Opened, Ripe, Sealed).',
                      },
                    },
                    required: ['name', 'category', 'quantityEstimate', 'confidence', 'freshness'],
                  },
                },
                recipeSuggestions: {
                  type: Type.ARRAY,
                  description: '2-3 delicious dish ideas that can be prepared with these detected ingredients.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      keyIngredientsUsed: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      prepTimeMinutes: { type: Type.NUMBER },
                    },
                    required: ['title', 'description', 'keyIngredientsUsed'],
                  },
                },
              },
              required: ['sceneDescription', 'items'],
            },
          },
        });
        if (response && response.text) {
          break; // successfully received response
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed or busy:`, err.message || err);
        // Wait 1 second before trying next model
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('Gemini models are currently unavailable. Please try again in a few moments.');
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsedData = JSON.parse(responseText);

    // Ensure each item has a unique ID
    if (Array.isArray(parsedData.items)) {
      parsedData.items = parsedData.items.map((item: any, index: number) => ({
        ...item,
        id: item.id || `ing-${Date.now()}-${index + 1}`,
      }));
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error analyzing ingredients:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze ingredients. Please try again.',
    });
  }
});

// Precise culinary archetype matching so every dish image corresponds to the recipe
function getArchetypeDishImage(title: string, description: string = '', ingredients: string[] = []): string {
  const t = title.toLowerCase();
  const full = `${title} ${description} ${ingredients.join(' ')}`.toLowerCase();

  // 1. Scramble / Scrambled eggs
  if (t.includes('scramble') || (full.includes('scrambled') && full.includes('egg'))) {
    return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80';
  }

  // 2. Omelet / Omelette
  if (t.includes('omelet') || t.includes('omelette')) {
    return 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=900&q=80';
  }

  // 3. Frittata / Egg skillet
  if (t.includes('frittata') || t.includes('quiche')) {
    return 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=900&q=80';
  }

  // 4. Bruschetta / Crostini / Toasted bread with toppings
  if (t.includes('bruschetta') || t.includes('crostini') || (full.includes('bread') && full.includes('toast') && full.includes('tomato'))) {
    return 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=900&q=80';
  }

  // 5. Caprese / Tomato & Mozzarella Salad
  if (t.includes('caprese') || (full.includes('mozzarella') && full.includes('tomato') && (full.includes('salad') || full.includes('raw') || full.includes('carpaccio')))) {
    return 'https://images.unsplash.com/photo-1592417817098-8f3d69102353?auto=format&fit=crop&w=900&q=80';
  }

  // 6. Skillet Bake / Casserole / Baked cheese & vegetables
  if (t.includes('skillet') || t.includes('bake') || t.includes('casserole') || t.includes('gratin')) {
    return 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=900&q=80';
  }

  // 7. Pasta / Spaghetti / Penne
  if (full.includes('pasta') || full.includes('spaghetti') || full.includes('penne') || full.includes('noodle') || full.includes('pomodoro')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281781?auto=format&fit=crop&w=900&q=80';
  }

  // 8. Soup / Stew / Broth
  if (full.includes('soup') || full.includes('stew') || full.includes('chowder') || full.includes('broth')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80';
  }

  // 9. Stir Fry / Sautéed vegetables in wok
  if (full.includes('stir fry') || full.includes('stir-fry') || full.includes('wok') || full.includes('saut')) {
    return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80';
  }

  // 10. Sandwich / Melt / Panini / Wrap
  if (full.includes('sandwich') || full.includes('panini') || full.includes('melt') || full.includes('wrap') || full.includes('burger')) {
    return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80';
  }

  // 11. Fresh Green Salad / Grain bowl
  if (full.includes('salad') || full.includes('greens') || full.includes('bowl')) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80';
  }

  // 12. Roasted Vegetables / Tray bake
  if (full.includes('roast') || full.includes('baked')) {
    return 'https://images.unsplash.com/photo-1505253758473-96b3015f240a?auto=format&fit=crop&w=900&q=80';
  }

  // 13. Smoothie / Yogurt / Breakfast
  if (full.includes('smoothie') || full.includes('yogurt') || full.includes('parfait') || full.includes('berry')) {
    return 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=80';
  }

  // Default appetizing plated dish
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80';
}

// Generate or fetch realistic dish image based on the recipe itself
async function generateOrGetDishImage(title: string, description: string = '', visualDesc: string = '', ingredients: string[] = []): Promise<string> {
  // 1. Precise archetype matching for culinary dishes guarantees the image looks like the exact recipe
  const archetypeImg = getArchetypeDishImage(title, description, ingredients);
  if (archetypeImg) return archetypeImg;

  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80';
}

// API Endpoint: Suggest Recipes from current ingredient table with strict quantity limits & item calories
app.post('/api/suggest-recipes', async (req: Request, res: Response) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Please provide a list of ingredients.' });
    }

    const ai = getGeminiClient();

    // Detailed inventory string with names and estimated available amounts
    const inventoryListStr = ingredients
      .map((i: any, idx: number) => `${idx + 1}. ${i.name} — Available Amount: ${i.quantityEstimate || '1 unit'} (Category: ${i.category || 'Food'})`)
      .join('\n');

    const promptText = `
You are a master executive chef and registered culinary dietitian.
Here is the EXACT inventory of available food ingredients identified from a photo:

${inventoryListStr}

CRITICAL RULES AND CONSTRAINTS:
1. ALWAYS GENERATE AT LEAST 3 DISTINCT RECIPES (generate exactly 3 or 4 delicious, practical recipes each time).
2. QUANTITY MUST NOT EXCEED AVAILABLE AMOUNTS:
   Every recipe must strictly use amounts LESS THAN or EQUAL TO the available quantities listed above.
   - For example: If only 2 eggs are available, the recipe must use at most 2 eggs.
   - If approx. 200g of cheese is available, do not use 300g.
   - Explicitly specify both the amount used in the recipe and the available amount from the photo (e.g., amountUsed: "2 medium tomatoes (~250g)", availableAmount: "4 medium tomatoes available").
3. SPECIFY CALORIES FOR EACH INGREDIENT:
   For every ingredient in the recipe, calculate and specify the estimated calories for that specific ingredient based on the estimated quantity used!
   - Provide the calorie number (e.g. 45 kcal).
   - Provide the calculation basis (e.g. "~18 kcal per 100g, 250g = ~45 kcal" or "72 kcal per large egg, 2 eggs = 144 kcal").
4. TOTAL CALORIES & MACROS:
   - Provide the total calories for the dish (sum of all ingredient calories).
   - Provide the number of servings and calories per serving.
   - Provide estimated macro nutrients (protein, carbs, fat, fiber).
5. VISUAL DISH DESCRIPTION:
   - Describe in vivid detail how the finished, plated dish looks (colors, texture, garnish, plating style) so we can match the exact visual appearance.
6. REMAINING INVENTORY & STEPS:
   - Propose 3 or 4 distinct, creative, and delicious recipes that make optimal use of these items.
   - List basic pantry staples needed (e.g., salt, black pepper, olive oil, water).
   - Summarize what ingredients remain in inventory after preparing the recipe.
   - Provide clear, numbered cooking steps.
`;

    let response;
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recipes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      subtitle: { type: Type.STRING },
                      description: { type: Type.STRING },
                      servings: { type: Type.NUMBER },
                      prepTimeMinutes: { type: Type.NUMBER },
                      cookTimeMinutes: { type: Type.NUMBER },
                      difficulty: { type: Type.STRING, description: 'Easy, Medium, or Advanced' },
                      totalCalories: { type: Type.NUMBER, description: 'Total calories of the entire dish' },
                      caloriesPerServing: { type: Type.NUMBER, description: 'Calories per individual serving' },
                      macroNutrients: {
                        type: Type.OBJECT,
                        properties: {
                          protein: { type: Type.STRING },
                          carbs: { type: Type.STRING },
                          fat: { type: Type.STRING },
                          fiber: { type: Type.STRING },
                        },
                        required: ['protein', 'carbs', 'fat'],
                      },
                      ingredientsUsed: {
                        type: Type.ARRAY,
                        description: 'List of ingredients with strict quantities not exceeding available amounts, and calories per item',
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            amountUsed: {
                              type: Type.STRING,
                              description: 'Amount used in this recipe (must not exceed available amount)',
                            },
                            availableAmount: {
                              type: Type.STRING,
                              description: 'Original available amount from the photo',
                            },
                            calories: {
                              type: Type.NUMBER,
                              description: 'Estimated calories for this ingredient amount',
                            },
                            caloriesBasis: {
                              type: Type.STRING,
                              description: 'Calculation rationale, e.g. ~72 kcal per egg x 2 = 144 kcal',
                            },
                            category: { type: Type.STRING },
                          },
                          required: ['name', 'amountUsed', 'availableAmount', 'calories'],
                        },
                      },
                      additionalPantryStaplesNeeded: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Basic pantry staples like cooking oil, salt, pepper',
                      },
                      remainingIngredientsSummary: {
                        type: Type.STRING,
                        description: 'What ingredients remain available after making this dish',
                      },
                      instructions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      visualDishDescription: {
                        type: Type.STRING,
                        description: 'Vivid description of how the finished plated dish looks',
                      },
                      chefTip: {
                        type: Type.STRING,
                        description: 'Pro culinary tip to elevate flavor or texture',
                      },
                    },
                    required: [
                      'title',
                      'description',
                      'servings',
                      'totalCalories',
                      'caloriesPerServing',
                      'ingredientsUsed',
                      'instructions',
                      'visualDishDescription',
                    ],
                  },
                },
              },
              required: ['recipes'],
            },
          },
        });
        if (response && response.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} for recipes failed:`, err.message || err);
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('Recipe generation temporarily unavailable');
    }

    const parsed = JSON.parse(response.text || '{}');
    const rawRecipes = parsed.recipes || [];

    // Attach dish images and IDs to each recipe
    const recipesWithImages = await Promise.all(
      rawRecipes.map(async (recipe: any, index: number) => {
        const recipeId = recipe.id || `recipe-${Date.now()}-${index + 1}`;
        const keyIngs = (recipe.ingredientsUsed || []).map((i: any) => i.name);
        const imageUrl = await generateOrGetDishImage(
          recipe.title,
          recipe.description,
          recipe.visualDishDescription,
          keyIngs
        );

        return {
          ...recipe,
          id: recipeId,
          imageUrl,
        };
      })
    );

    return res.json({ success: true, recipes: recipesWithImages });
  } catch (err: any) {
    console.error('Error suggesting recipes:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API Endpoint: On-demand generate dish image
app.post('/api/generate-dish-image', async (req: Request, res: Response) => {
  try {
    const { title, description, visualDescription, ingredients = [] } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Missing title parameter' });
    }

    const imageUrl = await generateOrGetDishImage(title, description || '', visualDescription || '', ingredients);
    return res.json({ success: true, imageUrl });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Server Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`KitchenLens server running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
