"use client";

import React, { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";
import { FileIcon, FolderIcon } from "lucide-react";

interface FileStructure {
  name: string;
  type: "file" | "directory";
  content?: string;
  path: string;
  children?: FileStructure[];
}

interface Props {
  projectId: string;
  projectStructure: string;
  projectFiles: string;
  language: string;
  disabled?: boolean;
}

export default function ProjectV2Challenge({
  projectId,
  projectStructure,
  projectFiles,
  language,
  disabled = false
}: Props) {
  // State
  console.log("Project ID:", projectId);
  const [files, setFiles] = useState<FileStructure[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>("");
  const [activeFileContent, setActiveFileContent] = useState<string>("");
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);

  // Find file content recursively
  const findFileContent = useCallback((items: FileStructure[], targetPath: string): string | null => {
    for (const item of items) {
      if (item.path === targetPath) return item.content || "";
      if (item.children) {
        const found = findFileContent(item.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Update file content recursively
  const updateFileContent = useCallback((items: FileStructure[], targetPath: string, newContent: string): boolean => {
    const newItems = [...items];
    for (let i = 0; i < newItems.length; i++) {
      if (newItems[i].path === targetPath) {
        newItems[i].content = newContent;
        setFiles(newItems);
        return true;
      }
      if (newItems[i].children) {
        const newChildren = [...newItems[i].children!];
        if (updateFileContent(newChildren, targetPath, newContent)) {
          newItems[i].children = newChildren;
          setFiles(newItems);
          return true;
        }
      }
    }
    return false;
  }, [setFiles]);

  // Handle file selection
  const handleFileSelect = useCallback((file: FileStructure) => {
    if (file.type === "file") {
      setActiveFilePath(file.path);
      const fileContent = findFileContent(files, file.path);
      setActiveFileContent(fileContent || "");
    }
  }, [files, findFileContent, setActiveFilePath, setActiveFileContent]);

  // Handle code changes
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setActiveFileContent(value);
      updateFileContent(files, activeFilePath, value);
    }
  }, [files, activeFilePath, updateFileContent, setActiveFileContent]);

  // Helper function to find first file in structure
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

  // Render file tree
  const renderFileTree = useCallback((items: FileStructure[], depth = 0) => {
    return items.map((item) => (
      <div key={item.path} style={{ marginLeft: `${depth * 16}px` }}>
        <div className="flex items-center gap-2 group">
          <button
            onClick={() => handleFileSelect(item)}
            className={cn(
              "flex items-center gap-2 flex-grow p-1 hover:bg-gray-100 rounded text-left",
              activeFilePath === item.path && "bg-gray-100"
            )}
            disabled={disabled}
          >
            {item.type === "directory" ? (
              <FolderIcon className="h-4 w-4 text-purple-500" />
            ) : (
              <FileIcon className="h-4 w-4 text-blue-500" />
            )}
            <span>{item.name}</span>
          </button>
          {!disabled && (
            <button
              onClick={() => {
                if (confirm(`Delete ${item.type} '${item.name}'?`)) {
                  setFiles(prev => prev.filter(f => f.path !== item.path));
                  if (activeFilePath === item.path) {
                    setActiveFilePath("");
                    setActiveFileContent("");
                  }
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded"
            >
              ×
            </button>
          )}
        </div>
        {item.children && renderFileTree(item.children, depth + 1)}
      </div>
    ));
  }, [activeFilePath, disabled, handleFileSelect, setActiveFilePath, setActiveFileContent]);

  // Initialize project structure
  useEffect(() => {
    try {
      const structure = JSON.parse(projectStructure);
      const projectFilesData = JSON.parse(projectFiles);
      console.log("Project structure:", structure);
      console.log("Project files:", projectFilesData);
      setFiles(structure);

      // Select first file by default
      const firstFile = findFirstFile(structure);
      if (firstFile) {
        setActiveFilePath(firstFile.path);
        const fileContent = findFileContent(structure, firstFile.path);
        setActiveFileContent(fileContent || "");
      }
    } catch (error) {
      console.error("Error parsing project structure:", error);
    }
  }, [projectStructure, projectFiles, findFirstFile, findFileContent]);

  interface ModuleExports {
    [key: string]: unknown;
  }

  interface ModuleContext {
    exports: ModuleExports;
  }

  // Build module code
  const buildModuleCode = useCallback((fileContent: string) => {
    let code = fileContent;

    // Replace import statements with require calls
    code = code.replace(/import\s+\{?\s*([^}\s]+)\s*\}?\s+from\s+['"]([^'"]+)['"];?/g, 
      (_, importName, path) => `const ${importName} = require('${path}');`);

    // Replace export statements
    code = code.replace(/export\s+(const|let|var|function|class)\s+([^\s{]+)/g, 
      (_, type, name) => `${type} ${name}; exports.${name} = ${name}`);

    return code;
  }, []);

  // Run code
  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setConsoleOutput("");

    try {
      // Create a custom console
      const customConsole = {
        log: (...args: (string | number | boolean | object | null | undefined)[]) => {
          setConsoleOutput(prev => prev + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(" ") + "\n");
        }
      };

      // Create module registry
      const moduleRegistry = new Map<string, ModuleExports>();

      // Create require function
      const requireModule = (path: string): unknown => {
        const normalizedPath = path.startsWith("/") ? path : `/${path}`;
        const file = files.find(f => f.path === normalizedPath);

        if (!file || file.type !== "file") {
          throw new Error(`Module not found: ${path}`);
        }

        if (moduleRegistry.has(file.path)) {
          return moduleRegistry.get(file.path);
        }

        const moduleContext: ModuleContext = { exports: {} };
        moduleRegistry.set(file.path, moduleContext.exports);

        const code = buildModuleCode(file.content || "");
        const moduleFunction = new Function(
          "exports", "require", "console", 
          `${code}\nreturn exports;`
        );

        const exports = moduleFunction(
          moduleContext.exports,
          requireModule,
          customConsole
        );

        moduleRegistry.set(file.path, exports);
        return exports;
      };

      // Execute the active file
      const code = buildModuleCode(activeFileContent);
      const moduleFunction = new Function(
        "exports", "require", "console",
        `${code}\nreturn exports;`
      );

      const exports = moduleFunction({}, requireModule, customConsole);
      
      // Log exports if any
      if (Object.keys(exports).length > 0) {
        customConsole.log("Exported:", exports);
      }

    } catch (error) {
      setConsoleOutput(prev => prev + "Error: " + (error as Error).message + "\n");
    } finally {
      setIsRunning(false);
    }
  }, [activeFileContent, activeFilePath, files, buildModuleCode]);

  return (
    <div className="h-full grid grid-cols-12 gap-4 rounded-lg border">
      {/* File Explorer */}
      <div className="col-span-3 p-4 border-r">
        <div className="flex justify-between items-center mb-4">
          <div className="font-medium">Files</div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const fileName = prompt("Enter file name (e.g., utils.js):");
                if (fileName) {
                  const newFile: FileStructure = {
                    name: fileName,
                    type: "file",
                    path: `/${fileName}`,
                    content: ""
                  };
                  setFiles(prev => [...prev, newFile]);
                }
              }}
              disabled={disabled}
              className={cn(
                "px-2 py-1 rounded text-sm",
                disabled ? "bg-gray-300" : "bg-blue-500 hover:bg-blue-600 text-white"
              )}
            >
              + File
            </button>
            <button
              onClick={() => {
                const folderName = prompt("Enter folder name:");
                if (folderName) {
                  const newFolder: FileStructure = {
                    name: folderName,
                    type: "directory",
                    path: `/${folderName}`,
                    children: []
                  };
                  setFiles(prev => [...prev, newFolder]);
                }
              }}
              disabled={disabled}
              className={cn(
                "px-2 py-1 rounded text-sm",
                disabled ? "bg-gray-300" : "bg-purple-500 hover:bg-purple-600 text-white"
              )}
            >
              + Folder
            </button>
          </div>
        </div>
        <div className="space-y-1 overflow-auto max-h-[calc(100vh-16rem)]">
          {renderFileTree(files)}
        </div>
      </div>

      {/* Editor and Console */}
      <div className="col-span-9 p-4 flex flex-col h-full">
        {/* Editor Section */}
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">Editor</div>
            <button
              onClick={handleRunCode}
              disabled={disabled || isRunning}
              className={cn(
                "px-4 py-2 rounded-md text-white",
                isRunning || disabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600"
              )}
            >
              {isRunning ? "Running..." : "Run Code"}
            </button>
          </div>
          <div className="flex-grow min-h-0">
            <Editor
              height="100%"
              defaultLanguage={language}
              value={activeFileContent}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                readOnly: disabled,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
              theme="vs-dark"
            />
          </div>
        </div>

        {/* Console Output */}
        <div className="h-[200px] bg-gray-900 rounded-md p-4 overflow-auto mt-4">
          <div className="font-medium text-white mb-2">Console Output</div>
          <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
            {consoleOutput || "No output yet..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
