function Banner({ message, error }) {
  if (!message && !error) return null;

  if (message) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
        {message}
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      {error}
    </div>
  );
}

export default Banner;
