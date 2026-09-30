/** AquaFlow mark: white droplet with a smile-wave on a sky tile (from the Stitch logo screen). */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0284c7" />
      <path d="M16 6.5c-.4 0-.7.2-.9.5C12.6 10.7 9.5 15 9.5 18.6 9.5 22.4 12.4 25.5 16 25.5s6.5-3.1 6.5-6.9C22.5 15 19.4 10.7 16.9 7c-.2-.3-.5-.5-.9-.5Z" fill="#fff" />
      <path d="M12.6 19.4c1.9 1.7 4.9 1.7 6.8 0" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-none">
        <div className="font-display text-[17px] font-bold tracking-tight text-ink">AquaFlow</div>
        <div className="mt-0.5 text-[9px] font-semibold tracking-[0.18em] text-brand">OPERATIONS</div>
      </div>
    </div>
  );
}
