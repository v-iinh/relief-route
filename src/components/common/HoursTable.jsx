const ORDERED = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday' },
];

export default function HoursTable({ hours }) {
  return (
    <table className="hours-table">
      <tbody>
        {ORDERED.map(day => {
          const time = hours?.[day.key] || '—';
          return (
            <tr key={day.key}>
              <td>{day.label}</td>
              <td>{time}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
