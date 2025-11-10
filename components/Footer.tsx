
import React from 'react';
import type { Page } from '../types';
import { Users, Award, Sparkles, Heart, Mail, Github, Linkedin } from 'lucide-react';

interface FooterProps {
  currentPage?: Page;
}

const Footer: React.FC<FooterProps> = ({ currentPage }) => {
  // Don't show the About Us section if we're on About, Topics, Docs, or Progress pages
  const showAboutSection = currentPage !== 'about' && currentPage !== 'topics' && currentPage !== 'docs' && currentPage !== 'progress';

  return (
    <footer className="w-full mt-12">
      {/* About Us Section - Only show on simulation and home pages */}
      {showAboutSection && (
        <div className="w-full py-8 sm:py-12 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 border-y border-blue-200 dark:border-purple-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <Sparkles className="text-purple-500 dark:text-purple-400" size={28} />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                About Us
              </h2>
              <Sparkles className="text-pink-500 dark:text-pink-400" size={28} />
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Passionate team dedicated to making Operating Systems concepts interactive and accessible
            </p>
          </div>

          {/* Team Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
            {/* Created By */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-blue-200 dark:border-blue-800 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                  <Users size={28} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Created By
                </h3>
              </div>
              
              <div className="space-y-4">
                {/* Team Member 1 */}
                <div className="group p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-4 border-blue-500 hover:border-cyan-500 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      R
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                        RANGESHPANDIAN PT
                      </h4>
                      <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-mono">
                        RA2411003010037
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team Member 2 */}
                <div className="group p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-l-4 border-purple-500 hover:border-pink-500 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      A
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                        M.ASWIN
                      </h4>
                      <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-mono">
                        RA2411003010058
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team Member 3 */}
                <div className="group p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-l-4 border-indigo-500 hover:border-blue-500 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      P
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                        P.M.PRANAV KUMAR
                      </h4>
                      <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-mono">
                        RA2411003010025
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mentored By */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-purple-200 dark:border-purple-800 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                  <Award size={28} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Mentored By
                </h3>
              </div>
              
              <div className="group p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 border-2 border-purple-300 dark:border-purple-700 hover:border-pink-400 dark:hover:border-pink-600 transition-all duration-300 hover:shadow-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl mb-4 group-hover:scale-110 transition-transform">
                    Dr.M
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Dr. M. Suchithra
                  </h4>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold shadow-md">
                    <Award size={16} />
                    <span>Faculty Mentor</span>
                  </div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 italic">
                    Guiding us to build better educational tools
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart className="text-pink-500 dark:text-pink-400 animate-pulse" size={24} />
              <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Built with passion for interactive OS education
              </p>
              <Heart className="text-pink-500 dark:text-pink-400 animate-pulse" size={24} />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Making complex Operating System concepts simple, visual, and engaging for everyone
            </p>
          </div>
        </div>
        </div>
      )}

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
