import React from 'react';

const Button = ({ 
  children, 
  primary = false, 
  outline = false, 
  small = false, 
  onClick, 
  disabled = false,
  className = '',
  icon = null
}) => {
  const baseStyles = "flex items-center justify-center rounded-full font-medium transition-all duration-200";
  const sizeStyles = small ? "py-2 px-4 text-sm" : "py-3 px-6 text-base";
  
  let variantStyles = "";
  if (primary) {
    variantStyles = disabled 
      ? "bg-primary/50 text-dark cursor-not-allowed" 
      : "bg-primary text-dark hover:bg-primary-dark active:scale-95";
  } else if (outline) {
    variantStyles = disabled 
      ? "border border-primary/50 text-primary/50 cursor-not-allowed" 
      : "border border-primary text-primary hover:bg-primary/10 active:scale-95";
  } else {
    variantStyles = disabled 
      ? "bg-secondary/50 text-text-secondary cursor-not-allowed" 
      : "bg-secondary text-white hover:bg-secondary/80 active:scale-95";
  }

  return (
    <button 
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
