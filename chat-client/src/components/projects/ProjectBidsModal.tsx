import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useEffect, useState } from 'react';
import { graphqlFetch } from '../../services/graphql.service';
import { FreelancerProfileModal } from './FreelancerProfileModal';

interface Bid {
    id: string;
    amount: number;
    status: string;
    user_id: string;
    project_id: string;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

interface BidCardProps {
    bid: Bid;
    onAccept: (bidId: string) => void;
    onReject: (bidId: string) => void;
    isProcessing: boolean;
    onViewProfile: (userId: string) => void;
}

function BidCard({ bid, onAccept, onReject, isProcessing, onViewProfile }: BidCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'ACCEPTED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'PENDING':
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-5 md:p-6 hover:border-primary/30 smooth-transition">
            <div className="flex items-start justify-between gap-4 mb-4">
                {/* Freelancer Info - Clickable */}
                <button
                    onClick={() => onViewProfile(bid.user_id)}
                    className="flex items-center gap-3 hover:opacity-80 smooth-transition text-left"
                >
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-linear-to-r from-primary to-primary-dark flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {bid.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-base md:text-lg hover:text-primary smooth-transition">
                            {bid.user?.name || 'Anonymous User'}
                        </h3>
                        <p className="text-sm text-gray-500">{bid.user?.email}</p>
                        <p className="text-xs text-primary font-medium mt-0.5">View Profile →</p>
                    </div>
                </button>

                {/* Status Badge */}
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(bid.status)}`}>
                    {bid.status.toUpperCase()}
                </span>
            </div>

            {/* Bid Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <div className="text-sm text-green-700 font-medium mb-1">Bid Amount</div>
                    <div className="text-2xl font-bold text-green-900">{formatCurrency(bid.amount)}</div>
                </div>

                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-blue-700 font-medium mb-1">Submitted</div>
                    <div className="text-base font-semibold text-blue-900">{formatDate(bid.createdAt)}</div>
                </div>
            </div>

            {/* Actions */}
            {bid.status.toUpperCase() === 'PENDING' && (
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        size="md"
                        onClick={() => onReject(bid.id)}
                        disabled={isProcessing}
                        className="flex-1 min-h-11"
                    >
                        Reject
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => onAccept(bid.id)}
                        isLoading={isProcessing}
                        className="flex-1 min-h-11"
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        }
                    >
                        Accept Bid
                    </Button>
                </div>
            )}
        </div>
    );
}

interface ProjectBidsModalProps {
    projectId: string;
    projectTitle: string;
    onClose: () => void;
    onBidAccepted: () => void;
}

export function ProjectBidsModal({ projectId, projectTitle, onClose, onBidAccepted }: ProjectBidsModalProps) {
    const [bids, setBids] = useState<Bid[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingBidId, setProcessingBidId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
    const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | null>(null);

    const loadBids = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await graphqlFetch<{ bidsByProjectId: Bid[] }, { project_id: string }>(
                `query ($project_id: ID!) {
                    bidsByProjectId(project_id: $project_id) {
                        id
                        amount
                        status
                        user_id
                        project_id
                        createdAt
                        user {
                            id
                            name
                            email
                        }
                    }
                }`,
                { project_id: projectId }
            );

            setBids(data.bidsByProjectId || []);
        } catch (err) {
            setError('Failed to load bids. Please try again.');
            console.error('Error loading bids:', err);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        loadBids();
    }, []);


    const handleAcceptBid = async (bidId: string) => {
        setProcessingBidId(bidId);
        setError('');

        try {
            await graphqlFetch<{ updateBid: { id: string } }, { id: string; data: { status: string } }>(
                `mutation ($id: ID!, $data: BidUpdateInput!) {
                    updateBid(id: $id, data: $data) {
                        id
                        status
                    }
                }`,
                { id: bidId, data: { status: 'ACCEPTED' } }
            );

            // Reject all other pending bids
            const otherBids = bids.filter(b => b.id !== bidId && b.status.toUpperCase() === 'PENDING');
            await Promise.all(
                otherBids.map(bid =>
                    graphqlFetch(
                        `mutation ($id: ID!, $data: BidUpdateInput!) { updateBid(id: $id, data: $data) { id } }`,
                        { id: bid.id, data: { status: 'REJECTED' } }
                    )
                )
            );

            onBidAccepted();
            await loadBids();
        } catch (err) {
            setError('Failed to accept bid. Please try again.');
            console.error('Error accepting bid:', err);
        } finally {
            setProcessingBidId(null);
        }
    };

    const handleRejectBid = async (bidId: string) => {
        setProcessingBidId(bidId);
        setError('');

        try {
            await graphqlFetch<{ updateBid: { id: string } }, { id: string; data: { status: string } }>(
                `mutation ($id: ID!, $data: BidUpdateInput!) {
                    updateBid(id: $id, data: $data) {
                        id
                        status
                    }
                }`,
                { id: bidId, data: { status: 'REJECTED' } }
            );

            await loadBids();
        } catch (err) {
            setError('Failed to reject bid. Please try again.');
            console.error('Error rejecting bid:', err);
        } finally {
            setProcessingBidId(null);
        }
    };

    const sortedBids = [...bids].sort((a, b) => {
        if (sortBy === 'amount') {
            return a.amount - b.amount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const stats = {
        total: bids.length,
        pending: bids.filter(b => b.status.toUpperCase() === 'PENDING').length,
        accepted: bids.filter(b => b.status.toUpperCase() === 'ACCEPTED').length,
        avgBid: bids.length > 0 ? bids.reduce((sum, b) => sum + b.amount, 0) / bids.length : 0,
        lowestBid: bids.length > 0 ? Math.min(...bids.map(b => b.amount)) : 0,
        highestBid: bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : 0,
    };

    return (
        <>
            <Modal isOpen={true} onClose={onClose} title={`Bids for "${projectTitle}"`} size="xl">
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-3 md:p-4 border border-blue-200">
                            <div className="text-xs md:text-sm text-blue-700 font-medium mb-1">Total Bids</div>
                            <div className="text-xl md:text-2xl font-bold text-blue-900">{stats.total}</div>
                        </div>
                        <div className="bg-linear-to-br from-yellow-50 to-amber-50 rounded-lg p-3 md:p-4 border border-yellow-200">
                            <div className="text-xs md:text-sm text-yellow-700 font-medium mb-1">Pending</div>
                            <div className="text-xl md:text-2xl font-bold text-yellow-900">{stats.pending}</div>
                        </div>
                        <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg p-3 md:p-4 border border-green-200">
                            <div className="text-xs md:text-sm text-green-700 font-medium mb-1">Avg. Bid</div>
                            <div className="text-lg md:text-xl font-bold text-green-900">
                                ${Math.round(stats.avgBid).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-3 md:p-4 border border-purple-200">
                            <div className="text-xs md:text-sm text-purple-700 font-medium mb-1">Range</div>
                            <div className="text-sm md:text-base font-semibold text-purple-900">
                                ${Math.round(stats.lowestBid).toLocaleString()} - ${Math.round(stats.highestBid).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Sort Controls */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900">
                            All Bids ({bids.length})
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSortBy('date')}
                                className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg smooth-transition ${sortBy === 'date'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Latest First
                            </button>
                            <button
                                onClick={() => setSortBy('amount')}
                                className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg smooth-transition ${sortBy === 'amount'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Lowest Bid
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Bids List */}
                    <div className="space-y-4 max-h-96 md:max-h-125 overflow-y-auto pr-2">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-gray-600">Loading bids...</p>
                            </div>
                        ) : sortedBids.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl md:text-6xl mb-4">📭</div>
                                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">No Bids Yet</h3>
                                <p className="text-sm md:text-base text-gray-600">
                                    Freelancers haven't submitted any bids for this project yet.
                                </p>
                            </div>
                        ) : (
                            sortedBids.map(bid => (
                                <BidCard
                                    key={bid.id}
                                    bid={bid}
                                    onAccept={handleAcceptBid}
                                    onReject={handleRejectBid}
                                    isProcessing={processingBidId === bid.id}
                                    onViewProfile={setSelectedFreelancerId}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <ModalFooter>
                        <Button variant="ghost" onClick={onClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </div>
            </Modal>

            {/* Freelancer Profile Modal */}
            {selectedFreelancerId && (
                <FreelancerProfileModal
                    userId={selectedFreelancerId}
                    onClose={() => setSelectedFreelancerId(null)}
                />
            )}
        </>
    );
}
