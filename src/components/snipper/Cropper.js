import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { screen } from '@electron/remote';

const screenSize = screen.getPrimaryDisplay().size;

const style = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'solid 2px #3a38d2',
  margin: '5px',
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
};

const Cropper = ({ props, snip, destroySnipView }) => {
  const [width, setWidth] = useState('500px');
  const [height, setHeight] = useState('500px');
  const [x, setX] = useState(screenSize.width / 2 - 250);
  const [y, setY] = useState(screenSize.height / 2 - 250);

  const handdleStatepicker = () => {
    snip({
      width,
      height,
      x,
      y,
    });
  };
  console.log('Cropper : ', width, height, x, y);
  return (
    <Rnd
      style={style}
      size={{ width: width, height: height }}
      position={{ x: x, y: y }}
      onDragStop={(e, d) => {
        setX(d.x), setY(d.y);
      }}
      onResize={(e, direction, ref, delta, position) => {
        setWidth(ref.style.width),
          setHeight(ref.style.height),
          setX(position.x),
          setY(position.y);
      }}
      bounds={'parent'}
    >
      <div
        className="rnd-controls"
        style={{
          paddingTop: '30px',
          margin: 'auto',
          justifyContent: 'space-around',
        }}
      >
        <button
          style={{
            width: '130px',
            marginRight: '5px',
            marginTop: '10px',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'solid 2px #12CFEE',
            backgroundColor: '#12CFEE',
            color: 'white',
          }}
          className="btn btn-primary"
          onClick={handdleStatepicker}
        >
          {covi.getDic('Capture')}
        </button>
        <button
          style={{
            width: '130px',
            marginRight: '5px',
            marginTop: '10px',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'solid 2px #12CFEE',
            backgroundColor: '#12CFEE',
            color: 'white',
          }}
          onClick={destroySnipView}
          className="btn btn-primary"
        >
          {covi.getDic('Cancel')}
        </button>
      </div>
    </Rnd>
  );
};

export default Cropper;
