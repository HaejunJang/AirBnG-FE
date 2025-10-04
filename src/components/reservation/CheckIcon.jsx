import React from "react";

const CheckIcon = ({
  width = 48,
  height = 48,
  strokeWidth = 6,
  className = "",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="#ffffff"
        stroke="#4561db"
        strokeWidth={strokeWidth}
      />
      <path
        d="M30 50l12 12 25-25"
        stroke="#4561db"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default CheckIcon;
