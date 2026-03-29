import React from 'react';
import type { Page } from '../types';
import { Heart } from 'lucide-react';

interface FooterProps {
  currentPage?: Page;
}

const Footer: React.FC<FooterProps> = ({ currentPage }) => {
  return (
    <footer className="w-full mt-12">
      {/* Copyright Section */}
      <div className="w-full py-6 border-t border-border-light dark:border-border-dark bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
          <p className="font-semibold">&copy; {new Date().getFullYear()} OS_VLab. All Rights Reserved.</p>
          <p className="mt-2 text-xs">
            Built for interactive Operating Systems education • Made with <Heart size={12} className="inline text-red-500" /> by students, for students
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
