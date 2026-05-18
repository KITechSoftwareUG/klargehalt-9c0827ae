'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  once?: boolean;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
  once = true,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // Positive bottom margin: trigger ~300px before the element enters the
  // viewport so content is already revealed by the time it scrolls into
  // view — prevents the "blank white section" effect on fast scroll.
  const isInView = useInView(ref, { once, margin: '0px 0px 300px 0px' });

  const visible = { opacity: 1, y: 0, x: 0 };
  const initial = reduceMotion
    ? visible
    : {
        opacity: 0,
        y: direction === 'up' ? 24 : direction === 'down' ? -24 : 0,
        x: direction === 'left' ? 24 : direction === 'right' ? -24 : 0,
      };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={reduceMotion || isInView ? visible : initial}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className, staggerDelay = 0.08 }: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: '0px 0px 300px 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={reduceMotion || isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

export { motion };
