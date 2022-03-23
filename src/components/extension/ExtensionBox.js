import React, { useMemo } from 'react';
import Config from '@/config/config';

const ExtensionBox = ({
  extensionId,
  photoPath,
  title,
  subtitle,
  handleClick,
  isInstalled,
}) => {
  const profileBox = useMemo(() => {
    return (
      <img
        src={photoPath}
        onError={e => {
          e.target.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
          e.target.onerror = null;
        }}
      ></img>
    );
  }, [photoPath]);

  return (
    <div style={{ marginTop: 10 }}>
      <div
        className="profile-photo"
        onClick={e => {
          handleClick();
        }}
      >
        {profileBox}
      </div>
      <p style={{ fontSize: 16, fontWeight: 'bold', lineHeight: '20px' }}>
        {title}
      </p>
      <p style={{ lineHeight: '16px' }}>{subtitle}</p>
      {(isInstalled && (
        <div
          style={{
            position: 'relative',
            backgroundColor: '#5cdb80',
            display: 'inline-block',
            padding: '5px 10px',
            borderRadius: 8,
            color: '#000',
            left: '240px',
            bottom: '20px',
            width: 55,
            textAlign: 'center',
          }}
        >
          {covi.getDic('InstallationComplete', '설치됨')}
        </div>
      )) || (
        <button
          style={{
            position: 'relative',
            backgroundColor: '#12cfee',
            display: 'inline-block',
            padding: '5px 10px',
            borderRadius: 8,
            color: '#fff',
            left: '240px',
            bottom: '20px',
            width: 75,
            textAlign: 'center',
          }}
          onClick={() => {
            handleClick();
          }}
        >
          {covi.getDic('Install', '설치하기')}
        </button>
      )}
    </div>
  );
};

export default React.memo(ExtensionBox);
