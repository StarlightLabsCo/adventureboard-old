import { LiveUsers } from '@/components/users/LiveUsers';

export function DMShare() {
  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center',
        minWidth: '80px',
      }}
    >
      <LiveUsers />
      <button className="btn btn-primary">Share</button>
    </div>
  );
}
