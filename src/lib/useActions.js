import { bindActionCreators } from 'redux';
import { useDispatch } from 'react-redux';
import { useMemo } from 'react';

// 여러개의 액션 사용 시 좀더 효율적으로 사용 가능
// ex: const [onChangeInput, onInsert, onToggle, onRemove] = useActions([changeInput, insert, toggle, remove], []);

export default function useActions(actions, deps) {
  const dispatch = useDispatch();
  return useMemo(
    () => {
      if (Array.isArray(actions)) {
        return actions.map(a => bindActionCreators(a, dispatch));
      }
      return bindActionCreators(actions, dispatch);
    },
    deps ? [dispatch, ...deps] : [dispatch],
  );
}
