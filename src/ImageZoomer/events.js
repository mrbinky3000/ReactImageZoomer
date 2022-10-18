const TRANSITION_ANIMATION = 'scale 400ms, transform-origin 400ms';

let animationFrameId;
let clickStep;
let imgEl;
let isDragging = false;
let isMouseDown = false;
let maxScale;
let minScale;
let origin;
let scale;
let start;
let wrapperEl;

function _log(text) {
  const screenLog = document.getElementById('screenLog');
  screenLog.insertAdjacentHTML('beforeend', `${text}<br>`);
  while (screenLog.childNodes.length > 10) screenLog.firstChild.remove()
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
  } else if (ev.type === 'touchstart') {
    _log('touchstart')
    const x = _origin(ev.touches[0].clientX, rect.left, rect.width); //x position within the element.
    const y = _origin(ev.touches[0].clientY, rect.top, rect.height); //y position within the element.
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
  wrapperEl.current.addEventListener('touchstart', handleTouchStart, false);
  wrapperEl.current.addEventListener('touchmove', handleTouchMove, false);
  wrapperEl.current.addEventListener('touchend', handleTouchEnd, true);
  wrapperEl.current.addEventListener('mousedown', handleMouseDown, false);
  wrapperEl.current.addEventListener('mouseup', handleMouseUp, false);
};

export const cleanup = () => {
  window.cancelAnimationFrame(animationFrameId);

  wrapperEl.current.removeEventListener('touchstart', handleTouchStart, false);
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

export const handleTouchStart = (ev) => {
  if (ev.touches.length === 1) {
    handleOnClick(ev);
  }
  if (ev.touches.length > 1) {
    ev.preventDefault();

    // compute distance between touches
    start.x = (ev.touches[0].pageX + ev.touches[1].pageX) / 2;
    start.y = (ev.touches[0].pageY + ev.touches[1].pageY) / 2;
    // const deltaDistance = distance(ev) - start.distance;
    // start.distance = start.distance + deltaDistance;
    start.distance = distance(ev);
    start.moveDistanceOld = start.distance;
  }
};

export const handleTouchMove = (ev) => {
  if (ev.touches.length > 1) {
    _log(start.moveDistanceOld);
    const moveDistanceNew = distance(ev);
    const distanceDelta = moveDistanceNew - start.moveDistanceOld;
    const newScale = Math.min(Math.max(minScale, start.distance + distanceDelta / start.distance), maxScale);
    start.moveDistanceOld = moveDistanceNew;

    // _log(`o: "${scale}" c: "${currentScale} "n: "${newScale}"`);
    // scale = Math.min(Math.max(1, newScale), 4);
    scale = newScale;

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
  // start = {};
  // origin = {};
  imgEl.current.style.transition = TRANSITION_ANIMATION;
  // imgEl.current.style.scale = 1;
  // imgEl.current.style.transformOrigin = '0 0 0';
  document.body.style.touchAction = null;
};

export const handleMouseDown = (ev) => {
  isDragging = false;
  isMouseDown = true;
  start.x = ev.clientX;
  start.y = ev.clientY;
  wrapperEl.current.addEventListener('mousemove', handleMouseMove, false);
  wrapperEl.current.addEventListener('mouseleave', handleMouseLeave, false);
}

export const handleMouseMove = (ev) => {
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
  _cancelMouseDown()
  if (isDragging) {
    _cancelDrag();
  } else {
    handleOnClick(ev);
  }
}

export const handleMouseLeave = (ev) => {
  _cancelMouseDown();
  if (isDragging) {
    _cancelDrag()
  }
}