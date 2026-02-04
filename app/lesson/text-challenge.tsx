"use client";

import ReactMarkdown from 'react-markdown';
import localFont from 'next/font/local';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

// Load Arabic fonts
const notoKufiArabic = localFont({
  src: [{
    path: '../../public/fonts/NotoKufiArabic-Regular.ttf',
    weight: '400',
    style: 'normal',
  }],
  variable: '--font-arabic'
});

// Function to detect if text contains Arabic
const containsArabic = (text: string) => {
  const arabicPattern = /[؀-ۿ]/;
  return arabicPattern.test(text);
};

interface TextChallengeProps {
  content: string;
  onComplete: () => void;
}

export const TextChallenge = ({ content, onComplete }: TextChallengeProps) => {
  return (
    <div className={`w-full max-w-4xl mx-auto p-8 ${notoKufiArabic.variable}`}>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Reading section */}
        <div className="p-8">
          <div className="mb-10 relative pb-4">
            <h2 className="text-4xl font-bold text-gray-800 mb-4 tracking-tight">Reading Exercise</h2>
            <div className="h-1.5 w-32 bg-green-500 rounded-full absolute bottom-0 left-0"></div>
            <div className="h-1.5 w-16 bg-green-300 rounded-full absolute bottom-0 left-36"></div>
          </div>
          
          <div className={cn(
            'prose prose-lg max-w-none',
            'prose-headings:text-gray-800',
            'prose-h1:text-5xl prose-h1:font-black prose-h1:mb-8 prose-h1:leading-tight',
            'prose-h1:bg-gradient-to-r prose-h1:from-green-800 prose-h1:to-green-600',
            'prose-h1:bg-clip-text prose-h1:text-transparent prose-h1:py-2',
            'prose-h2:text-4xl prose-h2:font-extrabold prose-h2:my-8 prose-h2:text-green-700',
            'prose-h2:border-b-4 prose-h2:border-green-200 prose-h2:pb-3 prose-h2:relative',
            'prose-h2:after:content-[""] prose-h2:after:absolute prose-h2:after:bottom-0 prose-h2:after:left-0',
            'prose-h2:after:w-1/3 prose-h2:after:h-1 prose-h2:after:bg-green-500',
            'prose-h2:uppercase prose-h2:tracking-wide prose-h2:shadow-sm',
            'prose-h3:text-2xl prose-h3:font-extrabold prose-h3:text-white',
            'prose-h3:bg-gradient-to-r prose-h3:from-green-700 prose-h3:to-green-500',
            'prose-h3:px-6 prose-h3:py-3 prose-h3:rounded-lg prose-h3:shadow-lg',
            'prose-h3:mb-6 prose-h3:inline-block prose-h3:w-auto',
            'prose-h3:border-l-8 prose-h3:border-green-800',
            'prose-h3:text-shadow',
            'prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4',
            'prose-strong:text-green-900 prose-strong:font-bold',
            'prose-em:text-gray-800 prose-em:italic',
            'prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4',
            'prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4',
            'prose-li:text-gray-700 prose-li:mb-2',
            'prose-blockquote:border-l-4 prose-blockquote:border-green-500',
            'prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:my-4',
            'prose-blockquote:bg-green-50 prose-blockquote:rounded-r-lg',
            'prose-a:text-green-600 prose-a:hover:text-green-700 prose-a:underline',
            'prose-code:bg-gray-100 prose-code:text-green-800 prose-code:px-1 prose-code:rounded',
            containsArabic(content) && 'font-arabic text-right rtl leading-loose tracking-normal'
          )}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                p: ({children, ...props}) => {
                  const isArabic = containsArabic(children?.toString() || '');
                  return (
                    <p className={cn(
                      isArabic && 'arabic-text',
                      'transition-all duration-200'
                    )} {...props}>
                      {children}
                    </p>
                  );
                },
                h1: ({children, ...props}) => {
                  const isArabic = containsArabic(children?.toString() || '');
                  return (
                    <h1 className={cn(
                      'animate-fade-in animate-slide-in',
                      isArabic && 'arabic-heading'
                    )} {...props}>
                      {children}
                    </h1>
                  );
                },
                h2: ({children, ...props}) => {
                  const isArabic = containsArabic(children?.toString() || '');
                  return (
                    <h2 className={cn(
                      'animate-fade-in animate-slide-in delay-100',
                      'transform hover:translate-x-2 transition-transform duration-300',
                      isArabic && 'arabic-heading'
                    )} {...props}>
                      {children}
                    </h2>
                  );
                },
                h3: ({children, ...props}) => {
                  const isArabic = containsArabic(children?.toString() || '');
                  return (
                    <h3 className={cn(
                      'animate-fade-in animate-slide-in delay-150',
                      'transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300',
                      'bg-gradient-to-r from-green-700 to-green-500 text-white px-6 py-3',
                      'rounded-lg shadow-lg inline-block my-5',
                      isArabic ? 'border-r-8 border-green-800' : 'border-l-8 border-green-800',
                      '[text-shadow:_0_1px_0_rgb(0_0_0_/_40%)]',
                      isArabic && 'arabic-heading'
                    )} {...props}>
                      {children}
                    </h3>
                  );
                },
                h4: ({...props}) => <h4 className="text-2xl font-semibold text-green-700 mb-4" {...props} />,
                h5: ({...props}) => <h5 className="text-xl font-semibold text-green-600 mb-3" {...props} />,
                h6: ({...props}) => <h6 className="text-lg font-semibold text-green-500 mb-2" {...props} />,
                strong: ({children, ...props}) => {
                  const isArabic = containsArabic(children?.toString() || '');
                  return (
                    <strong 
                      className={cn(
                        'px-3 py-1.5 rounded-md leading-relaxed',
                        'bg-gradient-to-r from-green-100 to-green-50',
                        'border border-green-200 shadow-sm',
                        isArabic
                          ? 'arabic-text font-bold text-green-800 block my-6'
                          : 'font-bold text-green-800 inline-block mx-1',
                        'hover:scale-105 hover:shadow-md transition-all duration-200'
                      )} 
                      {...props}>
                      {children}
                    </strong>
                  );
                },
                blockquote: ({children, ...props}) => {
                  const isArabic = containsArabic(children?.toString() || '');
                  return (
                    <blockquote 
                      className={cn(
                        'py-2 my-4 bg-green-50 rounded-lg shadow-sm hover:shadow-md transition-shadow animate-fade-in',
                        isArabic ? 'border-r-4 pr-4 text-right' : 'border-l-4 pl-4',
                        'border-green-500',
                        isArabic && 'arabic-text'
                      )} 
                      {...props}
                    >
                      {children}
                    </blockquote>
                  );
                },
                a: ({...props}) => (
                  <a className="text-green-600 hover:text-green-700 underline transition-all duration-200 hover:scale-105" {...props} />
                ),
                ul: ({children, ...props}) => {
                  const isArabic = containsArabic(children?.toString() || '');
                  return (
                    <ul 
                      className={cn(
                        'space-y-2 animate-fade-in delay-200',
                        isArabic ? 'pr-6 list-disc-rtl' : 'pl-6 list-disc',
                        isArabic && 'arabic-text'
                      )} 
                      {...props}
                    >
                      {children}
                    </ul>
                  );
                },
                ol: ({children, ...props}) => {
                  const isArabic = containsArabic(children?.toString() || '');
                  return (
                    <ol 
                      className={cn(
                        'space-y-2 animate-fade-in delay-200',
                        isArabic ? 'pr-6 list-decimal-rtl' : 'pl-6 list-decimal',
                        isArabic && 'arabic-text'
                      )} 
                      {...props}
                    >
                      {children}
                    </ol>
                  );
                },
                li: ({children, ...props}) => {
                  const isArabic = containsArabic(children?.toString() || '');
                  return (
                    <li 
                      className={cn(
                        'text-gray-700 leading-relaxed transition-transform',
                        isArabic ? 'hover:-translate-x-1' : 'hover:translate-x-1',
                        isArabic && 'arabic-text'
                      )} 
                      {...props}
                    >
                      {children}
                    </li>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Action section */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
          <button 
            onClick={onComplete}
            className="w-full md:w-auto bg-green-500 text-white px-8 py-3 rounded-lg
                     hover:bg-green-600 transition-colors duration-200 ease-in-out
                     font-medium flex items-center justify-center gap-2 shadow-md
                     hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <span>I&apos;ve finished reading</span>
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
