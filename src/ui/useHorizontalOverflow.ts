import { useEffect, useState, type RefObject } from "react";

interface HorizontalOverflow {
  start: boolean;
  end: boolean;
}

const NO_OVERFLOW: HorizontalOverflow = { start: false, end: false };

export const useHorizontalOverflow = (
  scrollerRef: RefObject<HTMLElement | null>,
  { wheelScrolls }: { wheelScrolls: boolean },
): HorizontalOverflow => {
  const [overflow, setOverflow] = useState(NO_OVERFLOW);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const update = () => {
      const start = scroller.scrollLeft > 0;
      // scrollLeft is fractional on HiDPI screens, so the end is never hit exactly.
      const end =
        scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
      setOverflow((prev) =>
        prev.start === start && prev.end === end ? prev : { start, end },
      );
    };

    const scrollHorizontally = (event: WheelEvent) => {
      const overflowing = scroller.scrollWidth > scroller.clientWidth;
      if (!overflowing || event.deltaX !== 0 || event.deltaY === 0) return;
      event.preventDefault();
      scroller.scrollLeft += event.deltaY;
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    if (wheelScrolls) {
      scroller.addEventListener("wheel", scrollHorizontally, {
        passive: false,
      });
    }
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(scroller);
    if (scroller.firstElementChild) {
      resizeObserver.observe(scroller.firstElementChild);
    }

    return () => {
      scroller.removeEventListener("scroll", update);
      scroller.removeEventListener("wheel", scrollHorizontally);
      resizeObserver.disconnect();
    };
  }, [scrollerRef, wheelScrolls]);

  return overflow;
};
