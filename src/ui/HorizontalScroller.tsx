import { useRef, type ReactNode } from "react";
import { useHorizontalOverflow } from "./useHorizontalOverflow";

interface HorizontalScrollerProps {
  className?: string;
  wheelScrolls?: boolean;
  children: ReactNode;
}

export const HorizontalScroller = ({
  className,
  wheelScrolls = false,
  children,
}: HorizontalScrollerProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const overflow = useHorizontalOverflow(scrollerRef, { wheelScrolls });
  const classes = [
    "pvhabits-hscroll",
    className,
    overflow.start && "fades-start",
    overflow.end && "fades-end",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={scrollerRef} className={classes}>
      {children}
    </div>
  );
};
