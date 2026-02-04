'use client';

import React from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
);

const MotionButton = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.button),
  { ssr: false }
);

interface ImageChallengeProps {
  content: string;
  onComplete: () => void;
}

export const ImageChallenge: React.FC<ImageChallengeProps> = ({ content, onComplete }) => {
  return (
    <div className='w-full max-w-4xl mx-auto p-8'>
      <MotionDiv 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-2xl shadow-lg overflow-hidden'
      >
        <div className='p-8'>
          <div className='mb-10 relative pb-4'>
            <h2 className='text-4xl font-bold text-gray-800 mb-4 tracking-tight'>Image Challenge</h2>
            <div className='h-1.5 w-32 bg-green-500 rounded-full absolute bottom-0 left-0'></div>
            <div className='h-1.5 w-16 bg-green-300 rounded-full absolute bottom-0 left-36'></div>
          </div>
          
          <MotionDiv 
            className='relative group'
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {content ? (
              <Image 
                src={content.startsWith('/') ? content : `/${content}`} 
                alt='Challenge Image'
                width={800}
                height={600}
                className='w-full h-auto rounded-xl shadow-lg transition-all duration-300
                         group-hover:shadow-xl'
                priority
              />
            ) : (
              <div className='w-full h-[600px] bg-gray-100 rounded-xl flex items-center justify-center'>
                <p className='text-gray-400'>No image available</p>
              </div>
            )}
            <MotionDiv 
              className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                        transition-opacity duration-300 rounded-xl flex items-center
                        justify-center'
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              <button 
                onClick={() => content && window.open(content, '_blank')}
                className='bg-white/90 text-gray-800 px-4 py-2 rounded-lg
                         hover:bg-white transition-colors duration-200
                         flex items-center gap-2'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} 
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2}
                        d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                </svg>
                View Full Image
              </button>
            </MotionDiv>
          </MotionDiv>
          
          <div className='mt-6 text-gray-600 text-lg leading-relaxed'>
            Click the image to view it in full size.
          </div>
        </div>

        <div className='bg-gray-50 px-8 py-6 border-t border-gray-100'>
          <MotionButton 
            onClick={onComplete}
            className='w-full md:w-auto bg-green-500 text-white px-8 py-3 rounded-lg
                     hover:bg-green-600 transition-colors duration-200 ease-in-out
                     font-medium flex items-center justify-center gap-2 shadow-md
                     hover:shadow-lg'
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>I&apos;ve finished viewing</span>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} 
                    d='M13 7l5 5m0 0l-5 5m5-5H6' />
            </svg>
          </MotionButton>
        </div>
      </MotionDiv>
    </div>
  );
};
