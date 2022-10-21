import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { bound, setTopButton } from '@/modules/menu';
import DocumentContainer from '@C/share/document/DocumentContainer';

const DocumentList = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      bound({
        name: covi.getDic('EditedByMeDoc', '내가 편집한 문서'),
        type: 'documentlist',
      }),
    );
    dispatch(setTopButton([]));
  }, []);
  return <DocumentContainer />;
};

export default DocumentList;
