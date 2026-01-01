import { useState } from 'react';
import { PROJECT_CATEGORIES, BUDGET_RANGES, EXPERIENCE_LEVELS } from '../../constants/projectCategories';
import type { ProjectCategory, BudgetRange, ExperienceLevel } from '../../constants/projectCategories';

interface AdvancedFiltersProps {
    selectedCategory: ProjectCategory | 'all';
    selectedBudget: BudgetRange;
    selectedExperience: ExperienceLevel;
    onCategoryChange: (category: ProjectCategory | 'all') => void;
    onBudgetChange: (budget: BudgetRange) => void;
    onExperienceChange: (experience: ExperienceLevel) => void;
    onReset: () => void;
}

export function AdvancedFilters({
    selectedCategory,
    selectedBudget,
    selectedExperience,
    onCategoryChange,
    onBudgetChange,
    onExperienceChange,
    onReset,
}: AdvancedFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasActiveFilters = selectedCategory !== 'all' || selectedBudget !== 'any' || selectedExperience !== 'any';

    return (
        <div className="glass-white rounded-xl p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                    {hasActiveFilters && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-white rounded-full">
                            Active
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={onReset}
                            className="text-sm text-gray-600 hover:text-primary smooth-transition"
                        >
                            Reset All
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-lg smooth-transition"
                    >
                        <svg
                            className={`w-5 h-5 smooth-transition ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Filters Content */}
            <div className={`space-y-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
                {/* Categories */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <button
                            onClick={() => onCategoryChange('all')}
                            className={`p-3 rounded-lg border-2 smooth-transition text-left ${selectedCategory === 'all'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-2xl mb-1">🌐</div>
                            <div className="text-xs font-medium">All Projects</div>
                        </button>
                        {PROJECT_CATEGORIES.map(category => (
                            <button
                                key={category.id}
                                onClick={() => onCategoryChange(category.id)}
                                className={`p-3 rounded-lg border-2 smooth-transition text-left ${selectedCategory === category.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-2xl mb-1">{category.icon}</div>
                                <div className="text-xs font-medium line-clamp-2">{category.name}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Budget Range */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Budget Range</label>
                    <div className="space-y-2">
                        {BUDGET_RANGES.map(range => (
                            <button
                                key={range.id}
                                onClick={() => onBudgetChange(range.id)}
                                className={`w-full p-3 rounded-lg border-2 smooth-transition text-left flex items-center justify-between ${selectedBudget === range.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-sm font-medium">{range.label}</span>
                                {selectedBudget === range.id && (
                                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Experience Level */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Experience Level</label>
                    <div className="grid grid-cols-2 gap-2">
                        {EXPERIENCE_LEVELS.map(level => (
                            <button
                                key={level.id}
                                onClick={() => onExperienceChange(level.id)}
                                className={`p-3 rounded-lg border-2 smooth-transition text-left ${selectedExperience === level.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-xl mb-1">{level.icon}</div>
                                <div className="text-xs font-medium">{level.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
