import { useRef } from 'react';
import { TXT_MD_ACCEPT } from '../lib/files';

export default function Composer({ value, onChange, file, onFile, onSubmit, busy, placeholder }) {
  const inputRef = useRef(null);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="composer-wrap">
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <textarea
          rows={2}
          placeholder={placeholder || 'What would you like to do today?'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
        />
        <div className="composer-row">
          <div className="composer-left">
            {onFile ? (
              <>
                <button type="button" className="chip" onClick={() => inputRef.current?.click()}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    attach_file
                  </span>
                  Attachment
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  hidden
                  accept={TXT_MD_ACCEPT}
                  onChange={(e) => {
                    const picked = e.target.files?.[0] || null;
                    onFile(picked, e.target);
                  }}
                />
              </>
            ) : null}
          </div>
          <div className="composer-right">
            <button className="send" type="submit" disabled={busy}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </form>
      {file && <p className="file-hint">Attached: {file.name}</p>}
    </div>
  );
}
