"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
// Using only JavaScript and Python for now
// TODO: Add HTML and CSS support later
import { FolderIcon, FileIcon, XIcon, PlusIcon, PlayIcon } from "lucide-react";

interface FileStructure {
  name: string;
  type: "file" | "directory";
  content?: string;
  path: string;
  children?: FileStructure[];
}

interface Props {
  projectStructure: string; // JSON string of FileStructure[]
  projectFiles: string; // JSON string of initial files
  language: string;
  disabled?: boolean;
}

export const ProjectChallenge = ({
  projectStructure,
  projectFiles,
  language,
  disabled
}: Props) => {
  const [files, setFiles] = useState<FileStructure[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>("");
  const [activeFileContent, setActiveFileContent] = useState<string>("");
  const [isPreviewRunning, setIsPreviewRunning] = useState(false);
  const [previewOutput, setPreviewOutput] = useState<string>("");
  const [consoleOutput, setConsoleOutput] = useState<Array<{type: 'log' | 'error' | 'info'; message: string}>>([]);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentContentRef = useRef<string>("");

  const findFirstFile = useCallback((items: FileStructure[]): FileStructure | null => {
    for (const item of items) {
      if (item.type === "file") return item;
      if (item.children) {
        const found = findFirstFile(item.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    console.log('[ProjectChallenge] Initializing component with:', { structureLength: projectStructure.length, filesLength: projectFiles.length });
    try {
      const structure = JSON.parse(projectStructure);
      const initialFiles = JSON.parse(projectFiles);
      setFiles(structure);
      // Set initial file contents
      const mergedFiles = mergeInitialContent(structure, initialFiles);
      setFiles(mergedFiles);
      // Set first file as active
      const firstFile = findFirstFile(mergedFiles);
      if (firstFile) {
        setActiveFilePath(firstFile.path);
        setActiveFileContent(firstFile.content || "");
        currentContentRef.current = firstFile.content || "";
      }
    } catch (error) {
      console.error("Error parsing project structure:", error);
    }
  }, [projectStructure, projectFiles, findFirstFile]);

  const mergeInitialContent = (structure: FileStructure[], initialContent: Record<string, string>, parentPath: string = "") => {
    const merge = (items: FileStructure[], currentPath: string): FileStructure[] => {
      return items.map(item => {
        const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        if (item.type === "file" && initialContent[item.name]) {
          return { ...item, content: initialContent[item.name], path: itemPath };
        }
        if (item.children) {
          return { ...item, path: itemPath, children: merge(item.children, itemPath) };
        }
        return { ...item, path: itemPath };
      });
    };
    return merge(structure, parentPath);
  };



  const handleFileSelect = (file: FileStructure) => {
    console.log('[ProjectChallenge] File selected:', { path: file.path, type: file.type });
    if (file.type === "file") {
      // Check if there are unsaved changes
      if (hasUnsavedChanges) {
        const confirmSwitch = window.confirm(
          "You have unsaved changes. Are you sure you want to switch files? Your changes will be lost."
        );
        if (!confirmSwitch) {
          return;
        }
      }
      
      // Reset states when switching files
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      setActiveFilePath(file.path);
      setActiveFileContent(file.content || "");
      // Store the initial content of the newly selected file
      currentContentRef.current = file.content || "";
    }
  };

  const handleCodeChange = (value: string) => {
    console.log('[ProjectChallenge] Code changed:', { filePath: activeFilePath, contentLength: value.length });
    if (!activeFilePath) return;
    
    setActiveFileContent(value);
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Compare with the last saved content
    const hasChanges = value !== currentContentRef.current;
    setHasUnsavedChanges(hasChanges);

    // Show saving status
    setSaveStatus("saving");
    
    const updateFileContent = (items: FileStructure[]): FileStructure[] => {
      return items.map(item => {
        if (item.path === activeFilePath) {
          return { ...item, content: value };
        }
        if (item.children) {
          return { ...item, children: updateFileContent(item.children) };
        }
        return item;
      });
    };

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const updatedFiles = updateFileContent(files);
        setFiles(updatedFiles);
        setSaveStatus("saved");
        setHasUnsavedChanges(false);
        // Update the current content reference
        currentContentRef.current = value;
      } catch (error) {
        setSaveStatus("error");
        console.error("Error saving file:", error);
      }
    }, 300); // 300ms debounce delay
  };

  const handleAddFile = (parentPath: string[] = []) => {
    console.log('[ProjectChallenge] Adding new file:', { parentPath });
    const fileName = prompt("Enter file name:");
    if (!fileName) return;

    const addFileToPath = (items: FileStructure[], path: string[]): FileStructure[] => {
      if (path.length === 0) {
        const newPath = parentPath.length > 0 ? `${parentPath.join('/')}/${fileName}` : fileName;
        return [...items, { name: fileName, type: "file", content: "", path: newPath }];
      }
      return items.map(item => {
        if (item.name === path[0] && item.children) {
          return {
            ...item,
            children: addFileToPath(item.children, path.slice(1))
          };
        }
        return item;
      });
    };

    const updatedFiles = addFileToPath(files, parentPath);
    setFiles(updatedFiles);

    // Select the newly created file
    const newFilePath = parentPath.length > 0 ? `${parentPath.join('/')}/${fileName}` : fileName;
    setActiveFilePath(newFilePath);
    setActiveFileContent("");
    currentContentRef.current = "";
  };

  // Helper function to find a file by path
  const findFileByPath = (items: FileStructure[], targetPath: string): FileStructure | null => {
    for (const item of items) {
      if (item.path === targetPath) return item;
      if (item.children) {
        const found = findFileByPath(item.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to resolve imports and prepare modules
  // const resolveImports = (content: string, filePath: string): { code: string; exports: string[] } => {
  //   console.log('[ProjectChallenge] Resolving imports for:', { filePath });
  //   const lines = content.split('\n');
  //   const exports: string[] = [];
  //   const resolvedLines = lines.map(line => {
  //     // Handle exports
  //     if (line.includes('export')) {
  //       const exportMatch = line.match(/export\s+(default\s+)?(function|const|let|var|class)?\s*([\w]+)/i);
  //       if (exportMatch) {
  //         const exportName = exportMatch[3];
  //         exports.push(exportName);
  //         // Remove export keyword but keep the declaration
  //         return line.replace(/export\s+(default\s+)?/, '');
  //       }
  //     }
  //     // Handle imports
  //     if (line.includes('import') && line.includes('from')) {
  //       const importMatch = line.match(/import\s+{?\s*([\w\s,]+)}?\s+from\s+['"]([^'"]+)['"]/);
  //       if (importMatch) {
  //         const [, importPath] = importMatch; // Skip first element (full match)
  //         // Resolve the absolute path
  //         const currentDir = filePath.split('/').slice(0, -1).join('/');
  //         const targetPath = importPath.startsWith('.') 
  //           ? `${currentDir}/${importPath.replace(/^\.\//, '')}`.replace(/\.js$/, '') + '.js'
  //           : importPath + '.js';
          
  //         // Find the target file
  //         const targetFile = findFileByPath(files, targetPath);
  //         if (targetFile && targetFile.content) {
  //           // Recursively resolve imports in the target file
  //           const { code: resolvedContent } = resolveImports(targetFile.content, targetFile.path);
  //           // Add the resolved code
  //           return `// Imported from ${targetPath}\n${resolvedContent}\n`;
  //         }
  //       }
  //     }
  //     return line;
  //   });
  //   return { 
  //     code: resolvedLines.join('\n'),
  //     exports
  //   };
  // };

  const handleConsoleLog = (message: string, type: 'log' | 'error' | 'info' = 'log') => {
    setConsoleOutput(prev => [...prev, { type, message }]);
  };

  const handlePreview = async () => {
    console.log('[ProjectChallenge] Starting preview execution:', {
      filePath: activeFilePath,
      timestamp: new Date().toISOString(),
      contentLength: activeFileContent?.length || 0
    });

    if (!activeFileContent || !activeFilePath) {
      console.warn('[ProjectChallenge] Preview aborted: No active file or content');
      return;
    }

    setIsPreviewRunning(true);
    console.log('[ProjectChallenge] Preview state updated:', { isPreviewRunning: true });
    setPreviewOutput('');
    console.log('[ProjectChallenge] Preview output cleared');

    try {
      // First, find all related files
      const allFiles = new Map<string, string>();
      const processFile = (filePath: string, content: string) => {
        if (allFiles.has(filePath)) return;
        
        allFiles.set(filePath, content);
        const importMatches = content.matchAll(/import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([\.\w\/]+)['"];?/g);
        
        for (const match of Array.from(importMatches)) {
          const importPath = match[1];
          const currentDir = filePath.split('/').slice(0, -1).join('/');
          const targetPath = importPath.startsWith('.') 
            ? `${currentDir}/${importPath.replace(/^\.\//g, '')}`.replace(/\.js$/, '') + '.js'
            : importPath + '.js';
          
          console.log('[ProjectChallenge] Processing import:', { importPath, targetPath });
          const targetFile = findFileByPath(files, targetPath);
          if (targetFile?.content) {
            processFile(targetPath, targetFile.content);
          } else {
            console.warn('[ProjectChallenge] Import not found:', { targetPath });
          }
        }
      };

      processFile(activeFilePath, activeFileContent);
      console.log('[ProjectChallenge] Found related files:', Array.from(allFiles.keys()));

      // Generate concatenated code with proper module handling
      let concatenatedCode = '';
      for (const [path, content] of allFiles) {
        concatenatedCode += `\n// File: ${path}\n`;
        // Remove imports and exports but keep the rest of the code
        const processedContent = content
          .replace(/export\s+(default\s+)?/g, '')
          .replace(/import\s+.*from\s+['"].*['"];?\n?/g, '');
        concatenatedCode += processedContent + '\n';
      }

      console.log('[ProjectChallenge] Generated concatenated code');

      // Create a temporary HTML file that includes the user's code
      console.log('[ProjectChallenge] Generating HTML preview content');
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Code Preview</title>
        </head>
        <body>
          <div id="output"></div>
          <script>
            // Capture console.log output
            const originalLog = console.log;
            console.log = (...args) => {
              originalLog.apply(console, args);
              const output = document.createElement('div');
              output.textContent = args.join(' ');
              document.getElementById('output').appendChild(output);
            };

            // Create a module-like environment
            (function() {
              const module = { exports: {} };
              const exports = module.exports;

              try {
                // User code with all dependencies
                ${concatenatedCode}

                // Execute main if it exists
                if (typeof main === 'function') {
                  console.log('Executing main function...');
                  const result = main();
                  if (result !== undefined) {
                    console.log('Main function returned:', result);
                  }
                } else {
                  console.log('No main function found to execute');
                }
              } catch (error) {
                console.error('Error executing code:', error.message);
              }
            })();
          </script>
        </body>
        </html>
      `;

      // Write the HTML content to a temporary file
      console.log('[ProjectChallenge] Creating temporary HTML file');
const tempFile = new File([htmlContent], 'preview.html', { type: 'text/html' });
console.log('[ProjectChallenge] Temporary file created:', {
  name: tempFile.name,
  size: tempFile.size,
  type: tempFile.type
});
      console.log('[ProjectChallenge] Creating object URL');
const url = URL.createObjectURL(tempFile);
console.log('[ProjectChallenge] Object URL created:', { url });

      // Open the preview in a new window/iframe
      console.log('[ProjectChallenge] Opening preview window');
const previewWindow = window.open(url, '_blank');
console.log('[ProjectChallenge] Preview window opened:', { success: !!previewWindow });
      if (previewWindow) {
        console.log('[ProjectChallenge] Setting up preview window onload handler');
        previewWindow.onload = () => {
          console.log('[ProjectChallenge] Preview window loaded, cleaning up object URL');
          URL.revokeObjectURL(url);
          console.log('[ProjectChallenge] Object URL revoked');
        };
      }

      const successMessage = 'Preview opened in a new window';
console.log('[ProjectChallenge] Setting preview success message:', { message: successMessage });
setPreviewOutput(successMessage);
    } catch (error) {
      console.error('[ProjectChallenge] Preview execution failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.log('[ProjectChallenge] Setting error output:', { errorMessage });
      setPreviewOutput(`Error: ${errorMessage}`);
      handleConsoleLog(errorMessage, 'error');
      console.log('[ProjectChallenge] Updating console output with error');
      setConsoleOutput(prev => [...prev, { type: 'error', message: error.message }]);
    } finally {
      console.log('[ProjectChallenge] Preview execution completed');
      setIsPreviewRunning(false);
      console.log('[ProjectChallenge] Preview state updated:', { isPreviewRunning: false });
    }
  };

  const handleDeleteFile = (file: FileStructure, parentPath: string[] = []) => {
    console.log('[ProjectChallenge] Deleting file:', { path: file.path, parentPath });
    const deleteFileFromPath = (items: FileStructure[], path: string[]): FileStructure[] => {
      if (path.length === 0) {
        return items.filter(item => item !== file);
      }
      return items.map(item => {
        if (item.name === path[0] && item.children) {
          return {
            ...item,
            children: deleteFileFromPath(item.children, path.slice(1))
          };
        }
        return item;
      });
    };

    const updatedFiles = deleteFileFromPath(files, parentPath);
    setFiles(updatedFiles);
    if (activeFilePath === file.path) {
      setActiveFilePath("");
      setActiveFileContent("");
      currentContentRef.current = "";
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
    }
  };



  const renderFileTree = (items: FileStructure[], path: string[] = []) => {
    return (
      <div className="pl-4">
        {items.map((item, index) => (
          <div key={index} className="py-1">
            <div 
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg cursor-pointer group",
                item.path === activeFilePath && "bg-emerald-100",
                "hover:bg-emerald-50",
                item.path === activeFilePath && hasUnsavedChanges && "ring-2 ring-amber-300"
              )}
              onClick={() => handleFileSelect(item)}
            >
              {item.type === "directory" ? (
                <FolderIcon className="w-4 h-4 text-emerald-600" />
              ) : (
                <FileIcon className="w-4 h-4 text-emerald-600" />
              )}
              <span className="flex-grow">{item.name}</span>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                {item.type === "directory" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddFile([...path, item.name]);
                    }}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(item, path);
                  }}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {item.type === "directory" && item.children && (
              renderFileTree(item.children, [...path, item.name])
            )}
          </div>
        ))}
      </div>
    );
  };

  const getLanguageExtension = () => {
    switch (language.toLowerCase()) {
      case "javascript":
        return javascript();
      case "python":
        return python();
      // TODO: Add HTML and CSS support later
      // case "html":
      //   return html();
      // case "css":
      //   return css();
      default:
        return javascript();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        {/* File Explorer */}
        <div className="col-span-3 bg-white rounded-xl shadow-lg border border-emerald-100 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-emerald-800">Project Files</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAddFile()}
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
          {renderFileTree(files)}
        </div>

        {/* Code Editor */}
        <div className="col-span-5 bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden">
          {activeFilePath ? (
            <div className="h-full flex flex-col">
              <div className="p-2 border-b border-emerald-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-emerald-800">{activeFilePath.split('/').pop()}</span>
                    {hasUnsavedChanges && (
                      <span className="text-amber-500 text-xs">●</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    saveStatus === "saved" && "text-emerald-600 bg-emerald-50",
                    saveStatus === "saving" && "text-amber-600 bg-amber-50",
                    saveStatus === "error" && "text-red-600 bg-red-50"
                  )}>
                    {saveStatus === "saved" && "Saved"}
                    {saveStatus === "saving" && "Saving..."}
                    {saveStatus === "error" && "Error saving"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePreview}
                  disabled={disabled}
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Run Preview
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <CodeMirror
                  value={activeFileContent}
                  height="100%"
                  theme="light"
                  extensions={[getLanguageExtension()]}
                  onChange={handleCodeChange}
                  readOnly={disabled}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a file to edit
            </div>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="col-span-4 bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden">
        <div className="p-2 border-b border-emerald-100">
          <span className="font-medium text-emerald-800">Preview</span>
        </div>
        <div className="grid grid-rows-2 gap-4 h-full p-4 bg-gray-50">
          {/* Preview Output */}
          <div className="bg-white rounded-lg p-4 font-mono text-sm overflow-auto">
            <h3 className="font-semibold text-emerald-800 mb-2">Output</h3>
            {isPreviewRunning ? (
              <div className="animate-pulse">Running preview...</div>
            ) : previewOutput ? (
              <div className="whitespace-pre-wrap">{previewOutput}</div>
            ) : (
              <div className="text-gray-500">Click &quot;Run Preview&quot; to see the output</div>
            )}
          </div>

          {/* Console Panel */}
          <div className="bg-gray-900 text-white rounded-lg p-4 font-mono text-sm overflow-auto">
            <h3 className="font-semibold text-emerald-400 mb-2">Console</h3>
            <div className="space-y-1">
              {consoleOutput.map((log, index) => (
                <div 
                  key={index} 
                  className={cn(
                    'py-0.5',
                    log.type === 'error' && 'text-red-400',
                    log.type === 'info' && 'text-blue-400'
                  )}
                >
                  {log.type === 'error' ? '❌ ' : log.type === 'info' ? 'ℹ️ ' : '> '}
                  {log.message}
                </div>
              ))}
              {consoleOutput.length === 0 && (
                <div className="text-gray-500">No console output yet...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


