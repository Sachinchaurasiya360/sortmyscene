import { useCallback, useEffect, useState } from 'react';
import api from '../api.js';
import SeatGrid from './SeatGrid.jsx';
import Countdown from './Countdown.jsx';
import SuccessOverlay from './SuccessOverlay.jsx';

// Flow stages: select -> reserved -> booked
export default function EventDetail({ eventId, onBack }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [selected, setSelected] = useState(() => new Set());
  const [reservation, setReservation] = useState(null); // { reservationId, expiresAt, seatNumbers }
  const [booking, setBooking] = useState(null); // { seatNumbers }
  const [busy, setBusy] = useState(false);

  const loadEvent = useCallback(async () => {
    const { data } = await api.get(`/events/${eventId}`);
    setEvent(data);
    return data;
  }, [eventId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadEvent()
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [loadEvent]);

  function toggleSeat(seatNumber) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(seatNumber) ? next.delete(seatNumber) : next.add(seatNumber);
      return next;
    });
  }

  async function handleReserve() {
    setError('');
    setNotice('');
    if (selected.size === 0) {
      setError('Please select at least one seat.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/reserve', {
        eventId,
        seatNumbers: [...selected],
      });
      setReservation(data);
      setNotice(`Seats reserved! Confirm your booking before the timer runs out.`);
      await loadEvent(); // refresh grid to show the new reserved seats
    } catch (err) {
      setError(err.message);
      // A seat was taken between selection and reserve — refresh the grid.
      await loadEvent();
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }

  async function handleBook() {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const { data } = await api.post('/bookings', {
        reservationId: reservation.reservationId,
      });
      setBooking(data);
      setReservation(null);
      setSelected(new Set());
      await loadEvent();
    } catch (err) {
      setError(err.message);
      setReservation(null);
      setSelected(new Set());
      await loadEvent();
    } finally {
      setBusy(false);
    }
  }

  async function handleExpire() {
    setReservation(null);
    setSelected(new Set());
    setNotice('');
    setError('Your reservation expired and the seats were released. Please select again.');
    await loadEvent();
  }

  if (loading) return <div className="muted center">Loading seats…</div>;
  if (!event) return <div className="alert error">{error || 'Event not found'}</div>;

  return (
    <div>
      <button className="link back" onClick={onBack}>
        ← All events
      </button>

      <div className="detail-head">
        <div>
          <h2 className="section-title">{event.name}</h2>
          <p className="muted">
            📍 {event.venue} · 🗓️ {new Date(event.startsAt).toLocaleString()}
          </p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert success">{notice}</div>}

      <SuccessOverlay
        booking={booking}
        eventName={event.name}
        onDone={() => setBooking(null)}
      />

      <SeatGrid
        seats={event.seats}
        selected={selected}
        onToggle={toggleSeat}
        disabled={!!reservation || busy}
      />

      <div className="action-bar">
        {!reservation ? (
          <>
            <div className="selection-summary">
              {selected.size > 0
                ? `Selected: ${[...selected].sort().join(', ')}`
                : 'No seats selected'}
            </div>
            <button
              className="btn primary"
              onClick={handleReserve}
              disabled={busy || selected.size === 0}
            >
              {busy ? 'Reserving…' : `Reserve ${selected.size || ''} seat(s)`}
            </button>
          </>
        ) : (
          <>
            <div className="selection-summary">
              Holding <strong>{reservation.seatNumbers.join(', ')}</strong> —{' '}
              <Countdown expiresAt={reservation.expiresAt} onExpire={handleExpire} />
            </div>
            <button className="btn success" onClick={handleBook} disabled={busy}>
              {busy ? 'Confirming…' : 'Confirm Booking'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
