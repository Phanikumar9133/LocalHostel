// SkeletonLoader.jsx
function SkeletonLoader() {
  return (
    <div className="card shadow-sm">
      <div className="skeleton" style={{ height: '200px' }}></div>
      <div className="card-body">
        <div className="skeleton mb-2" style={{ height: '20px', width: '80%' }}></div>
        <div className="skeleton" style={{ height: '15px', width: '60%' }}></div>
      </div>
    </div>
  );
}

export default SkeletonLoader;