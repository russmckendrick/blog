import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';

interface HeaderWrapperProps {
  children: React.ReactNode;
  autoHide?: boolean;
}

export default function HeaderWrapper({ children, autoHide = false }: HeaderWrapperProps) {
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!autoHide) return;

    const previous = scrollY.getPrevious() ?? 0;

    // Only hide after scrolling past 100px
    if (latest > 100) {
      if (latest > previous) {
        // Scrolling down
        setHidden(true);
      } else {
        // Scrolling up
        setHidden(false);
      }
    } else {
      // Always show at top
      setHidden(false);
    }
  });

  return (
    <motion.div
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="sticky top-0 z-50 focus:outline-none focus:ring-0"
    >
      {children}
    </motion.div>
  );
}
