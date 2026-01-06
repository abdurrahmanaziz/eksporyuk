'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image,
  Video,
  FileText,
  Link,
  Smile,
  AtSign,
  Hash,
  MapPin,
  BarChart3,
  Quote,
  Send,
  MoreHorizontal,
  Palette,
  X,
} from 'lucide-react';
import { POST_BACKGROUNDS, BACKGROUND_CATEGORIES, PostBackground, getBackgroundById, getRandomBackground } from '@/lib/post-backgrounds';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (content: any) => void;
  onSave?: (content: any) => void;
  placeholder?: string;
  allowScheduling?: boolean;
  allowPolls?: boolean;
  allowEvents?: boolean;
  allowMedia?: boolean;
  allowMentions?: boolean;
  allowHashtags?: boolean;
  allowBackground?: boolean;
  initialContent?: any;
  groupSlug?: string;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  submitButtonDisabled?: boolean;
  toolbarPosition?: 'top' | 'bottom';
  userAvatar?: string;
  userName?: string;
}

interface PostContent {
  text: string;
  contentFormatted: any;
  images: string[];
  videos: string[];
  documents: string[];
  linkPreview?: any;
  taggedUsers: string[];
  pollData?: any;
  eventData?: any;
  location?: any;
  quoteStyle?: string;
  scheduledAt?: Date;
  backgroundId?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  onSubmit,
  onSave,
  placeholder = "What's on your mind?",
  allowScheduling = true,
  allowPolls = true,
  allowEvents = true,
  allowMedia = true,
  allowMentions = true,
  allowHashtags = true,
  allowBackground = true,
  initialContent,
  groupSlug,
  showSubmitButton = false,
  submitButtonText = 'Post',
  submitButtonDisabled = false,
  toolbarPosition = 'bottom',
  userAvatar,
  userName,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState<PostContent>({
    text: value || '',
    contentFormatted: null,
    images: [],
    videos: [],
    documents: [],
    taggedUsers: [],
    backgroundId: undefined,
  });

  // Background selector state
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<PostBackground | null>(null);
  const [activeBackgroundCategory, setActiveBackgroundCategory] = useState<string>('export');

  const [activeTools, setActiveTools] = useState<Set<string>>(new Set());
  const [showToolbar, setShowToolbar] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [linkPreviewUrl, setLinkPreviewUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);
  const [giphySearchTerm, setGiphySearchTerm] = useState('');
  const [giphyResults, setGiphyResults] = useState<any[]>([]);
  const [giphyLoading, setGiphyLoading] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);

  // Initialize with initial content (for edit mode)
  useEffect(() => {
    if (initialContent) {
      setContent(prev => ({
        ...prev,
        text: typeof initialContent === 'string' ? initialContent : initialContent.text || '',
        images: initialContent.images || [],
        videos: initialContent.videos || [],
        documents: initialContent.documents || [],
        contentFormatted: initialContent.contentFormatted || null,
      }));
      
      if (editorRef.current) {
        const textContent = typeof initialContent === 'string' ? initialContent : initialContent.text || '';
        editorRef.current.innerHTML = textContent;
      }
    }
  }, [initialContent]);

  // Update content when value prop changes (controlled component)
  useEffect(() => {
    if (value !== undefined && value !== content.text) {
      setContent(prev => ({ ...prev, text: value }));
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  // Notify parent of content changes
  const handleContentChange = (newText: string) => {
    setContent(prev => ({ ...prev, text: newText }));
    if (onChange) {
      onChange(newText);
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
      if (showGiphyPicker && !target.closest('.giphy-picker-container')) {
        setShowGiphyPicker(false);
      }
      if (showMentionPicker && !target.closest('.mention-picker-container')) {
        setShowMentionPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showGiphyPicker, showMentionPicker]);

  // Format commands
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateActiveTools();
  }, []);

  const updateActiveTools = useCallback(() => {
    const tools = new Set<string>();
    
    if (document.queryCommandState('bold')) tools.add('bold');
    if (document.queryCommandState('italic')) tools.add('italic');
    if (document.queryCommandState('underline')) tools.add('underline');
    if (document.queryCommandState('insertOrderedList')) tools.add('orderedList');
    if (document.queryCommandState('insertUnorderedList')) tools.add('unorderedList');
    
    setActiveTools(tools);
  }, []);

  // Handle text input
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || '';
      const html = editorRef.current.innerHTML;
      
      handleContentChange(text);
      
      // Auto-assign random background when user starts typing (no media)
      if (allowBackground && text.trim().length > 0 && !selectedBackground && content.images.length === 0 && content.videos.length === 0) {
        const randomBg = getRandomBackground();
        setSelectedBackground(randomBg);
        setContent(prev => ({
          ...prev,
          backgroundId: randomBg.id
        }));
      }
      
      // Clear background if text is empty
      if (text.trim().length === 0 && selectedBackground) {
        setSelectedBackground(null);
        setContent(prev => ({
          ...prev,
          backgroundId: undefined
        }));
      }
      
      // Extract tagged users from mention elements
      const mentionElements = editorRef.current.querySelectorAll('.mention-tag');
      const taggedUserIds = Array.from(mentionElements).map(el => 
        el.getAttribute('data-user-id')
      ).filter(Boolean) as string[];
      
      setContent(prev => ({
        ...prev,
        text,
        contentFormatted: { html },
        taggedUsers: taggedUserIds,
      }));
      
      // Detect @ for mention
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textBeforeCursor = range.startContainer.textContent?.slice(0, range.startOffset) || '';
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        
        if (lastAtIndex !== -1) {
          // Check if @ is at start or has space before it
          const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
          if (charBeforeAt === ' ' || lastAtIndex === 0) {
            const searchQuery = textBeforeCursor.slice(lastAtIndex + 1);
            // Show mention picker and search
            setShowMentionPicker(true);
            setMentionSearchTerm(searchQuery);
            searchUsers(searchQuery);
          }
        } else {
          // No @ found, hide mention picker
          if (showMentionPicker) {
            setShowMentionPicker(false);
            setMentionSearchTerm('');
          }
        }
      }
      
      // Auto-detect links for preview
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = text.match(urlRegex);
      if (urls && urls.length > 0 && !content.linkPreview) {
        fetchLinkPreview(urls[0]);
      }
      
      updateActiveTools();
    }
  }, [content.linkPreview, content.images.length, content.videos.length, handleContentChange, updateActiveTools, showMentionPicker, allowBackground, selectedBackground]);

  // Handle file upload
  const handleFileUpload = async (files: FileList, type: 'image' | 'video' | 'document') => {
    if (!files.length) return;
    
    setIsUploading(true);
    console.log('[RichTextEditor] Starting upload for', files.length, type, 'files');
    
    try {
      const uploads = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        console.log('[RichTextEditor] Uploading file:', file.name, file.size, file.type);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('[RichTextEditor] Upload success:', result.url);
          uploads.push(result.url);
        } else {
          const error = await response.json();
          console.error('[RichTextEditor] Upload failed:', error);
        }
      }
      
      if (uploads.length > 0) {
        setContent(prev => {
          const key = type === 'image' ? 'images' : type === 'video' ? 'videos' : 'documents';
          const newContent = {
            ...prev,
            [key]: [...prev[key], ...uploads],
          };
          console.log('[RichTextEditor] Updated content with uploads:', key, newContent[key]);
          return newContent;
        });
      }
    } catch (error) {
      console.error('[RichTextEditor] Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch link preview
  const fetchLinkPreview = async (url: string) => {
    try {
      const response = await fetch('/api/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setContent(prev => ({
          ...prev,
          linkPreview: result.preview,
        }));
      }
    } catch (error) {
      console.error('Link preview failed:', error);
    }
  };

  // Handle emoji selection
  const handleEmojiClick = useCallback((emojiData: any) => {
    if (editorRef.current) {
      const emoji = emojiData.emoji;
      const selection = window.getSelection();
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          const textNode = document.createTextNode(emoji);
          range.deleteContents();
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          editorRef.current.appendChild(document.createTextNode(emoji));
        }
      } else {
        editorRef.current.appendChild(document.createTextNode(emoji));
      }
      
      handleInput();
      setShowEmojiPicker(false);
    }
  }, []);

  // Handle Giphy search
  const searchGiphy = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setGiphyResults([]);
      return;
    }

    setGiphyLoading(true);
    try {
      const response = await fetch('/api/giphy/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm, limit: 20 }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setGiphyResults(result.data || []);
      }
    } catch (error) {
      console.error('Giphy search failed:', error);
    } finally {
      setGiphyLoading(false);
    }
  };

  // Handle User Mention search
  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setMentionResults([]);
      return;
    }

    setMentionLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}&limit=10`);
      
      if (response.ok) {
        const result = await response.json();
        setMentionResults(result.users || []);
      }
    } catch (error) {
      console.error('User search failed:', error);
    } finally {
      setMentionLoading(false);
    }
  };

  // Handle User selection for mention
  const handleUserMention = useCallback((user: any) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Find and remove the @ and search term
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
          const textBeforeCursor = textNode.textContent.slice(0, range.startOffset);
          const lastAtIndex = textBeforeCursor.lastIndexOf('@');
          
          if (lastAtIndex !== -1) {
            // Create new range to select from @ to cursor
            const deleteRange = document.createRange();
            deleteRange.setStart(textNode, lastAtIndex);
            deleteRange.setEnd(textNode, range.startOffset);
            deleteRange.deleteContents();
            
            // Create mention element
            const mentionElement = document.createElement('span');
            mentionElement.contentEditable = 'false';
            mentionElement.className = 'mention-tag bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1 rounded';
            mentionElement.setAttribute('data-user-id', user.id);
            mentionElement.setAttribute('data-user-name', user.name);
            mentionElement.textContent = `@${user.name}`;
            
            // Insert mention and space
            const spaceNode = document.createTextNode(' ');
            deleteRange.insertNode(spaceNode);
            deleteRange.insertNode(mentionElement);
            
            // Move cursor after space
            deleteRange.setStartAfter(spaceNode);
            deleteRange.setEndAfter(spaceNode);
            selection.removeAllRanges();
            selection.addRange(deleteRange);
          }
        }
      }
      
      // Update content
      handleInput();
      setShowMentionPicker(false);
      setMentionSearchTerm('');
      setMentionResults([]);
      
      // Focus back to editor
      editorRef.current.focus();
    }
  }, [handleInput]);

  // Handle GIF selection
  const handleGifSelect = useCallback((gif: any) => {
    const gifUrl = gif.images.fixed_height.url;
    setContent(prev => ({
      ...prev,
      images: [...prev.images, gifUrl],
    }));
    setShowGiphyPicker(false);
    setGiphySearchTerm('');
    setGiphyResults([]);
  }, []);

  // Handle mentions and hashtags
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '@' && allowMentions) {
      // Show mention picker
      // Implementation for mention picker
    }
    
    if (e.key === '#' && allowHashtags) {
      // Handle hashtags
      // Implementation for hashtag handling
    }
    
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  }, [allowMentions, allowHashtags]);

  // Handle background selection
  const handleSelectBackground = (background: PostBackground | null) => {
    setSelectedBackground(background);
    setContent(prev => ({
      ...prev,
      backgroundId: background?.id || undefined
    }));
    setShowBackgroundPicker(false);
  };

  // Disable background when media is added
  useEffect(() => {
    if (content.images.length > 0 || content.videos.length > 0) {
      setSelectedBackground(null);
      setContent(prev => ({ ...prev, backgroundId: undefined }));
    }
  }, [content.images, content.videos]);

  const handleSubmit = () => {
    console.log('[RichTextEditor] handleSubmit called with content:', {
      text: content.text,
      images: content.images,
      videos: content.videos,
      documents: content.documents,
      backgroundId: selectedBackground?.id
    });
    
    if (content.text.trim() || content.images.length || content.videos.length || content.documents.length) {
      if (onSubmit) {
        const submitData = {
          ...content,
          backgroundId: selectedBackground?.id || undefined,
        };
        console.log('[RichTextEditor] Calling onSubmit with:', submitData);
        onSubmit(submitData);
      }
      
      // Reset content
      setContent({
        text: '',
        contentFormatted: null,
        images: [],
        videos: [],
        documents: [],
        taggedUsers: [],
        backgroundId: undefined,
      });
      setSelectedBackground(null);
      
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  };

  return (
    <div className="w-full max-w-full">
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #cbd5e1;
          pointer-events: none;
        }
        .mention-tag {
          display: inline-block;
          padding: 0 4px;
          border-radius: 4px;
          user-select: all;
          cursor: pointer;
        }
        .mention-tag:hover {
          opacity: 0.8;
        }
      `}</style>
      
      {/* Editor Content Area with Avatar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        {/* Avatar + Editor Area */}
        <div className={`flex gap-3 p-4 pb-2 ${
          selectedBackground && content.images.length === 0 && content.videos.length === 0 
            ? 'flex-col items-center' 
            : 'items-start'
        }`}>
          {userAvatar && !(selectedBackground && content.images.length === 0 && content.videos.length === 0) && (
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={userAvatar} alt={userName || 'User'} />
              <AvatarFallback className="bg-blue-500 text-white text-base">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          <div className={`relative ${
            selectedBackground && content.images.length === 0 && content.videos.length === 0 
              ? 'w-full' 
              : 'flex-1'
          }`}>
            {/* Background Preview Layer - Full width card style like Facebook */}
            {selectedBackground && content.images.length === 0 && content.videos.length === 0 && (
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  ...selectedBackground.style,
                  zIndex: 0,
                  margin: '-16px',
                  padding: '16px',
                }}
              />
            )}
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              className={`focus:outline-none leading-relaxed relative z-10 ${
                selectedBackground && content.images.length === 0 && content.videos.length === 0
                  ? 'min-h-[180px] flex items-center justify-center text-center font-bold text-xl p-6'
                  : 'min-h-[60px] text-[15px] text-gray-900 dark:text-gray-100'
              }`}
              style={{
                whiteSpace: 'pre-wrap',
                color: selectedBackground && content.images.length === 0 && content.videos.length === 0
                  ? selectedBackground.textColor
                  : undefined,
              }}
              suppressContentEditableWarning={true}
              data-placeholder={placeholder}
            />
          </div>
        </div>
        
        {/* Bottom Toolbar */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 px-3 sm:px-4 pb-2 sm:pb-3 pt-1 border-t border-gray-100 dark:border-gray-700">
          {allowMedia && (
            <>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) handleFileUpload(files, 'image');
                  };
                  input.click();
                }}
                className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Upload Image"
                disabled={isUploading}
              >
                <Image size={18} className="sm:w-5 sm:h-5 text-gray-400" />
              </button>
              
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'video/*';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) handleFileUpload(files, 'video');
                  };
                  input.click();
                }}
                className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Upload Video"
                disabled={isUploading}
              >
                <Video size={18} className="sm:w-5 sm:h-5 text-gray-400" />
              </button>
              
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) handleFileUpload(files, 'document');
                  };
                  input.click();
                }}
                className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Upload Document (PDF, DOC, EXCEL, etc)"
                disabled={isUploading}
              >
                <FileText size={18} className="sm:w-5 sm:h-5 text-gray-400" />
              </button>
            </>
          )}
          
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            title="Add Emoji"
          >
            <Smile size={18} className="sm:w-5 sm:h-5 text-gray-400" />
          </button>
          
          <button
            onClick={() => setShowGiphyPicker(!showGiphyPicker)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Add GIF"
          >
            <span className="text-[9px] sm:text-[11px] font-bold text-gray-400 tracking-wide">GIF</span>
          </button>
          
          {/* Background Selector Button - Click to shuffle/change background */}
          {allowBackground && content.images.length === 0 && content.videos.length === 0 && (
            <button
              onClick={() => {
                if (selectedBackground && content.text.trim()) {
                  // If background exists, shuffle to new random background
                  const newBg = getRandomBackground();
                  setSelectedBackground(newBg);
                  setContent(prev => ({ ...prev, backgroundId: newBg.id }));
                } else {
                  // Show picker or toggle off
                  setShowBackgroundPicker(!showBackgroundPicker);
                }
              }}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                selectedBackground 
                  ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={selectedBackground ? "Ganti Background (Klik untuk shuffle)" : "Pilih Background"}
            >
              <Palette size={18} className={`sm:w-5 sm:h-5 ${selectedBackground ? 'text-indigo-600' : 'text-gray-400'}`} />
            </button>
          )}
          
          {/* Remove Background Button */}
          {allowBackground && selectedBackground && content.images.length === 0 && content.videos.length === 0 && (
            <button
              onClick={() => {
                setSelectedBackground(null);
                setContent(prev => ({ ...prev, backgroundId: undefined }));
              }}
              className="p-1.5 sm:p-2 rounded-md hover:bg-red-100 transition-colors"
              title="Hapus Background"
            >
              <X size={16} className="sm:w-4.5 sm:h-4.5 text-red-500" />
            </button>
          )}
          
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto sm:ml-0"
            title="More Options"
          >
            <MoreHorizontal size={18} className="sm:w-5 sm:h-5 text-gray-400" />
          </button>
          
          <div className="hidden sm:block text-xs text-gray-400">
            Ketik @ untuk mention
          </div>
          
          {showSubmitButton && (
            <button
              onClick={handleSubmit}
              disabled={submitButtonDisabled || (!content.text.trim() && !content.images.length && !content.videos.length && !content.documents.length)}
              className="ml-auto sm:ml-2 px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              {submitButtonText || 'Post'}
            </button>
          )}
        </div>
      </div>
      
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute z-50 mt-2 emoji-picker-container">
          <div className="w-[320px] sm:w-[380px]">
            <EmojiPicker 
              onEmojiClick={handleEmojiClick}
              width="100%"
              height={400}
            />
          </div>
        </div>
      )}
      
      {/* Giphy Picker Popup */}
      {showGiphyPicker && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-72 sm:w-80 giphy-picker-container">
          <div className="p-3">
            <input
              type="text"
              placeholder="Search GIFs..."
              value={giphySearchTerm}
              onChange={(e) => {
                setGiphySearchTerm(e.target.value);
                searchGiphy(e.target.value);
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 text-sm"
            />
          </div>
          
          {giphyLoading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Searching...
            </div>
          )}
          
          {giphyResults.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-3 max-h-60 overflow-y-auto">
              {giphyResults.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleGifSelect(gif)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded overflow-hidden"
                >
                  <img 
                    src={gif.images.fixed_height_small.url}
                    alt={gif.title}
                    className="w-full h-20 object-cover rounded"
                  />
                </button>
              ))}
            </div>
          )}
          
          {!giphyLoading && giphyResults.length === 0 && giphySearchTerm && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No GIFs found
            </div>
          )}
        </div>
      )}
      
      {/* Mention User Picker Popup */}
      {showMentionPicker && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-72 sm:w-80 max-h-80 overflow-y-auto mention-picker-container">
          {mentionLoading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Searching users...
            </div>
          )}
          
          {!mentionLoading && mentionResults.length > 0 && (
            <div>
              {mentionSearchTerm && (
                <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  Search: @{mentionSearchTerm}
                </div>
              )}
              {mentionResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserMention(user)}
                  className="w-full p-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      @{user.name}
                    </div>
                    {user.email && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {!mentionLoading && mentionResults.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              {mentionSearchTerm ? `No users found for "@${mentionSearchTerm}"` : 'Type username to search...'}
            </div>
          )}
        </div>
      )}
      
      {/* Background Picker Popup */}
      {showBackgroundPicker && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-80 sm:w-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Palette size={16} />
              Pilih Background
            </h4>
            <div className="flex items-center gap-2">
              {selectedBackground && (
                <button
                  onClick={() => handleSelectBackground(null)}
                  className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                >
                  Hapus
                </button>
              )}
              <button
                onClick={() => setShowBackgroundPicker(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 dark:border-gray-700">
            {BACKGROUND_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveBackgroundCategory(cat.id)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  activeBackgroundCategory === cat.id
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          
          {/* Background Grid */}
          <div className="p-3">
            <div className="grid grid-cols-5 gap-2">
              {POST_BACKGROUNDS.filter(bg => bg.category === activeBackgroundCategory).map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => handleSelectBackground(bg)}
                  className={`w-full aspect-square rounded-lg transition-all duration-200 hover:scale-105 hover:ring-2 hover:ring-indigo-400 ${
                    selectedBackground?.id === bg.id ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                  }`}
                  style={bg.style}
                  title={bg.name}
                />
              ))}
            </div>
          </div>
          
          {/* Preview */}
          {selectedBackground && (
            <div className="px-3 pb-3">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div
                className="rounded-lg p-4 min-h-[60px] flex items-center justify-center"
                style={selectedBackground.style}
              >
                <p
                  className="text-center text-sm font-medium"
                  style={{ color: selectedBackground.textColor }}
                >
                  {content.text || 'Contoh teks postingan'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Text Formatting Popup */}
      {showToolbar && (
        <div className="absolute z-40 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex items-center gap-1">
          <button
            onClick={() => execCommand('bold')}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              activeTools.has('bold') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-600 dark:text-gray-400'
            }`}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          
          <button
            onClick={() => execCommand('italic')}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              activeTools.has('italic') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-600 dark:text-gray-400'
            }`}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          
          <button
            onClick={() => execCommand('underline')}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              activeTools.has('underline') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-600 dark:text-gray-400'
            }`}
            title="Underline"
          >
            <Underline size={18} />
          </button>
        </div>
      )}
      
      {/* Media Preview Section */}
      {(content.images.length > 0 || content.videos.length > 0 || content.documents.length > 0) && (
        <div className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {content.images.map((image, index) => (
              <div key={index} className="relative group">
                <img src={image} alt="" className="w-full h-24 object-cover rounded-lg" />
                <button
                  onClick={() => setContent(prev => ({
                    ...prev,
                    images: prev.images.filter((_, i) => i !== index)
                  }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            
            {content.videos.map((video, index) => (
              <div key={index} className="relative group">
                <video src={video} className="w-full h-24 object-cover rounded-lg" />
                <button
                  onClick={() => setContent(prev => ({
                    ...prev,
                    videos: prev.videos.filter((_, i) => i !== index)
                  }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            
            {content.documents.map((doc, index) => (
              <div key={index} className="relative group flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <FileText size={20} className="text-blue-500 mr-2" />
                <span className="text-sm truncate">{doc.split('/').pop()}</span>
                <button
                  onClick={() => setContent(prev => ({
                    ...prev,
                    documents: prev.documents.filter((_, i) => i !== index)
                  }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Link Preview */}
      {content.linkPreview && (
        <div className="mt-3">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex">
            {content.linkPreview.image && (
              <img src={content.linkPreview.image} alt="" className="w-16 h-16 object-cover rounded mr-3" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{content.linkPreview.title}</h4>
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{content.linkPreview.description}</p>
              <p className="text-blue-500 text-xs mt-1">{content.linkPreview.siteName}</p>
            </div>
            <button
              onClick={() => setContent(prev => ({ ...prev, linkPreview: undefined }))}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Upload loading */}
      {isUploading && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 text-blue-500">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Uploading...
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;