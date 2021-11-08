import React from 'react';
import { useDispatch } from 'react-redux';
import { extensionAdd } from '@/modules/extension';

// const Extension = () => {
//   const [loadExtension, setLoadExtension] = useState(false);

//   const loadExample = () => {
//     const simpleExtension = document.getElementById('example');
//     if (simpleExtension)
//       simpleExtension.parentNode.removeChild(simpleExtension);
//     const script = document.createElement('script');
//     script.src = 'http://127.0.0.1:8080/SnakeExtension.js?t=' + new Date();
//     script.id = 'example';
//     script.onload = () => {
//       setLoadExtension(false);
//     };
//     document.body.appendChild(script);
//   };

//   useEffect(() => {
//     if (!loadExtension) {
//       setLoadExtension(true);
//       loadExample();
//     }
//   }, []);

//   return (
//     <div className="extension-wrap">
//       <button
//         onClick={() => {
//           window.location.reload();
//         }}
//       >
//         load extension
//       </button>
//       {loadExtension && <p>loading extension</p>}
//       <div id="extension"> </div>
//     </div>
//   );
// };

// export default React.memo(Extension);

const extensionItem = {
  title: 'groupware',
  description: 'groupware in messenger',
  createDate: new Date(),
};

const Extension = () => {
  const dispatch = useDispatch();
  return (
    <div className="extension-wrap">
      <h2>Extension</h2>
      <input placeholder="Search Extensions(title, category...)"></input>
      <p>update at 2021-11-05 </p>
      <p>Installed</p>
      <ul>
        <li>
          <button
            onClick={() => {
              dispatch(extensionAdd(extensionItem));
            }}
          >
            Extension 1
          </button>
        </li>
        <li>
          <p>Extension 2</p>
        </li>
        <li>
          <p>Extension 3</p>
        </li>
      </ul>
      <p>List</p>
    </div>
  );
};

export default React.memo(Extension);
