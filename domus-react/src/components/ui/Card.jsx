import React from "react";
import PropTypes from "prop-types";
import SectionTitle from "./SectionTitle";

/**
 * Card компонент для відображення секцій з контентом
 * @param {Object} props - Властивості компонента
 * @param {React.ReactNode} props.children - Вміст карточки
 * @param {string} [props.title] - Заголовок карточки (опціонально)
 * @param {React.ReactNode} [props.icon] - Іконка заголовку (опціонально)
 * @param {React.ReactNode} [props.action] - Кнопка дії у заголовку (опціонально)
 * @param {string} [props.subtitle] - Підзаголовок (опціонально)
 * @param {boolean} [props.noPadding=false] - Чи видалити внутрішній padding
 * @param {string} [props.className] - Додаткові класи CSS
 */
export default function Card({
  children,
  title,
  icon,
  action,
  subtitle,
  noPadding = false,
  className = "",
}) {
  return (
    <div className={`card ${noPadding ? "card-no-padding" : ""} ${className}`}>
      {title && (
        <SectionTitle
          title={title}
          icon={icon}
          action={action}
          subtitle={subtitle}
        />
      )}

      <div className="card-content">{children}</div>
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.node,
  subtitle: PropTypes.string,
  noPadding: PropTypes.bool,
  className: PropTypes.string,
};
