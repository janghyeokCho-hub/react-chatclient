import { appendLayer, getJobInfo } from '@/lib/common';
import React, { useCallback } from 'react';
import AddTarget from '@/pages/note/AddTarget';
import ProfileBox from '@C/common/ProfileBox';
import RequireIcon from '@/icons/svg/requireIcon';

const SelectOrgList = props => {
  const { checkAll, targets, setCheckAll, viewState, setTargets, dispatch } =
    props;

  const addTarget = useCallback(() => {
    appendLayer(
      {
        component: (
          <AddTarget
            oldMemberList={targets}
            onChange={changedTargets => setTargets(changedTargets)}
          />
        ),
      },
      dispatch,
    );
  }, [viewState, targets]);

  const removeTarget = name => {
    setTargets(targets.filter(t => t.name !== name));
  };

  return (
    <>
      <div className="txtBox org_select_wrap_txtBox">
        <div style={{ display: 'flex' }}>
          <div>
            <p>{covi.getDic('Note_Recipient', '받는사람')}</p>
          </div>
          <div className="RequireIcon">
            <RequireIcon />
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <input
            id="chkStyle03"
            className="chkStyle03"
            type="checkbox"
            onClick={() => setCheckAll(!checkAll)}
            checked={checkAll}
          />
          <label for="chkStyle03" className="Style03" />
          <p> {covi.getDic('All_Recipient', '전체공지')}</p>
        </div>
      </div>
      <div
        className={
          checkAll ? 'org_select_wrap disabled_box' : 'org_select_wrap'
        }
        style={{ marginRight: '30px', marginLeft: '30px' }}
      >
        <ul>
          {targets.map((target, idx) => {
            return (
              <li key={idx}>
                <a className="ui-link">
                  <ProfileBox
                    userId={target.id}
                    img={target.photoPath}
                    presence={target.presence}
                    isInherit={true}
                    userName={target.name}
                    handleClick={false}
                    checkAll={checkAll}
                  />
                  <p className="name">{getJobInfo(target)}</p>
                  <span
                    onClick={!checkAll ? () => removeTarget(target.name) : ''}
                    className={'del'}
                  ></span>
                </a>
              </li>
            );
          })}
          <li
            className={checkAll ? 'add-disable' : 'add'}
            onClick={!checkAll ? addTarget : () => {}}
          >
            <a className="ui-link">
              <div
                className={
                  checkAll ? 'profile-photo add-disable' : 'profile-photo add'
                }
              ></div>
            </a>
          </li>
        </ul>
      </div>
    </>
  );
};

export default SelectOrgList;
