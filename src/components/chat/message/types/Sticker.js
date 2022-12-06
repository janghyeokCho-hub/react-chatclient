import React, { useState, useEffect } from 'react';
import Config from '@/config/config';
import { getConfig } from '@/lib/util/configUtil';

const Sticker = ({
  companyCode,
  groupId,
  emoticonId,
  type,
  width = 150,
  height = 150,
}) => {
  const storagePrefix = getConfig('storePrefix', '/storage/');
  const IsSaaSClient = getConfig('IsSaaSClient', 'N');
  const [isAnimation, setIsAnimation] = useState(type === 'A');

  const [resource, setResource] = useState(
    IsSaaSClient == 'Y'
      ? `${
          Config.ServerURL.HOST
        }${storagePrefix}emoticon/${companyCode}/${groupId}/${emoticonId}.${
          type === 'A' ? 'gif' : 'png'
        }`
      : `${
          Config.ServerURL.HOST
        }${storagePrefix}emoticon/${groupId}/${emoticonId}.${
          type === 'A' ? 'gif' : 'png'
        }`,
  );

  useEffect(() => {
    if (isAnimation) {
      setResource(
        IsSaaSClient == 'Y'
          ? `${Config.ServerURL.HOST}${storagePrefix}emoticon/${companyCode}/${groupId}/${emoticonId}.gif`
          : `${Config.ServerURL.HOST}${storagePrefix}emoticon/${groupId}/${emoticonId}.gif`,
      );
    }
  }, [isAnimation]);

  return (
    <img
      src={resource}
      onError={e => {
        e.target.src = `${Config.ServerURL.HOST}${storagePrefix}no_image.jpg`;
        e.target.onerror = null;
      }}
      onClick={e => {
        if (type === 'A' && !isAnimation) setIsAnimation(true);
      }}
      width={width}
      height={height}
    />
  );
};

export default Sticker;
