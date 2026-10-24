import Icon from './Icon.jsx';

// Inline message for one panel whose data source failed — the rest of the page still works
export default function PanelError({ message }) {
  return (
    <p className="panel-error">
      <Icon name="warning" size={16} />
      {message}
    </p>
  );
}
