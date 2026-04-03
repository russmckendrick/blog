import { motion, type Variants } from 'framer-motion'

interface ShareButton {
  name: string
  icon: string
  brandColor: string
  darkBrandColor: string
  hoverBg: string
  url: string
}

interface Props {
  buttons: ShareButton[]
}

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 24,
    },
  },
}

export default function ShareButtonsMotion({ buttons }: Props) {
  return (
    <div className="surface-container-low rounded-xl px-6 py-5 mt-8">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <motion.span
          className="text-sm text-on-surface-variant font-medium tracking-wide"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4 }}
        >
          Share
        </motion.span>
        <motion.div
          className="flex items-center gap-3 flex-wrap"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
        >
          {buttons.map((button) => (
            <motion.a
              key={button.name}
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${button.name}`}
              className="share-icon surface-container-lowest ghost-border rounded-full p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                '--brand-light': button.brandColor,
                '--brand-dark': button.darkBrandColor,
              } as React.CSSProperties}
              variants={item}
              whileHover={{ scale: 1.12, y: -3 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              dangerouslySetInnerHTML={{ __html: button.icon }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
