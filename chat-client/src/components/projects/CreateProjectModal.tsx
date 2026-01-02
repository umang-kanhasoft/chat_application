import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { SkillBadge } from '../ui/SkillBadge';
import { DEFAULT_SKILL_NAMES } from '../../constants/config';
import { graphqlFetch } from '../../services/graphql.service';

interface Skill {
    id: string;
    name: string;
}

interface CreateProjectModalProps {
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateProjectModal({ userId, onClose, onSuccess }: CreateProjectModalProps) {
    const [step, setStep] = useState(1);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        status: 'OPEN',
    });
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [skillSearchQuery, setSkillSearchQuery] = useState('');

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
                        { retries: 0 }
                    );
                }

                localStorage.setItem('skills_seeded', 'true');
            };

            const data = await graphqlFetch<{ skills: Skill[] }>(`query { skills { id name } }`);
            const list = data.skills || [];

            if (list.length === 0) {
                await seedDefaultSkills();
                const data2 = await graphqlFetch<{ skills: Skill[] }>(`query { skills { id name } }`);
                setSkills(data2.skills || []);
                return;
            }

            setSkills(list);
        } catch (error) {
            console.error('Failed to fetch skills:', error);
        }
    };

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Project title is required';
        }
        if (!formData.description.trim()) {
            newErrors.description = 'Project description is required';
        }
        if (!formData.budget || parseFloat(formData.budget) <= 0) {
            newErrors.budget = 'Please enter a valid budget';
        }
        if (!formData.status) {
            newErrors.status = 'Status is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleSubmit = async () => {
        if (selectedSkills.size === 0) {
            setErrors({ skills: 'Please select at least one skill' });
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            // Create project
            const projectData = await graphqlFetch<
                { createProject: { id: string } },
                { data: { title: string; description: string; budget: number; status: string; client_id: string } }
            >(
                `mutation ($data: ProjectInput!) { createProject(data: $data) { id } }`,
                {
                    data: {
                        title: formData.title,
                        description: formData.description,
                        budget: parseInt(formData.budget, 10),
                        status: formData.status,
                        client_id: userId,
                    },
                }
            );

            const projectId = projectData.createProject?.id;

            if (!projectId) {
                throw new Error('Failed to create project');
            }

            // Add skills to project
            const skillPromises = Array.from(selectedSkills).map((skillId) =>
                graphqlFetch<
                    { createProjectSkill: { project_id: string; skill_id: string } },
                    { data: { project_id: string; skill_id: string; years_of_experience: number; level: string } }
                >(
                    `mutation ($data: ProjectSkillInput!) { createProjectSkill(data: $data) { project_id skill_id } }`,
                    {
                        data: {
                            project_id: projectId,
                            skill_id: skillId,
                            years_of_experience: 0,
                            level: 'BEGINNER',
                        },
                    }
                )
            );

            await Promise.all(skillPromises);
            onSuccess();
        } catch {
            setErrors({ submit: 'Failed to create project. Please try again.' });
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
        setErrors(prev => ({ ...prev, skills: '' }));
    };

    const filteredSkills = skills.filter(skill =>
        skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase())
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={step === 1 ? 'Create New Project' : 'Select Required Skills'}
            size="lg"
        >
            {step === 1 ? (
                <div className="space-y-5">
                    <Input
                        label="Project Title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Build a React Dashboard"
                        error={errors.title}
                    />

                    <Textarea
                        label="Project Description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your project in detail..."
                        rows={6}
                        error={errors.description}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Budget (USD)"
                            type="number"
                            min="0"
                            step="1"
                            value={formData.budget}
                            onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                            placeholder="1000"
                            error={errors.budget}
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.status ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'}`}
                            >
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                            {errors.status && <p className="mt-1.5 text-sm text-red-600">{errors.status}</p>}
                        </div>
                    </div>

                    <ModalFooter>
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleNext}>
                            Next: Select Skills
                        </Button>
                    </ModalFooter>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Search Skills */}
                    <Input
                        type="text"
                        placeholder="Search skills..."
                        value={skillSearchQuery}
                        onChange={(e) => setSkillSearchQuery(e.target.value)}
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }
                    />

                    {/* Selected Skills */}
                    {selectedSkills.size > 0 && (
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                Selected Skills ({selectedSkills.size})
                            </h4>
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

                    {/* Skills Grid */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Skills</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
                            {filteredSkills.map(skill => (
                                <button
                                    key={skill.id}
                                    onClick={() => toggleSkill(skill.id)}
                                    className={`
                                        px-3 py-2 rounded-lg text-sm font-medium smooth-transition
                                        ${selectedSkills.has(skill.id)
                                            ? 'gradient-primary text-white shadow-md'
                                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-primary'
                                        }
                                    `}
                                >
                                    {skill.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {errors.skills && (
                        <p className="text-sm text-red-600">{errors.skills}</p>
                    )}

                    {errors.submit && (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            {errors.submit}
                        </div>
                    )}

                    <ModalFooter>
                        <Button variant="ghost" onClick={() => setStep(1)}>
                            Back
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            isLoading={isLoading}
                            disabled={selectedSkills.size === 0}
                        >
                            Create Project ({selectedSkills.size}{selectedSkills.size === 1 ? ' skill' : ' skills'})
                        </Button>
                    </ModalFooter>
                </div>
            )}
        </Modal>
    );
}
