import React, { useState, useRef, useEffect } from 'react';
import RightConxtMenu from '@COMMON/popup/RightConxtMenu';
import DocumentItem from './DocumentItem';

const DocumentItems = ({ name, items, isFirstGroup }) => {
  const groupRef = useRef(null);
  const [isopen, setIsopen] = useState(true);
  const [docItems, setDocItems] = useState([]);

  useEffect(() => {
    if (isopen) {
      groupRef.current.style.display = 'none';
    } else {
      groupRef.current.style.display = '';
    }
  }, [isopen]);

  useEffect(() => {
    if (isFirstGroup) {
      setIsopen(false);
    }
  }, [isFirstGroup]);

  useEffect(() => {
    if (items?.length) {
      setDocItems(items.sort((a, b) => b.pinTop - a.pinTop));
    } else {
      setDocItems([]);
    }
    return () => {
      setDocItems([]);
    };
  }, [items]);

  return (
    <>
      <RightConxtMenu menuId={`docFD_${name}`}>
        <div className={['contextArea'].join(' ')}>
          <a
            className={['ListDivisionLine', isopen ? 'show' : ''].join(' ')}
            onClick={() => setIsopen(!isopen)}
          >
            <span>{`${name} (${docItems?.length || 0})`}</span>
          </a>
        </div>
      </RightConxtMenu>
      <ul className="people" ref={groupRef}>
        {docItems &&
          docItems.map(item => (
            <DocumentItem key={`docItem_${item.docID}`} item={item} />
          ))}
      </ul>
    </>
  );
};

export default DocumentItems;
