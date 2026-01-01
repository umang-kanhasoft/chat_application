import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SkillBadge } from '../ui/SkillBadge';
import { RatingDisplay } from '../ui/RatingDisplay';
import { useState, useEffect } from 'react';
import { graphqlFetch } from '../../services/graphql.service';

interface User {
    id: string;
    name: string;
    email: string;
}

interface UserSkill {
    skill: {
        id: string;
        name: string;
    };
    years_of_experience: number;
    level: string;
}

interface FreelancerStats {
    projectsCompleted: number;
    successRate: number;
    averageRating: number;
    reviewCount: number;
    totalEarnings: number;
    responseTime: string;
}

interface FreelancerProfileModalProps {
    userId: string;
    onClose: () => void;
    onMessage?: () => void;
}

export function FreelancerProfileModal({ userId, onClose, onMessage }: FreelancerProfileModalProps) {
    const [user, setUser] = useState<User | null>(null);
    const [skills, setSkills] = useState<UserSkill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Mock stats for now - will be calculated from real data later
    const stats: FreelancerStats = {
        projectsCompleted: 0,
        successRate: 0,
        averageRating: 0,
        reviewCount: 0,
        totalEarnings: 0,
        responseTime: 'N/A',
    };

    useEffect(() => {
        loadUserProfile();
    }, [userId]);

    const loadUserProfile = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [userData, skillsData] = await Promise.all([
                graphqlFetch<{ user: User }, { id: string }>(
                    `query ($id: ID!) { user(id: $id) { id name email } }`,
                    { id: userId }
                ),
                graphqlFetch<{ userSkillsByUserId: Array<{ skill: { id: string; name: string }; years_of_experience: number; level: string }> }, { user_id: string }>(
                    `query ($user_id: ID!) {
                        userSkillsByUserId(user_id: $user_id) {
                            skill { id name }
                            years_of_experience
                            level
                        }
                    }`,
                    { user_id: userId }
                ),
            ]);

            setUser(userData.user);
            setSkills(skillsData.userSkillsByUserId || []);
        } catch (err) {
            console.error('Error loading user profile:', err);
            setError('Failed to load freelancer profile');
        } finally {
            setIsLoading(false);
        }
    };

    const getLevelColor = (level: string) => {
        switch (level.toUpperCase()) {
            case 'EXPERT':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'INTERMEDIATE':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'BEGINNER':
            default:
                return 'bg-green-100 text-green-800 border-green-200';
        }
    };

    if (isLoading) {
        return (
            <Modal isOpen={true} onClose={onClose} title="Freelancer Profile" size="xl">
                <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </Modal>
        );
    }

    if (error || !user) {
        return (
            <Modal isOpen={true} onClose={onClose} title="Freelancer Profile" size="xl">
                <div className="text-center py-12">
                    <div className="text-5xl mb-4">😕</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Profile</h3>
                    <p className="text-gray-600 mb-6">{error || 'User not found'}</p>
                    <Button variant="primary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={true} onClose={onClose} title="" size="xl">
            <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-gray-200">
                    {/* Avatar */}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-linear-to-r from-primary to-primary-dark flex items-center justify-center text-white text-4xl md:text-5xl font-bold shrink-0">
                        {user.name[0]?.toUpperCase() || 'U'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{user.name}</h2>
                        <p className="text-gray-600 mb-3">{user.email}</p>

                        {/* Rating */}
                        {stats.reviewCount > 0 ? (
                            <RatingDisplay rating={stats.averageRating} reviewCount={stats.reviewCount} size="lg" />
                        ) : (
                            <p className="text-sm text-gray-500">No reviews yet</p>
                        )}

                        {/* Action Buttons */}
                        {onMessage && (
                            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={onMessage}
                                    icon={
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    }
                                >
                                    Send Message
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div className="text-xs text-blue-700 font-medium mb-1">Projects</div>
                        <div className="text-2xl font-bold text-blue-900">{stats.projectsCompleted}</div>
                    </div>
                    <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="text-xs text-green-700 font-medium mb-1">Success Rate</div>
                        <div className="text-2xl font-bold text-green-900">{stats.successRate}%</div>
                    </div>
                    <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                        <div className="text-xs text-purple-700 font-medium mb-1">Total Earned</div>
                        <div className="text-xl font-bold text-purple-900">${stats.totalEarnings.toLocaleString()}</div>
                    </div>
                    <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                        <div className="text-xs text-orange-700 font-medium mb-1">Response Time</div>
                        <div className="text-lg font-bold text-orange-900">{stats.responseTime}</div>
                    </div>
                </div>

                {/* Skills Section */}
                {skills.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {skills.map((userSkill, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-primary/30 smooth-transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <SkillBadge variant="primary">{userSkill.skill.name}</SkillBadge>
                                        <span
                                            className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getLevelColor(
                                                userSkill.level
                                            )}`}
                                        >
                                            {userSkill.level}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {userSkill.years_of_experience}+ yrs
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State for Skills */}
                {skills.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <div className="text-4xl mb-2">💼</div>
                        <p className="text-gray-600">No skills listed yet</p>
                    </div>
                )}

                {/* Placeholder for Future Sections */}
                <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">More Features Coming Soon</h4>
                            <p className="text-sm text-blue-800">
                                Portfolio, reviews, work history, and certifications will be available soon.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
