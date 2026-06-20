import { useEffect, useState } from 'react';
import api from '../api.js';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventList({ onSelect }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get('/events')
      .then((res) => active && setEvents(res.data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="muted center">Loading events…</div>;
  if (error) return <div className="alert error">{error}</div>;

  return (
    <div>
      <h2 className="section-title">Upcoming Events</h2>
      <div className="event-grid">
        {events.map((ev) => {
          const soldOut = ev.availableSeats === 0;
          return (
            <button
              key={ev._id}
              className="card event-card"
              onClick={() => onSelect(ev._id)}
              disabled={soldOut}
            >
              <h3>{ev.name}</h3>
              <p className="muted">{ev.description}</p>
              <ul className="event-meta">
                <li>📍 {ev.venue}</li>
                <li>🗓️ {formatDate(ev.startsAt)}</li>
                <li>
                  🎟️{' '}
                  <span className={soldOut ? 'pill danger' : 'pill ok'}>
                    {soldOut ? 'Sold out' : `${ev.availableSeats} of ${ev.totalSeats} available`}
                  </span>
                </li>
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
