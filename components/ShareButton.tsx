import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import type { Page } from '../types';
import { buildShareUrl } from '../utils/permalinkUtils';

interface ShareButtonProps {
  /** The current simulation page identifier */
  pageId: Page;
  /** A function that returns the current state to be serialized */
  getState: () => object;
  /** Optional callback to show a toast notification */
  onToast?: (message: string, type: 'success' | 'error') => void;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ pageId, getState, onToast, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const state = getState();
      const url = buildShareUrl(pageId, state);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onToast?.('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: display the URL in a prompt (for browsers that block clipboard)
      try {
        const state = getState();
        const url = buildShareUrl(pageId, state);
        window.prompt('Copy this link to share:', url);
        onToast?.('URL generated — please copy manually.', 'success');
      } catch {
        onToast?.('Failed to generate share link.', 'error');
      }
    }
  };

  return (
    <button
      id={`share-btn-${pageId}`}
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 ${className}`}
      title="Share this simulation configuration"
      aria-label="Share simulation"
    >
      {copied ? (
        <>
          <Check size={18} className="animate-bounce" />
          <span className="hidden sm:inline">Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={18} />
          <span className="hidden sm:inline">Share</span>
        </>
      )}
    </button>
  );
};

export default ShareButton;
