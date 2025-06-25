import React from "react";
import PropTypes from "prop-types";
import Badge from "./Badge";
import Button from "./Button";

/**
 * ProfileCard компонент для відображення профілю користувача
 * @param {Object} props - Властивості компонента
 * @param {string} props.avatar - URL аватару користувача
 * @param {string} props.name - Ім'я користувача
 * @param {string} props.rank - Ранг/статус користувача
 * @param {Array} [props.badges] - Бейджі користувача (опціонально)
 * @param {Array} [props.stats] - Статистика користувача (опціонально)
 * @param {Array} [props.actions] - Кнопки дії (опціонально)
 * @param {boolean} [props.editable=false] - Чи можна редагувати аватар
 * @param {Function} [props.onChangeAvatar] - Обробник зміни аватару
 */
export default function ProfileCard({
  avatar,
  name,
  rank,
  badges = [],
  stats = [],
  actions = [],
  editable = false,
  onChangeAvatar,
}) {
  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <img src={avatar} alt={name} />
          {editable && (
            <button
              className="btn-change-avatar"
              title="Change avatar"
              onClick={onChangeAvatar}
            >
              <span className="btn-change-avatar-icon">📷</span>
            </button>
          )}
        </div>

        <div className="profile-details">
          <h3>{name}</h3>
          <p className="profile-rank">{rank}</p>

          {badges.length > 0 && (
            <div className="profile-badges">
              {badges.map((badge, index) => (
                <Badge
                  key={`badge-${index}`}
                  icon={badge.icon}
                  text={badge.text}
                  title={badge.title}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.length > 0 && (
        <div className="profile-stats">
          {stats.map((stat, index) => (
            <div key={`stat-${index}`} className="profile-stat">
              <h4>{stat.label}</h4>
              <p>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="profile-actions">
          {actions.map((action, index) => (
            <Button
              key={`action-${index}`}
              onClick={action.onClick}
              variant={action.variant || (index === 0 ? "primary" : "outline")}
              className={`btn-profile-action ${
                action.primary ? "btn-primary" : ""
              }`}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

ProfileCard.propTypes = {
  avatar: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  rank: PropTypes.string.isRequired,
  badges: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      text: PropTypes.string.isRequired,
      title: PropTypes.string,
    })
  ),
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    })
  ),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      variant: PropTypes.string,
      primary: PropTypes.bool,
    })
  ),
  editable: PropTypes.bool,
  onChangeAvatar: PropTypes.func,
};
