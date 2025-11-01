'use client';

import { useEffect, useState, useCallback } from 'react';
import { TankComponent } from '@/lib/types';

interface AnimationState {
  animatedComponents: Set<string>;
  isAnimating: boolean;
}

interface UseHealthAnimationProps {
  components: TankComponent[];
  animationDelay?: number; // Delay between animations in ms (default: 150)
}

export function useHealthAnimation({
  components,
  animationDelay = 150,
}: UseHealthAnimationProps) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    animatedComponents: new Set(),
    isAnimating: false,
  });

  // Sort components by priority: critical > maintenance_required > degraded > operational
  // Then by health (lowest first)
  const sortedComponents = [...components].sort((a, b) => {
    const statusPriority: Record<string, number> = {
      critical: 0,
      maintenance_required: 1,
      degraded: 2,
      operational: 3,
    };

    const aPriority = statusPriority[a.status] ?? 99;
    const bPriority = statusPriority[b.status] ?? 99;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Then sort by health (lowest first)
    return a.health - b.health;
  });

  // Initialize animation on mount
  useEffect(() => {
    if (components.length === 0) return;

    setAnimationState((prev) => ({
      ...prev,
      isAnimating: true,
    }));

    // Animate components sequentially
    sortedComponents.forEach((component, index) => {
      setTimeout(() => {
        setAnimationState((prev) => {
          const newAnimated = new Set(prev.animatedComponents);
          newAnimated.add(component.id);
          
          const allAnimated = newAnimated.size === sortedComponents.length;
          
          return {
            animatedComponents: newAnimated,
            isAnimating: !allAnimated,
          };
        });
      }, index * animationDelay);
    });
  }, []); // Only run on mount

  // Check if a component should be animated
  const shouldAnimate = useCallback(
    (componentId: string) => {
      return animationState.animatedComponents.has(componentId);
    },
    [animationState.animatedComponents]
  );

  // Get animation progress for a component (0 to 1)
  const getAnimationProgress = useCallback(
    (componentId: string) => {
      if (!animationState.animatedComponents.has(componentId)) {
        return 0;
      }
      return 1; // Fully animated
    },
    [animationState.animatedComponents]
  );

  // Reset animation (useful for re-triggering)
  const resetAnimation = useCallback(() => {
    setAnimationState({
      animatedComponents: new Set(),
      isAnimating: false,
    });
    
    // Re-trigger animation
    sortedComponents.forEach((component, index) => {
      setTimeout(() => {
        setAnimationState((prev) => {
          const newAnimated = new Set(prev.animatedComponents);
          newAnimated.add(component.id);
          
          const allAnimated = newAnimated.size === sortedComponents.length;
          
          return {
            animatedComponents: newAnimated,
            isAnimating: !allAnimated,
          };
        });
      }, index * animationDelay);
    });
  }, [sortedComponents, animationDelay]);

  return {
    sortedComponents,
    isAnimating: animationState.isAnimating,
    animatedComponents: animationState.animatedComponents,
    shouldAnimate,
    getAnimationProgress,
    resetAnimation,
  };
}

