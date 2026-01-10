'use client';

import React, { useState } from 'react';
import { X, Plus, BarChart3, Calendar, Users } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface PollData {
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  allowAnonymous: boolean;
  endDate?: Date;
  maxVoters?: number;
}

interface PollCreatorProps {
  onCreatePoll: (pollData: PollData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const PollCreator: React.FC<PollCreatorProps> = ({
  onCreatePoll,
  onCancel,
  isOpen,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    { id: '1', text: '', votes: 0, voters: [] },
    { id: '2', text: '', votes: 0, voters: [] },
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [endDate, setEndDate] = useState<string>('');
  const [maxVoters, setMaxVoters] = useState<string>('');

  if (!isOpen) return null;

  const addOption = () => {
    if (options.length < 10) {
      setOptions([
        ...options,
        { id: Date.now().toString(), text: '', votes: 0, voters: [] },
      ]);
    }
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const handleSubmit = () => {
    if (!question.trim() || options.some(opt => !opt.text.trim())) {
      return;
    }

    const pollData: PollData = {
      question: question.trim(),
      options: options.filter(opt => opt.text.trim()),
      allowMultiple,
      allowAnonymous,
      endDate: endDate ? new Date(endDate) : undefined,
      maxVoters: maxVoters ? parseInt(maxVoters) : undefined,
    };

    onCreatePoll(pollData);
    
    // Reset form
    setQuestion('');
    setOptions([
      { id: '1', text: '', votes: 0, voters: [] },
      { id: '2', text: '', votes: 0, voters: [] },
    ]);
    setAllowMultiple(false);
    setAllowAnonymous(false);
    setEndDate('');
    setMaxVoters('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold">Create Poll</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Poll Question *
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700"
              rows={3}
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Options *
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(option.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              
              {options.length < 10 && (
                <button
                  onClick={addOption}
                  className="flex items-center gap-2 px-3 py-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add Option
                </button>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium mb-4">Poll Settings</h3>
            
            <div className="space-y-4">
              {/* Multiple Choice */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allow Multiple Choices
                  </label>
                  <p className="text-xs text-gray-500">Let people select more than one option</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMultiple}
                    onChange={(e) => setAllowMultiple(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Anonymous Voting */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Anonymous Voting
                  </label>
                  <p className="text-xs text-gray-500">Hide who voted for what</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAnonymous}
                    onChange={(e) => setAllowAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* End Date */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Date
                  </label>
                </div>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm"
                />
              </div>

              {/* Max Voters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-500" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Voters
                  </label>
                </div>
                <input
                  type="number"
                  value={maxVoters}
                  onChange={(e) => setMaxVoters(e.target.value)}
                  placeholder="No limit"
                  min="1"
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!question.trim() || options.some(opt => !opt.text.trim())}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Create Poll
          </button>
        </div>
      </div>
    </div>
  );
};

interface PollVoteProps {
  poll: PollData & { id: string; totalVotes: number; userVotes: string[] };
  onVote: (optionIds: string[]) => void;
  currentUserId: string;
  showResults?: boolean;
}

export const PollVote: React.FC<PollVoteProps> = ({
  poll,
  onVote,
  currentUserId,
  showResults = false,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(poll.userVotes.length > 0);

  const handleOptionClick = (optionId: string) => {
    if (hasVoted || (poll.endDate && new Date() > poll.endDate)) return;

    if (poll.allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length > 0) {
      onVote(selectedOptions);
      setHasVoted(true);
    }
  };

  const isEnded = poll.endDate && new Date() > poll.endDate;
  const isMaxReached = poll.maxVoters && poll.totalVotes >= poll.maxVoters;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
      <div className="flex items-start gap-3">
        <BarChart3 className="text-blue-500 flex-shrink-0 mt-1" size={20} />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{poll.question}</h3>
          
          <div className="mt-3 space-y-2">
            {poll.options.map((option) => {
              const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
              const isSelected = selectedOptions.includes(option.id);
              const hasUserVoted = poll.userVotes.includes(option.id);

              return (
                <div key={option.id} className="space-y-1">
                  <button
                    onClick={() => handleOptionClick(option.id)}
                    disabled={hasVoted || isEnded || isMaxReached}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      hasVoted || showResults
                        ? 'cursor-default'
                        : 'hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer'
                    } ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : hasUserVoted
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected || hasUserVoted
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-500'
                        }`}>
                          {(isSelected || hasUserVoted) && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-sm">{option.text}</span>
                      </div>
                      
                      {(hasVoted || showResults) && (
                        <span className="text-sm text-gray-500">
                          {option.votes} ({percentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    
                    {(hasVoted || showResults) && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              hasUserVoted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {!hasVoted && !isEnded && !isMaxReached && selectedOptions.length > 0 && (
            <button
              onClick={handleVote}
              className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
            >
              Vote
            </button>
          )}

          {/* Poll Info */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>{poll.totalVotes} votes</span>
            <div className="flex items-center gap-3">
              {poll.endDate && (
                <span className={isEnded ? 'text-red-500' : ''}>
                  {isEnded ? 'Ended' : 'Ends'} {poll.endDate.toLocaleDateString()}
                </span>
              )}
              {poll.maxVoters && (
                <span className={isMaxReached ? 'text-red-500' : ''}>
                  {poll.totalVotes}/{poll.maxVoters} voters
                </span>
              )}
              {poll.allowMultiple && <span>Multiple choice</span>}
              {poll.allowAnonymous && <span>Anonymous</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};