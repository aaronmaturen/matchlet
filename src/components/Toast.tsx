import React from "react";

interface ToastProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  position?:
    | "top"
    | "bottom"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
}

const Toast: React.FC<ToastProps> = ({
  type,
  message,
  position = "bottom-right",
}) => {
  // Map position to Tailwind classes
  const positionClasses = {
    top: "toast-top toast-center",
    bottom: "toast-bottom toast-center",
    "top-left": "toast-top toast-start",
    "top-right": "toast-top toast-end",
    "bottom-left": "toast-bottom toast-start",
    "bottom-right": "toast-bottom toast-end",
  };

  // Map type to Tailwind classes and icon
  const typeConfig = {
    success: {
      alertClass: "alert-success",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    error: {
      alertClass: "alert-error",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    warning: {
      alertClass: "alert-warning",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    info: {
      alertClass: "alert-info",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  return (
    <div className={`toast z-50 ${positionClasses[position]}`}>
      <div className={`alert ${typeConfig[type].alertClass} shadow-lg`}>
        <div>
          {typeConfig[type].icon}
          <span className="font-comic font-bold">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default Toast;
