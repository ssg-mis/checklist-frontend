"use client"
import { useState, useEffect } from 'react';
import { Sun, Moon, Sunrise, Sunset, Sparkles } from 'lucide-react';

const WelcomeCard = ({ username }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [greeting, setGreeting] = useState({ text: '', icon: null, bgClass: '' });

  useEffect(() => {
    // Check if we've already shown the welcome this session
    const hasShownWelcome = sessionStorage.getItem('welcome-shown');
    if (hasShownWelcome) {
      setIsVisible(false);
      return;
    }

    // Determine greeting based on time
    const hour = new Date().getHours();
    let greetingData = { text: '', icon: null, bgClass: '' };

    if (hour >= 5 && hour < 12) {
      greetingData = {
        text: 'Good Morning',
        icon: <Sunrise className="w-8 h-8" />,
        bgClass: 'from-amber-400 via-orange-400 to-yellow-300'
      };
    } else if (hour >= 12 && hour < 17) {
      greetingData = {
        text: 'Good Afternoon',
        icon: <Sun className="w-8 h-8" />,
        bgClass: 'from-blue-400 via-cyan-400 to-teal-300'
      };
    } else if (hour >= 17 && hour < 21) {
      greetingData = {
        text: 'Good Evening',
        icon: <Sunset className="w-8 h-8" />,
        bgClass: 'from-orange-500 via-pink-500 to-purple-500'
      };
    } else {
      greetingData = {
        text: 'Good Night',
        icon: <Moon className="w-8 h-8" />,
        bgClass: 'from-indigo-600 via-purple-600 to-violet-700'
      };
    }

    setGreeting(greetingData);

    // Animate content after initial mount
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 100);

    // Auto-hide after 4 seconds
    const hideTimer = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleClose = () => {
    setShowContent(false);
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('welcome-shown', 'true');
    }, 500);
  };

  if (!isVisible) return null;

  const displayName = username || 'User';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-500 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Welcome Card */}
      <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-500 ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}>
        <div 
          className={`relative overflow-hidden rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-700 ease-out ${
            showContent ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${greeting.bgClass}`} />
          
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" 
                 style={{ animationDelay: '0s' }} />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" 
                 style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse" 
                 style={{ animationDelay: '1s' }} />
          </div>
          
          {/* Sparkle Effects */}
          <div className="absolute top-4 right-4 text-white/60 animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="absolute bottom-8 left-8 text-white/40 animate-bounce" style={{ animationDelay: '0.3s' }}>
            <Sparkles className="w-4 h-4" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-8 text-white text-center">
            {/* Icon with Animation */}
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4 transition-all duration-700 delay-100 ${
              showContent ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
            }`}>
              {greeting.icon}
            </div>
            
            {/* Greeting Text */}
            <h2 className={`text-xl font-medium mb-2 transition-all duration-500 delay-200 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {greeting.text}
            </h2>
            
            {/* Username */}
            <h1 className={`text-3xl sm:text-4xl font-bold mb-4 transition-all duration-500 delay-300 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              Welcome, {displayName}!
            </h1>
            
            {/* Date */}
            <p className={`text-sm text-white/80 mb-6 transition-all duration-500 delay-400 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {currentDate}
            </p>
            
            {/* Motivational Message */}
            <p className={`text-white/90 text-sm transition-all duration-500 delay-500 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              Let's make today productive! ✨
            </p>
            
            {/* Progress Bar (Auto-close indicator) */}
            <div className="mt-6 mx-auto w-32 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full animate-shrink"
                style={{ 
                  animation: 'shrink 4s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom Animation Keyframes */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  );
};

export default WelcomeCard;
