export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
      <button
        className="btn-ghost order-2 sm:order-1"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      <div className="order-1 flex flex-wrap justify-center gap-2 sm:order-2">
        {pages.map(page => (
          <button
            key={page}
            className={`grid h-10 w-10 place-items-center rounded-full border font-extrabold transition-colors ${
              page === currentPage
                ? 'border-wine bg-wine text-white'
                : 'border-ink/10 bg-paper text-ink hover:border-gold'
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        className="btn-ghost order-3"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}
