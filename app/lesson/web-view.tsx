"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface WebViewProps {
  content: string;
  onComplete: () => void;
}

const sanitizeUrl = (str: string) => {
  try {
    const url = new URL(str.trim());
    // Only handle Google Forms URLs
    if (url.hostname.includes('forms.gle') || url.hostname.includes('docs.google.com')) {
      return url.toString().replace('/viewform', '/viewform?embedded=true');
    }
    return url.toString();
  } catch {
    return null;
  }
};

export const WebView = ({ content: rawContent, onComplete }: WebViewProps) => {
  // Clean and validate the URL
  const [url, setUrl] = useState(() => {
    return typeof rawContent === 'string' ? sanitizeUrl(rawContent) : null;
  });
  const [hasRead, setHasRead] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Update URL when content changes
    const sanitized = typeof rawContent === 'string' ? sanitizeUrl(rawContent) : null;
    setUrl(sanitized);
  }, [rawContent]);

  useEffect(() => {
    // Auto-enable continue button after 10 seconds for external content
    if (url) {
      const timer = setTimeout(() => {
        setHasRead(true);
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [url]);



  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {url ? (
        <div className="flex-1 relative w-full h-full min-h-[500px]">
          <iframe
            key={url} // Force iframe refresh when URL changes
            src={url}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-presentation"
            referrerPolicy="no-referrer"
            loading="lazy"
            allowFullScreen
          />
        </div>
      ) : (
        <div 
          className="flex-1 overflow-y-auto p-6 prose prose-emerald max-w-none"
        >
          <ReactMarkdown>{rawContent}</ReactMarkdown>
        </div>
      )}
      <div className="p-4 border-t flex justify-end">
        <Button
          onClick={onComplete}
          disabled={!hasRead}
          size="lg"
          variant={hasRead ? "default" : "secondary"}
        >
          {hasRead ? "Continue" : "Please read to continue"}
        </Button>
      </div>
    </div>
  );
};
