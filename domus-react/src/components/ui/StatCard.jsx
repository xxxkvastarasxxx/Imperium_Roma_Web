import React from "react";
import PropTypes from "prop-types";

/**
 * StatCard компонент для відображення статистичної карточки з іконкою та числовою інформацією
 * @param {Object} props - Властивості компонента
 * @param {React.ReactNode} props.icon - Іконка для відображення (компонент іконки)
 * @param {string} props.title - Заголовок статистичної карточки
 * @param {string|number} props.value - Значення статистики
 * @param {string} [props.subtitle] - Підзаголовок (опціонально)
 * @param {string} [props.trendDirection] - Напрямок тренду: 'up', 'down', або null (опціонально)
 * @param {string} [props.trendValue] - Значення тренду, наприклад "+12%" (опціонально)
 */
export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  trendDirection,
  trendValue,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div className="stat-info">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}

        {trendDirection && trendValue && (
          <div className={`stat-trend ${trendDirection}`}>
            <span className="trend-arrow">
              {trendDirection === "up" ? "↑" : "↓"}
            </span>
            <span className="trend-value">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  trendDirection: PropTypes.oneOf(["up", "down", null]),
  trendValue: PropTypes.string,
};
