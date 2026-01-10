'use client';

import React, { useState } from 'react';
import { X, Calendar, MapPin, Clock, Users, Link as LinkIcon } from 'lucide-react';

interface EventData {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  maxAttendees?: number;
  isOnline: boolean;
  meetingLink?: string;
  coverImage?: string;
  tags: string[];
}

interface EventCreatorProps {
  onCreateEvent: (eventData: EventData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const EventCreator: React.FC<EventCreatorProps> = ({
  onCreateEvent,
  onCancel,
  isOpen,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  if (!isOpen) return null;

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setCoverImage(result.url);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !startDate) {
      return;
    }

    const eventData: EventData = {
      title: title.trim(),
      description: description.trim(),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isOnline,
      location: !isOnline && (locationName || locationAddress) ? {
        name: locationName.trim(),
        address: locationAddress.trim(),
      } : undefined,
      meetingLink: isOnline && meetingLink.trim() ? meetingLink.trim() : undefined,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
      coverImage: coverImage || undefined,
      tags,
    };

    onCreateEvent(eventData);
    
    // Reset form
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setIsOnline(false);
    setLocationName('');
    setLocationAddress('');
    setMeetingLink('');
    setMaxAttendees('');
    setCoverImage('');
    setTags([]);
    setTagInput('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold">Create Event</h2>
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
          {/* Cover Image */}
          {coverImage && (
            <div className="relative">
              <img src={coverImage} alt="Event cover" className="w-full h-48 object-cover rounded-lg" />
              <button
                onClick={() => setCoverImage('')}
                className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {!coverImage && (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
                id="cover-upload"
              />
              <label htmlFor="cover-upload" className="cursor-pointer">
                <div className="text-gray-400 mb-2">
                  <Calendar size={48} className="mx-auto" />
                </div>
                <p className="text-sm text-gray-500">Click to upload cover image</p>
              </label>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your event..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700"
                rows={4}
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Event Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!isOnline}
                  onChange={() => setIsOnline(false)}
                  className="text-blue-500"
                />
                <MapPin size={16} className="text-gray-500" />
                <span className="text-sm">In-person</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isOnline}
                  onChange={() => setIsOnline(true)}
                  className="text-blue-500"
                />
                <LinkIcon size={16} className="text-gray-500" />
                <span className="text-sm">Online</span>
              </label>
            </div>
          </div>

          {/* Location or Meeting Link */}
          {isOnline ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Link
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Venue name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="Full address"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                />
              </div>
            </div>
          )}

          {/* Additional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Attendees
              </label>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-500" />
                <input
                  type="number"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  placeholder="No limit"
                  min="1"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-800 dark:hover:text-blue-400"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
            disabled={!title.trim() || !startDate}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

interface EventDisplayProps {
  event: EventData & { id: string; attendees: string[]; userAttending: boolean };
  onToggleAttendance: () => void;
  canEdit?: boolean;
  onEdit?: () => void;
}

export const EventDisplay: React.FC<EventDisplayProps> = ({
  event,
  onToggleAttendance,
  canEdit = false,
  onEdit,
}) => {
  const isUpcoming = new Date(event.startDate) > new Date();
  const isOngoing = event.endDate 
    ? new Date() >= new Date(event.startDate) && new Date() <= new Date(event.endDate)
    : new Date().toDateString() === new Date(event.startDate).toDateString();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = () => {
    if (isOngoing) {
      return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full text-xs font-medium">Live</span>;
    }
    if (isUpcoming) {
      return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-xs font-medium">Upcoming</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">Past</span>;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Cover Image */}
      {event.coverImage && (
        <img src={event.coverImage} alt={event.title} className="w-full h-48 object-cover" />
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-blue-500" size={20} />
              {getStatusBadge()}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {event.title}
            </h3>
          </div>
          {canEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">{event.description}</p>
        )}

        {/* Date & Time */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-gray-500" />
            <span>Starts: {formatDate(new Date(event.startDate))}</span>
          </div>
          {event.endDate && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-gray-500" />
              <span>Ends: {formatDate(new Date(event.endDate))}</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm mb-4">
          {event.isOnline ? (
            <>
              <LinkIcon size={16} className="text-gray-500" />
              <span>Online Event</span>
              {event.meetingLink && (
                <a
                  href={event.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 underline ml-2"
                >
                  Join Meeting
                </a>
              )}
            </>
          ) : (
            <>
              <MapPin size={16} className="text-gray-500" />
              <div>
                {event.location?.name && <div className="font-medium">{event.location.name}</div>}
                {event.location?.address && (
                  <div className="text-gray-500">{event.location.address}</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Attendees */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={16} />
            <span>
              {event.attendees.length} attending
              {event.maxAttendees && ` / ${event.maxAttendees} max`}
            </span>
          </div>

          {isUpcoming && (
            <button
              onClick={onToggleAttendance}
              disabled={!event.userAttending && event.maxAttendees && event.attendees.length >= event.maxAttendees}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                event.userAttending
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {event.userAttending ? 'Not Going' : 'Attend'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};