import React from "react";
import PropTypes from "prop-types";
import { LineChart } from "lucide-react";

/**
 * ChartPlaceholder компонент для відображення плейсхолдера діаграми
 * @param {Object} props - Властивості компонента
 * @param {string} [props.text='Завантаження даних...'] - Текст плейсхолдера
 * @param {React.ReactNode} [props.icon] - Іконка для плейсхолдера
 * @param {string} [props.height='250px'] - Висота плейсхолдера
 */
export default function ChartPlaceholder({
  text = "Loading data...",
  icon = <LineChart size={32} />,
  height = "250px",
}) {
  return (
    <div className="chart-placeholder" style={{ height }}>
      <div className="placeholder-icon">{icon}</div>
      <div className="placeholder-text">{text}</div>
    </div>
  );
}

ChartPlaceholder.propTypes = {
  text: PropTypes.string,
  icon: PropTypes.node,
  height: PropTypes.string,
};
