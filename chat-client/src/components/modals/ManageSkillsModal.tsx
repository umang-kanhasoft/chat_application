import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SkillBadge } from '../ui/SkillBadge';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { graphqlFetch } from '../../services/graphql.service';
import { useAuthStore } from '../../store/authStore';

interface Skill {
    id: string;
    name: string;
}

interface UserSkill {
    user_id: string;
    skill_id: string;
}

interface ManageSkillsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ManageSkillsModal({ isOpen, onClose }: ManageSkillsModalProps) {
    const { currentUserId } = useAuthStore();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
    const [initialSkills, setInitialSkills] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && currentUserId) {
            fetchData();
        }
    }, [isOpen, currentUserId]);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Fetch both all skills and user's current skills
            const data = await graphqlFetch<{ skills: Skill[]; userSkillsByUserId: UserSkill[] }>(
                `query GetSkillsData($userId: ID!) {
                    skills { id name }
                    userSkillsByUserId(user_id: $userId) { skill_id }
                }`,
                { userId: currentUserId }
            );

            setSkills(data.skills || []);

            const userSkillIds = new Set((data.userSkillsByUserId || []).map(us => us.skill_id));
            setSelectedSkills(userSkillIds);
            setInitialSkills(new Set(userSkillIds)); // Clone to compare later
        } catch {
            setError('Failed to load skills. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSkill = (skillId: string) => {
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

    const handleSave = async () => {
        if (!currentUserId) return;

        setIsSaving(true);
        setError('');

        const toAdd = Array.from(selectedSkills).filter(id => !initialSkills.has(id));
        const toRemove = Array.from(initialSkills).filter(id => !selectedSkills.has(id));

        if (toAdd.length === 0 && toRemove.length === 0) {
            onClose();
            return;
        }

        try {
            const promises = [];

            // Add new skills
            for (const skillId of toAdd) {
                promises.push(
                    graphqlFetch(
                        `mutation ($data: UserSkillInput!) { createUserSkill(data: $data) { user_id } }`,
                        {
                            data: {
                                user_id: currentUserId,
                                skill_id: skillId,
                                years_of_experience: 0,
                                level: 'BEGINNER',
                            },
                        }
                    )
                );
            }

            // Remove unselected skills
            for (const skillId of toRemove) {
                promises.push(
                    graphqlFetch(
                        `mutation ($userId: ID!, $skillId: ID!) { deleteUserSkill(user_id: $userId, skill_id: $skillId) }`,
                        { userId: currentUserId, skillId }
                    )
                );
            }

            await Promise.all(promises);
            onClose();
        } catch {
            setError('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const filteredSkills = skills.filter(skill =>
        skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 md:p-8 animate-fade-in flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Manage Skills</h2>
                        <p className="text-gray-500 text-sm mt-1">Add or remove skills from your profile</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <Input
                        type="text"
                        placeholder="Search skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }
                    />
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                    {/* Selected Skills */}
                    {selectedSkills.size > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                Selected Skills
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{selectedSkills.size}</span>
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(selectedSkills).map(skillId => {
                                    const skill = skills.find(s => s.id === skillId);
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

                    {/* Available Skills */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Skills</h3>
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <LoadingSkeleton key={i} variant="rectangle" height="40px" />
                                ))}
                            </div>
                        ) : filteredSkills.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {searchQuery ? 'No skills found matching your search' : 'No skills available'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredSkills.map(skill => (
                                    <button
                                        key={skill.id}
                                        onClick={() => toggleSkill(skill.id)}
                                        className={`
                                            px-3 py-2 rounded-lg text-sm font-medium smooth-transition text-left truncate
                                            ${selectedSkills.has(skill.id)
                                                ? 'bg-primary/5 border-primary text-primary border'
                                                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {skill.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} isLoading={isSaving}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
