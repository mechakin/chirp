import type { ReactNode } from "react";

type IconHoverEffectProps = {
  children: ReactNode;
  red?: boolean;
};

export function IconHoverEffect({
  children,
  red = false,
}: IconHoverEffectProps) {
  const colorClasses = red
    ? "outline-red-400 hover:bg-red-700 group-hover-bg-red-700 group-focus-visible:bg-red-700 focus-visible:bg-red-700 p-1 hover:bg-opacity-50"
    : "outline-gray-400 hover:bg-gray-700 group-hover-bg-gray-700 group-focus-visible:bg-gray-700 focus-visible:bg-gray-700 p-2";

  return (
    <div
      className={`rounded-2xl transition-colors duration-200 ${colorClasses}`}
    >
      {children}
    </div>
  );
}
