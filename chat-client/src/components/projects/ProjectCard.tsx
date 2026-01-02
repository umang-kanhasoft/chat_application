import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { SkillBadge } from '../ui/SkillBadge';
import { motion } from 'framer-motion';

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

interface ProjectCardProps {
    project: Project;
    onViewDetails: (project: Project) => void;
    onBid: (project: Project) => void;
    currentUserId: string;
}

export function ProjectCard({ project, onViewDetails, onBid, currentUserId }: ProjectCardProps) {
    const isOwnProject = project.client_id === currentUserId;
    const skillsList = project.project_skills?.map(ps => ps.skill) || [];
    const bidCount = project.bids?.length || 0;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatBudget = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatStatus = (status: string) => {
        const s = status?.toUpperCase?.() || '';
        if (s === 'OPEN') return 'Open';
        if (s === 'IN_PROGRESS') return 'In Progress';
        if (s === 'COMPLETED') return 'Completed';
        if (s === 'CANCELLED') return 'Cancelled';
        return status;
    };

    return (
        <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <Card hover padding="none" className="overflow-hidden h-full flex flex-col">
                <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-4">
                        <CardTitle className="flex-1 line-clamp-2">{project.title}</CardTitle>
                        {isOwnProject && (
                            <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                                Your Project
                            </span>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="px-5 pb-3 flex-1">
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {project.description}
                    </p>

                    {/* Skills */}
                    {skillsList.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {skillsList.slice(0, 4).map((skill) => (
                                <SkillBadge key={skill.id} variant="default">
                                    {skill.name}
                                </SkillBadge>
                            ))}
                            {skillsList.length > 4 && (
                                <SkillBadge variant="default">
                                    +{skillsList.length - 4} more
                                </SkillBadge>
                            )}
                        </div>
                    )}

                    {/* Project Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-gray-500">Budget:</span>
                            <div className="font-semibold text-gray-900 mt-0.5">
                                {formatBudget(project.budget)}
                            </div>
                        </div  >
                        <div>
                            <span className="text-gray-500">Status:</span>
                            <div className="font-semibold text-gray-900 mt-0.5">
                                {formatStatus(project.status)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-600">
                        Posted: <span className="font-medium">{formatDate(project.createdAt)}</span>
                    </div>

                    {/* Bids Count */}
                    {bidCount > 0 && (
                        <div className="mt-3 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {bidCount} bid{bidCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-5 pt-0 border-0 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(project)}
                        className="flex-1"
                    >
                        View Details
                    </Button>
                    {!isOwnProject && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onBid(project)}
                            className="flex-1"
                        >
                            Submit Bid
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    );
}
