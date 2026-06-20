// Celebratory "booking done" moment: animated checkmark + confetti burst.
const CONFETTI_COLORS = ['#15994f', '#e0972a', '#2f7de0', '#d23b3b', '#0e7a57', '#e05ca0'];

function Confetti() {
  // Deterministic spread so it looks lively without Math.random in render.
  const pieces = Array.from({ length: 18 }, (_, i) => {
    const left = (i * 5.5 + (i % 3) * 7) % 100;
    const delay = (i % 6) * 0.08;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const rotate = (i % 4) * 25;
    return (
      <span
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}%`,
          background: color,
          animationDelay: `${delay}s`,
          transform: `rotate(${rotate}deg)`,
        }}
      />
    );
  });
  return <div className="confetti">{pieces}</div>;
}

export default function SuccessOverlay({ booking, eventName, onDone }) {
  if (!booking) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="success-modal">
        <Confetti />

        <svg className="checkmark" viewBox="0 0 52 52" aria-hidden="true">
          <circle className="checkmark-circle" cx="26" cy="26" r="24" />
          <path
            className="checkmark-check"
            fill="none"
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
          />
        </svg>

        <h3>Booking Confirmed!</h3>
        <p>
          Seats <strong>{booking.seatNumbers.join(', ')}</strong>
        </p>
        <p className="muted">for {eventName}</p>
        <p className="muted small">Ref: {booking.bookingId}</p>

        <button className="btn primary" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}
