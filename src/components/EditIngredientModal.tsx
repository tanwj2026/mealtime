import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { IngredientItem } from '../types.ts';

interface EditIngredientModalProps {
  isOpen: boolean;
  ingredient: IngredientItem | null;
  onClose: () => void;
  onSave: (ingredient: IngredientItem) => void;
  onDelete?: (id: string) => void;
  isNew?: boolean;
}

const CATEGORIES = [
  'Produce / Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Condiments & Sauces',
  'Pantry & Grains',
  'Bakery & Breads',
  'Beverages',
  'Snacks & Other',
];

const FRESHNESS_OPTIONS = [
  'Fresh',
  'Ripe - Use Soon',
  'Good Condition',
  'Shelf-stable',
  'Check Expiry',
];

export const EditIngredientModal: React.FC<EditIngredientModalProps> = ({
  isOpen,
  ingredient,
  onClose,
  onSave,
  onDelete,
  isNew = false,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [quantityEstimate, setQuantityEstimate] = useState('');
  const [count, setCount] = useState<string>('');
  const [unit, setUnit] = useState('');
  const [confidence, setConfidence] = useState<'High' | 'Medium' | 'Low'>('High');
  const [freshness, setFreshness] = useState(FRESHNESS_OPTIONS[0]);
  const [storageLocation, setStorageLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name || '');
      setCategory(ingredient.category || CATEGORIES[0]);
      setQuantityEstimate(ingredient.quantityEstimate || '');
      setCount(ingredient.count !== undefined && ingredient.count !== null ? String(ingredient.count) : '');
      setUnit(ingredient.unit || '');
      setConfidence((ingredient.confidence as any) || 'High');
      setFreshness(ingredient.freshness || FRESHNESS_OPTIONS[0]);
      setStorageLocation(ingredient.storageLocation || '');
      setNotes(ingredient.notes || '');
    } else {
      setName('');
      setCategory(CATEGORIES[0]);
      setQuantityEstimate('1 unit');
      setCount('1');
      setUnit('pieces');
      setConfidence('High');
      setFreshness(FRESHNESS_OPTIONS[0]);
      setStorageLocation('');
      setNotes('');
    }
  }, [ingredient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: IngredientItem = {
      id: ingredient?.id || `custom-${Date.now()}`,
      name: name.trim(),
      category,
      quantityEstimate: quantityEstimate.trim() || '1 item',
      count: count ? parseFloat(count) : null,
      unit: unit.trim() || undefined,
      confidence,
      freshness,
      storageLocation: storageLocation.trim() || undefined,
      notes: notes.trim() || undefined,
      checked: ingredient?.checked ?? false,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <h3 className="font-bold text-stone-900 text-base">
            {isNew ? 'Add Missing Ingredient' : 'Edit Ingredient Details'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Ingredient Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Roma Tomatoes, Whole Milk, Mozzarella"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Estimate & Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Estimated Quantity *
              </label>
              <input
                type="text"
                required
                value={quantityEstimate}
                onChange={(e) => setQuantityEstimate(e.target.value)}
                placeholder="e.g. 4 medium, ~500 ml, 1 carton"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Unit / Measure
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. pieces, bunch, carton, g"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Freshness & Confidence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Freshness / State
              </label>
              <select
                value={freshness}
                onChange={(e) => setFreshness(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                {FRESHNESS_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Storage Spot (Optional)
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Crisper drawer, Door shelf"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Notes / Condition
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Opened, ripe, sealed, slight bruising"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
            {!isNew && onDelete && ingredient ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(ingredient.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
