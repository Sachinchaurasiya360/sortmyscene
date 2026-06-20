// Renders seats grouped by row letter with status color coding.
export default function SeatGrid({ seats, selected, onToggle, disabled }) {
  // Group seats by their row letter (e.g. "A").
  const rows = {};
  for (const seat of seats) {
    const rowLetter = seat.seatNumber.match(/^[A-Za-z]+/)?.[0] || '?';
    (rows[rowLetter] ||= []).push(seat);
  }
  const rowLetters = Object.keys(rows).sort();

  return (
    <div className="seatmap">
      <div className="screen">STAGE</div>
      <div className="rows">
        {rowLetters.map((letter) => (
          <div className="seat-row" key={letter}>
            <span className="row-label">{letter}</span>
            {rows[letter].map((seat) => {
              const isSelected = selected.has(seat.seatNumber);
              const status = isSelected ? 'selected' : seat.status;
              const clickable = !disabled && seat.status === 'available';
              return (
                <button
                  key={seat.seatNumber}
                  className={`seat ${status}`}
                  title={`${seat.seatNumber} — ${seat.status}`}
                  onClick={() => clickable && onToggle(seat.seatNumber)}
                  disabled={!clickable && !isSelected}
                >
                  {seat.seatNumber}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="legend">
        <span><i className="swatch available" /> Available</span>
        <span><i className="swatch selected" /> Selected</span>
        <span><i className="swatch reserved" /> Reserved</span>
        <span><i className="swatch booked" /> Booked</span>
      </div>
    </div>
  );
}
