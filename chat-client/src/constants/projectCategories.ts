export const PROJECT_CATEGORIES = [
    { id: 'web_dev', name: 'Web Development', icon: '💻', color: 'blue' },
    { id: 'mobile_dev', name: 'Mobile Development', icon: '📱', color: 'purple' },
    { id: 'design', name: 'Design & Creative', icon: '🎨', color: 'pink' },
    { id: 'writing', name: 'Writing & Content', icon: '✍️', color: 'green' },
    { id: 'marketing', name: 'Marketing & Sales', icon: '📈', color: 'orange' },
    { id: 'data', name: 'Data & Analytics', icon: '📊', color: 'indigo' },
    { id: 'video', name: 'Video & Animation', icon: '🎬', color: 'red' },
    { id: 'admin', name: 'Admin & Support', icon: '🔧', color: 'gray' },
    { id: 'other', name: 'Other', icon: '📦', color: 'slate' },
] as const;

export const BUDGET_RANGES = [
    { id: 'any', label: 'Any Budget', min: 0, max: Infinity },
    { id: 'micro', label: 'Micro ($0 - $100)', min: 0, max: 100 },
    { id: 'small', label: 'Small ($100 - $500)', min: 100, max: 500 },
    { id: 'medium', label: 'Medium ($500 - $2,000)', min: 500, max: 2000 },
    { id: 'large', label: 'Large ($2,000 - $10,000)', min: 2000, max: 10000 },
    { id: 'enterprise', label: 'Enterprise ($10,000+)', min: 10000, max: Infinity },
] as const;

export const EXPERIENCE_LEVELS = [
    { id: 'any', label: 'Any Level', icon: '🌟' },
    { id: 'beginner', label: 'Beginner Friendly', icon: '🌱' },
    { id: 'intermediate', label: 'Intermediate', icon: '📚' },
    { id: 'expert', label: 'Expert Only', icon: '👑' },
] as const;

export type ProjectCategory = typeof PROJECT_CATEGORIES[number]['id'];
export type BudgetRange = typeof BUDGET_RANGES[number]['id'];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number]['id'];
