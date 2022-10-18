import React, { useRef, useEffect } from 'react';
import cn from '../cn.js';
import s from './ImageZoomer.module.scss';
import {
  init,
  cleanup,
} from './events';


const ImageZoomer = ({
  src,
  alt,
  className,
  initialScale = 1,
  minScale = 1,
  clickStep = 1,
  maxScale = 4,
  children,
}) => {
  const imgEl = useRef();
  const wrapperEl = useRef();

  useEffect(() => {
    imgEl.current.style.scale = initialScale;
    init(initialScale, imgEl, wrapperEl, minScale, maxScale, clickStep);

    return () => {
      cleanup();
    };
  }, [initialScale, maxScale, clickStep, minScale]);

  return (
    <div
      ref={wrapperEl}
      className={cn(s.wrapper, className)}
    >
      <img ref={imgEl} src={src} className={s.image} alt={alt} draggable={false} />
      {children}
    </div>
  );
};

export default ImageZoomer;
