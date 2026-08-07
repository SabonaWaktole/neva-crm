import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValueEvent,
} from 'framer-motion';
import { Building2, Construction, ShieldCheck, Zap } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useThemeStore } from '../../store/useThemeStore';
import nevaLogo from '../../assets/nevacrm-logo.png';
import nevaLogoDark from '../../assets/nevacrm-logo-dark.png';
import nevaIcon from '../../assets/nevacrm-icon.png';
import {
  headlineContainerVariants,
  headlineWordVariants,
  heroContainerVariants,
  heroItemVariants,
  marketingEase,
  noopVariants,
  revealContainerVariants,
  revealVariants,
  revealViewport,
  staticVariants,
} from '../../lib/motion';
import styles from './LandingPage.module.css';

/**
 * LANDING PAGE CONTENT LIVES IN THE i18n CATALOGUE, NOT IN THIS FILE.
 *
 * All copy is under `landing.*` in `src/locales/{en,sq}/auth.json`. To add or
 * change a headline, feature, or any other visible text: add the key there and
 * reference it here.
 *
 * Why this file looks different from every other component, which just calls
 * `t('some.key')` inline: this content is declared at MODULE scope, where React
 * hooks cannot reach. So the constants hold key NAMES, and the component
 * resolves them with `t(...)` at render time.
 *
 * Do not put literal strings in this file. They will not be translatable, and
 * the Albanian build will silently fall back to English for them.
 */
const HEADLINE_KEY = 'landing.headline';

/* Keys, not copy — see the note above HEADLINE_KEY. */
const FEATURES = [
  {
    icon: Building2,
    titleKey: 'landing.featureMultiTenancy',
    descriptionKey: 'landing.featureMultiTenancyDesc',
    iconStyle: {
      backgroundColor: 'var(--color-primary-container)',
      color: 'var(--color-primary)',
    },
  },
  {
    icon: ShieldCheck,
    titleKey: 'landing.featureSecurity',
    descriptionKey: 'landing.featureSecurityDesc',
    iconStyle: {
      backgroundColor: 'var(--color-secondary-container)',
      color: 'var(--color-on-secondary-container)',
    },
  },
  {
    icon: Zap,
    titleKey: 'landing.featureFast',
    descriptionKey: 'landing.featureFastDesc',
    iconStyle: {
      backgroundColor: 'var(--color-surface-variant)',
      color: 'var(--color-on-surface-variant)',
    },
  },
];

export const LandingPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const headline = t(HEADLINE_KEY);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);
  const resolvedTheme = useThemeStore((state) => state.resolved);

  const { scrollY, scrollYProgress } = useScroll();

  // The nav's glass treatment is driven by a boolean + CSS transition rather
  // than an animated backdrop-filter: filters are expensive to animate per
  // frame, and a threshold switch is what Apple/Vercel actually do.
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const next = latest > 12;
    setIsScrolled((current) => (current === next ? current : next));
  });

  // Scroll progress rail. Spring-smoothed so it glides instead of tracking
  // the wheel's raw stepping.
  const progressScale = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    restDelta: 0.001,
  });

  // Parallax: the ambient glow drifts slower than the page, and the hero
  // content eases away as it scrolls. Both are pure transform/opacity.
  const glowY = useTransform(scrollY, [0, 700], [0, 160]);
  const heroContentY = useTransform(scrollY, [0, 500], [0, 48]);

  // With reduced motion the page still fades in, but nothing travels or
  // parallaxes — no transform is ever driven by scroll.
  const containerVariants = prefersReducedMotion ? noopVariants : heroContainerVariants;
  const itemVariants = prefersReducedMotion ? staticVariants : heroItemVariants;
  const sectionVariants = prefersReducedMotion ? staticVariants : revealVariants;
  const wordContainerVariants = prefersReducedMotion ? noopVariants : headlineContainerVariants;
  const wordVariants = prefersReducedMotion ? staticVariants : headlineWordVariants;

  // `x: '-50%'` centres the glow. It lives here rather than in CSS because
  // Motion writes the entire `transform`, so a CSS translateX would be lost
  // the moment `y` animates.
  const glowStyle = prefersReducedMotion ? { x: '-50%' } : { x: '-50%', y: glowY };
  // Drift only — deliberately no scroll-linked opacity fade on the hero. Fading
  // it out would leave the primary CTA invisible but still clickable while it
  // is on screen, which is worse than the effect is worth.
  const heroParallax = prefersReducedMotion ? {} : { y: heroContentY };

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: marketingEase }}
    >
      {/* Navigation Bar */}
      <nav className={`${styles.nav} ${isScrolled ? styles.navScrolled : ''}`}>
        <motion.div
          className={styles.brand}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: marketingEase }}
        >
          {/*
            The wordmark's "nëva" text is baked in dark navy, so on the dark
            theme it swaps for a pre-generated white-text variant. Only the
            text recolors — the purple icon square and "crm" gradient are
            identical pixels in both files, so the swap is invisible aside
            from the text going legible.
          */}
          <img
            src={resolvedTheme === 'dark' ? nevaLogoDark : nevaLogo}
            alt={t('appName')}
            className={styles.brandLogo}
          />
        </motion.div>

        <motion.div
          className={styles.navActions}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: marketingEase }}
        >
          <ThemeToggle />
          {/*
            Workspaces are provisioned by a platform administrator, not
            self-serve — while the site is under construction this stays a
            quiet text link for people who already have access, not a
            prominent CTA inviting new signups.
          */}
          <button type="button" className={styles.signInLink} onClick={() => navigate('/login')}>
            {t('landing.signIn')}
          </button>
        </motion.div>

        {/* Reading-progress rail pinned to the nav's lower edge. */}
        <motion.div
          className={styles.scrollProgress}
          style={{ scaleX: progressScale }}
          aria-hidden="true"
        />
      </nav>

      {/* Hero Section */}
      <main className={styles.hero}>
        {/* Ambient glow, promoted from a CSS pseudo-element so it can parallax. */}
        <motion.div
          className={styles.heroGlow}
          style={glowStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: marketingEase }}
          aria-hidden="true"
        />

        <motion.div
          className={styles.heroContent}
          style={heroParallax}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className={styles.badge} variants={itemVariants}>
            <Construction size={14} />
            <span>{t('landing.versionBanner')}</span>
          </motion.div>

          {/*
            The brand mark, enlarged into a centerpiece rather than tucked in
            the nav. A soft pulsing ring stands in for the marketing hero
            image this page doesn't have yet — it reads as "actively being
            built", not "broken" or "empty".
          */}
          <motion.div className={styles.markStage} variants={itemVariants} aria-hidden="true">
            <motion.span
              className={styles.markRing}
              animate={
                prefersReducedMotion
                  ? undefined
                  : { scale: [1, 1.12, 1], opacity: [0.5, 0.15, 0.5] }
              }
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <img src={nevaIcon} alt="" className={styles.markIcon} />
          </motion.div>

          {/*
            The headline animates per word. Screen readers get the whole
            sentence from aria-label; the spans are hidden from them so the
            text is never announced word-by-word.
          */}
          <motion.h1
            className={styles.title}
            variants={wordContainerVariants}
            initial="hidden"
            animate="visible"
            aria-label={headline}
          >
            {headline.split(' ').map((word, index, all) => (
              <Fragment key={`${word}-${index}`}>
                <span className={styles.word} aria-hidden="true">
                  <motion.span className={styles.wordInner} variants={wordVariants}>
                    {word}
                  </motion.span>
                </span>
                {/* A real space between words, not a CSS margin: the headline
                    has to survive being selected and copied, and normal
                    whitespace is also what lets the line wrap naturally. */}
                {index < all.length - 1 ? ' ' : null}
              </Fragment>
            ))}
          </motion.h1>

          <motion.p className={styles.subtitle} variants={itemVariants}>
            {t('landing.subtitle')}
          </motion.p>
        </motion.div>

        {/* Feature Grid */}
        <motion.p
          className={styles.featuresIntro}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          {t('landing.featuresIntro')}
        </motion.p>
        <motion.div
          className={styles.featureGrid}
          variants={prefersReducedMotion ? noopVariants : revealContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          {FEATURES.map(({ icon: Icon, titleKey, descriptionKey, iconStyle }) => (
            <motion.div
              className={styles.featureCard}
              key={titleKey}
              variants={sectionVariants}
              whileHover={prefersReducedMotion ? undefined : { y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <motion.div
                className={styles.featureIcon}
                style={iconStyle}
                /* Icons respond to a hover anywhere on their card. */
                variants={{
                  hidden: {},
                  visible: {},
                }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.08, rotate: -4 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              >
                <Icon size={24} />
              </motion.div>
              <h3 className={styles.featureTitle}>{t(titleKey)}</h3>
              <p className={styles.featureDescription}>{t(descriptionKey)}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className={styles.footer}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={revealViewport}
      >
        {t('landing.copyright')}
      </motion.footer>
    </motion.div>
  );
};
