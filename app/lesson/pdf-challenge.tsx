"use client";

import { useState } from "react";
import { DocumentLoadEvent, PageChangeEvent, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';
import { Worker } from '@react-pdf-viewer/core';
import { motion } from 'framer-motion';
import { CheckCircle, BookOpen, Loader2, AlertCircle } from 'lucide-react';

interface PdfChallengeProps {
  pdfUrl: string;
  onComplete: () => void;
}

export const PdfChallenge = ({ pdfUrl, onComplete }: PdfChallengeProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);

  // Detect if this is a Google Drive URL
  const isGoogleDriveUrl = pdfUrl.includes('drive.google.com');

  // Initialize plugins (only for non-Google Drive PDFs)
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Extract Google Drive file ID and build preview URL
  const extractGoogleDriveFileId = (url: string): string | null => {
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const viewMatch = url.match(/\/file\/d\/([^\/\?]+)/);
    if (viewMatch?.[1]) return viewMatch[1];

    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/[?&]id=([^&]+)/);
    if (openMatch?.[1]) return openMatch[1];

    return null;
  };

  const googleDriveFileId = isGoogleDriveUrl ? extractGoogleDriveFileId(pdfUrl) : null;
  const googleDrivePreviewUrl = googleDriveFileId
    ? `https://drive.google.com/file/d/${googleDriveFileId}/preview`
    : null;

  // Format the PDF URL correctly for non-Google Drive PDFs
  const formattedPdfUrl = pdfUrl.startsWith("http")
    ? pdfUrl
    : `${window.location.origin}${pdfUrl.startsWith("/") ? pdfUrl : `/${pdfUrl}`}`;

  console.log('Original PDF URL:', pdfUrl);
  console.log('Is Google Drive:', isGoogleDriveUrl);
  console.log('Google Drive File ID:', googleDriveFileId);
  console.log('Preview URL:', googleDrivePreviewUrl || formattedPdfUrl);

  const handlePageChange = (e: PageChangeEvent) => {
    setCurrentPage(e.currentPage);
  };

  const handleDocumentLoad = (e: DocumentLoadEvent) => {
    setNumPages(e.doc.numPages);
    setError(null);
    setIsLoading(false);
  };

  // Handlers for Google Drive iframe
  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasViewed(true);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load PDF. Make sure sharing is "Anyone with the link (Viewer)".');
  };

  // Check for invalid Google Drive link
  if (isGoogleDriveUrl && !googleDriveFileId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-lg text-center font-semibold text-neutral-700 mb-2">
          Invalid Google Drive link
        </p>
        <p className="text-sm text-center text-neutral-500">
          Could not extract file ID from the URL.
        </p>
      </div>
    );
  }

  // Check if pdfUrl is missing
  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-lg text-center text-neutral-700">
          PDF link is missing.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center w-full max-w-5xl mx-auto p-3 sm:p-4 md:p-6 bg-white rounded-xl shadow-xl"
    >
      <div className="w-full mb-2 sm:mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-800">PDF Challenge</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-36 sm:w-48 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-600"
              style={{
                width: `${(currentPage + 1) / numPages * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600">
            {Math.round((currentPage + 1) / numPages * 100)}%
          </span>
        </div>
      </div>

      {isGoogleDriveUrl ? (
        // Google Drive PDF - Use iframe with proxy
        <motion.div
          className="w-full h-[530px] sm:h-[600px] md:h-[750px] lg:h-[550px] mb-4 sm:mb-6 relative rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
              <p className="text-lg font-medium text-green-700 mt-4">
                Loading PDF from Google Drive...
              </p>
              <p className="text-sm text-green-600 mt-2">
                This may take a moment
              </p>
            </div>
          )}
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-6 bg-red-50 rounded-lg">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <div className="text-center">
                <p className="font-semibold text-neutral-800 mb-2">
                  Failed to load PDF
                </p>
                <p className="text-sm text-neutral-600">
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <iframe
              src={googleDrivePreviewUrl || ''}
              className="w-full h-full rounded-xl border"
              title="PDF Viewer"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="autoplay"
            />
          )}
        </motion.div>
      ) : (
        // Regular PDF - Use react-pdf-viewer
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <motion.div
            className="w-full h-[530px] sm:h-[600px] md:h-[750px] lg:h-[550px] mb-4 sm:mb-6 relative rounded-lg overflow-hidden border border-gray-200 shadow-sm"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}
            {error ? (
              <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">
                <p className="font-medium">Error loading PDF</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            ) : (
              <Viewer
                fileUrl={formattedPdfUrl}
                plugins={[
                  pageNavigationPluginInstance,
                  defaultLayoutPluginInstance,
                ]}
                onPageChange={handlePageChange}
                onDocumentLoad={handleDocumentLoad}
                renderError={(error: Error) => {
                  console.error('PDF Error:', error);
                  return (
                    <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">
                      <p className="font-medium">Error loading PDF</p>
                      <p className="text-sm mt-1">{error.message || 'Please try again later.'}</p>
                    </div>
                  );
                }}
              />
            )}
          </motion.div>
        </Worker>
      )}

      <div className="w-full flex justify-between items-center px-2 sm:px-4">
        <div className="text-xs sm:text-sm font-medium text-gray-700">
          Page {currentPage + 1} of {numPages}
        </div>

        {(
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={onComplete}
              disabled={isGoogleDriveUrl ? !hasViewed : currentPage !== numPages - 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg transition-all ${(isGoogleDriveUrl ? hasViewed : currentPage === numPages - 1) ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              <CheckCircle className="w-5 h-5" />
              Complete Challenge
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
