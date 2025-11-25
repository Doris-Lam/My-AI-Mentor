import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { analyzeCode, generateCode, visualizeCode, generateDiagram, generateLesson, formatCode, executeCode, shareCode, getSharedCode, type CodeExecutionResponse } from './services/api';
import type { Document, FeedbackItem, Achievement, CodeAnalysisResponse } from './types/app';
import { getStarterCode, getLanguageOptions } from './constants/starterCode';
import MetricsDashboard from './components/MetricsDashboard';
import './App.css';
import { 
  X, Plus, Upload, Download, Printer, Clock, 
  Undo2, Redo2, Scissors, Copy, Clipboard, Square,
  Menu, Search, BarChart3,
  ChevronRight, ChevronLeft, MessageSquare, Code, Search as SearchIcon, Replace,
  Sparkles, AlertCircle, CheckCircle, User, Play, Network, BookOpen, Share2,
  Moon, Sun, Activity
} from 'lucide-react';

function App() {

  // Tab system: manage multiple documents
  const createNewDocument = (title: string = 'Untitled document', lang: string = 'python'): Document => ({
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    code: getStarterCode(lang),
    language: lang,
    documentHistory: [getStarterCode(lang)],
    historyIndex: 0,
    feedback: [],
    visualization: null,
    diagram: null,
    lesson: null,
    aiMessages: [],
    scores: {},
    achievements: [],
  });

  const [documents, setDocuments] = useState<Document[]>([createNewDocument()]);
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(0);
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decorations, setDecorations] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'ai' | 'visualizer' | 'diagram'>('suggestions');
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  const diagramSvgRef = useRef<string | null>(null); // Store the SVG to prevent it from disappearing
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResponse | null>(null);
  const [outputPanelOpen, setOutputPanelOpen] = useState(false);
  const [outputPanelHeight, setOutputPanelHeight] = useState(300);
  const [isResizingOutput, setIsResizingOutput] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('Untitled document');
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [useContext, setUseContext] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Helper functions to get/set active document
  const getActiveDocument = (): Document => documents[activeDocumentIndex] || documents[0];
  const updateActiveDocument = (updates: Partial<Document>) => {
    setDocuments(prev => {
      const newDocs = [...prev];
      if (newDocs[activeDocumentIndex]) {
        newDocs[activeDocumentIndex] = { ...newDocs[activeDocumentIndex], ...updates };
      }
      return newDocs;
    });
  };

  // Derived state from active document
  const activeDoc = getActiveDocument();
  const code = activeDoc.code;
  const language = activeDoc.language;
  const feedback = activeDoc.feedback;
  const visualization = activeDoc.visualization;
  const diagram = activeDoc.diagram;
  const lesson = activeDoc.lesson;
  const documentTitle = activeDoc.title;
  const documentHistory = activeDoc.documentHistory;
  const historyIndex = activeDoc.historyIndex;
  const scores = activeDoc.scores;
  const achievements = activeDoc.achievements;
  const aiMessages = activeDoc.aiMessages;
  const editorRef = useRef<any>(null);
  const historyTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);
  const aiMessagesRef = useRef<HTMLDivElement>(null);

  // Manual analysis trigger
  const handleManualAnalysis = () => {
    if (code.trim()) {
        analyzeCodeDebounced();
    }
  };

  // Code visualization handler
  const handleVisualizeCode = async () => {
    if (!code.trim()) {
      setError('Please enter some code to visualize.');
      return;
    }

    setIsVisualizing(true);
    setError(null);
    setActiveTab('visualizer');
    
    try {
      const backendLanguage = getBackendLanguage(language);
      const result = await visualizeCode({ code, language: backendLanguage });
      updateActiveDocument({ visualization: result });
    } catch (err: any) {
      console.error('Visualization error:', err);
      let errorMessage = 'Failed to visualize code. Please try again.';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsVisualizing(false);
    }
  };

  // Download diagram as SVG
  const handleDownloadDiagram = () => {
    // Get the SVG element from the rendered diagram
    const svgElement = diagramRef.current?.querySelector('svg');
    
    if (!svgElement) {
      setError('No diagram available to download. Please generate a diagram first.');
      return;
    }
    
    try {
      // Get SVG content
      const svgContent = svgElement.outerHTML;
      
      // Create blob and download
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagram-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading diagram:', err);
      setError('Failed to download diagram. Please try again.');
    }
  };

  // Lesson generation handler
  const handleGenerateLesson = async () => {
    if (!code.trim()) {
      setError('Please enter some code to generate a lesson.');
      return;
    }
    
    setIsGeneratingLesson(true);
    setLessonModalOpen(true);
    setError(null);
    
    try {
      const result = await generateLesson({ code, language: getBackendLanguage(language) });
      updateActiveDocument({ lesson: result.lesson });
    } catch (err: any) {
      console.error('Lesson generation error:', err);
      let errorMessage = 'Failed to generate lesson. Please try again.';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      setError(errorMessage);
      updateActiveDocument({ lesson: null });
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // Diagram generation handler
  const handleGenerateDiagram = async () => {
    if (!code.trim()) {
      setError('Please enter some code to generate a diagram.');
      return;
    }

    setIsGeneratingDiagram(true);
    setError(null);
    setActiveTab('diagram');
    
    try {
      const backendLanguage = getBackendLanguage(language);
      const result = await generateDiagram({ code, language: backendLanguage });
      updateActiveDocument({ diagram: result });
    } catch (err: any) {
      console.error('Diagram generation error:', err);
      let errorMessage = 'Failed to generate diagram. Please try again.';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
        // Check for rate limit errors
        if (errorMessage.includes('429') || errorMessage.includes('Rate limit') || errorMessage.includes('quota')) {
          errorMessage = '⚠️ Rate limit exceeded: You\'ve hit the API rate limit. Please wait a few minutes before trying again.';
        }
      } else if (err.message) {
        errorMessage = err.message;
        if (errorMessage.includes('429') || errorMessage.includes('Rate limit') || errorMessage.includes('quota')) {
          errorMessage = '⚠️ Rate limit exceeded: You\'ve hit the API rate limit. Please wait a few minutes before trying again.';
        }
      }
      
      setError(errorMessage);
      // Also set diagram to null to show error state
      updateActiveDocument({ diagram: null });
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  // AI generation handler
  const handleGenerateCode = async () => {
    if (!aiPrompt.trim()) {
      return;
    }

    const userMessage = aiPrompt.trim();
    
    // Add user message to chat
    const currentDoc = getActiveDocument();
    updateActiveDocument({
      aiMessages: [...currentDoc.aiMessages, { type: 'user', content: userMessage }]
    });
    setAiPrompt('');
    setIsGenerating(true);
    setError(null);

    try {
      const backendLanguage = getBackendLanguage(language);
      const request: { prompt: string; language: string; context?: string } = {
        prompt: userMessage,
        language: backendLanguage
      };
      if (useContext && code.trim()) {
        request.context = code.trim();
      }
      const result = await generateCode(request);
      
      // Add AI response to chat
      const updatedDoc = getActiveDocument();
      updateActiveDocument({
        aiMessages: [...updatedDoc.aiMessages, {
        type: 'ai',
        content: result.explanation,
        code: result.generated_code
        }]
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate code. Please try again.');
      console.error('Generation error:', err);
      // Add error message to chat
      const errorDoc = getActiveDocument();
      updateActiveDocument({
        aiMessages: [...errorDoc.aiMessages, {
        type: 'ai',
        content: `Error: ${err.response?.data?.detail || 'Failed to generate code. Please try again.'}`
        }]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Insert generated code into editor at cursor position or replace selection
  const handleInsertGeneratedCode = (codeToInsert: string) => {
    if (codeToInsert && editorRef.current) {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      if (model) {
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty()) {
          // Replace selected text
          editor.executeEdits('insert-generated-code', [{
            range: selection,
            text: codeToInsert
          }]);
        } else {
          // Insert at cursor position
          const position = editor.getPosition();
          if (position) {
            editor.executeEdits('insert-generated-code', [{
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              },
              text: codeToInsert
            }]);
          }
        }
        
        // Update code state
        updateActiveDocument({ code: model.getValue() });
      }
    }
  };

  // Replace all code with generated code
  const handleApplyGeneratedCode = (codeToApply: string) => {
    if (codeToApply && editorRef.current) {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      if (model) {
        // Replace entire document
        const fullRange = model.getFullModelRange();
        editor.executeEdits('apply-generated-code', [{
          range: fullRange,
          text: codeToApply
        }]);
        
        // Move cursor to top
        editor.setPosition({ lineNumber: 1, column: 1 });
        
        // Update code state
        updateActiveDocument({ code: codeToApply });
      }
    }
  };

  // Handle Enter key (with Shift for new line)
  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (aiPrompt.trim() && !isGenerating) {
        handleGenerateCode();
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (aiInputRef.current) {
      aiInputRef.current.style.height = 'auto';
      aiInputRef.current.style.height = `${aiInputRef.current.scrollHeight}px`;
    }
  }, [aiPrompt]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (aiMessagesRef.current) {
      aiMessagesRef.current.scrollTop = aiMessagesRef.current.scrollHeight;
    }
  }, [aiMessages, isGenerating]);

  // Load shared code from URL on mount
  useEffect(() => {
    const loadSharedCode = async () => {
      // Check for share ID in URL (e.g., /share/abc123 or ?share=abc123)
      const urlParams = new URLSearchParams(window.location.search);
      const shareId = urlParams.get('share');
      
      // Also check if URL path contains /share/
      const pathMatch = window.location.pathname.match(/\/share\/([^\/]+)/);
      const pathShareId = pathMatch ? pathMatch[1] : null;
      
      const finalShareId = shareId || pathShareId;
      
      if (finalShareId) {
        try {
          const sharedData = await getSharedCode(finalShareId);
          
          // Map backend language to frontend language format
          const frontendLanguage = getFrontendLanguage(sharedData.language);
          
          // Create a new document with the shared code
          const newDoc = createNewDocument(
            sharedData.title || 'Shared Code',
            frontendLanguage
          );
          newDoc.code = sharedData.code;
          newDoc.documentHistory = [sharedData.code];
          
          setDocuments([newDoc]);
          setActiveDocumentIndex(0);
          
          // Clean up URL - remove share parameter but keep the pathname
          const url = new URL(window.location.href);
          url.searchParams.delete('share');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        } catch (err: any) {
          console.error('Error loading shared code:', err);
          setError(err.response?.data?.detail || 'Failed to load shared code. The link may have expired.');
        }
      }
    };
    
    loadSharedCode();
  }, []); // Only run on mount

  // Sanitize Mermaid diagram code to fix common syntax issues
  const sanitizeMermaidCode = (code: string): string => {
    if (!code) return code;
    
    // Fix quotes inside node labels: [Return "Positive"] -> ["Return Positive"]
    // This regex finds patterns like [Label "text"] and wraps the entire label in quotes
    let sanitized = code.replace(/\[([^\]]*)"([^"]*)"([^\]]*)\]/g, (_match, before, quoted, after) => {
      // Remove quotes and combine the parts, then wrap entire label in quotes
      const label = (before + quoted + after).trim();
      return `["${label}"]`;
    });
    
    return sanitized;
  };

  // Render Mermaid diagram when diagram data changes
  useEffect(() => {
    if (diagram && diagram.diagram_code && !diagram.diagram_code.includes('Error[Error generating diagram]')) {
      // Wait a bit for the ref to be attached
      const renderDiagram = async () => {
        // Wait for ref to be available
        let attempts = 0;
        while (!diagramRef.current && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!diagramRef.current) {
          console.error('Diagram ref not available after waiting');
          return;
        }
        
        try {
          // Dynamically import mermaid
          const mermaid = await import('mermaid');
          
          // Initialize mermaid (safe to call multiple times)
          mermaid.default.initialize({
            startOnLoad: false,
            theme: darkMode ? 'dark' : 'default',
            securityLevel: 'loose',
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            }
          });

          // Check if diagram is already rendered and matches current diagram code
          const existingSvg = diagramRef.current?.querySelector('svg');
          if (existingSvg && diagramSvgRef.current && diagramSvgRef.current === existingSvg.outerHTML) {
            return;
          }
          
          // Clear previous diagram only if we have new diagram code
          // This prevents the diagram from disappearing on re-renders
          if (diagramRef.current && diagram.diagram_code) {
            diagramRef.current.innerHTML = '';
          }
          
          // Create a unique ID for this diagram
          const diagramId = `mermaid-diagram-${Date.now()}`;
          
          // Sanitize the diagram code before rendering
          const sanitizedCode = sanitizeMermaidCode(diagram.diagram_code);
          
          // Render the diagram directly using the render method
          try {
            const result = await mermaid.default.render(diagramId, sanitizedCode);
            
            if (!result || !result.svg) {
              throw new Error('Mermaid render returned no SVG');
            }
            
            // Store the SVG to prevent it from disappearing
            diagramSvgRef.current = result.svg;
            
            // Create a container div and insert the SVG
            const container = document.createElement('div');
            container.className = 'mermaid-diagram-wrapper';
            container.innerHTML = result.svg;
            diagramRef.current.appendChild(container);
          } catch (renderErr: any) {
            console.error('Mermaid render error:', renderErr);
            
            // Show more detailed error message
            let errorMessage = 'Error rendering diagram.';
            if (renderErr?.message) {
              errorMessage = `Syntax error: ${renderErr.message}`;
            } else if (typeof renderErr === 'string') {
              errorMessage = `Syntax error: ${renderErr}`;
            }
            
            // Show the generated diagram code for debugging
            const codePreview = sanitizeMermaidCode(diagram.diagram_code).length > 500 
              ? sanitizeMermaidCode(diagram.diagram_code).substring(0, 500) + '...' 
              : sanitizeMermaidCode(diagram.diagram_code);
            
            diagramRef.current.innerHTML = `
              <div class="diagram-error">
                ${errorMessage}
                <code>Generated diagram code:\n${codePreview}</code>
              </div>
            `;
          }
        } catch (err) {
          console.error('Error rendering Mermaid diagram:', err);
          if (diagramRef.current) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            diagramRef.current.innerHTML = `<div class="diagram-error">Error rendering diagram: ${errorMsg}. Please try again.</div>`;
          }
        }
      };

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        renderDiagram();
      }, 100);
    } else if (diagramSvgRef.current && diagramRef.current && !diagramRef.current.querySelector('svg')) {
      // Restore diagram if it disappeared but we have the SVG stored
      const container = document.createElement('div');
      container.className = 'mermaid-diagram-wrapper';
      container.innerHTML = diagramSvgRef.current;
      diagramRef.current.appendChild(container);
    }
  }, [diagram, darkMode]);


  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedTitle = localStorage.getItem('documentTitle');
    if (savedTitle) {
      updateActiveDocument({ title: savedTitle });
      setTitleInput(savedTitle);
    }

    const savedAchievements = localStorage.getItem('codingAchievements');
    if (savedAchievements) {
      updateActiveDocument({ achievements: JSON.parse(savedAchievements) });
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    document.documentElement.classList.toggle('dark-mode', newDarkMode);
  };

  // Apply dark mode class on mount and when darkMode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);


  // Initialize history with current code
  useEffect(() => {
    if (documentHistory.length === 1 && documentHistory[0] !== code) {
      updateActiveDocument({ documentHistory: [code], historyIndex: 0 });
    }
  }, [code, documentHistory.length]);

  // Sync titleInput when switching documents
  useEffect(() => {
    setTitleInput(documentTitle);
    setIsEditingTitle(false);
  }, [activeDocumentIndex, documentTitle]);

  // Handle terminal panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingOutput) {
        const newHeight = window.innerHeight - e.clientY;
        const minHeight = 100;
        const maxHeight = window.innerHeight - 200;
        setOutputPanelHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
      }
    };

    const handleMouseUp = () => {
      setIsResizingOutput(false);
    };

    if (isResizingOutput) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingOutput]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Update decorations when feedback changes
  useEffect(() => {
    if (editorRef.current) {
      updateEditorDecorations();
    }
  }, [feedback]);

  const analyzeCodeDebounced = async () => {
    const currentCode = code; // Use the current code state
    
    if (!currentCode.trim()) {
      setError('Please enter some code to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const backendLanguage = getBackendLanguage(language);
      const result = await analyzeCode({ code: currentCode, language: backendLanguage });
      parseFeedback(result);
    } catch (err: any) {
      console.error('Analysis error:', err);
      
      // Extract error message from various possible error formats
      let errorMessage = 'Failed to analyze code. Please try again.';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Check for network errors
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorMessage = 'Network error: Unable to connect to the backend server. Please make sure the backend is running on http://localhost:8000';
      }
      
      // Check for CORS errors
      if (err.message?.includes('CORS') || err.message?.includes('cross-origin')) {
        errorMessage = 'CORS error: The backend server may not be configured to allow requests from this origin.';
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to check if a suggestion is meaningful (not just minor styling)
  const isMeaningfulSuggestion = (original: string, suggested: string): boolean => {
    const originalLower = original.toLowerCase().trim();
    const suggestedLower = suggested.toLowerCase().trim();
    
    // If they're the same (case-insensitive), it's not meaningful
    if (originalLower === suggestedLower) {
      return false;
    }
    
    // Check if it's just capitalization differences
    const isOnlyCapitalization = originalLower === suggestedLower && 
                                  original !== suggested;
    
    // If it's only capitalization and no context (like in print statements), skip it
    if (isOnlyCapitalization) {
      // Allow capitalization fixes if it's in a variable name or function name
      const isVariableOrFunction = /^(def|class|var|let|const)\s+\w+/i.test(original) ||
                                   /^\w+\s*=\s*/i.test(original);
      
      // Check if it's just a string literal in a print statement (most common case to skip)
      const isPrintStringOnly = /print\s*\(["']([^"']+)["']\)/.test(original) &&
                                 /print\s*\(["']([^"']+)["']\)/.test(suggested);
      
      // If it's just capitalization in a print string, skip it (no real context)
      if (isPrintStringOnly) {
        // Extract the strings
        const originalString = original.match(/print\s*\(["']([^"']+)["']\)/)?.[1] || '';
        const suggestedString = suggested.match(/print\s*\(["']([^"']+)["']\)/)?.[1] || '';
        
        // If only the string content capitalization differs, skip it
        if (originalString.toLowerCase() === suggestedString.toLowerCase() &&
            originalString !== suggestedString) {
          return false; // Skip capitalization-only fixes in print strings
        }
      }
      
      // Allow if it's in a variable/function name (meaningful context)
      if (isVariableOrFunction) {
        return true;
      }
      
      // Skip all other capitalization-only changes
      return false;
    }
    
    // Check if it's just adding/removing whitespace
    const originalNoSpaces = original.replace(/\s+/g, '');
    const suggestedNoSpaces = suggested.replace(/\s+/g, '');
    if (originalNoSpaces === suggestedNoSpaces) {
      return false; // Just whitespace changes, not meaningful
    }
    
    // Check if it's just adding a comment
    if (suggested.includes('#') && !original.includes('#') && 
        originalNoSpaces === suggestedNoSpaces.replace(/#.*$/, '').replace(/\s+/g, '')) {
      return false; // Just adding a comment, not meaningful
    }
    
    return true; // It's a meaningful change
  };

  const parseFeedback = (result: CodeAnalysisResponse) => {
    const feedbackItems: FeedbackItem[] = [];
    let itemId = 0;
    
    // Track changes that will be applied to avoid duplicates
    const appliedChanges = new Map<number, string>(); // lineNumber -> new content
    const pendingChanges = new Map<number, string[]>(); // lineNumber -> array of suggested changes
    const seenSuggestions = new Set<string>(); // Track seen suggestions to prevent exact repeats
    
    // Parse errors
    if (result.errors && result.errors !== 'No errors found.' && result.errors !== '[None]') {
      const errorLines = result.errors.split('\n').filter((line: string) => line.trim() && line !== '[None]');
      errorLines.forEach((line: string, index: number) => {
        // Try to extract line number from error message (e.g., "line 2: SyntaxError: ...")
        const lineMatch = line.match(/line\s+(\d+)/i);
        let lineNumber = index + 1; // Default to index + 1
        let errorMessage = line;
        
        if (lineMatch) {
          lineNumber = parseInt(lineMatch[1]);
          // Remove "line X:" prefix from message for cleaner display
          errorMessage = line.replace(/^line\s+\d+:\s*/i, '').trim();
        }
        
        // Try to extract the actual error text for context-aware fixing
        let originalText = '';
        let suggestion = '';
        
        // Get the actual line content first
        const actualLine = code.split('\n')[lineNumber - 1];
        if (actualLine && actualLine.trim()) {
          originalText = actualLine.trim();
        }
        
        // If error contains code, try to extract it (but prefer actual line content)
        if (!originalText) {
          const codeMatch = errorMessage.match(/["']([^"']+)["']/);
          if (codeMatch) {
            originalText = codeMatch[1];
          }
        }
        
        // Try to infer fix from error type - only if we have actual code
        if (errorMessage.includes('EOL while scanning string literal') || errorMessage.includes('missing') || errorMessage.includes('unterminated')) {
          // This is likely a missing quote/parenthesis - try to find the problematic line
          const problemLine = code.split('\n')[lineNumber - 1];
          if (problemLine && problemLine.trim()) {
            // Preserve original text with spacing for context
            originalText = problemLine.trim();
            // Try to fix common issues while preserving indentation
            if (problemLine.includes('print(') && !problemLine.match(/print\(["'][^"']*["']\)/)) {
              // Missing closing quote - preserve indentation
              const indentation = problemLine.match(/^(\s*)/)?.[1] || '';
              const content = problemLine.trim();
              if (content.includes('print("') && !content.includes('")') || content.includes('print(') && !content.match(/print\(["'][^"']*["']\)/)) {
                // Try to add missing quote
                if (content.endsWith(')')) {
                  suggestion = indentation + content.replace(/\)$/, '")');
                } else if (!content.includes('"')) {
                  suggestion = indentation + content.replace(/print\(([^)]*)\)/, 'print("$1")');
                } else {
                  // Add closing quote before parenthesis
                  suggestion = indentation + content.replace(/(")([^"]*)$/, '$1$2"') + ')';
                }
              }
            }
          }
        } else if (errorMessage.includes('NameError') || errorMessage.includes('not defined')) {
          // For undefined variables, don't suggest nonsensical replacements
          // Just show the error - the user needs to define the variable themselves
          const problemLine = code.split('\n')[lineNumber - 1];
          if (problemLine && problemLine.trim()) {
            originalText = problemLine.trim();
            // Don't suggest replacement - just note the issue
            // User needs to define the variable themselves
            suggestion = originalText; // Keep original text, user needs to fix
          }
        } else if (errorMessage.includes('SyntaxError') && errorMessage.includes('invalid syntax')) {
          // For syntax errors, try to find what's missing
          const problemLine = code.split('\n')[lineNumber - 1];
          if (problemLine && problemLine.trim()) {
            originalText = problemLine.trim();
            
            // Check if this line already has a pending change that adds a colon
            const existingChange = appliedChanges.get(lineNumber) || pendingChanges.get(lineNumber)?.[0];
            const alreadyHasColon = existingChange?.includes(':') || problemLine.includes(':');
            
            // Check for common missing syntax - only suggest if not already fixed
            if (!alreadyHasColon) {
              if (problemLine.includes('if ') && !problemLine.includes(':')) {
                const indentation = problemLine.match(/^(\s*)/)?.[1] || '';
                suggestion = indentation + problemLine.trim() + ':';
                // Track this change
                pendingChanges.set(lineNumber, [suggestion]);
              } else if (problemLine.includes('for ') && !problemLine.includes(':')) {
                const indentation = problemLine.match(/^(\s*)/)?.[1] || '';
                suggestion = indentation + problemLine.trim() + ':';
                // Track this change
                pendingChanges.set(lineNumber, [suggestion]);
              } else if (problemLine.includes('while ') && !problemLine.includes(':')) {
                const indentation = problemLine.match(/^(\s*)/)?.[1] || '';
                suggestion = indentation + problemLine.trim() + ':';
                // Track this change
                pendingChanges.set(lineNumber, [suggestion]);
              } else {
                // Generic syntax error - don't suggest nonsense
                suggestion = ''; // Will be handled by display logic
              }
            } else {
              // Already has colon or pending change - skip
              suggestion = originalText;
            }
          }
        }
        
        // Only add error if we have meaningful suggestion or original text
        // Also check that errorMessage is not "None" or empty
        const trimmedMessage = errorMessage?.trim().toLowerCase();
        const hasValidMessage = trimmedMessage && 
                                trimmedMessage !== 'none' && 
                                trimmedMessage !== 'no information provided.' &&
                                trimmedMessage !== '[none]';
        
        if ((originalText || suggestion) && hasValidMessage) {
          // If no suggestion, don't show a replacement - just show the error message
          if (!suggestion && originalText) {
            suggestion = originalText; // Keep same text if no fix available
          } else if (!suggestion) {
            suggestion = 'Fix this error';
          }
          
          // Only show originalText if it's different from suggestion (so replacement makes sense)
          const shouldShowReplacement = originalText && suggestion && originalText !== suggestion;
          
        feedbackItems.push({
            id: `error-${itemId++}`,
            line: lineNumber,
          type: 'error',
            message: errorMessage,
            suggestion: suggestion,
            severity: 'high',
            originalText: shouldShowReplacement ? originalText : undefined
          });
        }
      });
    }

    // Parse suggestions with better parsing - now handles contextual suggestions
    if (result.suggestions && result.suggestions !== 'No information provided.' && result.suggestions !== '[None]') {
      const suggestionLines = result.suggestions.split('\n').filter((line: string) => line.trim() && line !== '[None]');
      suggestionLines.forEach((line: string) => {
        
        // Skip lines that are just section headers or empty
        if (line.trim().match(/^(ERRORS|SUGGESTIONS|TEST_CASES|EXPLANATION|SCORE):?$/i)) {
          return;
        }
        
        // Try to parse line number from the suggestion - look for patterns like "line X:" or "line X-Y:"
        const lineMatch = line.match(/line\s+(\d+)(?:\s*-\s*(\d+))?/i);
        let lineNumber = lineMatch ? parseInt(lineMatch[1]) : null;
        
        // If no line number found, try to infer from context or skip
        if (!lineNumber) {
          // Try to find line number in other formats
          const altMatch = line.match(/(?:^|\s)(\d+):/);
          if (altMatch) {
            lineNumber = parseInt(altMatch[1]);
          } else {
            // Skip suggestions without clear line numbers - they're probably contextual explanations
            return;
          }
        }
        
        // Extract original text and suggestion if in format "original -> suggested"
        // Handle both "line X: original_text -> suggested_text" and "line X: description with context" formats
        const arrowMatch = line.match(/line\s+\d+(?:\s*-\s*\d+)?:\s*(.+?)\s*->\s*(.+)/i) || line.match(/(.+?)\s*->\s*(.+)/);
        let message = line;
        let suggestion = '';
        let originalText = '';
        
        if (arrowMatch) {
          // Extract the suggested replacement from AI
          suggestion = arrowMatch[2].trim();
          
          // Try to extract original text from the first part (before ->)
          const originalPart = arrowMatch[1].trim();
          
          // Get the actual line content from the code - this is the ONLY source of truth
          const actualLine = code.split('\n')[lineNumber - 1];
          if (actualLine) {
            // Use the actual line content (trimmed) as originalText
            originalText = actualLine.trim();
            
            // Check if this line already has a pending change
            const existingChange = appliedChanges.get(lineNumber) || pendingChanges.get(lineNumber)?.[0];
            if (existingChange) {
              // Use the pending change as the base for this suggestion
              originalText = existingChange.trim();
            }
            
            // Clean up the suggestion - remove any "line X:" prefixes
            suggestion = suggestion.replace(/^line\s+\d+(?:\s*-\s*\d+)?:\s*/i, '').trim();
            
            // Remove quotes from suggestion if they're just wrapping the whole thing
            if (suggestion.startsWith('"') && suggestion.endsWith('"')) {
              suggestion = suggestion.slice(1, -1);
            }
            
            // Extract context from the original part if it contains explanation
            if (originalPart && !originalPart.includes(originalText)) {
              // The original part might contain context/explanation
              message = originalPart.replace(/^line\s+\d+(?:\s*-\s*\d+)?:\s*/i, '').trim();
            }
            
            // Check if this is a meaningful suggestion (not just minor styling)
            if (!isMeaningfulSuggestion(originalText, suggestion)) {
              return; // Skip this iteration
            }
            
            // Check for exact duplicate suggestions (same original -> same suggestion)
            const suggestionKey = `${lineNumber}:${originalText.toLowerCase()}:${suggestion.toLowerCase()}`;
            if (seenSuggestions.has(suggestionKey)) {
              return; // Skip this iteration
            }
            seenSuggestions.add(suggestionKey);
            
            // Check for duplicate changes (e.g., multiple suggestions to add colon)
            const pendingForLine = pendingChanges.get(lineNumber) || [];
            const isDuplicate = pendingForLine.some(pending => {
              // Check if this suggestion would result in the same change
              const normalizedSuggestion = suggestion.trim().toLowerCase();
              const normalizedPending = pending.trim().toLowerCase();
              
              // Check for duplicate colon additions
              if (normalizedSuggestion.includes(':') && normalizedPending.includes(':') && 
                  !originalText.includes(':')) {
                return true;
              }
              
              // Check for exact duplicate
              if (normalizedSuggestion === normalizedPending) {
                return true;
              }
              
              return false;
            });
            
            if (isDuplicate) {
              return; // Skip this iteration
            }
            
            // Track this change
            pendingForLine.push(suggestion);
            pendingChanges.set(lineNumber, pendingForLine);
            
            // Create a meaningful message if not already set
            if (!message || message === line) {
            message = `Consider changing the code on line ${lineNumber}`;
            }
            
            // Only add this suggestion if the actual line exists and has content
            if (!originalText || originalText.length === 0) {
              // Skip this suggestion if line doesn't exist or is empty
              return; // Skip this iteration
            }
          } else {
            // Skip if line doesn't exist
            return; // Skip this iteration
          }
        } else {
          // For non-arrow format, try to extract meaningful suggestion with context
          // Get the actual line content from the code
          const actualLine = code.split('\n')[lineNumber - 1];
          if (actualLine && actualLine.trim()) {
            originalText = actualLine.trim();
            
            // Try to extract suggested code from the line
            // Look for quoted code or code snippets
            const quotedMatch = line.match(/"([^"]+)"/);
            const codeBlockMatch = line.match(/```\w*\n?([^`]+)```/);
            
            if (quotedMatch) {
              suggestion = quotedMatch[1];
            } else if (codeBlockMatch) {
              suggestion = codeBlockMatch[1].trim();
            } else {
              // Use the line as-is, but remove "line X:" prefix
              suggestion = line.replace(/^line\s+\d+(?:\s*-\s*\d+)?:\s*/i, '').trim();
            }
            
            // Clean up suggestion - remove "line X:" prefixes
            suggestion = suggestion.replace(/^line\s+\d+(?:\s*-\s*\d+)?:\s*/i, '').trim();
            
            // Check if this is a meaningful suggestion
            if (!isMeaningfulSuggestion(originalText, suggestion)) {
              return; // Skip this iteration
            }
            
            // Check for exact duplicate
            const suggestionKey = `${lineNumber}:${originalText.toLowerCase()}:${suggestion.toLowerCase()}`;
            if (seenSuggestions.has(suggestionKey)) {
              return; // Skip this iteration
            }
            seenSuggestions.add(suggestionKey);
            
            // Use the line as message, but clean it up
            message = line.replace(/^line\s+\d+(?:\s*-\s*\d+)?:\s*/i, '').trim();
            if (!message || message === suggestion) {
            message = `Suggestion for line ${lineNumber}: ${suggestion}`;
            }
          } else {
            // Skip if line doesn't exist
            return;
          }
        }
        
        // Only add suggestion if we have a valid message (not "None" or empty)
        const trimmedMessage = message?.trim().toLowerCase();
        const hasValidMessage = trimmedMessage && 
                                trimmedMessage !== 'none' && 
                                trimmedMessage !== 'no information provided.' &&
                                trimmedMessage !== '[none]' &&
                                trimmedMessage.length > 0;
        
        // Also check that suggestion is valid
        const trimmedSuggestion = suggestion?.trim().toLowerCase();
        const hasValidSuggestion = trimmedSuggestion && 
                                   trimmedSuggestion !== 'none' && 
                                   trimmedSuggestion !== 'no information provided.' &&
                                   trimmedSuggestion !== '[none]' &&
                                   trimmedSuggestion.length > 0;
        
        if (hasValidMessage && hasValidSuggestion && originalText) {
        feedbackItems.push({
          id: `suggestion-${itemId++}`,
          line: lineNumber,
          type: 'suggestion',
          message: message,
          suggestion: suggestion,
          severity: 'medium',
          originalText: originalText
        });
        }
      });
    }

    // If no feedback items were created, try basic syntax checking
    if (feedbackItems.length === 0) {
      const lines = code.split('\n');
      
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // Check for missing closing parenthesis
        if (line.includes('print(') && !line.match(/print\([^)]*\)/)) {
          feedbackItems.push({
            id: `syntax-${itemId++}`,
            line: lineNumber,
            type: 'error',
            message: 'Missing closing parenthesis in print statement',
            suggestion: line.replace(/print\([^)]*$/, 'print("Hello World")'),
            severity: 'high',
            originalText: line.trim()
          });
        }
        
        // Check for missing quotes
        if (line.includes('print(') && !line.match(/print\(["'][^"']*["']\)/)) {
          feedbackItems.push({
            id: `syntax-${itemId++}`,
            line: lineNumber,
            type: 'error',
            message: 'String literal is not properly quoted',
            suggestion: line.replace(/print\(([^)]*)\)/, 'print("$1")'),
            severity: 'high',
            originalText: line.trim()
          });
        }
      });
    }

    updateActiveDocument({ feedback: feedbackItems });

    // Store scores
    if (result.overall_score !== undefined) {
      updateActiveDocument({
        scores: {
        correctness: result.correctness_score ?? 100,
        clarity: result.clarity_score ?? 100,
        bestPractices: result.best_practices_score ?? 100,
        performance: result.performance_score ?? 100,
        overall: result.overall_score ?? 100
        }
      });
    }

    // Check for first analysis achievement
    checkAchievements();
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    updateEditorDecorations();
    
    // Add click handler for suggestions
    editor.onMouseDown((e: any) => {
      if (e.target.type === 6) { // Content widget clicked
        const element = e.target.element;
        if (element && element.classList.contains('suggestion-inline-widget')) {
          // Find the suggestion ID from the decoration
          const lineNumber = e.target.position.lineNumber;
          const suggestion = feedback.find(item => item.line === lineNumber);
          if (suggestion) {
            handleAcceptSuggestion(suggestion.id);
          }
        }
      }
    });
  };

  const clearAllDecorations = () => {
    if (editorRef.current) {
      editorRef.current.deltaDecorations(decorations, []);
      setDecorations([]);
    }
  };

  const updateEditorDecorations = () => {
    if (!editorRef.current) {
      return;
    }
    
    // Clear all existing decorations first
    clearAllDecorations();

    const newDecorations = feedback.map((item) => {
      const lineNumber = item.line;
      const startColumn = item.startColumn || 1;
      const endColumn = item.endColumn || 1000; // Default to end of line
      
      return {
        range: {
          startLineNumber: lineNumber,
          startColumn: startColumn,
          endLineNumber: lineNumber,
          endColumn: endColumn
        },
        options: {
          className: `suggestion-underline suggestion-${item.type}`,
          hoverMessage: {
            value: `**${item.type.toUpperCase()}**: ${item.message}\n\n**Suggestion**: ${item.suggestion}\n\nClick to accept suggestion`,
            isTrusted: true
          },
          minimap: {
            color: item.type === 'error' ? '#ff6b6b' : item.type === 'warning' ? '#ffa726' : '#42a5f5',
            position: 1
          },
          overviewRuler: {
            color: item.type === 'error' ? '#ff6b6b' : item.type === 'warning' ? '#ffa726' : '#42a5f5',
            position: 1
          },
          afterContentClassName: `suggestion-widget suggestion-${item.type}`,
          afterContent: {
            content: `💡 ${item.suggestion}`,
            inlineClassName: 'suggestion-inline-widget'
          }
        }
      };
    });

    const decorationIds = editorRef.current.deltaDecorations([], newDecorations);
    setDecorations(decorationIds);
  };

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    updateActiveDocument({ code: newCode });
    
    // Clear existing history timeout
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }
    
    // Always update history when user types (not during undo/redo)
    const currentDoc = getActiveDocument();
    if (currentDoc.historyIndex === currentDoc.documentHistory.length - 1) {
      // Debounce history updates to avoid too many entries
      historyTimeoutRef.current = setTimeout(() => {
        const updatedDoc = getActiveDocument();
        updateActiveDocument({
          documentHistory: [...updatedDoc.documentHistory, newCode],
          historyIndex: updatedDoc.historyIndex + 1
        });
      }, 500); // Reduced to 500ms for better responsiveness
    }
  };

  // Document title editing
  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTitleInput(documentTitle);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleInput(e.target.value);
  };

  const handleTitleSave = () => {
    const newTitle = titleInput.trim() || 'Untitled document';
    updateActiveDocument({ title: newTitle });
    setIsEditingTitle(false);
    localStorage.setItem('documentTitle', newTitle);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitleInput(documentTitle);
      setIsEditingTitle(false);
    }
  };

  // Document actions
  const handleNewDocument = () => {
    const newDoc = createNewDocument('Untitled document', language);
    setDocuments(prev => {
      const newDocs = [...prev, newDoc];
      setActiveDocumentIndex(newDocs.length - 1);
      return newDocs;
    });
    setTitleInput('Untitled document');
    setError(null);
    clearAllDecorations();
    setActiveTab('suggestions');
  };

  const handleSwitchDocument = (index: number) => {
    if (index >= 0 && index < documents.length) {
      setActiveDocumentIndex(index);
      setTitleInput(documents[index].title);
      setError(null);
      clearAllDecorations();
      setActiveTab('suggestions');
    }
  };

  const handleCloseDocument = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (documents.length <= 1) {
      // Don't allow closing the last document, just reset it
      const newDoc = createNewDocument('Untitled document', 'python');
      setDocuments([newDoc]);
      setActiveDocumentIndex(0);
      setTitleInput('Untitled document');
      setError(null);
      clearAllDecorations();
      return;
    }
    
    const newDocs = documents.filter((_, i) => i !== index);
    setDocuments(newDocs);
    
    // Adjust active index if needed
    if (index === activeDocumentIndex) {
      // Closing the active document
      const newIndex = index >= newDocs.length ? newDocs.length - 1 : index;
      setActiveDocumentIndex(newIndex);
      setTitleInput(newDocs[newIndex].title);
    } else if (index < activeDocumentIndex) {
      // Closing a document before the active one
      setActiveDocumentIndex(activeDocumentIndex - 1);
    }
    setError(null);
    clearAllDecorations();
  };

  // Drag and drop handlers for tab reordering
  const handleDragStart = (index: number) => {
    setDraggedTabIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTabIndex !== null && draggedTabIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedTabIndex === null || draggedTabIndex === dropIndex) {
      setDraggedTabIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newDocs = [...documents];
    const draggedDoc = newDocs[draggedTabIndex];
    
    // Remove dragged item
    newDocs.splice(draggedTabIndex, 1);
    
    // Calculate the correct drop index after removal
    let finalDropIndex = dropIndex;
    if (draggedTabIndex < dropIndex) {
      finalDropIndex = dropIndex - 1;
    }
    
    // Insert at new position
    newDocs.splice(finalDropIndex, 0, draggedDoc);
    
    setDocuments(newDocs);
    
    // Update active index
    if (draggedTabIndex === activeDocumentIndex) {
      setActiveDocumentIndex(finalDropIndex);
    } else if (draggedTabIndex < activeDocumentIndex && finalDropIndex >= activeDocumentIndex) {
      setActiveDocumentIndex(activeDocumentIndex - 1);
    } else if (draggedTabIndex > activeDocumentIndex && finalDropIndex <= activeDocumentIndex) {
      setActiveDocumentIndex(activeDocumentIndex + 1);
    }
    
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        updateActiveDocument({
          code: content,
          title: fileName,
          documentHistory: [content],
          historyIndex: 0,
          feedback: []
        });
        setTitleInput(fileName);
        setError(null);
        localStorage.setItem('documentTitle', fileName);
      };
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    // Map language to file extension
    const extensionMap: Record<string, string> = {
      'python': 'py',
      'java': 'java',
      'ruby': 'rb',
      'php': 'php',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'cs',
      'go': 'go',
      'rust': 'rs',
    };
    
    const extension = extensionMap[language.toLowerCase()] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${documentTitle}</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; padding: 20px; }
              .header { font-weight: bold; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">${documentTitle}</div>
            ${code}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    if (!code.trim()) {
      setError('Cannot share empty code. Please add some code first.');
      return;
    }

    setIsSharing(true);
    setShareCopied(false);
    setError(null);
    setShareModalOpen(true);

    try {
      const backendLanguage = getBackendLanguage(language);
      const result = await shareCode({
        code: code.trim(),
        language: backendLanguage,
        title: documentTitle
      });

      // Construct the full share URL using the current origin
      // Use base pathname (remove any existing query params)
      const basePath = window.location.pathname;
      const fullShareUrl = `${window.location.origin}${basePath}?share=${result.share_id}`;
      setShareUrl(fullShareUrl);
      
      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(fullShareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      } catch (clipboardErr) {
        console.error('Failed to copy to clipboard:', clipboardErr);
      }
    } catch (err: any) {
      console.error('Share error:', err);
      setError(err.response?.data?.detail || 'Failed to share code. Please try again.');
      setShareModalOpen(false);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      } catch (err) {
        console.error('Failed to copy:', err);
        setError('Failed to copy link to clipboard');
      }
    }
  };


  // Edit actions
  const handleUndo = () => {
    const currentDoc = getActiveDocument();
    if (currentDoc.historyIndex > 0) {
      // Clear any pending history updates
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
      const newIndex = currentDoc.historyIndex - 1;
      updateActiveDocument({
        historyIndex: newIndex,
        code: currentDoc.documentHistory[newIndex]
      });
    }
  };

  const handleRedo = () => {
    const currentDoc = getActiveDocument();
    if (currentDoc.historyIndex < currentDoc.documentHistory.length - 1) {
      // Clear any pending history updates
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
      const newIndex = currentDoc.historyIndex + 1;
      updateActiveDocument({
        historyIndex: newIndex,
        code: currentDoc.documentHistory[newIndex]
      });
    }
  };

  const handleCut = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editorRef.current.getModel()?.getValueInRange(selection);
        navigator.clipboard.writeText(selectedText || '');
        editorRef.current.executeEdits('cut', [{
          range: selection,
          text: ''
        }]);
      }
    }
  };

  const handleCopy = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editorRef.current.getModel()?.getValueInRange(selection);
        navigator.clipboard.writeText(selectedText || '');
      }
    }
  };

  const handlePaste = async () => {
    if (editorRef.current) {
      try {
        const text = await navigator.clipboard.readText();
        const selection = editorRef.current.getSelection();
        editorRef.current.executeEdits('paste', [{
          range: selection || editorRef.current.getPosition(),
          text: text
        }]);
      } catch (err) {
        console.error('Failed to paste:', err);
      }
    }
  };

  const handleSelectAll = () => {
    if (editorRef.current) {
      editorRef.current.setSelection(editorRef.current.getModel()?.getFullModelRange());
    }
  };

  const checkAchievements = () => {
    const newAchievements: Achievement[] = [];
    const existingAchievementIds = achievements.map(a => a.id);

    // First analysis achievement
    if (!existingAchievementIds.includes('first_analysis')) {
      newAchievements.push({
        id: 'first_analysis',
        title: 'First Steps',
        description: 'Completed your first code analysis',
        icon: '🎯',
        unlockedAt: new Date().toISOString(),
        category: 'milestone'
      });
    }

    // High score achievement
    if (scores.overall && scores.overall >= 90 && !existingAchievementIds.includes('high_scorer')) {
      newAchievements.push({
        id: 'high_scorer',
        title: 'Code Master',
        description: 'Achieved a score of 90+',
        icon: '⭐',
        unlockedAt: new Date().toISOString(),
        category: 'quality'
      });
    }

    if (newAchievements.length > 0) {
      const updatedAchievements = [...achievements, ...newAchievements];
      updateActiveDocument({ achievements: updatedAchievements });
      localStorage.setItem('codingAchievements', JSON.stringify(updatedAchievements));
    }
  };

  const handleOverallScore = () => {
    setScoreModalOpen(true);
  };

  // Bottom toolbar actions
  const handleIndent = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.indentLines', null);
    }
  };

  const handleOutdent = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.outdentLines', null);
    }
  };

  const handleComment = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.commentLine', null);
    }
  };

  const [isFormatting, setIsFormatting] = useState(false);

  const handleFormatCode = async () => {
    if (!code.trim()) {
      setError('No code to format.');
      return;
    }

    if (!editorRef.current) {
      setError('Editor not available.');
            return;
          }
          
    setIsFormatting(true);
    setError(null);

    try {
      const backendLanguage = getBackendLanguage(language);
      const result = await formatCode({ code, language: backendLanguage });
          
          if (result.formatted_code) {
        const editor = editorRef.current;
        const model = editor.getModel();
        
        if (model) {
          // Replace entire document with formatted code
          const fullRange = model.getFullModelRange();
          editor.executeEdits('format-code', [{
            range: fullRange,
            text: result.formatted_code
          }]);
          
          // Update document state
          updateActiveDocument({ code: result.formatted_code });
          
          // Update history
          const currentDoc = getActiveDocument();
          updateActiveDocument({
            documentHistory: [...currentDoc.documentHistory, result.formatted_code],
            historyIndex: currentDoc.historyIndex + 1
          });

          // Code formatted successfully
        }
      }
    } catch (err: any) {
      console.error('Formatting error:', err);
      let errorMessage = 'Failed to format code. Please try again.';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsFormatting(false);
    }
  };


  // Code execution handler
  const handleExecuteCode = async () => {
    if (!code.trim()) {
      setError('No code to execute.');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setExecutionResult(null);

    try {
      const backendLanguage = getBackendLanguage(language);
      const result = await executeCode({ code, language: backendLanguage });
      setExecutionResult(result);
      setOutputPanelOpen(true); // Open output panel at bottom
      
      if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      console.error('Execution error:', err);
      let errorMessage = 'Failed to execute code. Please try again.';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFind = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      // Simulate Ctrl+F / Cmd+F keyboard shortcut
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const editorElement = editorRef.current.getDomNode();
      if (editorElement) {
        const event = new KeyboardEvent('keydown', {
          key: 'f',
          code: 'KeyF',
          ctrlKey: !isMac,
          metaKey: isMac,
          bubbles: true,
          cancelable: true
        });
        editorElement.dispatchEvent(event);
      }
    }
  };

  const handleReplace = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      // Simulate Ctrl+H / Cmd+Option+F keyboard shortcut
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const editorElement = editorRef.current.getDomNode();
      if (editorElement) {
        const event = new KeyboardEvent('keydown', {
          key: isMac ? 'f' : 'h',
          code: isMac ? 'KeyF' : 'KeyH',
          ctrlKey: !isMac,
          metaKey: isMac,
          altKey: isMac,
          bubbles: true,
          cancelable: true
        });
        editorElement.dispatchEvent(event);
      }
    }
  };


  // Suggestion actions
  const handleAcceptSuggestion = (suggestionId: string) => {
    const suggestion = feedback.find(item => item.id === suggestionId);
    
    if (suggestion && editorRef.current) {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      if (model) {
        let success = false;
        
        // If we have specific text to replace - use line-based replacement for context
        if (suggestion.originalText && suggestion.originalText.trim()) {
          // Get the line number for context-aware replacement
          const lineNumber = suggestion.line;
          const lineText = model.getLineContent(lineNumber);
          
          // Try to find the original text in the specific line first (preserves context)
          if (lineText.includes(suggestion.originalText.trim())) {
            // Replace only the problematic part, preserving indentation
            const newLineText = lineText.replace(suggestion.originalText.trim(), suggestion.suggestion.trim());
            
            editor.executeEdits('suggestion-accept', [{
              range: {
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber,
                endColumn: lineText.length + 1
              },
              text: newLineText
            }]);
            success = true;
          } else {
            // Fallback to global replacement but preserve line structure
            const textToReplace = suggestion.originalText.trim();
            const replacement = suggestion.suggestion.trim();
            const fullText = model.getValue();
            
            // Try to find and replace while preserving context
            const lines = fullText.split('\n');
            let foundMatch = false;
            
            // Check each line for the text to replace
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(textToReplace)) {
                // Replace while preserving existing indentation
                const newLineText = lines[i].replace(textToReplace, replacement);
                lines[i] = newLineText;
                foundMatch = true;
                break;
              }
            }
            
            if (foundMatch) {
              const newText = lines.join('\n');
              
              editor.executeEdits('suggestion-accept', [{
                range: model.getFullModelRange(),
                text: newText
              }]);
              success = true;
            }
          }
        }
        
        // Fallback: replace on the specific line with context preservation
        if (!success) {
          const lineNumber = suggestion.line;
          const lineText = model.getLineContent(lineNumber);
          
          // Extract indentation from current line to preserve spacing
          const indentationMatch = lineText.match(/^(\s*)/);
          const currentIndentation = indentationMatch ? indentationMatch[1] : '';
          
          // Try to find the original text in the line
          if (suggestion.originalText && lineText.includes(suggestion.originalText)) {
            // Replace only the problematic part, preserving indentation
            const newLineText = lineText.replace(suggestion.originalText, suggestion.suggestion);
            
            editor.executeEdits('suggestion-accept', [{
              range: {
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber,
                endColumn: lineText.length + 1
              },
              text: newLineText
            }]);
            success = true;
          } else if (suggestion.suggestion) {
            // Try to preserve indentation when replacing entire line
            let newLineText = suggestion.suggestion;
            
            // If suggestion doesn't have indentation, add it from current line
            if (!newLineText.match(/^\s/)) {
              newLineText = currentIndentation + newLineText.trim();
            }
            
            // Ensure the suggestion preserves the line's indentation level
            const suggestionIndentation = newLineText.match(/^(\s*)/)?.[1] || '';
            if (suggestionIndentation.length < currentIndentation.length) {
              // Use current indentation if suggestion has less
              newLineText = currentIndentation + newLineText.trim();
            }
            
            editor.executeEdits('suggestion-accept', [{
              range: {
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber,
                endColumn: lineText.length + 1
              },
              text: newLineText
            }]);
            success = true;
          }
        }
        
        if (success) {
          // Get the updated code after the change
          const updatedCode = model.getValue();
          const updatedLines = updatedCode.split('\n');
          const changedLineNumber = suggestion.line;
          
          // Remove the accepted suggestion
          let newFeedback = feedback.filter(item => item.id !== suggestionId);
          
          // Update other suggestions for the same line to reflect the change
          newFeedback = newFeedback.map(item => {
            if (item.line === changedLineNumber && item.id !== suggestionId) {
              // Get the updated line content
              const updatedLine = updatedLines[changedLineNumber - 1];
              if (updatedLine) {
                // Check if this suggestion is now invalid (e.g., colon already added)
                const suggestionText = item.suggestion.trim();
                const currentLine = updatedLine.trim();
                
                // Check if the suggestion would create a duplicate (e.g., adding colon when one exists)
                if (suggestionText.includes(':') && currentLine.includes(':')) {
                  // Skip this suggestion - colon already added
                  return null;
                }
                
                // Check if suggestion is already applied
                if (currentLine.includes(suggestionText) || suggestionText === currentLine) {
                  return null;
                }
                
                // Update originalText to reflect the current state
                return {
                  ...item,
                  originalText: currentLine
                };
              }
            }
            return item;
          }).filter(item => item !== null) as FeedbackItem[];
          
      updateActiveDocument({ feedback: newFeedback, code: updatedCode });
          
          // Update decorations to reflect the new state
          setTimeout(() => {
            if (editorRef.current) {
              updateEditorDecorations();
            }
          }, 100);
        }
      }
    }
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    // Remove the suggestion from the list
    const newFeedback = feedback.filter(item => item.id !== suggestionId);
    updateActiveDocument({ feedback: newFeedback });
  };


  // Map language codes for Monaco Editor (Monaco uses different IDs than backend)
  const getMonacoLanguage = (lang: string): string => {
    const mapping: Record<string, string> = {
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'ruby': 'ruby',
      'php': 'php',
      'go': 'go',
      'rust': 'rust',
    };
    return mapping[lang] || 'python';
  };

  // Map language codes for backend API (backend expects readable names)
  const getBackendLanguage = (lang: string): string => {
    const mapping: Record<string, string> = {
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'ruby': 'ruby',
      'php': 'php',
      'go': 'go',
      'rust': 'rust',
    };
    return mapping[lang] || 'python';
  };

  const getFrontendLanguage = (backendLang: string): string => {
    // Map backend language back to frontend language format
    const mapping: Record<string, string> = {
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'ruby': 'ruby',
      'php': 'php',
      'go': 'go',
      'rust': 'rust',
    };
    return mapping[backendLang] || 'python';
  };


  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    // Update code to starter code for the new language
    const starterCode = getStarterCode(newLanguage);
    updateActiveDocument({
      language: newLanguage,
      code: starterCode,
      documentHistory: [starterCode],
      historyIndex: 0
    });
  };

  return (
    <div className={`grammarly-app ${darkMode ? 'dark-mode' : ''}`}>
      {/* Document Tabs */}
      <div className="document-tabs">
        {documents.map((doc, index) => (
          <div
            key={doc.id}
            className={`document-tab ${index === activeDocumentIndex ? 'active' : ''} ${draggedTabIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => handleSwitchDocument(index)}
          >
            <span className="tab-title">{doc.title}</span>
            {documents.length > 1 && (
              <button
                className="tab-close"
                onClick={(e) => handleCloseDocument(index, e)}
                onMouseDown={(e) => e.stopPropagation()}
                onDragStart={(e) => e.stopPropagation()}
                title="Close tab"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {/* Drop zone after last tab */}
        <div
          className={`tab-drop-zone ${dragOverIndex === documents.length ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedTabIndex !== null) {
              setDragOverIndex(documents.length);
            }
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, documents.length)}
        />
        <button
          className="document-tab new-tab"
          onClick={handleNewDocument}
          title="New document"
        >
          <Plus size={14} />
        </button>
      </div>
      {/* Left Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">My AI Mentor</div>
          <button 
            className="close-sidebar-btn"
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3>DOCUMENT</h3>
            <div className="sidebar-btn-group">
              <button className="sidebar-btn" onClick={handleNewDocument}>
                <Plus size={16} />
                <span>New document</span>
              </button>
              <button className="sidebar-btn" onClick={handleUploadFile}>
                <Upload size={16} />
                <span>Upload file</span>
              </button>
              <button className="sidebar-btn" onClick={handleDownload}>
                <Download size={16} />
                <span>Download</span>
              </button>
              <button className="sidebar-btn" onClick={handlePrint}>
                <Printer size={16} />
                <span>Print</span>
              </button>
              <button className="sidebar-btn" onClick={handleShare}>
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".py,.rb,.php,.java,.cpp,.c,.cs,.go,.rs,.txt"
            />
          </div>

          <div className="sidebar-section">
            <h3>EDIT</h3>
            <div className="sidebar-btn-group">
              <button 
                className="sidebar-btn" 
                onClick={handleUndo} 
                disabled={historyIndex === 0}
                title={`Undo (${historyIndex}/${documentHistory.length - 1})`}
              >
                <Undo2 size={16} />
                <span>Undo</span>
              </button>
              <button 
                className="sidebar-btn" 
                onClick={handleRedo} 
                disabled={historyIndex === documentHistory.length - 1}
                title={`Redo (${historyIndex}/${documentHistory.length - 1})`}
              >
                <Redo2 size={16} />
                <span>Redo</span>
              </button>
              <div className="sidebar-divider"></div>
              <button className="sidebar-btn" onClick={handleCut}>
                <Scissors size={16} />
                <span>Cut</span>
              </button>
              <button className="sidebar-btn" onClick={handleCopy}>
                <Copy size={16} />
                <span>Copy</span>
              </button>
              <button className="sidebar-btn" onClick={handlePaste}>
                <Clipboard size={16} />
                <span>Paste</span>
              </button>
              <button className="sidebar-btn" onClick={handleSelectAll}>
                <Square size={16} />
                <span>Select all</span>
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>SETTINGS</h3>
            <div className="sidebar-btn-group">
              <button 
                className="sidebar-btn" 
                onClick={toggleDarkMode}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <div className="top-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </button>
          <div className="document-title">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleInput}
                onChange={handleTitleChange}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="title-input"
              />
            ) : (
              <span 
                className="title-text editable"
                onClick={handleTitleClick}
                title="Click to edit"
              >
                {documentTitle}
              </span>
            )}
          </div>
          <div className="header-actions">
            <button className="header-btn header-btn-primary" onClick={handleExecuteCode} disabled={!code.trim() || isExecuting}>
              {isExecuting ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run Code
                </>
              )}
            </button>
            <button className="header-btn" onClick={handleManualAnalysis} disabled={!code.trim() || isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Analyze Code
                </>
              )}
            </button>
            <button className="header-btn" onClick={handleGenerateLesson} disabled={!code.trim() || isGeneratingLesson}>
              <BookOpen size={16} />
              {isGeneratingLesson ? 'Loading...' : 'Learn Concepts'}
            </button>
            <button className="header-btn" onClick={handleOverallScore}>
              <BarChart3 size={16} />
              Overall score
            </button>
            <button className="header-btn" onClick={() => setMetricsModalOpen(true)}>
              <Activity size={16} />
              Metrics
            </button>
          </div>
        </div>

        {/* Editor and Suggestions Layout */}
        <div className="content-layout" style={{ height: outputPanelOpen ? `calc(100vh - 140px - ${outputPanelHeight}px)` : 'calc(100vh - 140px)' }}>
          {/* Code Editor */}
          <div className="editor-container">
            <div className="editor-header">
              <div className="editor-header-left">
              <select 
                value={language} 
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="language-selector"
              >
                {getLanguageOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
                <div className="editor-toolbar">
                  <div className="toolbar-group">
                    <button className="toolbar-btn icon-only" onClick={handleIndent} title="Indent">
                      <ChevronRight size={16} />
                    </button>
                    <button className="toolbar-btn icon-only" onClick={handleOutdent} title="Outdent">
                      <ChevronLeft size={16} />
                    </button>
                    <button className="toolbar-btn icon-only" onClick={handleComment} title="Toggle Comment">
                      <MessageSquare size={16} />
                    </button>
                  </div>
                  <div className="toolbar-separator"></div>
                  <div className="toolbar-group">
                    <button className="toolbar-btn icon-only" onClick={handleFind} title="Find">
                      <SearchIcon size={16} />
                    </button>
                    <button className="toolbar-btn icon-only" onClick={handleReplace} title="Find & Replace">
                      <Replace size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="editor-header-right">
                <button 
                  className="toolbar-btn" 
                  onClick={handleFormatCode} 
                  disabled={!code.trim() || isFormatting}
                  title="Format Code"
                >
                  {isFormatting ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Formatting...
                    </>
                  ) : (
                    <>
                      <Code size={16} />
                      Format
                    </>
                  )}
                </button>
                <span className="char-count">{code.length} characters</span>
              </div>
            </div>
            
            <div className="editor-wrapper">
              <Editor
                height="100%"
                language={getMonacoLanguage(language)}
                value={code}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme={darkMode ? "vs-dark" : "vs-light"}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  padding: { top: 20, bottom: 20 },
                }}
              />
              
              {/* Analysis Status */}
              {isAnalyzing && (
                <div className="analysis-overlay">
                  <div className="analysis-spinner">
                    <div className="spinner"></div>
                    <span>Analyzing code...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Suggestions Panel */}
          <div className="suggestions-panel">
            <div className="suggestions-tabs">
              <button 
                className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
                onClick={() => setActiveTab('suggestions')}
              >
                Review suggestions {feedback.length > 0 && `(${feedback.length})`}
              </button>
              <button 
                className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai')}
              >
                Write with generative AI
              </button>
              <button 
                className={`tab ${activeTab === 'visualizer' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('visualizer');
                  if (!visualization && code.trim()) {
                    handleVisualizeCode();
                  }
                }}
              >
                Code Explainer
              </button>
              <button 
                className={`tab ${activeTab === 'diagram' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('diagram');
                  if (!diagram && code.trim()) {
                    handleGenerateDiagram();
                  }
                }}
              >
                Code Visualizer
              </button>
            </div>

            <div className="suggestions-content">
              {activeTab === 'suggestions' && (
                <div className="suggestions-tab-content">
                  <div className="suggestions-list">
                    {error && (
                      <div className="suggestion-item error">
                        <div className="suggestion-content">
                          <div className="suggestion-text">
                            <strong>Error:</strong> {error}
                          </div>
                          <div className="suggestion-actions">
                            <button className="accept-btn" onClick={() => setError(null)}>Accept</button>
                            <button className="dismiss-btn" onClick={() => setError(null)}>Dismiss</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {feedback.length === 0 && !isAnalyzing && !error && (
                      <div className="no-suggestions">
                        <p>
                          Your code looks good!
                        </p>
                        <p className="sub-text">Click "Analyze Code" to get feedback</p>
                      </div>
                    )}

                    {feedback
                      .filter((item) => {
                        // Filter out items with empty, "None", or meaningless messages
                        const message = item.message?.trim().toLowerCase();
                        return message && 
                               message !== 'none' && 
                               message !== 'no information provided.' &&
                               message !== '[none]' &&
                               message.length > 0;
                      })
                      .map((item) => (
                      <div key={item.id} className={`suggestion-item ${item.type}`}>
                        <div className="suggestion-content">
                          <div className="suggestion-text">
                            <div className="suggestion-header">
                              <strong>{item.type === 'error' ? 'Fix error:' : item.type === 'warning' ? 'Warning:' : 'Suggestion:'}</strong>
                              <span className="line-number">Line {item.line}</span>
                            </div>
                            <div className="suggestion-message">{item.message}</div>
                            {item.originalText && (
                              <div className="suggestion-details">
                                <span className="original-text">"{item.originalText}"</span>
                                <span className="arrow">→</span>
                                <span className="suggested-text">"{item.suggestion}"</span>
                              </div>
                            )}
                          </div>
                          <div className="suggestion-actions">
                            <button 
                              className="accept-btn" 
                              onClick={() => handleAcceptSuggestion(item.id)}
                              title="Accept this suggestion"
                            >
                              Accept
                            </button>
                            <button 
                              className="dismiss-btn" 
                              onClick={() => handleDismissSuggestion(item.id)}
                              title="Dismiss this suggestion"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'visualizer' && (
                <div className="visualizer-content">
                  {isVisualizing ? (
                    <div className="visualizer-loading">
                      <div className="spinner"></div>
                      <span>Analyzing code execution flow...</span>
                    </div>
                  ) : visualization ? (
                    <div className="visualizer-results">
                      <div className="visualizer-header">
                        <h3>Code Execution Flow</h3>
                        <button 
                          className="refresh-btn"
                          onClick={handleVisualizeCode}
                          title="Refresh visualization"
                        >
                          <Play size={16} />
                          Refresh
                        </button>
                      </div>

                      {visualization.explanation && (
                        <div className="visualizer-explanation">
                          <h4>Overview</h4>
                          <p>{visualization.explanation}</p>
                        </div>
                      )}

                      {visualization.steps && visualization.steps.length > 0 && (
                        <div className="visualizer-steps">
                          <h4>Step-by-Step Execution</h4>
                          <div className="steps-list">
                            {visualization.steps.map((step, index) => (
                              <div key={index} className="step-item">
                                <div className="step-header">
                                  <span className="step-number">Step {step.step_number}</span>
                                  <span className="step-line">
                                    Line {step.line_number}{step.line_end ? `-${step.line_end}` : ''}
                                  </span>
                                </div>
                                <div className="step-description">{step.description}</div>
                                {step.action && (
                                  <div className="step-action">
                                    <strong>Action:</strong> {step.action}
                                  </div>
                                )}
                                {step.variables && (
                                  <div className="step-variables">
                                    <strong>Variables:</strong> {typeof step.variables === 'string' ? step.variables : JSON.stringify(step.variables)}
                                  </div>
                                )}
                                {step.output && (
                                  <div className="step-output">
                                    <strong>Output:</strong> {step.output}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {visualization.flow_diagram && (
                        <div className="visualizer-flow">
                          <h4>Execution Flow Diagram</h4>
                          <pre className="flow-diagram">{visualization.flow_diagram}</pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="visualizer-empty">
                      <h3>Code Explainer</h3>
                      <p>Click "Refresh" or enter code to visualize how it executes step by step.</p>
                      <button 
                        className="visualize-btn"
                        onClick={handleVisualizeCode}
                        disabled={!code.trim() || isVisualizing}
                      >
                        <Play size={16} />
                        Visualize Code
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'diagram' && (
                <div className="diagram-content">
                  {isGeneratingDiagram ? (
                    <div className="diagram-loading">
                      <div className="spinner"></div>
                      <p>Generating diagram...</p>
                    </div>
                  ) : error && activeTab === 'diagram' ? (
                    <div className="diagram-results">
                      <div className="diagram-header">
                        <h3>Code Visualizer</h3>
                        <button 
                          className="visualize-btn"
                          onClick={handleGenerateDiagram}
                          disabled={!code.trim() || isGeneratingDiagram}
                        >
                          <Network size={16} />
                          Retry
                        </button>
                      </div>
                      <div className="diagram-error" style={{ marginTop: '20px' }}>
                        {error}
                      </div>
                    </div>
                  ) : diagram ? (
                    <div className="diagram-results">
                      <div className="diagram-header">
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="visualize-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDownloadDiagram();
                            }}
                            disabled={!diagram && !diagramRef.current?.querySelector('svg')}
                            title="Download diagram as image"
                          >
                            <Download size={16} />
                            Download
                          </button>
                          <button 
                            className="visualize-btn"
                            onClick={handleGenerateDiagram}
                            disabled={!code.trim() || isGeneratingDiagram}
                            title="Regenerate diagram"
                          >
                            <Network size={16} />
                            Refresh
                          </button>
                        </div>
                      </div>
                      
                      {/* Check if this is an error diagram */}
                      {diagram.explanation && diagram.explanation.includes('Error generating diagram') ? (
                        <div className="diagram-error" style={{ marginBottom: '20px' }}>
                          {diagram.explanation}
                        </div>
                      ) : diagram.explanation ? (
                        <div className="diagram-explanation">
                          <h4>About this diagram</h4>
                          <p>{diagram.explanation}</p>
                        </div>
                      ) : null}

                      <div className="diagram-container">
                        {/* Always render the ref container so it's available for rendering */}
                        <div ref={diagramRef} className="mermaid-container"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="diagram-empty">
                      <Network size={48} />
                      <h3>Code Visualizer</h3>
                      <p>Click "Generate" or enter code to create a visual diagram of your code structure.</p>
                      <button 
                        className="visualize-btn"
                        onClick={handleGenerateDiagram}
                        disabled={!code.trim() || isGeneratingDiagram}
                      >
                        <Network size={16} />
                        Generate Diagram
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="ai-chat-content">
                  {/* Chat Messages */}
                  <div className="ai-chat-messages" ref={aiMessagesRef}>
                    {aiMessages.length === 0 && (
                      <div className="ai-chat-empty">
                        <h3>Start a conversation</h3>
                        <p>Describe what you want to code, and I'll help you generate it.</p>
                </div>
              )}

                    {aiMessages.map((message, index) => (
                      <div key={index} className={`ai-message ${message.type}`}>
                        {message.type === 'user' ? (
                          <div className="message-content">
                            <div className="message-avatar user">
                              <User size={16} />
                </div>
                            <div className="message-text">{message.content}</div>
                          </div>
                        ) : (
                          <div className="message-content">
                            <div className="message-avatar ai">
                              <Sparkles size={16} />
                            </div>
                            <div className="message-body">
                              {message.content && (
                                <div className="message-text">{message.content}</div>
                              )}
                              {message.code && (
                                <div className="message-code-block">
                                  <div className="code-header">
                                    <span className="code-language">{language}</span>
                                    <div className="code-actions">
                                      <button
                                        className="code-action-btn apply-btn"
                                        onClick={() => handleApplyGeneratedCode(message.code!)}
                                        title="Replace all code with this"
                                      >
                                        <CheckCircle size={14} />
                                      </button>
                                      <button
                                        className="code-action-btn"
                                        onClick={() => handleInsertGeneratedCode(message.code!)}
                                        title="Insert at cursor position"
                                      >
                                        <Plus size={14} />
                                      </button>
                                      <button
                                        className="code-action-btn"
                                        onClick={() => {
                                          navigator.clipboard.writeText(message.code!);
                                        }}
                                        title="Copy code"
                                      >
                                        <Copy size={14} />
                                      </button>
            </div>
          </div>
                                  <pre><code>{message.code}</code></pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isGenerating && (
                      <div className="ai-message ai">
                        <div className="message-content">
                          <div className="message-avatar ai">
                            <Sparkles size={16} />
                          </div>
                          <div className="message-body">
                            <div className="typing-indicator">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Context Toggle */}
                  {code.trim() && (
                    <div className="ai-context-bar">
                      <button
                        className={`context-toggle-btn ${useContext ? 'active' : ''}`}
                        onClick={() => setUseContext(!useContext)}
                      >
                        {useContext ? (
                          <>
                            <CheckCircle size={14} />
                            Using context
                          </>
                        ) : (
                          <>
                            <Square size={14} />
                            Include context
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Input Area at Bottom */}
                  <div className="ai-chat-input-area">
                    <div className="ai-input-wrapper">
                      <textarea
                        ref={aiInputRef}
                        className="ai-chat-input"
                        placeholder="Ask me to generate code..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={handlePromptKeyDown}
                        rows={1}
                        disabled={isGenerating}
                      />
                      <button
                        className="ai-send-btn"
                        onClick={handleGenerateCode}
                        disabled={!aiPrompt.trim() || isGenerating}
                        title="Send message (Enter)"
                      >
                        {isGenerating ? (
                          <Clock size={18} className="animate-spin" />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output Panel (Bottom Terminal) */}
        {outputPanelOpen && (
          <div 
            className="output-panel-container" 
            style={{ 
              height: `${outputPanelHeight}px`,
              left: sidebarOpen ? '300px' : '0',
              right: '400px'
            }}
          >
            <div 
              className="output-panel-resizer"
              onMouseDown={(e) => {
                setIsResizingOutput(true);
                e.preventDefault();
              }}
            />
            <div className="output-panel-header">
              <div className="output-panel-title">
                <Play size={14} />
                <span>Output</span>
                {executionResult && (
                  <span className={`output-status ${executionResult.exit_code === 0 ? 'success' : 'error'}`}>
                    {executionResult.exit_code === 0 ? '✓' : '✗'} Exit Code: {executionResult.exit_code}
                  </span>
                )}
                {executionResult && (
                  <span className="output-time">Time: {executionResult.execution_time}s</span>
                )}
              </div>
              <div className="output-panel-actions">
                <button 
                  className="output-panel-btn"
                  onClick={() => setOutputPanelOpen(false)}
                  title="Close panel"
                >
                  <X size={14} />
            </button>
              </div>
            </div>
            <div className="output-panel-content">
              {isExecuting ? (
                <div className="output-loading">
                  <div className="spinner"></div>
                  <span>Executing code...</span>
                </div>
              ) : executionResult ? (
                <>
                  {executionResult.output && (
                    <pre className="output-text">{executionResult.output}</pre>
                  )}
                  {executionResult.error && (
                    <pre className="output-text error">{executionResult.error}</pre>
                  )}
                  {!executionResult.output && !executionResult.error && (
                    <div className="output-empty">
                      <p>No output generated.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="output-empty">
                  <p>Click "Run Code" to execute your code and see the output here.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Lesson Modal */}
      {lessonModalOpen && (
        <div className="modal-overlay" onClick={() => setLessonModalOpen(false)}>
          <div className="lesson-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lesson-modal-header">
              <h2>Learn Concepts</h2>
              <button className="close-modal-btn" onClick={() => setLessonModalOpen(false)}>
                <X size={20} />
            </button>
            </div>
            <div className="lesson-modal-content">
              {isGeneratingLesson ? (
                <div className="lessons-loading">
                  <div className="spinner"></div>
                  <p>Generating lesson...</p>
                </div>
              ) : error ? (
                <div className="lessons-error">
                  <AlertCircle size={20} />
                  <p>{error}</p>
                  <button className="retry-btn" onClick={handleGenerateLesson}>
                    Retry
            </button>
          </div>
              ) : lesson ? (
                <div className="lessons-results">
                  <div className="lesson-content">
                    <div className="lesson-text">
                      {(() => {
                        const lines = lesson.split('\n');
                        const elements: React.ReactElement[] = [];
                        let inCodeBlock = false;
                        let codeBlockContent: string[] = [];
                        let codeBlockLanguage = '';
                        let codeBlockIndex = 0;

                        for (let i = 0; i < lines.length; i++) {
                          const line = lines[i];

                          // Check for code block start
                          if (line.startsWith('```')) {
                            if (inCodeBlock) {
                              // End of code block
                              elements.push(
                                <pre key={`code-${codeBlockIndex}`} className="lesson-code-block">
                                  <code className={`language-${codeBlockLanguage}`}>
                                    {codeBlockContent.join('\n')}
                                  </code>
                                </pre>
                              );
                              codeBlockContent = [];
                              codeBlockLanguage = '';
                              inCodeBlock = false;
                              codeBlockIndex++;
                            } else {
                              // Start of code block
                              codeBlockLanguage = line.substring(3).trim() || 'text';
                              inCodeBlock = true;
                            }
                            continue;
                          }

                          if (inCodeBlock) {
                            codeBlockContent.push(line);
                            continue;
                          }

                          // Handle markdown-style headers
                          if (line.startsWith('# ')) {
                            elements.push(<h1 key={i}>{line.substring(2)}</h1>);
                          } else if (line.startsWith('## ')) {
                            elements.push(<h2 key={i}>{line.substring(3)}</h2>);
                          } else if (line.startsWith('### ')) {
                            elements.push(<h3 key={i}>{line.substring(4)}</h3>);
                          } else if (line.startsWith('#### ')) {
                            elements.push(<h4 key={i}>{line.substring(5)}</h4>);
                          } else if (line.trim() === '') {
                            elements.push(<br key={i} />);
                          } else {
                            // Handle inline code and bold text
                            const parts = line.split(/(\*\*.*?\*\*|`[^`]+`)/g);
                            elements.push(
                              <p key={i}>
                                {parts.map((part, pIndex) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={pIndex}>{part.slice(2, -2)}</strong>;
                                  } else if (part.startsWith('`') && part.endsWith('`')) {
                                    return <code key={pIndex} className="lesson-inline-code">{part.slice(1, -1)}</code>;
                                  }
                                  return <span key={pIndex}>{part}</span>;
                                })}
                              </p>
                            );
                          }
                        }

                        // Close any remaining code block
                        if (inCodeBlock && codeBlockContent.length > 0) {
                          elements.push(
                            <pre key={`code-${codeBlockIndex}`} className="lesson-code-block">
                              <code className={`language-${codeBlockLanguage}`}>
                                {codeBlockContent.join('\n')}
                              </code>
                            </pre>
                          );
                        }

                        return elements;
                      })()}
          </div>
        </div>
      </div>
              ) : (
                <div className="lessons-empty">
                  <BookOpen size={48} />
                  <h3>Learn Concepts</h3>
                  <p>Click "Teach Me" to learn about the core concepts and algorithms in your code.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {scoreModalOpen && (
        <div className="score-modal-overlay" onClick={() => setScoreModalOpen(false)}>
          <div className="score-modal" onClick={(e) => e.stopPropagation()}>
            <div className="score-modal-header">
              <h2>Overall Score</h2>
              <button className="close-modal-btn" onClick={() => setScoreModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="score-modal-content">
              {scores.overall !== undefined ? (
                <>
                  <div className="overall-score-display">
                    <div className="score-circle">
                      <div className="score-number">{scores.overall}</div>
                      <div className="score-label">Overall</div>
                    </div>
                  </div>

                  <div className="score-breakdown">
                    <div className="score-category">
                      <div className="category-header">
                        <span className="category-name">Correctness</span>
                        <span className="category-score">{scores.correctness ?? 100}</span>
                      </div>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ width: `${scores.correctness ?? 100}%` }}
                        ></div>
                      </div>
                      <div className="category-description">
                        Code correctness and error-free execution
                      </div>
                    </div>

                    <div className="score-category">
                      <div className="category-header">
                        <span className="category-name">Clarity</span>
                        <span className="category-score">{scores.clarity ?? 100}</span>
                      </div>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ width: `${scores.clarity ?? 100}%` }}
                        ></div>
                      </div>
                      <div className="category-description">
                        Readability, naming conventions, and documentation
                      </div>
                    </div>

                    <div className="score-category">
                      <div className="category-header">
                        <span className="category-name">Best Practices</span>
                        <span className="category-score">{scores.bestPractices ?? 100}</span>
                      </div>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ width: `${scores.bestPractices ?? 100}%` }}
                        ></div>
                      </div>
                      <div className="category-description">
                        Following language conventions and design patterns
                      </div>
                    </div>

                    <div className="score-category">
                      <div className="category-header">
                        <span className="category-name">Performance</span>
                        <span className="category-score">{scores.performance ?? 100}</span>
                      </div>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ width: `${scores.performance ?? 100}%` }}
                        ></div>
                      </div>
                      <div className="category-description">
                        Efficiency and optimization opportunities
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-score-message">
                  <AlertCircle size={48} />
                  <p>No score available yet.</p>
                  <p className="sub-text">Run code analysis to get your overall score and breakdown.</p>
                  <button 
                    className="analyze-btn" 
                    onClick={() => {
                      setScoreModalOpen(false);
                      if (code.trim()) {
                        handleManualAnalysis();
                      }
                    }}
                  >
                    Analyze Code
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Modal */}
      {metricsModalOpen && (
        <div className="modal-overlay" onClick={() => setMetricsModalOpen(false)}>
          <div className="metrics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="metrics-modal-header">
              <h2>Code Metrics Dashboard</h2>
              <button className="close-modal-btn" onClick={() => setMetricsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="metrics-modal-content">
              <MetricsDashboard code={code} language={language} darkMode={darkMode} />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="modal-overlay" onClick={() => setShareModalOpen(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h2>Share Code</h2>
              <button className="close-modal-btn" onClick={() => setShareModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="share-modal-content">
              {isSharing ? (
                <div className="share-loading">
                  <div className="spinner"></div>
                  <p>Generating share link...</p>
                </div>
              ) : error ? (
                <div className="share-error">
                  <AlertCircle size={20} />
                  <p>{error}</p>
                  <button className="retry-btn" onClick={handleShare}>
                    Retry
                  </button>
                </div>
              ) : shareUrl ? (
                <div className="share-success">
                  <p className="share-description">
                    Your code has been shared! Copy the link below to share with others.
                  </p>
                  <div className="share-url-container">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="share-url-input"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      className={`copy-share-btn ${shareCopied ? 'copied' : ''}`}
                      onClick={handleCopyShareLink}
                      title="Copy link"
                    >
                      {shareCopied ? (
                        <>
                          <CheckCircle size={16} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="share-info">
                    <AlertCircle size={16} />
                    <span>This link will expire in 30 days</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
