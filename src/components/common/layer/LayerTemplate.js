import React, { useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { init } from '@/modules/mainlayer';
const LayerTemplate = () => {
  const layer = useSelector(({ mainlayer }) => mainlayer.layer);

  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    dispatch(init());
  }, [dispatch]);

  const drawCurrentLayer = useMemo(() => {
    if (layer && layer.length > 0) {
      const currentLayer = layer[layer.length - 1];
      return (
        <>
          <div className="layerWrap" style={{ maxWidth: '400px' }}>
            <div
              key={`layer_${layer.length}`}
              className="cover_chat_menu"
              style={{ height: '100%', overflow: 'hidden' }}
            >
              <div
                style={{
                  position: 'relative',
                  height: '100%',
                }}
              >
                {currentLayer.component}
              </div>
            </div>
          </div>
          <div
            className="bg_dim"
            style={{ display: 'block' }}
            onClick={handleClose}
          ></div>
        </>
      );
    } else {
      return <></>;
    }
  }, [layer]);

  return drawCurrentLayer;
};

export default React.memo(LayerTemplate);
