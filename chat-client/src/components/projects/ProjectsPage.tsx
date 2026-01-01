import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ProjectCard } from './ProjectCard';
import { ProjectCardSkeleton } from '../ui/LoadingSkeleton';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { BidFormModal } from './BidFormModal';
import { graphqlFetch } from '../../services/graphql.service';
import type { BudgetRange } from '../../constants/projectCategories';
import { BUDGET_RANGES } from '../../constants/projectCategories';

interface Skill {
    id: string;
    name: string;
}

interface Project {
    id: string;
    title: string;
    description: string;
    budget: number;
    status: string;
    client_id: string;
    createdAt: string;
    project_skills?: Array<{ skill: Skill }>;
    bids?: Array<{ id: string }>;
}

interface ProjectsPageProps {
    currentUserId: string;
}

export function ProjectsPage({ currentUserId }: ProjectsPageProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'all' | 'my-projects'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [bidProject, setBidProject] = useState<Project | null>(null);
    const [selectedBudget, setSelectedBudget] = useState<BudgetRange>('any');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterProjects();
    }, [projects, searchQuery, selectedSkills, activeTab, selectedBudget]);

    const loadData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [projectsData, skillsData] = await Promise.all([
                graphqlFetch<{ projects: Project[] }>(
                    `query { projects { id title description budget status client_id createdAt project_skills { skill { id name } } bids { id } } }`
                ),
                graphqlFetch<{ skills: Skill[] }>(`query { skills { id name } }`),
            ]);

            setProjects(projectsData.projects || []);
            setSkills(skillsData.skills || []);
        } catch (error) {
            console.error('Failed to load data:', error);
            setError('Failed to load projects. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const filterProjects = () => {
        let filtered = projects;

        // Filter by tab
        if (activeTab === 'my-projects') {
            filtered = filtered.filter(p => p.client_id === currentUserId);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
        }

        // Filter by selected skills
        if (selectedSkills.size > 0) {
            filtered = filtered.filter(p => {
                const projectSkillIds = (p.project_skills || []).map(ps => ps.skill.id);
                return Array.from(selectedSkills).some(skillId => projectSkillIds.includes(skillId));
            });
        }

        // Filter by budget range
        if (selectedBudget !== 'any') {
            const budgetRange = BUDGET_RANGES.find(r => r.id === selectedBudget);
            if (budgetRange) {
                filtered = filtered.filter(p =>
                    p.budget >= budgetRange.min && p.budget <= budgetRange.max
                );
            }
        }

        // Note: Category and experience filtering would require backend support
        // For now, they're prepared but not actively filtering

        setFilteredProjects(filtered);
    };

    const handleResetFilters = () => {
        setSelectedBudget('any');
        setSelectedSkills(new Set());
        setSearchQuery('');
    };

    const toggleSkillFilter = (skillId: string) => {
        setSelectedSkills(prev => {
            const newSet = new Set(prev);
            if (newSet.has(skillId)) {
                newSet.delete(skillId);
            } else {
                newSet.add(skillId);
            }
            return newSet;
        });
    };

    const handleProjectCreated = () => {
        setShowCreateModal(false);
        loadData();
    };

    const handleBidSubmitted = () => {
        setBidProject(null);
        loadData();
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 md:mb-2">Projects</h1>
                            <p className="text-sm md:text-base text-white/80">Find your next opportunity or post a project</p>
                        </div>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => setShowCreateModal(true)}
                            className="w-full md:w-auto min-h-12"
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        >
                            Create Project
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 md:mb-6">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg font-semibold smooth-transition text-sm md:text-base ${activeTab === 'all'
                                ? 'glass-white text-primary shadow-lg'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            All Projects
                        </button>
                        <button
                            onClick={() => setActiveTab('my-projects')}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg font-semibold smooth-transition text-sm md:text-base ${activeTab === 'my-projects'
                                ? 'glass-white text-primary shadow-lg'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            My Projects
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="glass-white rounded-2xl p-6">
                        <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4 mb-3 md:mb-4">
                            <div className="flex-1">
                                <Input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    icon={
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    }
                                />
                            </div>

                            <div className="md:w-64">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget</label>
                                <select
                                    value={selectedBudget}
                                    onChange={(e) => setSelectedBudget(e.target.value as BudgetRange)}
                                    className="w-full min-h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    {BUDGET_RANGES.map((range) => (
                                        <option key={range.id} value={range.id}>
                                            {range.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Button
                                variant="ghost"
                                onClick={handleResetFilters}
                                className="min-h-12 md:w-auto"
                            >
                                Reset
                            </Button>
                        </div>

                        {/* Skill Filters */}
                        {skills.length > 0 && (
                            <div>
                                <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3">Filter by Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {skills.slice(0, 10).map(skill => (
                                        <button
                                            key={skill.id}
                                            onClick={() => toggleSkillFilter(skill.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium smooth-transition ${selectedSkills.has(skill.id)
                                                ? 'gradient-primary text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            {skill.name}
                                        </button>
                                    ))}
                                </div>
                                {selectedSkills.size > 0 && (
                                    <button
                                        onClick={() => setSelectedSkills(new Set())}
                                        className="text-xs md:text-sm text-primary hover:underline mt-2 md:mt-3"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Results Count */}
                    <div className="glass-white rounded-xl p-4">
                        <p className="text-sm md:text-base text-gray-700">
                            Showing <span className="font-bold text-primary">{filteredProjects.length}</span>{' '}
                            {filteredProjects.length === 1 ? 'project' : 'projects'}
                        </p>
                    </div>
                </div>

                {/* Projects Grid */}
                {error && !isLoading && (
                    <div className="glass-white rounded-2xl p-6 mb-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="font-semibold text-gray-900">Unable to load projects</div>
                                <div className="text-sm text-gray-600 mt-1">{error}</div>
                            </div>
                            <Button variant="primary" onClick={loadData}>Retry</Button>
                        </div>
                    </div>
                )}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ProjectCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="glass-white rounded-2xl p-12 text-center">
                        <div className="text-5xl md:text-6xl mb-3 md:mb-4">📋</div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">No Projects Found</h3>
                        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                            {activeTab === 'my-projects'
                                ? "You haven't created any projects yet."
                                : 'Try adjusting your search or filters.'}
                        </p>
                        {activeTab === 'my-projects' && (
                            <Button variant="primary" onClick={() => setShowCreateModal(true)} className="min-h-12">
                                Create Your First Project
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {filteredProjects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                currentUserId={currentUserId}
                                onViewDetails={(p) => setSelectedProject(p)}
                                onBid={(p) => setBidProject(p)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateProjectModal
                    userId={currentUserId}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleProjectCreated}
                />
            )}

            {selectedProject && (
                <ProjectDetailsModal
                    project={selectedProject}
                    currentUserId={currentUserId}
                    onClose={() => setSelectedProject(null)}
                    onBid={(project) => {
                        setSelectedProject(null);
                        setBidProject(project);
                    }}
                />
            )}

            {bidProject && (
                <BidFormModal
                    project={bidProject}
                    userId={currentUserId}
                    onClose={() => setBidProject(null)}
                    onSuccess={handleBidSubmitted}
                />
            )}
        </div>
    );
}
