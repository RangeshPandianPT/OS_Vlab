
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-12 py-6 border-t border-border-light dark:border-border-dark">
      <div className="container mx-auto px-4 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
        <p>&copy; {new Date().getFullYear()} OS_VLab. All Rights Reserved.</p>
        <p className="mt-1">
          Built for interactive OS education.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
