import { useState, type FormEvent } from 'react';
import { ArrowRight, Instagram, Linkedin, Youtube } from 'lucide-react';
import { RevealText } from '@/components/system/RevealText';
import { BRAND, FOOTER_LINKS } from '@/data/site';
import { cn } from '@/lib/utils';

const SOCIALS = [
  { label: 'Instagram', Icon: Instagram },
  { label: 'YouTube', Icon: Youtube },
  { label: 'LinkedIn', Icon: Linkedin },
];

export function Footer() {
  return (
    <footer className="relative border-t border-divider bg-ink pb-12 pt-[clamp(4rem,10vh,8rem)]">
      <div className="gold-rule absolute inset-x-0 top-0" aria-hidden="true" />

      <div className="gutter">
        <div className="grid grid-cols-1 gap-x-12 gap-y-16 lg:grid-cols-12">
          {/* Newsletter -------------------------------------------- */}
          <div className="lg:col-span-5">
            <RevealText as="h2" variant="chars" className="display text-[clamp(2rem,4.5vw,3.5rem)]">
              The Register.
            </RevealText>
            <p className="lede mt-5 max-w-[38ch] text-[0.85rem]">
              Two letters a year. New models, behind the scenes, and nothing else.
            </p>
            <Newsletter />
          </div>

          <div className="hidden lg:col-span-1 lg:block" aria-hidden="true" />

          {/* Link columns ------------------------------------------ */}
          {FOOTER_LINKS.map((group) => (
            <nav key={group.title} aria-label={group.title} className="lg:col-span-2">
              <h3 className="font-sub text-[0.58rem] uppercase tracking-[0.3em] text-gold">
                {group.title}
              </h3>
              <ul className="mt-6 space-y-3.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#specifications"
                      className="group inline-flex items-center gap-2 font-body text-[0.85rem] text-muted transition-colors duration-400 hover:text-bone"
                    >
                      <span className="h-px w-0 bg-gold transition-all duration-500 ease-[var(--ease-luxe)] group-hover:w-4" />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contact ----------------------------------------------- */}
          <div className="lg:col-span-2">
            <h3 className="font-sub text-[0.58rem] uppercase tracking-[0.3em] text-gold">Atelier</h3>
            <address className="mt-6 font-body text-[0.85rem] not-italic leading-relaxed text-muted">
              {BRAND.name} Automobili
              <br />
              Rue du Rhône 42
              <br />
              1204 Genève, Switzerland
            </address>
            <ul className="mt-7 flex gap-3">
              {SOCIALS.map(({ label, Icon }) => (
                <li key={label}>
                  <a
                    href="#hero"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center border border-white/10 text-muted transition-all duration-500 ease-[var(--ease-luxe)] hover:border-gold hover:text-gold"
                  >
                    <Icon size={15} strokeWidth={1.25} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Baseline ------------------------------------------------ */}
        <div className="mt-[clamp(4rem,8vh,7rem)] border-t border-divider pt-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-[0.72rem] text-muted">
              © {BRAND.year} {BRAND.name} Manufacture SA. All rights reserved.
            </p>
            <p className="font-sub text-[0.58rem] uppercase tracking-[0.3em] text-muted">
              {BRAND.tagline} — {BRAND.reference}
            </p>
          </div>

          <div className="mt-8 flex flex-col items-start gap-4 border-t border-gold/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-[0.68rem] text-muted/70">
              Design & front-end engineering — {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Newsletter capture. Validation and the confirmation state are handled locally;
 * wiring the submit to a real list provider is the only change needed to ship it.
 */
function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'error' | 'done'>('idle');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    if (!valid) {
      setState('error');
      return;
    }
    setState('done');
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 max-w-md">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>

      <div
        className={cn(
          'flex items-center gap-4 border-b pb-3 transition-colors duration-500',
          state === 'error' ? 'border-red-400/60' : 'border-white/15 focus-within:border-gold',
        )}
      >
        <input
          id="newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@domain.com"
          value={email}
          disabled={state === 'done'}
          aria-invalid={state === 'error'}
          aria-describedby="newsletter-status"
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === 'error') setState('idle');
          }}
          className="w-full bg-transparent font-body text-[0.9rem] text-bone placeholder:text-muted/60 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={state === 'done'}
          className="group flex shrink-0 items-center gap-2 font-sub text-[0.58rem] uppercase tracking-[0.28em] text-gold transition-opacity duration-400 hover:opacity-70 disabled:opacity-40"
        >
          {state === 'done' ? 'Registered' : 'Register'}
          <ArrowRight
            size={13}
            strokeWidth={1.5}
            aria-hidden="true"
            className="transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:translate-x-1"
          />
        </button>
      </div>

      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className={cn(
          'mt-3 font-body text-[0.72rem] transition-opacity duration-400',
          state === 'idle' && 'opacity-0',
          state === 'error' && 'text-red-400/90',
          state === 'done' && 'text-muted',
        )}
      >
        {state === 'error' && 'Enter a valid email address.'}
        {state === 'done' && 'Thank you — you are on the register.'}
        {state === 'idle' && 'placeholder'}
      </p>
    </form>
  );
}
