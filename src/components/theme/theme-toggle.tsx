'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle theme change - cycle through light, dark, system
  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Determine current theme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';
  const isSystem = theme === 'system';

  // Placeholder while mounting
  if (!mounted) {
    return <div className="w-14 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />;
  }

  return (
    <div className="relative">
      {/* Main toggle button */}
      <motion.button
        onClick={cycleTheme}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative w-14 h-8 rounded-full p-1 transition-all duration-500",
          isDark 
            ? "bg-gradient-to-r from-indigo-900 to-slate-800 border border-indigo-800 shadow-inner shadow-indigo-900/20" 
            : "bg-gradient-to-r from-amber-100 to-sky-100 border border-amber-200 shadow-inner shadow-amber-100/20"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle theme"
      >
        <span className="sr-only">Toggle theme</span>
        
        {/* Stars in dark mode */}
        <AnimatePresence>
          {isDark && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-[2px] h-[2px] rounded-full bg-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: Math.random() * 0.7 + 0.3 }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5 + Math.random() * 2,
                    repeatType: "reverse" 
                  }}
                  style={{
                    top: `${Math.random() * 70 + 15}%`,
                    left: `${Math.random() * 80 + 10}%`,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
        
        {/* Track icons */}
        <motion.span 
          className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-400"
          animate={{ opacity: isDark ? 0.3 : 1 }}
        >
          <Sun size={12} />
        </motion.span>
        <motion.span 
          className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400"
          animate={{ opacity: isDark ? 1 : 0.3 }}
        >
          <Moon size={12} />
        </motion.span>
        
        {/* Animated thumb */}
        <motion.div
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full shadow-lg",
            isDark 
              ? "bg-gradient-to-br from-indigo-400 to-indigo-600 border border-indigo-300" 
              : isSystem
                ? "bg-gradient-to-br from-gray-300 to-gray-500 border border-gray-200"
                : "bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-200"
          )}
          initial={false}
          animate={{ 
            x: isDark ? 24 : isSystem ? 12 : 0,
            rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
          }}
          transition={{ 
            x: { type: "spring", stiffness: 500, damping: 30 },
            rotate: { duration: 0.5, ease: "easeInOut" }
          }}
        >
          {isDark ? (
            <Moon size={14} className="text-white" />
          ) : isSystem ? (
            <Monitor size={14} className="text-white" />
          ) : (
            <Sun size={14} className="text-white" />
          )}
          
          {/* Glow effect */}
          <motion.div 
            className={cn(
              "absolute inset-0 rounded-full blur-md opacity-70",
              isDark ? "bg-indigo-400" : isSystem ? "bg-gray-400" : "bg-amber-400"
            )}
            style={{ zIndex: -1 }}
            animate={{ 
              opacity: isHovered ? 0.9 : 0.4,
              scale: isHovered ? 1.2 : 1
            }}
          />
        </motion.div>
      </motion.button>
      
      {/* Theme label tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className={cn(
              "absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium",
              isDark 
                ? "bg-indigo-900 text-indigo-100" 
                : isSystem 
                  ? "bg-gray-700 text-gray-100" 
                  : "bg-amber-100 text-amber-900"
            )}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? 'มืด' : isSystem ? 'ตามระบบ' : 'สว่าง'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}