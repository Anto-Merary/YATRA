export function HomePage() {
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src="/homepage.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        scrolling="yes"
        title="YATRA 2026 Homepage"
      />
    </div>
  );
}
