import React from 'react';
import Config from '@/config/config';

const LinkMessageBox = ({ thumbnailInfo, link }) => (
  <div
    className="link-thumbnail-box"
    onClick={() => {
      if (DEVICE_TYPE == 'd') {
        window.openExternalPopup(link);
      } else {
        window.open(link, '_blank');
      }
    }}
  >
    {thumbnailInfo.image && (
      <div className="thumbnail">
        <img
          src={thumbnailInfo.image}
          width={248}
          height={248}
          style={{ marginTop: '-58px' }}
          onError={e => {
            e.target.src = thumbnailInfo.domain + thumbnailInfo.image;
            e.target.onerror = e => {
              e.target.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
              e.target.onerror = null;
            };
          }}
        />
      </div>
    )}
    <div className="link-txt">
      <p className="site-name">{thumbnailInfo.title}</p>
      <p className="site-sub">{thumbnailInfo.description}</p>
      <p className="site-url">{link}</p>
    </div>
  </div>
);

export default React.memo(LinkMessageBox);
