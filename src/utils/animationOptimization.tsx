import React, { useRef, useCallback, useEffect } from 'react';
import { Animated, InteractionManager, Platform } from 'react-native';

// Animation performance constants
const ANIMATION_CONFIG = {
  // Use native driver for better performance
  useNativeDriver: true,
  // Optimize for 60fps
  duration: 300,
  // Easing for smooth animations
  easing: Animated.Easing.cubic,
  // Reduce animation complexity on low-end devices
  isLowEndDevice: Platform.OS === 'android' && Platform.Version < 26,
};

// Optimized animation hook
export const useOptimizedAnimation = (initialValue: number = 0) => {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  const isAnimating = useRef(false);

  const animate = useCallback((
    toValue: number,
    options: {
      duration?: number;
      delay?: number;
      easing?: any;
      useNativeDriver?: boolean;
    } = {}
  ) => {
    if (isAnimating.current) return;

    const {
      duration = ANIMATION_CONFIG.duration,
      delay = 0,
      easing = ANIMATION_CONFIG.easing,
      useNativeDriver = ANIMATION_CONFIG.useNativeDriver,
    } = options;

    isAnimating.current = true;

    // Defer animation to avoid blocking interactions
    InteractionManager.runAfterInteractions(() => {
      Animated.timing(animatedValue, {
        toValue,
        duration,
        delay,
        easing,
        useNativeDriver,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  }, [animatedValue]);

  const animateTo = useCallback((toValue: number, options = {}) => {
    animate(toValue, options);
  }, [animate]);

  const reset = useCallback(() => {
    animatedValue.setValue(initialValue);
    isAnimating.current = false;
  }, [animatedValue, initialValue]);

  return {
    animatedValue,
    animate,
    animateTo,
    reset,
    isAnimating: () => isAnimating.current,
  };
};

// Optimized spring animation hook
export const useOptimizedSpring = (initialValue: number = 0) => {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  const isAnimating = useRef(false);

  const spring = useCallback((
    toValue: number,
    options: {
      tension?: number;
      friction?: number;
      useNativeDriver?: boolean;
    } = {}
  ) => {
    if (isAnimating.current) return;

    const {
      tension = 50,
      friction = 7,
      useNativeDriver = ANIMATION_CONFIG.useNativeDriver,
    } = options;

    isAnimating.current = true;

    InteractionManager.runAfterInteractions(() => {
      Animated.spring(animatedValue, {
        toValue,
        tension,
        friction,
        useNativeDriver,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  }, [animatedValue]);

  const reset = useCallback(() => {
    animatedValue.setValue(initialValue);
    isAnimating.current = false;
  }, [animatedValue, initialValue]);

  return {
    animatedValue,
    spring,
    reset,
    isAnimating: () => isAnimating.current,
  };
};

// Optimized sequence animation hook
export const useOptimizedSequence = () => {
  const animations = useRef<Animated.CompositeAnimation[]>([]);
  const isAnimating = useRef(false);

  const runSequence = useCallback((
    animationSteps: (() => Animated.CompositeAnimation)[],
    options: {
      useNativeDriver?: boolean;
      onComplete?: () => void;
    } = {}
  ) => {
    if (isAnimating.current) return;

    const { useNativeDriver = ANIMATION_CONFIG.useNativeDriver, onComplete } = options;

    isAnimating.current = true;

    InteractionManager.runAfterInteractions(() => {
      const sequence = Animated.sequence(
        animationSteps.map(step => step())
      );

      sequence.start(() => {
        isAnimating.current = false;
        onComplete?.();
      });

      animations.current.push(sequence);
    });
  }, []);

  const stopAll = useCallback(() => {
    animations.current.forEach(animation => animation.stop());
    animations.current = [];
    isAnimating.current = false;
  }, []);

  return {
    runSequence,
    stopAll,
    isAnimating: () => isAnimating.current,
  };
};

// Optimized parallel animation hook
export const useOptimizedParallel = () => {
  const animations = useRef<Animated.CompositeAnimation[]>([]);
  const isAnimating = useRef(false);

  const runParallel = useCallback((
    animationSteps: (() => Animated.CompositeAnimation)[],
    options: {
      useNativeDriver?: boolean;
      onComplete?: () => void;
    } = {}
  ) => {
    if (isAnimating.current) return;

    const { useNativeDriver = ANIMATION_CONFIG.useNativeDriver, onComplete } = options;

    isAnimating.current = true;

    InteractionManager.runAfterInteractions(() => {
      const parallel = Animated.parallel(
        animationSteps.map(step => step())
      );

      parallel.start(() => {
        isAnimating.current = false;
        onComplete?.();
      });

      animations.current.push(parallel);
    });
  }, []);

  const stopAll = useCallback(() => {
    animations.current.forEach(animation => animation.stop());
    animations.current = [];
    isAnimating.current = false;
  }, []);

  return {
    runParallel,
    stopAll,
    isAnimating: () => isAnimating.current,
  };
};

// Optimized staggered animation hook
export const useOptimizedStagger = () => {
  const animations = useRef<Animated.CompositeAnimation[]>([]);
  const isAnimating = useRef(false);

  const runStagger = useCallback((
    animationSteps: (() => Animated.CompositeAnimation)[],
    options: {
      delay?: number;
      useNativeDriver?: boolean;
      onComplete?: () => void;
    } = {}
  ) => {
    if (isAnimating.current) return;

    const {
      delay = 100,
      useNativeDriver = ANIMATION_CONFIG.useNativeDriver,
      onComplete,
    } = options;

    isAnimating.current = true;

    InteractionManager.runAfterInteractions(() => {
      const stagger = Animated.stagger(
        delay,
        animationSteps.map(step => step())
      );

      stagger.start(() => {
        isAnimating.current = false;
        onComplete?.();
      });

      animations.current.push(stagger);
    });
  }, []);

  const stopAll = useCallback(() => {
    animations.current.forEach(animation => animation.stop());
    animations.current = [];
    isAnimating.current = false;
  }, []);

  return {
    runStagger,
    stopAll,
    isAnimating: () => isAnimating.current,
  };
};

// Animation performance monitor
export const useAnimationPerformance = (animationName: string) => {
  const startTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  const startMonitoring = useCallback(() => {
    startTime.current = Date.now();
    frameCount.current = 0;
    lastFrameTime.current = 0;
  }, []);

  const recordFrame = useCallback(() => {
    const now = Date.now();
    frameCount.current++;
    
    if (lastFrameTime.current === 0) {
      lastFrameTime.current = now;
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    const duration = Date.now() - startTime.current;
    const fps = frameCount.current / (duration / 1000);
    
    if (fps < 50) {
      console.warn(`Low animation FPS detected for ${animationName}: ${fps.toFixed(1)}fps`);
    }
    
    return { duration, frameCount: frameCount.current, fps };
  }, [animationName]);

  return {
    startMonitoring,
    recordFrame,
    stopMonitoring,
  };
};

// Optimized animation configuration
export const getOptimizedAnimationConfig = (devicePerformance: 'low' | 'medium' | 'high' = 'medium') => {
  const configs = {
    low: {
      duration: 200,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
      delay: 150,
    },
    medium: {
      duration: 300,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
      delay: 100,
    },
    high: {
      duration: 400,
      useNativeDriver: true,
      tension: 60,
      friction: 6,
      delay: 50,
    },
  };

  return configs[devicePerformance];
};
