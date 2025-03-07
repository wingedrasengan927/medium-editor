export const OFFSCREEN_POSITION = -1000;

export function computeToolbarPosition(
  boundingRectCoords,
  toolbarRef,
  topOffset = 0
) {
  // Ensure the popover reference is valid
  if (!toolbarRef || !toolbarRef.current) {
    console.error("Invalid popover reference");
    return {
      x: OFFSCREEN_POSITION,
      y: OFFSCREEN_POSITION,
    };
  }

  const toolbarElement = toolbarRef.current;

  const { x, y } = boundingRectCoords;
  const { width, height } = toolbarElement.getBoundingClientRect();

  const centerX = x - width / 2;
  const topY = y - height - topOffset;

  return {
    x: centerX,
    y: topY,
  };
}

export function getBoundingRectCoords(range) {
  // Ensure the range is valid
  if (!range || typeof range.getBoundingClientRect !== "function") {
    console.error("Invalid DOM range");
    return null;
  }

  const rect = range.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const topY = rect.top;

  return {
    x: centerX,
    y: topY,
  };
}
