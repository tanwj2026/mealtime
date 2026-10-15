import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Edit2, 
  Trash2, 
  ChefHat, 
  Table as TableIcon, 
  LayoutGrid, 
  AlertTriangle, 
  Sparkles,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';
import { IngredientItem, RecipeSuggestion } from '../types.ts';
import { IngredientCardView } from './IngredientCardView.tsx';
import { EditIngredientModal } from './EditIngredientModal.tsx';

interface IngredientTableProps {
  items: IngredientItem[];
  sceneDescription?: string;
  detectedEnvironment?: string;
  onUpdateItems: (newItems: IngredientItem[]) => void;
  onOpenRecipes: () => void;
  onOpenPhotoViewer: () => void;
  hasPhoto: boolean;
}

const getCategoryBadgeClass = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('produce') || cat.includes('veg')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (cat.includes('fruit')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (cat.includes('dairy') || cat.includes('egg')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (cat.includes('meat') || cat.includes('seafood') || cat.includes('poultry')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (cat.includes('pantry') || cat.includes('grain')) return 'bg-amber-50/70 text-amber-800 border-amber-300';
  if (cat.includes('condiment') || cat.includes('sauce')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (cat.includes('bakery') || cat.includes('bread')) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-stone-100 text-stone-700 border-stone-200';
};

const getFreshnessBadgeClass = (freshness: string) => {
  const f = (freshness || '').toLowerCase();
  if (f.includes('ripe') || f.includes('soon') || f.includes('check')) {
    return 'bg-amber-100/80 text-amber-900 border-amber-300 font-semibold';
  }
  if (f.includes('fresh') || f.includes('good')) {
    return 'bg-emerald-100/80 text-emerald-900 border-emerald-300';
  }
  return 'bg-stone-100 text-stone-700 border-stone-200';
};

export const IngredientTable: React.FC<IngredientTableProps> = ({
  items,
  sceneDescription,
  detectedEnvironment,
  onUpdateItems,
  onOpenRecipes,
  onOpenPhotoViewer,
  hasPhoto,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'quantity' | 'freshness'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copied, setCopied] = useState(false);

  // Edit / Add modal state
  const [editingItem, setEditingItem] = useState<IngredientItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set)];
  }, [items]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.quantityEstimate && item.quantityEstimate.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.storageLocation && item.storageLocation.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') comp = a.name.localeCompare(b.name);
        else if (sortBy === 'category') comp = a.category.localeCompare(b.category);
        else if (sortBy === 'freshness') comp = a.freshness.localeCompare(b.freshness);
        else if (sortBy === 'quantity') {
          const valA = a.count ?? 0;
          const valB = b.count ?? 0;
          comp = valA - valB || a.quantityEstimate.localeCompare(b.quantityEstimate);
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [items, searchTerm, selectedCategory, sortBy, sortOrder]);

  // Quick stats
  const ripeCount = useMemo(() => {
    return items.filter((i) => {
      const f = (i.freshness || '').toLowerCase();
      return f.includes('ripe') || f.includes('soon') || f.includes('check');
    }).length;
  }, [items]);

  // Handlers
  const handleToggleCheck = (id: string) => {
    onUpdateItems(
      items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleSelectAll = (checked: boolean) => {
    onUpdateItems(items.map((item) => ({ ...item, checked })));
  };

  const isAllSelected = items.length > 0 && items.every((i) => i.checked);

  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter((item) => item.id !== id));
  };

  const handleDeleteSelected = () => {
    onUpdateItems(items.filter((item) => !item.checked));
  };

  const handleSaveItem = (savedItem: IngredientItem) => {
    if (isAddingNew) {
      onUpdateItems([savedItem, ...items]);
    } else {
      onUpdateItems(items.map((i) => (i.id === savedItem.id ? savedItem : i)));
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsAddingNew(true);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (item: IngredientItem) => {
    setEditingItem(item);
    setIsAddingNew(false);
    setIsEditModalOpen(true);
  };

  // Copy as Text
  const handleCopyList = () => {
    const listText = items
      .map((i) => `• ${i.name} - ${i.quantityEstimate} (${i.category}) [${i.freshness}]`)
      .join('\n');
    navigator.clipboard.writeText(`KitchenLens Ingredient Inventory:\n${listText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export as CSV
  const handleExportCSV = () => {
    const headers = ['Ingredient', 'Estimated Quantity', 'Category', 'Freshness', 'Storage Location', 'Notes'];
    const rows = items.map((i) => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.quantityEstimate.replace(/"/g, '""')}"`,
      `"${i.category.replace(/"/g, '""')}"`,
      `"${i.freshness.replace(/"/g, '""')}"`,
      `"${(i.storageLocation || '').replace(/"/g, '""')}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kitchen-ingredients-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Overview Scene Banner */}
      {sceneDescription && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {detectedEnvironment || 'Detected Scene'}
                </span>
                <span className="text-xs text-stone-400">•</span>
                <span className="text-xs font-semibold text-stone-600">
                  {items.length} Ingredients Identified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 font-medium mt-0.5">
                {sceneDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            {hasPhoto && (
              <button
                type="button"
                onClick={onOpenPhotoViewer}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 shadow-2xs transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                <span>View Photo</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenRecipes}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Recipe Ideas</span>
            </button>
          </div>
        </div>
      )}

      {/* Freshness Alert Banner if items ripe */}
      {ripeCount > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>{ripeCount} {ripeCount === 1 ? 'ingredient is' : 'ingredients are'} ripe:</strong> Consider prioritizing these in your next meal to reduce food waste.
          </span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Controls Bar: Search, Category Filters, Views, Actions */}
        <div className="p-4 sm:p-5 border-b border-stone-200 space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ingredients, quantities, locations..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* View Switcher & Action Tools */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {/* Table / Card view toggle */}
              <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    viewMode === 'table'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Tabular Form"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    viewMode === 'cards'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Cards</span>
                </button>
              </div>

              {/* Recipe Ideas Button */}
              <button
                type="button"
                onClick={onOpenRecipes}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 active:scale-95 shadow-2xs"
                title="View Recipes based on ingredients"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Recipe Ideas</span>
              </button>

              {/* Add Missing Ingredient */}
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>

              {/* Copy List */}
              <button
                type="button"
                onClick={handleCopyList}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition flex items-center gap-1.5"
                title="Copy as text list"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              {/* Export CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition flex items-center gap-1.5"
                title="Export as CSV spreadsheet"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills (Horizontal scroll on mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-stone-400 font-medium mr-1 text-[11px] shrink-0">Filter:</span>
            {categories.map((cat) => {
              const count =
                cat === 'All' ? items.length : items.filter((i) => i.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bulk Selection Notification */}
          {items.some((i) => i.checked) && (
            <div className="bg-stone-100/90 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">
                {items.filter((i) => i.checked).length} items selected
              </span>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete Selected
              </button>
            </div>
          )}
        </div>

        {/* Tabular Presentation */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 text-[11px] uppercase tracking-wider font-bold">
                  {/* Select column */}
                  <th className="py-3 px-3 sm:px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
                    />
                  </th>

                  {/* Ingredient Name */}
                  <th 
                    className="py-3 px-3 sm:px-4 cursor-pointer hover:text-emerald-700 transition"
                    onClick={() => {
                      if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortBy('name'); setSortOrder('asc'); }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Ingredient</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>

                  {/* Estimated Quantity (Key requirement!) */}
                  <th 
                    className="py-3 px-3 sm:px-4 cursor-pointer hover:text-emerald-700 transition"
                    onClick={() => {
                      if (sortBy === 'quantity') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortBy('quantity'); setSortOrder('asc'); }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Estimated Quantity</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>

                  {/* Category */}
                  <th 
                    className="py-3 px-3 sm:px-4 cursor-pointer hover:text-emerald-700 transition"
                    onClick={() => {
                      if (sortBy === 'category') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortBy('category'); setSortOrder('asc'); }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Category</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>

                  {/* Freshness / Condition */}
                  <th 
                    className="py-3 px-3 sm:px-4 cursor-pointer hover:text-emerald-700 transition hidden md:table-cell"
                    onClick={() => {
                      if (sortBy === 'freshness') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortBy('freshness'); setSortOrder('asc'); }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Freshness</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>

                  {/* Storage Location */}
                  <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">
                    <span>Observed Spot</span>
                  </th>

                  {/* Notes */}
                  <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                    <span>Notes</span>
                  </th>

                  {/* Actions */}
                  <th className="py-3 px-3 sm:px-4 text-right w-24">
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAndSortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500">
                      No ingredients found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-emerald-50/40 transition-colors group ${
                        item.checked ? 'bg-stone-50/70 text-stone-400' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 sm:px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!item.checked}
                          onChange={() => handleToggleCheck(item.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
                        />
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-3 sm:px-4 font-semibold text-stone-900">
                        <div className="flex flex-col">
                          <span className={item.checked ? 'line-through text-stone-400' : ''}>
                            {item.name}
                          </span>
                          {/* Mobile sub-tags for small screen */}
                          <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${getCategoryBadgeClass(
                                item.category
                              )}`}
                            >
                              {item.category}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${getFreshnessBadgeClass(
                                item.freshness
                              )}`}
                            >
                              {item.freshness}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Estimated Quantity (Prominent display) */}
                      <td className="py-3.5 px-3 sm:px-4">
                        <span className="inline-flex items-center font-extrabold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/70 shadow-2xs text-xs sm:text-sm">
                          {item.quantityEstimate}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 sm:px-4 hidden sm:table-cell">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </td>

                      {/* Freshness */}
                      <td className="py-3.5 px-3 sm:px-4 hidden md:table-cell">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${getFreshnessBadgeClass(
                            item.freshness
                          )}`}
                        >
                          {item.freshness.includes('Ripe') || item.freshness.includes('Soon') ? (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                          {item.freshness}
                        </span>
                      </td>

                      {/* Storage Spot */}
                      <td className="py-3.5 px-3 sm:px-4 text-xs text-stone-600 hidden lg:table-cell">
                        {item.storageLocation ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            {item.storageLocation}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">—</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-3 sm:px-4 text-xs text-stone-600 hidden sm:table-cell max-w-xs truncate">
                        {item.notes ? (
                          <span title={item.notes}>{item.notes}</span>
                        ) : (
                          <span className="text-stone-400 italic">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition"
                            title="Edit row"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards View */
          <div className="p-4 sm:p-5">
            <IngredientCardView
              items={filteredAndSortedItems}
              onToggleCheck={handleToggleCheck}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteItem}
            />
          </div>
        )}

        {/* Table Footer with Summary Counts */}
        <div className="px-4 sm:px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <span>
            Showing <strong>{filteredAndSortedItems.length}</strong> of{' '}
            <strong>{items.length}</strong> items
          </span>
          <div className="flex items-center gap-3">
            <span>
              Selected: <strong>{items.filter((i) => i.checked).length}</strong>
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">
              Ready for cooking or pantry logging
            </span>
          </div>
        </div>
      </div>

      {/* Edit / Add Modal */}
      <EditIngredientModal
        isOpen={isEditModalOpen}
        ingredient={editingItem}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        isNew={isAddingNew}
      />
    </div>
  );
};
