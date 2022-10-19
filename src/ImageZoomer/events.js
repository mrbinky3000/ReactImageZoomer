const TRANSITION_ANIMATION = 'scale 400ms, transform-origin 400ms';

let animationFrameId;
let clickStep;
let imgEl;
let isDragging = false;
let isPinchZoomGesture = false;
let isMouseDown = false;
let maxScale;
let minScale;
let origin;
let scale;
let start;
let wrapperEl;
let startingFingerDistance;

function _log(text) {
  const screenLog = document.getElementById('screenLog');
  screenLog.insertAdjacentHTML('beforeend', `${text}<br>`);
  while (screenLog.childNodes.length > 20) screenLog.firstChild.remove()
}

function _origin(x, left, width) {
  return ((x - left) / width) * 100
}

function computeOrigin(ev) {
  const rect = ev.target.getBoundingClientRect();
  if (ev.type === 'mouseup') {
    const x = _origin(ev.clientX, rect.left, rect.width); //x position within the element.
    const y = _origin(ev.clientY, rect.top, rect.height); //y position within the element.
    return [x, y];
  } else if (ev.type === 'touchend') {
    const x = _origin(ev.changedTouches[0].clientX, rect.left, rect.width); //x position within the element.
    const y = _origin(ev.changedTouches[0].clientY, rect.top, rect.height); //y position within the element.
    return [x, y];
  } else if (ev.type === 'touchmove') {
    const t0x = _origin(ev.touches[0].clientX, rect.left, rect.width);
    const t0y = _origin(ev.touches[0].clientY, rect.top, rect.height);
    const t1x = _origin(ev.touches[1].clientX, rect.left, rect.width);
    const t1y = _origin(ev.touches[1].clientY, rect.top, rect.height);
    return [t0x, t0y, t1x, t1y];
  }
}

function distance(ev) {
  return Math.hypot(
    ev.touches[0].pageX - ev.touches[1].pageX,
    ev.touches[0].pageY - ev.touches[1].pageY
  );
}

export const init = (
  initScale = 1,
  initImgEl,
  initWrapperEl,
  initMinScale = 1,
  initMaxScale = 4,
  initClickStep = 1,
) => {
  clickStep = initClickStep;
  imgEl = initImgEl;
  maxScale = initMaxScale;
  minScale = initMinScale
  origin = {};
  scale = initScale;
  start = { distance: 0};
  wrapperEl = initWrapperEl;

  // using native events instead of react synthetic events
  // was the easiest way to stop pinch gesture from zooming entire
  // page on ios devices
  wrapperEl.current.addEventListener('touchstart', handleTouchStart, true);
  wrapperEl.current.addEventListener('touchmove', handleTouchMove, false);
  wrapperEl.current.addEventListener('touchend', handleTouchEnd, true);
  wrapperEl.current.addEventListener('mousedown', handleMouseDown, false);
  wrapperEl.current.addEventListener('mouseup', handleMouseUp, false);
};

export const cleanup = () => {
  window.cancelAnimationFrame(animationFrameId);

  wrapperEl.current.removeEventListener('touchstart', handleTouchStart, true);
  wrapperEl.current.removeEventListener('touchmove', handleTouchMove, false);
  wrapperEl.current.removeEventListener('touchend', handleTouchEnd, true);
  wrapperEl.current.removeEventListener('mousedown', handleMouseDown, false);
  wrapperEl.current.removeEventListener('mouseup', handleMouseUp, false);
  wrapperEl.current.removeEventListener('mousemove', handleMouseMove, false);
  wrapperEl.current.removeEventListener('mouseleave', handleMouseLeave, false);

  clickStep = null;
  imgEl = null;
  maxScale = null;
  origin = null;
  scale = null;
  start = null;
  wrapperEl = null;
}

export const handleOnClick = (ev) => {
  _log('handleOnClick');
  // Only react to clicks on the image, not other children
  // For example, ignore clicks on add to bag button
  if (ev.target !== imgEl.current) {
    return;
  }

  const newScale = Math.floor(scale) + clickStep;
  if (newScale >= maxScale) {
    scale = 1;
    imgEl.current.style.scale = scale;
    imgEl.current.style.transformOrigin = `0, 0`;
  } else {
    const [x, y] = computeOrigin(ev);
    origin.x = x;
    origin.y = y;
    scale = newScale;
    imgEl.current.style.scale = scale;
    imgEl.current.style.transition = TRANSITION_ANIMATION;
    imgEl.current.style.transformOrigin = `${x}% ${y}% 0px`;
  }
};

let totalFingerDistance = 0;


export const handleTouchStart = (ev) => {
  ev.preventDefault();
  _log('handleTouchStart');
  if (ev.touches.length === 2) {
    _log('starting pinch zoom gesture');
    isPinchZoomGesture = true;
    startingFingerDistance = 0;
  }
};

export const handleTouchMove = (ev) => {
  _log(`handleTouchMove ${scale}`);
  if ((ev.touches.length === 2) && (scale >= minScale) && (scale <= maxScale)) {
    const currentFingerDistance = distance(ev);
    if (!startingFingerDistance) {
      startingFingerDistance = currentFingerDistance;
    }
    const deltaDistance = currentFingerDistance - startingFingerDistance;
    totalFingerDistance = totalFingerDistance + deltaDistance;

    const newScale = scale + totalFingerDistance/(startingFingerDistance * 500);

    _log(`deltaDistance: ${deltaDistance}, newScale: ${newScale}`);
    scale = Math.min(Math.max(minScale, newScale), maxScale);

    // Calculate the geographic center of the two touches
    // All you do is average the x coords and y coords to find center
    // Also, prevent scrolling out of bounds with min, max
    const [t0x, t0y, t1x, t1y] = computeOrigin(ev);
    origin.x = Math.min(Math.max(0, (t0x + t1x) / 2), 100);
    origin.y = Math.min(Math.max(0, (t0y + t1y) / 2), 100);

    // Transform the image scale to make it grow and move with fingers
    // Center the scaling around the geographic center of your fingers
    // use an animation frame for smooth animation
    animationFrameId = window.requestAnimationFrame(() => {
      imgEl.current.style.transition = null;
      imgEl.current.style.scale = scale;
      imgEl.current.style.transformOrigin = `${origin.x}% ${origin.y}% 0px`;
    });
  }
};

export const handleTouchEnd = (ev) => {
  ev.preventDefault();
  _log(`touchend - touches ${ev.touches.length}`);

  if (!isPinchZoomGesture) {
    handleOnClick(ev);
  }

  // if we previously did a pinch zoom and all fingers are off the screen, end the zoom
  if (isPinchZoomGesture && !ev.touches.length) {
    imgEl.current.style.transition = TRANSITION_ANIMATION;
    document.body.style.touchAction = null;
    totalFingerDistance = 0;
    isPinchZoomGesture = false
    _log('end of pinch zoom')
  }



};

export const handleMouseDown = (ev) => {
  _log('handleMouseDown');
  isDragging = false;
  isMouseDown = true;
  start.x = ev.clientX;
  start.y = ev.clientY;
  wrapperEl.current.addEventListener('mousemove', handleMouseMove, false);
  wrapperEl.current.addEventListener('mouseleave', handleMouseLeave, false);
}

export const handleMouseMove = (ev) => {
  _log('handleMouseMove');
  const MINIMUM_DELTA = 5;
  const { width, height } = wrapperEl.current.getBoundingClientRect();
  const deltaX = start.x - ev.clientX;
  const deltaY = start.y - ev.clientY;

  if (
    scale > 1
    && isMouseDown === true
    && ((Math.abs(deltaX) > MINIMUM_DELTA) || (Math.abs(deltaY) > MINIMUM_DELTA))
  ) {
    isDragging = true;
    animationFrameId = window.requestAnimationFrame(
      () => {
        start.x = ev.clientX;
        start.y = ev.clientY;
        origin.x = Math.min(Math.max(0, origin.x + ((deltaX / width) * 100)), 100);
        origin.y = Math.min(Math.max(0, origin.y + ((deltaY / height) * 100)), 100);
        imgEl.current.style.transition = null;
        imgEl.current.style.transformOrigin = `${origin.x}% ${origin.y}% 0px`;
      }
    )
  }
}

function _cancelMouseDown() {
  wrapperEl.current.removeEventListener('mousemove', handleMouseMove, false);
  wrapperEl.current.removeEventListener('mouseleave', handleMouseLeave, false);
  start = {};
  isMouseDown = false;
}

function _cancelDrag() {
  imgEl.current.style.transition = TRANSITION_ANIMATION;
  isDragging = false;
}

export const handleMouseUp = (ev) => {
  _log('handleMouseUp');
  _cancelMouseDown();
  if (isDragging) {
    _cancelDrag();
  } else {
    handleOnClick(ev);
  }
}

export const handleMouseLeave = (ev) => {
  _log('handleMouseLeave');
  _cancelMouseDown();
  if (isDragging) {
    _cancelDrag();
  }
}