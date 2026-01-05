import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
    onClose?: () => void;
    className?: string;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

export function ReactionPicker({ onSelect, className }: ReactionPickerProps) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={cn(
                "absolute -top-12 z-50 flex items-center gap-1 p-2 bg-white rounded-full shadow-lg border border-gray-100",
                className
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {REACTION_EMOJIS.map((emoji) => (
                <button
                    key={emoji}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(emoji);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-xl leading-none"
                >
                    {emoji}
                </button>
            ))}
        </motion.div>
    );
}
