import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { useHorizontalOverflow } from "./useHorizontalOverflow";

const Strip = ({ wheelScrolls }: { wheelScrolls: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { start, end } = useHorizontalOverflow(ref, { wheelScrolls });
  return (
    <div ref={ref} data-testid="strip" data-start={start} data-end={end}>
      <div />
    </div>
  );
};

const renderStrip = (
  layout: { scrollWidth: number; clientWidth: number },
  wheelScrolls = true,
) => {
  const scrollWidth = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "scrollWidth",
  );
  const clientWidth = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "clientWidth",
  );
  Object.defineProperty(Element.prototype, "scrollWidth", {
    configurable: true,
    get: () => layout.scrollWidth,
  });
  Object.defineProperty(Element.prototype, "clientWidth", {
    configurable: true,
    get: () => layout.clientWidth,
  });
  try {
    render(<Strip wheelScrolls={wheelScrolls} />);
  } finally {
    Object.defineProperty(Element.prototype, "scrollWidth", scrollWidth!);
    Object.defineProperty(Element.prototype, "clientWidth", clientWidth!);
  }
  const strip = screen.getByTestId("strip");
  Object.defineProperty(strip, "scrollWidth", {
    get: () => layout.scrollWidth,
  });
  Object.defineProperty(strip, "clientWidth", {
    get: () => layout.clientWidth,
  });
  return strip;
};

const overflow = (strip: HTMLElement) => [
  strip.dataset.start,
  strip.dataset.end,
];

describe("useHorizontalOverflow", () => {
  it("reports no overflow when the content fits", () => {
    expect(
      overflow(renderStrip({ scrollWidth: 300, clientWidth: 300 })),
    ).toEqual(["false", "false"]);
  });

  it("reports each side that still has content to scroll to", () => {
    const strip = renderStrip({ scrollWidth: 500, clientWidth: 200 });
    expect(overflow(strip)).toEqual(["false", "true"]);

    strip.scrollLeft = 150;
    fireEvent.scroll(strip);
    expect(overflow(strip)).toEqual(["true", "true"]);

    strip.scrollLeft = 299.5;
    fireEvent.scroll(strip);
    expect(overflow(strip)).toEqual(["true", "false"]);
  });

  it("turns a vertical mouse wheel into horizontal scrolling only when overflowing", () => {
    const strip = renderStrip({ scrollWidth: 500, clientWidth: 200 });
    const wheel = new WheelEvent("wheel", { deltaY: 40, cancelable: true });
    strip.dispatchEvent(wheel);
    expect(strip.scrollLeft).toBe(40);
    expect(wheel.defaultPrevented).toBe(true);
  });

  it("leaves the wheel alone when the content fits", () => {
    const strip = renderStrip({ scrollWidth: 200, clientWidth: 200 });
    const wheel = new WheelEvent("wheel", { deltaY: 40, cancelable: true });
    strip.dispatchEvent(wheel);
    expect(strip.scrollLeft).toBe(0);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it("leaves the wheel alone unless wheel scrolling is enabled", () => {
    const strip = renderStrip({ scrollWidth: 500, clientWidth: 200 }, false);
    const wheel = new WheelEvent("wheel", { deltaY: 40, cancelable: true });
    strip.dispatchEvent(wheel);
    expect(strip.scrollLeft).toBe(0);
    expect(wheel.defaultPrevented).toBe(false);
  });
});
