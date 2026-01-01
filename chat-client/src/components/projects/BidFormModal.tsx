import { useState } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { graphqlFetch } from '../../services/graphql.service';

interface Project {
    id: string;
    title: string;
    budget: number;
}

interface BidFormModalProps {
    project: Project;
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function BidFormModal({ project, userId, onClose, onSuccess }: BidFormModalProps) {
    const [formData, setFormData] = useState({
        amount: '',
        timeline: '',
        proposal: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Please enter a valid bid amount';
        } else if (parseFloat(formData.amount) > project.budget * 1.5) {
            newErrors.amount = 'Bid amount is significantly higher than project budget';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            const data = await graphqlFetch<
                { createBid: { id: string } },
                { data: { amount: number; status: string; user_id: string; project_id: string } }
            >(
                `mutation ($data: BidInput!) { createBid(data: $data) { id } }`,
                {
                    data: {
                        amount: parseInt(formData.amount, 10),
                        status: 'PENDING',
                        user_id: userId,
                        project_id: project.id,
                    },
                }
            );

            if (!data.createBid?.id) throw new Error('Failed to submit bid');

            onSuccess();
        } catch (error: any) {
            setErrors({ submit: error.message || 'Failed to submit bid. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatBudget = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Submit Your Bid"
            size="lg"
        >
            <div className="space-y-6">
                {/* Project Info */}
                <div className="bg-linear-to-r from-primary/10 to-primary-dark/10 rounded-xl p-5 border border-primary/20">
                    <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                    <p className="text-sm text-gray-600">
                        Project Budget: <span className="font-semibold text-primary">{formatBudget(project.budget)}</span>
                    </p>
                </div>

                {/* Bid Amount */}
                <Input
                    label="Your Bid Amount (USD)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder={project.budget.toString()}
                    error={errors.amount}
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />

                {formData.amount && parseFloat(formData.amount) > 0 && (
                    <div className="text-sm text-gray-600 -mt-4 ml-1">
                        {parseFloat(formData.amount) < project.budget ? (
                            <span className="text-green-600">✓ Below project budget</span>
                        ) : parseFloat(formData.amount) === project.budget ? (
                            <span className="text-blue-600">• Matches project budget</span>
                        ) : (
                            <span className="text-orange-600">⚠ Above project budget</span>
                        )}
                    </div>
                )}

                {/* Proposed Timeline */}
                <Input
                    label="Proposed Timeline"
                    type="text"
                    value={formData.timeline}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                    placeholder="e.g., 2 weeks, 1 month, 10 days"
                    error={errors.timeline}
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />

                {/* Proposal */}
                <Textarea
                    label="Proposal / Cover Letter"
                    value={formData.proposal}
                    onChange={(e) => setFormData(prev => ({ ...prev, proposal: e.target.value }))}
                    placeholder="Explain why you're the best fit for this project. Include your relevant experience, approach, and any questions you have..."
                    rows={8}
                    error={errors.proposal}
                />

                <div className="text-sm text-gray-500">
                    {formData.proposal.length}/500 characters
                    {formData.proposal.length < 50 && formData.proposal.length > 0 && (
                        <span className="text-orange-600 ml-2">
                            (Minimum 50 characters recommended)
                        </span>
                    )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {errors.submit}
                    </div>
                )}

                {/* Success Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for a Winning Bid:</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Be specific about your approach and methodology</li>
                        <li>Highlight relevant past experience</li>
                        <li>Be realistic with timeline and budget</li>
                        <li>Ask clarifying questions if needed</li>
                    </ul>
                </div>

                {/* Footer */}
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        }
                    >
                        Submit Bid
                    </Button>
                </ModalFooter>
            </div>
        </Modal>
    );
}
