"use client";

import React, { useEffect, useRef, useState } from 'react';
import sdk from '@stackblitz/sdk';

interface Props {
  projectId: string;
  projectStructure: string;
  projectFiles: string;
  language: string;
  disabled?: boolean;
  onSubmit?: () => void;
}

const ProjectV3Challenge: React.FC<Props> = ({
  projectId,
  projectStructure,
  projectFiles,
  language,
  disabled = false,
  onSubmit
}) => {
  const embedRef = useRef<HTMLDivElement>(null);
  const [localProjectState, setLocalProjectState] = useState<{ files: Record<string, string> } | null>(null);

  // Function to generate storage key with user ID
  const getStorageKey = (projectId: string) => {
    // Get the current user ID from your auth system
    const userId = localStorage.getItem('userId') || 'anonymous';
    return `project_${userId}_${projectId}`;
  };

  // Load saved state from localStorage when component mounts
  useEffect(() => {
    const storageKey = getStorageKey(projectId);
    const savedState = localStorage.getItem(storageKey);
    
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Check if the saved state is not older than 24 hours
        const savedTime = parsedState.timestamp || 0;
        const currentTime = Date.now();
        const isValid = (currentTime - savedTime) < (24 * 60 * 60 * 1000);

        if (isValid) {
          setLocalProjectState(parsedState.files);
          console.log('[ProjectV3Challenge] Loaded saved state:', { projectId, userId: localStorage.getItem('userId') });
        } else {
          // Clear expired state
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error('[ProjectV3Challenge] Error loading saved state:', error);
      }
    }
  }, [projectId]);

  useEffect(() => {
    if (!embedRef.current) return;

    const files = JSON.parse(projectFiles);
    const structure = JSON.parse(projectStructure);

    // Convert project structure to StackBlitz format
    // Initialize project config with either saved state or default files
    const projectConfig = {
      files: localProjectState?.files || {},
      title: `Project ${projectId}`,
      description: 'CodeNGo Project Challenge',
      template: (language === 'python' ? 'node' : 'javascript') as 'node' | 'javascript',
      dependencies: {}
    };

    // Only load initial files if there's no saved state
    if (!localProjectState) {
      structure.forEach((item: { type: string; path: string }) => {
        if (item.type === 'file') {
          const fileContent = files[item.path] || '';
          projectConfig.files[item.path.substring(1)] = fileContent;
        }
      });

      // Save initial state to localStorage
      const storageKey = getStorageKey(projectId);
      localStorage.setItem(storageKey, JSON.stringify({
        files: projectConfig.files,
        timestamp: Date.now(),
        userId: localStorage.getItem('userId') || 'anonymous'
      }));
      console.log('[ProjectV3Challenge] Saved initial state:', { projectId, userId: localStorage.getItem('userId') });
    }

    // Add necessary configuration files based on language
    if (language === 'python') {
      projectConfig.files['requirements.txt'] = '';
      projectConfig.files['main.py'] = files['/main.py'] || '';
    } else {
      projectConfig.files['package.json'] = JSON.stringify({
        name: `project-${projectId}`,
        version: '1.0.0',
        private: true,
        type: 'module'
      });
      projectConfig.files['index.js'] = files['/index.js'] || '';
    }

    // Embed the StackBlitz project
    const setupEditor = async () => {
      try {
        const vm = await sdk.embedProject(embedRef.current, projectConfig, {
          height: '100%',
          hideNavigation: true,
          hideExplorer: false,
          view: 'editor',
          terminalHeight: 50,
          showSidebar: true,
          forceEmbedLayout: true,
        });

        // Set up auto-save with debounce
        let saveTimeout: NodeJS.Timeout;
        const handleContentChange = async () => {
          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(async () => {
            try {
              const snapshot = await vm.getFsSnapshot();
              const storageKey = getStorageKey(projectId);
              localStorage.setItem(storageKey, JSON.stringify({
                files: snapshot,
                timestamp: Date.now(),
                userId: localStorage.getItem('userId') || 'anonymous'
              }));
            } catch (error) {
              console.error('[ProjectV3Challenge] Error saving state:', error);
            }
          }, 1000);
        };

        // Set up periodic auto-save since StackBlitz doesn't provide direct change events
        const autoSaveInterval = setInterval(handleContentChange, 5000);

        return () => {
          if (saveTimeout) clearTimeout(saveTimeout);
          clearInterval(autoSaveInterval);
        };
      } catch (error) {
        console.error('[ProjectV3Challenge] Error setting up editor:', error);
      }
    };

    if (!disabled) {
      setupEditor();
    }
  }, [projectId, projectFiles, projectStructure, language, disabled, localProjectState]);

  const handleSubmit = () => {
    // TODO: In future, add code validation logic here
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="h-full w-full rounded-lg border flex flex-col">
      <div ref={embedRef} className="flex-1 w-full" />
      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? 'Project Submitted' : 'Submit Project'}
        </button>
      </div>
    </div>
  );
};

export default ProjectV3Challenge;
