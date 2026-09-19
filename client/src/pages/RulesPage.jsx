import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { useProject } from '../hooks/useProject';
import { patchProject } from '../store/sessionsSlice';

export default function RulesPage() {
  const { id, current, dispatch, error } = useProject();
  const navigate = useNavigate();
  const [composer, setComposer] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');

  if (!current) return <div className="spinner" />;
  const rules = current.rules || [];
  const selected = rules.filter((r) => r.selected).length;

  function toggle(i, selected) {
    const next = rules.map((r, idx) => (idx === i ? { ...r, selected } : r));
    dispatch(patchProject({ id, rules: next }));
  }

  function saveEdit(i) {
    const next = rules.map((r, idx) => (idx === i ? { ...r, text: editText } : r));
    dispatch(patchProject({ id, rules: next }));
    setEditId(null);
  }

  function remove(i) {
    dispatch(patchProject({ id, rules: rules.filter((_, idx) => idx !== i) }));
  }

  async function proceed() {
    await dispatch(patchProject({ id, step: 'stories' }));
    navigate(`/projects/${id}/stories`);
  }

  return (
    <div className="wizard">
      <StepBack id={id} current="rules" />
      <p className="pearl-line">
        <span className="pearl" />
        All {current.workflows?.length || 0} workflow are approved.
      </p>
      <p className="subhead">Step2: review the Rules</p>
      {error && <p className="banner">{error}</p>}
      <section className="panel">
        <div className="panel-head">
          <h2>Generated Rules ({rules.length})</h2>
        </div>
        {rules.map((r, i) => (
          <div key={r._id || i} className="row">
            <input type="checkbox" checked={!!r.selected} onChange={(e) => toggle(i, e.target.checked)} />
            {editId === i ? (
              <input className="grow" value={editText} onChange={(e) => setEditText(e.target.value)} />
            ) : (
              <span className="grow">{r.text}</span>
            )}
            <span className={`badge-s ${r.explicit ? 'ok' : 'no'}`}>{r.explicit ? 'Explicit' : 'Implicit'}</span>
            {editId === i ? (
              <button type="button" className="icon-btn" onClick={() => saveEdit(i)}>
                save
              </button>
            ) : (
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setEditId(i);
                  setEditText(r.text);
                }}
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            )}
            <button type="button" className="icon-btn" onClick={() => remove(i)}>
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        ))}
        {selected > 0 && (
          <div className="bulk">
            {selected} Selected
            <button type="button" className="btn primary" onClick={proceed}>
              Continue
            </button>
          </div>
        )}
      </section>
      <div className="wizard-foot">
        <Composer value={composer} onChange={setComposer} onSubmit={proceed} />
      </div>
    </div>
  );
}
