import React from "react";
import PropTypes from "prop-types";

/**
 * Button компонент для кнопок з різними варіаціями
 * @param {Object} props - Властивості компонента
 * @param {React.ReactNode} props.children - Вміст кнопки
 * @param {Function} [props.onClick] - Функція обробки кліку
 * @param {string} [props.variant='default'] - Варіант кнопки: 'primary', 'secondary', 'outline', 'text', 'default'
 * @param {string} [props.size='medium'] - Розмір кнопки: 'small', 'medium', 'large'
 * @param {React.ReactNode} [props.leftIcon] - Іконка зліва
 * @param {React.ReactNode} [props.rightIcon] - Іконка справа
 * @param {boolean} [props.fullWidth] - Чи займає кнопка всю доступну ширину
 * @param {boolean} [props.disabled] - Чи вимкнена кнопка
 * @param {string} [props.className] - Додаткові класи CSS
 * @param {string} [props.type='button'] - Тип кнопки: 'button', 'submit', 'reset'
 */
export default function Button({
  children,
  onClick,
  variant = "default",
  size = "medium",
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled = false,
  className = "",
  type = "button",
  ...rest
}) {
  const buttonClasses = `
    btn 
    btn-${variant} 
    btn-${size}
    ${fullWidth ? "btn-full-width" : ""} 
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {leftIcon && <span className="btn-icon btn-icon-left">{leftIcon}</span>}
      <span className="btn-text">{children}</span>
      {rightIcon && (
        <span className="btn-icon btn-icon-right">{rightIcon}</span>
      )}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "outline",
    "text",
    "default",
  ]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
};
