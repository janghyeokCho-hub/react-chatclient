import React from "react";

const HeaderLine = ({ bgcolor, children, title }) => {
  const headerStyle = {
    background: bgcolor,
    width: "100%",
    height: "50px",
    textAlign: "center"
  };
  return (
    <div style={headerStyle}>
      <span style={{ lineHeight: "50px", fontSize: "18px", color: "#fff" }}>
        {title}
      </span>
      {children}
    </div>
  );
};

export default HeaderLine;
