import React from 'react';

const InputWithTitle = ({ title, name, required }) => {
  return (
    <div>
      <div>
        <span>{title}</span>
        {required && <span>*</span>}
      </div>
      <input value="" name={name} required={required} onChange="" />
    </div>
  );
};

InputWithTitle.defaultProps = {
  required: '',
};

export default InputWithTitle;
