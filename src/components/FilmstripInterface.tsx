'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { PAGES } from '@/lib/pages';
import { 
  X, Film, List, Plus, ChevronDown, GripVertical, 
  Play, Pause, SkipBack, SkipForward, Square,
  ZoomIn, ZoomOut, RotateCcw, Settings, Maximize2,
  BookOpen, CheckCircle, Clock, Star, Award,
  Volume2, Subtitles, Bookmark, StickyNote
} from 'lucide-react';

interface CourseInterfaceProps {
  activeId: string;
  onSelect: (id: string) => void;
}

// Course progress and completion tracking
interface LessonProgress {
  completed: boolean;
  watchTime: number;
  totalTime: number;
  bookmarked: boolean;
  notes: string[];
  rating?: number;
}

export default function CourseInterface({ activeId, onSelect }: CourseInterfaceProps) {
  // Course State
  const [courseProgress, setCourseProgress] = useState<Record<string, LessonProgress>>({});
  const [currentLessonStartTime, setCurrentLessonStartTime] = useState<number>(Date.now());
  
  // UI State
  const [isLessonListOpen, setIsLessonListOpen] = useState(true);
  const [lessonListWidth, setLessonListWidth] = useState(320);
  const [viewMode, setViewMode] = useState<'lessons' | 'modules'>('lessons');
  
  // Learning Mode State
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5x, 1x, 1.25x, 1.5x, 2x
  const [showSubtitles, setShowSubtitles] = useState(false);
  
  // Content State
  const [contentZoom, setContentZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  
  // Auto-advance timer
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Refs
  const lessonListRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Get current lesson info
  const currentIndex = PAGES.findIndex(p => p.id === activeId);
  const currentLesson = PAGES[currentIndex] || PAGES[0];
  const totalLessons = PAGES.length;
  const completedLessons = Object.values(courseProgress).filter(p => p.completed).length;
  const courseCompletionPercent = (completedLessons / totalLessons) * 100;

  // Initialize lesson progress on component mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('courseProgress');
    if (savedProgress) {
      try {
        setCourseProgress(JSON.parse(savedProgress));
      } catch (e) {
        console.warn('Failed to parse saved course progress');
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('courseProgress', JSON.stringify(courseProgress));
  }, [courseProgress]);

  // Track lesson viewing time
  useEffect(() => {
    setCurrentLessonStartTime(Date.now());
    
    return () => {
      // Update watch time when leaving lesson
      const watchTime = Date.now() - currentLessonStartTime;
      setCourseProgress(prev => ({
        ...prev,
        [activeId]: {
          ...prev[activeId] || { completed: false, watchTime: 0, totalTime: 300000, bookmarked: false, notes: [] },
          watchTime: (prev[activeId]?.watchTime || 0) + watchTime
        }
      }));
    };
  }, [activeId, currentLessonStartTime]);

  // Auto-advance functionality
  const startAutoAdvance = useCallback((delayMs: number = 5000) => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setTimeRemaining(delayMs / 1000);
    setIsAutoPlaying(true);
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsAutoPlaying(false);
          // Advance to next lesson
          const nextIndex = (currentIndex + 1) % PAGES.length;
          onSelect(PAGES[nextIndex].id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    autoAdvanceRef.current = setTimeout(() => {
      setIsAutoPlaying(false);
    }, delayMs);
  }, [currentIndex, onSelect]);

  const stopAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setIsAutoPlaying(false);
    setTimeRemaining(0);
  }, []);

  // Navigation functions
  const nextLesson = useCallback(() => {
    const nextIndex = (currentIndex + 1) % PAGES.length;
    onSelect(PAGES[nextIndex].id);
    if (autoAdvance) startAutoAdvance();
  }, [currentIndex, onSelect, autoAdvance, startAutoAdvance]);

  const prevLesson = useCallback(() => {
    const prevIndex = (currentIndex - 1 + PAGES.length) % PAGES.length;
    onSelect(PAGES[prevIndex].id);
  }, [currentIndex, onSelect]);

  // Mark lesson as completed
  const markLessonCompleted = useCallback((lessonId: string) => {
    setCourseProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId] || { completed: false, watchTime: 0, totalTime: 300000, bookmarked: false, notes: [] },
        completed: true
      }
    }));
  }, []);

  // Toggle bookmark
  const toggleBookmark = useCallback((lessonId: string) => {
    setCourseProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId] || { completed: false, watchTime: 0, totalTime: 300000, bookmarked: false, notes: [] },
        bookmarked: !prev[lessonId]?.bookmarked
      }
    }));
  }, []);

  // Keyboard shortcuts for learning
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (autoAdvance) {
            isAutoPlaying ? stopAutoAdvance() : startAutoAdvance();
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextLesson();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prevLesson();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setIsFullscreen(!isFullscreen);
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          markLessonCompleted(activeId);
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          toggleBookmark(activeId);
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          setShowNotes(!showNotes);
          break;
        case 'Escape':
          setIsFullscreen(false);
          setIsStudyMode(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeId, autoAdvance, isAutoPlaying, isFullscreen, showNotes, startAutoAdvance, stopAutoAdvance, nextLesson, prevLesson, markLessonCompleted, toggleBookmark]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, []);

  // Get lesson progress helper function
  const getLessonProgress = (lessonId: string): LessonProgress => {
    return courseProgress[lessonId] || {
      completed: false,
      watchTime: 0,
      totalTime: 300000, // 5 minutes default
      bookmarked: false,
      notes: []
    };
  };

  // Resize handling for lesson list
  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const newWidth = Math.max(280, Math.min(600, e.clientX));
      setLessonListWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const resizeElement = resizeRef.current;
    if (resizeElement) {
      resizeElement.addEventListener('mousedown', handleMouseDown);
      return () => resizeElement.removeEventListener('mousedown', handleMouseDown);
    }
  }, []);

  // Content zoom controls
  const handleZoomIn = () => setContentZoom(prev => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setContentZoom(prev => Math.max(0.25, prev - 0.25));
  const handleResetView = () => setContentZoom(1);

  return (
    <div className={cn('flex h-screen bg-[color:var(--bg)]', isFullscreen && 'fixed inset-0 z-50')}>
      {/* Course Lesson List Sidebar */}
      <AnimatePresence>
        {isLessonListOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: lessonListWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative border-r border-[color:var(--ring)] bg-[color:var(--card)] flex flex-col"
          >
            {/* Course Header */}
            <div className="p-4 border-b border-[color:var(--ring)]">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-semibold">Website Wireframes Course</h1>
                <button
                  onClick={() => setIsLessonListOpen(false)}
                  className="btn p-2"
                  aria-label="Close lesson list"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Course Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--sub)]">Progress</span>
                  <span className="font-medium">{completedLessons}/{totalLessons} lessons</span>
                </div>
                <div className="w-full bg-[color:var(--ring)] rounded-full h-2">
                  <motion.div 
                    className="bg-green-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${courseCompletionPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-xs text-[color:var(--sub)]">
                  {Math.round(courseCompletionPercent)}% complete
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 p-4 border-b border-[color:var(--ring)]">
              <button
                onClick={() => setViewMode('lessons')}
                className={cn('btn flex-1', viewMode === 'lessons' && 'bg-[color:var(--accent)]')}
              >
                <BookOpen size={16} />
                <span>Lessons</span>
              </button>
              <button
                onClick={() => setViewMode('modules')}
                className={cn('btn flex-1', viewMode === 'modules' && 'bg-[color:var(--accent)]')}
              >
                <List size={16} />
                <span>Modules</span>
              </button>
            </div>

            {/* Lesson List */}
            <div className="flex-1 overflow-y-auto p-2">
              {PAGES.map((lesson, index) => {
                const progress = getLessonProgress(lesson.id);
                const isActive = activeId === lesson.id;
                const isCompleted = progress.completed;
                const progressPercent = (progress.watchTime / progress.totalTime) * 100;
                
                return (
                  <motion.div
                    key={lesson.id}
                    className={cn(
                      'relative mb-3 rounded-lg border overflow-hidden cursor-pointer group transition-all',
                      isActive 
                        ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-lg' 
                        : 'border-[color:var(--ring)] hover:border-white/20 hover:shadow-md'
                    )}
                    onClick={() => onSelect(lesson.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Lesson Status Icons */}
                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                      {isCompleted && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-green-500 text-white p-1 rounded-full"
                        >
                          <CheckCircle size={12} />
                        </motion.div>
                      )}
                      {progress.bookmarked && (
                        <div className="bg-yellow-500 text-white p-1 rounded-full">
                          <Bookmark size={12} />
                        </div>
                      )}
                    </div>

                    {/* Lesson Number */}
                    <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>

                    {/* Lesson Preview */}
                    <div className="aspect-[16/10] bg-black/20 relative overflow-hidden">
                      <div 
                        className="w-full h-full origin-top-left"
                        style={{
                          transform: `scale(${(lessonListWidth - 32) / 1280})`
                        }}
                      >
                        <div className="w-[1280px] h-[800px]">
                          {lesson.render()}
                        </div>
                      </div>
                      
                      {/* Progress overlay */}
                      {progressPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${Math.min(100, progressPercent)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div className="p-3 border-t border-[color:var(--ring)]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm mb-1 line-clamp-2">{lesson.title}</h3>
                          {lesson.subtitle && (
                            <p className="text-xs text-[color:var(--sub)] line-clamp-1">{lesson.subtitle}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Clock size={12} className="text-[color:var(--sub)]" />
                          <span className="text-xs text-[color:var(--sub)]">
                            {Math.ceil(progress.totalTime / 60000)}m
                          </span>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(lesson.id);
                            }}
                            className={cn(
                              'p-1 rounded hover:bg-white/10 transition-colors',
                              progress.bookmarked ? 'text-yellow-500' : 'text-[color:var(--sub)]'
                            )}
                          >
                            <Bookmark size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markLessonCompleted(lesson.id);
                            }}
                            className={cn(
                              'p-1 rounded hover:bg-white/10 transition-colors',
                              isCompleted ? 'text-green-500' : 'text-[color:var(--sub)]'
                            )}
                          >
                            <CheckCircle size={14} />
                          </button>
                        </div>
                        
                        {progress.notes.length > 0 && (
                          <div className="flex items-center gap-1">
                            <StickyNote size={12} className="text-[color:var(--sub)]" />
                            <span className="text-xs text-[color:var(--sub)]">
                              {progress.notes.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Resize Handle */}
            <div
              ref={resizeRef}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[color:var(--accent)] transition-colors"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Learning Area */}
      <div className="flex-1 flex flex-col">
        {/* Learning Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-[color:var(--ring)] bg-[color:var(--card)]">
          {/* Left: Navigation & Course Info */}
          <div className="flex items-center gap-4">
            {!isLessonListOpen && (
              <button
                onClick={() => setIsLessonListOpen(true)}
                className="btn"
              >
                <BookOpen size={16} />
                <span>Lessons</span>
              </button>
            )}
            
            <div className="text-sm">
              <span className="text-[color:var(--sub)]">Lesson {currentIndex + 1} of {totalLessons}:</span>
              <span className="ml-2 font-medium">{currentLesson.title}</span>
            </div>
          </div>

          {/* Center: Learning Controls */}
          <div className="flex items-center gap-2">
            <button onClick={prevLesson} className="btn" disabled={currentIndex === 0}>
              <SkipBack size={16} />
            </button>
            
            <button
              onClick={() => {
                if (autoAdvance) {
                  isAutoPlaying ? stopAutoAdvance() : startAutoAdvance();
                } else {
                  setAutoAdvance(true);
                  startAutoAdvance();
                }
              }}
              className={cn('btn', autoAdvance && 'bg-blue-500 text-white')}
            >
              {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isAutoPlaying && (
                <span className="ml-1 text-xs">{timeRemaining}s</span>
              )}
            </button>
            
            <button onClick={nextLesson} className="btn" disabled={currentIndex === totalLessons - 1}>
              <SkipForward size={16} />
            </button>
            
            <div className="w-px h-6 bg-[color:var(--ring)] mx-2" />
            
            <button
              onClick={() => markLessonCompleted(activeId)}
              className={cn(
                'btn',
                getLessonProgress(activeId).completed ? 'bg-green-500 text-white' : ''
              )}
            >
              <CheckCircle size={16} />
              <span>Complete</span>
            </button>
          </div>

          {/* Right: View Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={cn('btn', showNotes && 'bg-[color:var(--accent)]')}
            >
              <StickyNote size={16} />
            </button>
            
            <button
              onClick={() => toggleBookmark(activeId)}
              className={cn(
                'btn',
                getLessonProgress(activeId).bookmarked ? 'text-yellow-500' : ''
              )}
            >
              <Bookmark size={16} />
            </button>
            
            <div className="w-px h-6 bg-[color:var(--ring)] mx-2" />
            
            <button onClick={handleZoomOut} className="btn">
              <ZoomOut size={16} />
            </button>
            <span className="text-sm text-[color:var(--sub)] min-w-[4rem] text-center">
              {Math.round(contentZoom * 100)}%
            </span>
            <button onClick={handleZoomIn} className="btn">
              <ZoomIn size={16} />
            </button>
            <button onClick={handleResetView} className="btn">
              <RotateCcw size={16} />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* Learning Content Area */}
        <div className="flex-1 flex">
          {/* Main Lesson Content */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-hidden bg-[radial-gradient(1000px_600px_at_70%_-10%,rgba(255,255,255,0.05),transparent)] relative"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                key={activeId} // Trigger animation on lesson change
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative bg-black/20 rounded-3xl border border-[color:var(--ring)] shadow-glow overflow-hidden"
                style={{
                  transform: `scale(${contentZoom})`,
                  width: '85%',
                  maxWidth: '1200px',
                  aspectRatio: '16/10',
                  transition: 'transform 0.2s ease-out'
                }}
              >
                <div className="w-full h-full overflow-hidden">
                  <div 
                    className="origin-top-left w-[1280px] h-[800px]"
                    style={{
                      transform: typeof window !== 'undefined' ? `scale(${Math.min(
                        (window.innerWidth * 0.85 * 0.8) / 1280,
                        (window.innerHeight * 0.8 * 0.6) / 800
                      )})` : 'scale(0.5)'
                    }}
                  >
                    {currentLesson.render()}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Auto-advance notification */}
            <AnimatePresence>
              {isAutoPlaying && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm">
                      Next lesson in {timeRemaining}s
                    </span>
                    <button
                      onClick={stopAutoAdvance}
                      className="text-white/80 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Study Mode Overlay */}
            {isStudyMode && (
              <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} />
                  <span className="text-sm">Study Mode</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes Sidebar */}
          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-l border-[color:var(--ring)] bg-[color:var(--card)] p-4 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Lesson Notes</h3>
                  <button
                    onClick={() => setShowNotes(false)}
                    className="btn p-2"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <textarea
                  className="w-full h-64 p-3 bg-[color:var(--bg)] border border-[color:var(--ring)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Take notes for this lesson..."
                  value={getLessonProgress(activeId).notes.join('\n')}
                  onChange={(e) => {
                    const notes = e.target.value.split('\n').filter(note => note.trim());
                    setCourseProgress(prev => ({
                      ...prev,
                      [activeId]: {
                        ...getLessonProgress(activeId),
                        notes
                      }
                    }));
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}