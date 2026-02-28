const VARIANTS = {
  green:  'badge-green',
  yellow: 'badge-yellow',
  red:    'badge-red',
  navy:   'badge-navy',
  slate:  'badge-slate',
};

export const Badge = ({ children, variant = 'slate', dot = false }) => (
  <span className={VARIANTS[variant] || VARIANTS.slate}>
    {dot && <span className={`dot-${variant}`} />}
    {children}
  </span>
);
