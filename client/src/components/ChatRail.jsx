import Composer from './Composer';

export default function ChatRail({ statusLine, children, composerProps }) {
  return (
    <aside className="chat-rail">
      {statusLine && (
        <p className="pearl-line">
          <span className="pearl" />
          {statusLine}
        </p>
      )}
      {children}
      {composerProps && <Composer {...composerProps} />}
    </aside>
  );
}
