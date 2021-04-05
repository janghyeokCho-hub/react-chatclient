import React, { useEffect, useMemo } from 'react';

const getPercent = (load, total) => {
  return Math.floor((load / total) * 100);
};

const Progress = ({ load, total, handleFinish }) => {
  const percent = useMemo(() => getPercent(load, total), [load, total]);

  useEffect(() => {
    if (load == total) {
      setTimeout(() => {
        handleFinish();
      }, 1000);
    }
  }, [load]);

  return (
    <div className="progress-wrap">
      <div className="progress-box">
        <div className="progress-bar">
          <div
            className="progress"
            style={{
              width: `${load == total ? '100%' : `${percent}%`}`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
