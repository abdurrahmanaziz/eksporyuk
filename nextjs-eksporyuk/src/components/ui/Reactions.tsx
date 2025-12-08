'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Heart, ThumbsUp, Smile, Angry, Frown, Eye } from 'lucide-react';

export type ReactionType = 'LIKE' | 'LOVE' | 'CARE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

interface ReactionConfig {
  type: ReactionType;
  icon: React.ReactNode;
  label: string;
  color: string;
  emoji: string;
}

const reactionConfigs: ReactionConfig[] = [
  {
    type: 'LIKE',
    icon: <ThumbsUp size={20} />,
    label: 'Like',
    color: 'text-blue-500',
    emoji: '👍',
  },
  {
    type: 'LOVE',
    icon: <Heart size={20} />,
    label: 'Love',
    color: 'text-red-500',
    emoji: '❤️',
  },
  {
    type: 'CARE',
    icon: <span className="text-lg">🤗</span>,
    label: 'Care',
    color: 'text-yellow-500',
    emoji: '🤗',
  },
  {
    type: 'HAHA',
    icon: <Smile size={20} />,
    label: 'Haha',
    color: 'text-yellow-500',
    emoji: '😂',
  },
  {
    type: 'WOW',
    icon: <Eye size={20} />,
    label: 'Wow',
    color: 'text-purple-500',
    emoji: '😮',
  },
  {
    type: 'SAD',
    icon: <Frown size={20} />,
    label: 'Sad',
    color: 'text-blue-400',
    emoji: '😢',
  },
  {
    type: 'ANGRY',
    icon: <Angry size={20} />,
    label: 'Angry',
    color: 'text-red-600',
    emoji: '😠',
  },
];

interface ReactionPickerProps {
  onReact: (type: ReactionType) => void;
  currentUserReaction?: ReactionType | null;
  disabled?: boolean;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onReact,
  currentUserReaction,
  disabled = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReactionClick = (type: ReactionType) => {
    onReact(type);
    setShowPicker(false);
  };

  const currentReactionConfig = currentUserReaction
    ? reactionConfigs.find(config => config.type === currentUserReaction)
    : null;

  return (
    <div className="relative" ref={pickerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        onMouseEnter={() => setShowPicker(true)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
          currentUserReaction
            ? `${currentReactionConfig?.color} bg-gray-50 dark:bg-gray-800`
            : 'text-gray-500 hover:text-blue-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {currentReactionConfig ? (
          <>
            <span className="text-lg">{currentReactionConfig.emoji}</span>
            <span className="text-sm font-medium">{currentReactionConfig.label}</span>
          </>
        ) : (
          <>
            <ThumbsUp size={16} />
            <span className="text-sm">Like</span>
          </>
        )}
      </button>

      {/* Reaction Picker */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50">
          <div className="flex items-center gap-1">
            {reactionConfigs.map((config) => (
              <button
                key={config.type}
                onClick={() => handleReactionClick(config.type)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-125"
                title={config.label}
              >
                <span className="text-lg">{config.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ReactionSummaryProps {
  reactionsCount: Record<string, number>;
  onViewReactions?: () => void;
  className?: string;
}

export const ReactionSummary: React.FC<ReactionSummaryProps> = ({
  reactionsCount,
  onViewReactions,
  className = '',
}) => {
  const totalReactions = Object.values(reactionsCount).reduce((sum, count) => sum + count, 0);
  
  if (totalReactions === 0) return null;

  // Get top 3 reaction types by count
  const sortedReactions = Object.entries(reactionsCount)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <button
      onClick={onViewReactions}
      className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors ${className}`}
    >
      <div className="flex items-center -space-x-1">
        {sortedReactions.map(([type]) => {
          const config = reactionConfigs.find(c => c.type === type);
          return (
            <span
              key={type}
              className="bg-white dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700"
              title={config?.label}
            >
              <span className="text-xs">{config?.emoji}</span>
            </span>
          );
        })}
      </div>
      <span>
        {totalReactions === 1 ? '1 reaction' : `${totalReactions} reactions`}
      </span>
    </button>
  );
};

interface ReactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactions: Array<{
    id: string;
    type: ReactionType;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    createdAt: string;
  }>;
  reactionsCount: Record<string, number>;
}

export const ReactionModal: React.FC<ReactionModalProps> = ({
  isOpen,
  onClose,
  reactions,
  reactionsCount,
}) => {
  const [selectedType, setSelectedType] = useState<ReactionType | 'ALL'>('ALL');

  if (!isOpen) return null;

  const filteredReactions = selectedType === 'ALL' 
    ? reactions 
    : reactions.filter(r => r.type === selectedType);

  const totalCount = Object.values(reactionsCount).reduce((sum, count) => sum + count, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Reactions</h3>
        </div>
        
        {/* Reaction Type Tabs */}
        <div className="flex items-center gap-1 p-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedType === 'ALL'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All
            <span className="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full text-xs">
              {totalCount}
            </span>
          </button>
          
          {reactionConfigs.map((config) => {
            const count = reactionsCount[config.type] || 0;
            if (count === 0) return null;
            
            return (
              <button
                key={config.type}
                onClick={() => setSelectedType(config.type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedType === config.type
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-base">{config.emoji}</span>
                <span className="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Reactions List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredReactions.length > 0 ? (
            <div className="p-3 space-y-3">
              {filteredReactions.map((reaction) => {
                const config = reactionConfigs.find(c => c.type === reaction.type);
                
                return (
                  <div key={reaction.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {reaction.user.avatar ? (
                        <img
                          src={reaction.user.avatar}
                          alt={reaction.user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {reaction.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <span className="font-medium text-sm">{reaction.user.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config?.emoji}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(reaction.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No reactions yet
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export { reactionConfigs };