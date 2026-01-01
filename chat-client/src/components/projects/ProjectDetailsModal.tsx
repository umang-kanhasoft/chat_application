import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SkillBadge } from '../ui/SkillBadge';
import { useState } from 'react';
import { ProjectBidsModal } from './ProjectBidsModal';

interface Project {
    id: string;
    title: string;
    description: string;
    budget: number;
    status: string;
    client_id: string;
    createdAt: string;
    project_skills?: Array<{ skill: { id: string; name: string } }>;
    bids?: Array<{ id: string }>;
}

interface ProjectDetailsModalProps {
    project: Project;
    currentUserId: string;
    onClose: () => void;
    onBid: (project: Project) => void;
}

export function ProjectDetailsModal({ project, currentUserId, onClose, onBid }: ProjectDetailsModalProps) {
    const [showBidsModal, setShowBidsModal] = useState(false);
    const isOwnProject = project.client_id === currentUserId;
    const skillsList = project.project_skills?.map(ps => ps.skill) || [];
    const bidCount = project.bids?.length || 0;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const formatBudget = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const handleBidAccepted = () => {
        setShowBidsModal(false);
        onClose();
    };

    if (showBidsModal) {
        return (
            <ProjectBidsModal
                projectId={project.id}
                projectTitle={project.title}
                onClose={() => setShowBidsModal(false)}
                onBidAccepted={handleBidAccepted}
            />
        );
    }

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Project Details"
            size="xl"
        >
            <div className="space-y-6">
                {/* Project Title and Badge */}
                <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
                        {isOwnProject && (
                            <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                                Your Project
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        Posted on {formatDate(project.createdAt)}
                    </p>
                </div>

                {/* Description */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {project.description}
                    </p>
                </div>

                {/* Bid Statistics - Only for Project Owners */}
                {isOwnProject && bidCount > 0 && (
                    <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-purple-900">Bids Received</h3>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setShowBidsModal(true)}
                                icon={
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                }
                            >
                                View All {bidCount} Bids
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-3">
                                <div className="text-xs text-purple-700 font-medium mb-1">Total Bids</div>
                                <div className="text-2xl font-bold text-purple-900">{bidCount}</div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                                <div className="text-xs text-purple-700 font-medium mb-1">Status</div>
                                <div className="text-sm font-semibold text-purple-900 capitalize">{project.status}</div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                                <div className="text-xs text-purple-700 font-medium mb-1">Action Needed</div>
                                <div className="text-sm font-semibold text-purple-900">
                                    {project.status === 'OPEN' ? 'Review Bids' : 'In Progress'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                        <div className="text-sm text-green-700 font-medium mb-1">Budget</div>
                        <div className="text-2xl font-bold text-green-900">{formatBudget(project.budget)}</div>
                    </div>

                    <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                        <div className="text-sm text-blue-700 font-medium mb-1">Status</div>
                        <div className="text-2xl font-bold text-blue-900 capitalize">{project.status}</div>
                    </div>
                </div>

                {/* Required Skills */}
                {skillsList.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {skillsList.map(skill => (
                                <SkillBadge key={skill.id} variant="outline">
                                    {skill.name}
                                </SkillBadge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bid Info for Non-Owners */}
                {!isOwnProject && bidCount > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h4 className="font-semibold text-orange-900 mb-1">Competition Level</h4>
                                <p className="text-sm text-orange-800">
                                    {bidCount} {bidCount === 1 ? 'freelancer has' : 'freelancers have'} already submitted bids for this project.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                    {!isOwnProject && (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => onBid(project)}
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            }
                        >
                            Submit Your Bid
                        </Button>
                    )}
                    {isOwnProject && bidCount > 0 && (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => setShowBidsModal(true)}
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            }
                        >
                            Manage Bids ({bidCount})
                        </Button>
                    )}
                </ModalFooter>
            </div>
        </Modal>
    );
}
