import React from "react";

const Unauthorized = () => {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem",
      }}
    >
      🚫 You are not authorized to view this page.
    </div>
  );
};

export default Unauthorized;
