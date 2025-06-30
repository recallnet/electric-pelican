/**
 * @file Animation utilities for router UI components
 * @description Provides smooth animation helpers for progress bars and transitions
 */

/**
 * Easing function for smooth animations
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for bounce effect
 */
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

/**
 * Animate a value over time with easing
 */
export function animate(
  from: number,
  to: number,
  options: {
    duration: number;
    easing?: (t: number) => number;
    onUpdate: (value: number) => void;
    onComplete?: () => void;
  },
): { stop: () => void } {
  const { duration, easing = easeOutCubic, onUpdate, onComplete } = options;

  let startTime: number;
  let animationId: number;
  let stopped = false;

  const step = (timestamp: number) => {
    if (stopped) return;

    if (!startTime) startTime = timestamp;

    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    const currentValue = from + (to - from) * easedProgress;
    onUpdate(currentValue);

    if (progress < 1) {
      animationId = requestAnimationFrame(step);
    } else {
      onComplete?.();
    }
  };

  animationId = requestAnimationFrame(step);

  return {
    stop: () => {
      stopped = true;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    },
  };
}

/**
 * Stagger animations for multiple elements
 */
export function staggerAnimation(
  elements: HTMLElement[],
  animationFn: (element: HTMLElement, index: number) => void,
  delay: number = 100,
): void {
  elements.forEach((element, index) => {
    setTimeout(() => {
      animationFn(element, index);
    }, index * delay);
  });
}

/**
 * Create a spring animation effect
 */
export function createSpringAnimation(
  element: HTMLElement,
  property: string,
  from: number,
  to: number,
  options: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  } = {},
): { stop: () => void } {
  const { stiffness = 200, damping = 25, mass = 1 } = options;

  let value = from;
  let velocity = 0;
  let animationId: number;
  let stopped = false;

  const step = () => {
    if (stopped) return;

    const force = -stiffness * (value - to);
    const dampingForce = -damping * velocity;

    const acceleration = (force + dampingForce) / mass;
    velocity += acceleration * 0.016; // Assume 60fps
    value += velocity * 0.016;

    element.style.setProperty(property, `${value}px`);

    // Continue animation if not settled
    if (Math.abs(velocity) > 0.01 || Math.abs(value - to) > 0.01) {
      animationId = requestAnimationFrame(step);
    }
  };

  animationId = requestAnimationFrame(step);

  return {
    stop: () => {
      stopped = true;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    },
  };
}

/**
 * Fade in animation
 */
export function fadeIn(
  element: HTMLElement,
  duration: number = 300,
  easing: (t: number) => number = easeOutCubic,
): Promise<void> {
  return new Promise((resolve) => {
    element.style.opacity = "0";
    element.style.transition = "none";

    animate(0, 1, {
      duration,
      easing,
      onUpdate: (value) => {
        element.style.opacity = value.toString();
      },
      onComplete: () => {
        element.style.transition = "";
        resolve();
      },
    });
  });
}

/**
 * Slide in animation
 */
export function slideIn(
  element: HTMLElement,
  direction: "up" | "down" | "left" | "right" = "up",
  distance: number = 20,
  duration: number = 300,
): Promise<void> {
  return new Promise((resolve) => {
    const initialTransform = element.style.transform;

    let translateProperty: string;
    let translateValue: string;

    switch (direction) {
      case "up":
        translateProperty = "translateY";
        translateValue = `${distance}px`;
        break;
      case "down":
        translateProperty = "translateY";
        translateValue = `-${distance}px`;
        break;
      case "left":
        translateProperty = "translateX";
        translateValue = `${distance}px`;
        break;
      case "right":
        translateProperty = "translateX";
        translateValue = `-${distance}px`;
        break;
    }

    element.style.transform = `${translateProperty}(${translateValue})`;
    element.style.opacity = "0";
    element.style.transition = "none";

    requestAnimationFrame(() => {
      element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
      element.style.transform = initialTransform;
      element.style.opacity = "1";

      setTimeout(() => {
        element.style.transition = "";
        resolve();
      }, duration);
    });
  });
}

/**
 * Pulse animation for attention
 */
export function pulse(
  element: HTMLElement,
  intensity: number = 1.05,
  duration: number = 600,
): Promise<void> {
  return new Promise((resolve) => {
    const originalTransform = element.style.transform;

    element.style.transition = `transform ${duration / 2}ms ease-out`;
    element.style.transform = `${originalTransform} scale(${intensity})`;

    setTimeout(() => {
      element.style.transform = originalTransform;

      setTimeout(() => {
        element.style.transition = "";
        resolve();
      }, duration / 2);
    }, duration / 2);
  });
}
