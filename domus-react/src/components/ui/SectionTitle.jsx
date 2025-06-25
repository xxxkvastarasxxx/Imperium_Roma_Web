import React from "react";
import PropTypes from "prop-types";

/**
 * SectionTitle компонент для відображення заголовка секції
 * @param {Object} props - Властивості компонента
 * @param {string} props.title - Текст заголовка
 * @param {React.ReactNode} [props.icon] - Іконка (опціонально)
 * @param {React.ReactNode} [props.action] - Кнопка дії справа (опціонально)
 * @param {string} [props.subtitle] - Підзаголовок (опціонально)
 */
export default function SectionTitle({ title, icon, action, subtitle }) {
  return (
    <div className="section-header">
      <div className="section-title-container">
        <div className="title-with-icon">
          {icon && (
            <div className="section-icon">
              {React.cloneElement(icon, {
                size: 18,
                className: "icon-top-align",
              })}
            </div>
          )}
          <h2 className="section-title">{title}</h2>
        </div>
        {subtitle && <div className="section-subtitle">{subtitle}</div>}
      </div>

      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

SectionTitle.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  action: PropTypes.node,
  subtitle: PropTypes.string,
};
