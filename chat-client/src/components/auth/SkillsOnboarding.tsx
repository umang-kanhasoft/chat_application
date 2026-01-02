import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SkillBadge } from '../ui/SkillBadge';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { DEFAULT_SKILL_NAMES } from '../../constants/config';
import { graphqlFetch } from '../../services/graphql.service';

interface Skill {
    id: string;
    name: string;
}

interface SkillsOnboardingProps {
    userId: string;
    onComplete: () => void;
}

export function SkillsOnboarding({ userId, onComplete }: SkillsOnboardingProps) {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const seedDefaultSkills = async () => {
                const alreadySeeded = localStorage.getItem('skills_seeded') === 'true';
                if (alreadySeeded) return;

                for (const name of DEFAULT_SKILL_NAMES) {
                    await graphqlFetch<{ createSkill: { id: string } }, { data: { name: string } }>(
                        `mutation ($data: SkillInput!) { createSkill(data: $data) { id } }`,
                        { data: { name } },
                        { retries: 0 },
                    );
                }

                localStorage.setItem('skills_seeded', 'true');
            };

            const data = await graphqlFetch<{ skills: Skill[] }>(`query { skills { id name } }`);
            const list = data.skills || [];

            if (list.length === 0) {
                await seedDefaultSkills();
                const data2 = await graphqlFetch<{ skills: Skill[] }>(
                    `query { skills { id name } }`,
                );
                setSkills(data2.skills || []);
                return;
            }

            setSkills(list);
        } catch {
            setError('Failed to load skills. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSkill = (skillId: string) => {
        setSelectedSkills((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(skillId)) {
                newSet.delete(skillId);
            } else {
                newSet.add(skillId);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        if (selectedSkills.size === 0) {
            setError('Please select at least one skill');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const promises = Array.from(selectedSkills).map((skillId) =>
                graphqlFetch<
                    { createUserSkill: { user_id: string; skill_id: string } },
                    {
                        data: {
                            user_id: string;
                            skill_id: string;
                            years_of_experience: number;
                            level: string;
                        };
                    }
                >(
                    `mutation ($data: UserSkillInput!) { createUserSkill(data: $data) { user_id skill_id } }`,
                    {
                        data: {
                            user_id: userId,
                            skill_id: skillId,
                            years_of_experience: 0,
                            level: 'BEGINNER',
                        },
                    },
                ),
            );

            await Promise.all(promises);
            onComplete();
        } catch {
            setError('Failed to save skills. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredSkills = skills.filter((skill) =>
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-6">
            <div className="glass-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-12 max-w-3xl w-full animate-fade-in">
                {/* Header */}
                <div className="text-center mb-6 md:mb-8">
                    <div className="inline-block p-3 md:p-4 rounded-full bg-linear-to-r from-primary to-primary-dark mb-3 md:mb-4">
                        <svg
                            className="w-10 h-10 md:w-12 md:h-12 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                        Choose Your Skills
                    </h1>
                    <p className="text-sm md:text-base text-gray-600">
                        Select the skills you have to help us match you with the right projects
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-4 md:mb-6">
                    <Input
                        type="text"
                        placeholder="Search skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        }
                    />
                </div>

                {/* Selected Skills Preview */}
                {selectedSkills.size > 0 && (
                    <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl bg-white/80 border border-gray-200">
                        <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3">
                            Selected Skills ({selectedSkills.size})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(selectedSkills).map((skillId) => {
                                const skill = skills.find((s) => s.id === skillId);
                                return skill ? (
                                    <SkillBadge
                                        key={skillId}
                                        variant="primary"
                                        removable
                                        onRemove={() => toggleSkill(skillId)}
                                    >
                                        {skill.name}
                                    </SkillBadge>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                {/* Skills Grid */}
                <div className="mb-6 md:mb-8">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3">
                        Available Skills
                    </h3>
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <LoadingSkeleton key={i} variant="rectangle" height="44px" />
                            ))}
                        </div>
                    ) : filteredSkills.length === 0 ? (
                        <div className="text-center py-8 md:py-12 text-gray-500 text-sm md:text-base">
                            {searchQuery
                                ? 'No skills found matching your search'
                                : 'No skills available'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 max-h-80 md:max-h-96 overflow-y-auto p-1">
                            {filteredSkills.map((skill) => (
                                <button
                                    key={skill.id}
                                    onClick={() => toggleSkill(skill.id)}
                                    className={`
                                        px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-medium smooth-transition min-h-11
                                        ${
                                            selectedSkills.has(skill.id)
                                                ? 'bg-linear-to-r from-primary to-primary-dark text-white shadow-md'
                                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-primary hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {skill.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={onComplete}
                        className="flex-1 min-h-12"
                    >
                        Skip for Now
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSave}
                        isLoading={isSaving}
                        disabled={selectedSkills.size === 0}
                        className="flex-1 min-h-12"
                    >
                        Continue ({selectedSkills.size})
                    </Button>
                </div>
            </div>
        </div>
    );
}
