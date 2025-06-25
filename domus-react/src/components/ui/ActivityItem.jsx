import React from "react";
import PropTypes from "prop-types";

/**
 * ActivityItem компонент для відображення елементу активності
 * @param {Object} props - Властивості компонента
 * @param {React.ReactNode} props.icon - Іконка для відображення
 * @param {string} props.text - Основний текст активності
 * @param {string} props.time - Час активності
 * @param {string} [props.type] - Тип активності (для стилізації)
 */
export default function ActivityItem({ icon, text, time, type = "default" }) {
  return (
    <div className={`activity-item ${type}`}>
      <div className="activity-icon">{icon}</div>

      <div className="activity-info">
        <div className="activity-text">{text}</div>
        <div className="activity-time">{time}</div>
      </div>
    </div>
  );
}

ActivityItem.propTypes = {
  icon: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  type: PropTypes.string,
};
