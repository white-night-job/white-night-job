type LineIconProps = {
  className?: string;
};

export function LineIcon({ className = "h-5 w-5" }: LineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M19.365 9.864c.012.168.012.336.012.504 0 5.112-5.124 9.252-11.436 9.252-1.824 0-3.528-.444-5.028-1.224L1.5 20.25l2.34-3.456C2.58 15.456 1.89 13.26 1.89 10.872 1.89 5.76 7.014 1.62 13.326 1.62c6.312 0 11.436 4.14 11.436 9.252 0 .168 0 .336-.012.504h-.385z" />
    </svg>
  );
}
