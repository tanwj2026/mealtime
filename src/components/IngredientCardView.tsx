import React from 'react';
import { Edit2, Trash2, MapPin, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { IngredientItem } from '../types.ts';

interface IngredientCardViewProps {
  items: IngredientItem[];
  onToggleCheck: (id: string) => void;
  onEdit: (item: IngredientItem) => void;
  onDelete: (id: string) => void;
}

const getCategoryBadgeClass = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('produce') || cat.includes('veg')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (cat.includes('fruit')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (cat.includes('dairy') || cat.includes('egg')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (cat.includes('meat') || cat.includes('seafood')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (cat.includes('pantry') || cat.includes('grain')) return 'bg-amber-50/70 text-amber-800 border-amber-300';
  if (cat.includes('condiment') || cat.includes('sauce')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (cat.includes('bakery') || cat.includes('bread')) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-stone-100 text-stone-700 border-stone-200';
};

const getFreshnessBadgeClass = (freshness: string) => {
  const f = freshness.toLowerCase();
  if (f.includes('ripe') || f.includes('soon') || f.includes('check')) {
    return 'bg-amber-100 text-amber-800 border-amber-300';
  }
  if (f.includes('fresh') || f.includes('good')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }
  return 'bg-stone-100 text-stone-700 border-stone-200';
};

export const IngredientCardView: React.FC<IngredientCardViewProps> = ({
  items,
  onToggleCheck,
  onEdit,
  onDelete,
}) => {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-stone-500">
        No ingredients match your current filter.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {items.map((item) => (
        <div
          key={item.id}
          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            item.checked
              ? 'bg-stone-50/80 border-stone-300 opacity-75'
              : 'bg-white border-stone-200 shadow-xs hover:border-emerald-300 hover:shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={!!item.checked}
                  onChange={() => onToggleCheck(item.id)}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
                />
                <div>
                  <h4
                    className={`font-bold text-stone-900 text-base leading-snug ${
                      item.checked ? 'line-through text-stone-500' : ''
                    }`}
                  >
                    {item.name}
                  </h4>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadgeClass(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                  title="Edit item"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Estimated Quantity Box */}
            <div className="my-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Estimated Quantity:</span>
              <span className="text-sm font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200/60 shadow-2xs">
                {item.quantityEstimate}
              </span>
            </div>

            {/* Freshness & Location */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1 ${getFreshnessBadgeClass(
                  item.freshness
                )}`}
              >
                {item.freshness.includes('Ripe') || item.freshness.includes('Soon') ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
                {item.freshness}
              </span>

              {item.storageLocation && (
                <span className="text-[11px] text-stone-500 flex items-center gap-1 bg-stone-100/70 px-2 py-0.5 rounded-md">
                  <MapPin className="w-2.5 h-2.5 text-stone-400" />
                  {item.storageLocation}
                </span>
              )}
            </div>

            {/* Notes */}
            {item.notes && (
              <p className="mt-2 text-[11px] text-stone-500 italic flex items-center gap-1">
                <Info className="w-3 h-3 text-stone-400 shrink-0" />
                {item.notes}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
