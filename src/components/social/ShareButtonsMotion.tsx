import { motion } from 'framer-motion'

interface ShareButton {
  name: string
  icon: string
  brandColor: string
  darkBrandColor: string
  url: string
}

interface Props {
  buttons: ShareButton[]
}

export default function ShareButtonsMotion({ buttons }: Props) {
  return (
    <div className="surface-container-low rounded-xl px-6 py-5 mt-8">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <span className="text-sm text-on-surface-variant font-medium tracking-wide">
          Share
        </span>
        <div className="flex items-center gap-3 flex-wrap">
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
              whileHover={{ scale: 1.15, y: -4 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              dangerouslySetInnerHTML={{ __html: button.icon }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
