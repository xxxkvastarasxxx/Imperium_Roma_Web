import React from "react";
import PropTypes from "prop-types";

/**
 * Table компонент для відображення таблиць даних
 * @param {Object} props - Властивості компонента
 * @param {Array<Object>} props.columns - Конфігурація колонок
 * @param {Array<Object>} props.data - Дані для відображення
 * @param {boolean} [props.striped=false] - Чи чергувати колір рядків
 * @param {boolean} [props.hoverable=true] - Чи змінювати стиль при наведенні на рядок
 * @param {string} [props.className] - Додаткові класи CSS
 */
export default function Table({
  columns,
  data = [],
  striped = false,
  hoverable = true,
  className = "",
}) {
  if (!columns || columns.length === 0 || data.length === 0) {
    return <div className="table-empty">No data available</div>;
  }

  return (
    <div className="table-container">
      <table
        className={`table ${striped ? "table-striped" : ""} ${
          hoverable ? "table-hover" : ""
        } ${className}`}
      >
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={`th-${index}`}
                className={column.className || ""}
                style={column.width ? { width: column.width } : {}}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={`tr-${rowIndex}`}
              onClick={row.onClick ? () => row.onClick(row) : undefined}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={`td-${rowIndex}-${colIndex}`}
                  className={column.cellClassName || ""}
                >
                  {column.cell ? column.cell(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.node.isRequired,
      accessor: PropTypes.string,
      cell: PropTypes.func,
      className: PropTypes.string,
      cellClassName: PropTypes.string,
      width: PropTypes.string,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  striped: PropTypes.bool,
  hoverable: PropTypes.bool,
  className: PropTypes.string,
};
