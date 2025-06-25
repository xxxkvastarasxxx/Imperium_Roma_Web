import React from "react";
import PropTypes from "prop-types";

/**
 * Badge компонент для відображення бейджів користувача
 * @param {Object} props - Властивості компонента
 * @param {React.ReactNode|string} props.icon - Іконка або емодзі для бейджа
 * @param {string} props.text - Текст бейджа
 * @param {string} [props.title] - Заголовок бейджа для тултіпа (опціонально)
 * @param {string} [props.color] - Колір бейджа (опціонально)
 */
export default function Badge({ icon, text, title, color }) {
  return (
    <div
      className={`badge ${color ? `badge-${color}` : ""}`}
      title={title || text}
    >
      <span className="badge-icon">{icon}</span>
      <span className="badge-text">{text}</span>
    </div>
  );
}

Badge.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.string]).isRequired,
  text: PropTypes.string.isRequired,
  title: PropTypes.string,
  color: PropTypes.string,
};
