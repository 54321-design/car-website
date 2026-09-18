import { motion } from 'framer-motion';
import { NAV_SECTIONS } from '@/data/site';

/**
 * Mobile navigation sheet.
 *
 * Split into its own chunk so Framer Motion stays out of the initial bundle —
 * it is ~45kB gzipped and nothing above the fold needs it. The chunk is fetched
 * the moment the menu button is pressed, which is well inside the time the
 * overlay takes to fade in.
 */
export default function MobileMenu({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <motion.div
      id="mobile-menu"
      className="fixed inset-0 z-[75] flex flex-col justify-center gutter bg-ink/[0.97] backdrop-blur-2xl lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <ul className="flex flex-col">
        {NAV_SECTIONS.map((section, i) => (
          <motion.li
            key={section.id}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.7, delay: 0.06 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
          >
            <a
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(section.id);
              }}
              className="flex items-baseline gap-5 border-b border-divider py-5"
            >
              <span className="font-sub text-[0.55rem] tracking-[0.3em] text-gold">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-[clamp(2rem,9vw,3rem)] leading-none">
                {section.label}
              </span>
            </a>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
