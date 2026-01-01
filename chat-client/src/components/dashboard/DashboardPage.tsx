import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { RatingBadge } from '../ui/RatingDisplay';

interface DashboardStats {
    activeProjects: number;
    completedProjects: number;
    totalBids: number;
    acceptedBids: number;
    totalEarned: number;
    totalSpent: number;
    averageRating: number;
    reviewCount: number;
}

interface RecentActivity {
    id: string;
    type: 'bid_received' | 'bid_accepted' | 'project_created' | 'project_completed';
    title: string;
    description: string;
    timestamp: string;
}

interface DashboardPageProps {
    currentUserId: string;
    onNavigateToProjects: () => void;
}

export function DashboardPage({ currentUserId, onNavigateToProjects }: DashboardPageProps) {
    const [stats, setStats] = useState<DashboardStats>({
        activeProjects: 0,
        completedProjects: 0,
        totalBids: 0,
        acceptedBids: 0,
        totalEarned: 0,
        totalSpent: 0,
        averageRating: 0,
        reviewCount: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [recentActivity] = useState<RecentActivity[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, [currentUserId]);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            // For now, we'll show placeholder data
            // In production, this would fetch from GraphQL
            setStats({
                activeProjects: 0,
                completedProjects: 0,
                totalBids: 0,
                acceptedBids: 0,
                totalEarned: 0,
                totalSpent: 0,
                averageRating: 0,
                reviewCount: 0,
            });
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'bid_received':
                return '📨';
            case 'bid_accepted':
                return '✅';
            case 'project_created':
                return '🚀';
            case 'project_completed':
                return '🎉';
            default:
                return '📌';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Dashboard</h1>
                        <p className="text-base md:text-lg text-white/80">Welcome back! Here's your overview.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        <Button
                            variant="outline"
                            size="md"
                            onClick={onNavigateToProjects}
                            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 min-h-11"
                        >
                            Browse Projects
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            onClick={onNavigateToProjects}
                            className="min-h-11"
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        >
                            Create Project
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="glass-white rounded-xl p-4 md:p-6 hover:scale-105 smooth-transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-linear-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 mb-1">Active Projects</div>
                        <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.activeProjects}</div>
                    </div>

                    <div className="glass-white rounded-xl p-4 md:p-6 hover:scale-105 smooth-transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-linear-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 mb-1">Completed</div>
                        <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.completedProjects}</div>
                    </div>

                    <div className="glass-white rounded-xl p-4 md:p-6 hover:scale-105 smooth-transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 mb-1">Total Bids</div>
                        <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.totalBids}</div>
                    </div>

                    <div className="glass-white rounded-xl p-4 md:p-6 hover:scale-105 smooth-transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-linear-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 mb-1">Total Earned</div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEarned)}</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 glass-white rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivity.map(activity => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 smooth-transition"
                                    >
                                        <div className="text-3xl">{getActivityIcon(activity.type)}</div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                                            <p className="text-sm text-gray-600">{activity.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">📊</div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Start by browsing projects or creating your own!
                                </p>
                                <Button variant="primary" onClick={onNavigateToProjects}>
                                    Browse Projects
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-white rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={onNavigateToProjects}
                                className="w-full flex items-center gap-3 p-4 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 smooth-transition text-left"
                            >
                                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <div>
                                    <div className="font-semibold text-blue-900">Find Projects</div>
                                    <div className="text-xs text-blue-700">Browse available work</div>
                                </div>
                            </button>

                            <button
                                onClick={onNavigateToProjects}
                                className="w-full flex items-center gap-3 p-4 rounded-lg bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 hover:border-green-300 smooth-transition text-left"
                            >
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <div>
                                    <div className="font-semibold text-green-900">Post a Project</div>
                                    <div className="text-xs text-green-700">Hire talented freelancers</div>
                                </div>
                            </button>

                            <button
                                className="w-full flex items-center gap-3 p-4 rounded-lg bg-linear-to-r from-purple-50 to-pink-50 border border-purple-200 hover:border-purple-300 smooth-transition text-left"
                            >
                                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <div>
                                    <div className="font-semibold text-purple-900">Edit Profile</div>
                                    <div className="text-xs text-purple-700">Update your information</div>
                                </div>
                            </button>
                        </div>

                        {/* Rating Section */}
                        {stats.reviewCount > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Rating</h3>
                                <div className="flex items-center justify-center">
                                    <RatingBadge rating={stats.averageRating} reviewCount={stats.reviewCount} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Coming Soon Banner */}
                <div className="glass-white rounded-2xl p-6 bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="text-5xl">📈</div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Analytics Coming Soon</h3>
                            <p className="text-sm text-gray-700">
                                Detailed charts, earnings reports, and performance insights will be available soon.
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Learn More
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
