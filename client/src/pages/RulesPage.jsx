import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { nextOf } from '../api/steps';
import { useDebouncedPatch } from '../hooks/useDebouncedPatch';
import { useProject } from '../hooks/useProject';
import { patchProject } from '../store/sessionsSlice';

export default function RulesPage() {
  const { id, current, dispatch, error } = useProject();
  const navigate = useNavigate();
  const [composer, setComposer] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [localError, setLocalError] = useState('');
  const [rules, setRules] = useState([]);
  const { save, flush } = useDebouncedPatch(dispatch);

  useEffect(() => {
    if (current) setRules(current.rules || []);
  }, [current?._id]);

  if (!current) return <div className="spinner" />;
  const selected = rules.filter((r) => r.selected !== false).length;
  const nxt = nextOf('rules', current.design);

  function persist(next) {
    setRules(next);
    save({ id, rules: next });
  }

  function toggle(i, selectedVal) {
    persist(rules.map((r, idx) => (idx === i ? { ...r, selected: selectedVal } : r)));
  }

  function saveEdit(i) {
    persist(rules.map((r, idx) => (idx === i ? { ...r, text: editText } : r)));
    setEditId(null);
  }

  function remove(i) {
    persist(rules.filter((_, idx) => idx !== i));
  }

  async function proceed() {
    const chosen = rules.filter((r) => r.selected !== false);
    if (!chosen.length) {
      setLocalError('Select at least one rule.');
      return;
    }
    setLocalError('');
    await flush();
    if (!nxt) {
      await dispatch(patchProject({ id, rules, step: 'rules' }));
      navigate('/');
      return;
    }
    await dispatch(patchProject({ id, rules, step: nxt.step }));
    navigate(nxt.path(id));
  }

  return (
    <div className="wizard">
      <StepBack id={id} current="rules" />
      <p className="pearl-line">
        <span className="pearl" />
        All {current.workflows?.length || 0} workflow are approved.
      </p>
      <p className="subhead">Step2: review the Rules</p>
      {(error || localError) && <p className="banner">{error || localError}</p>}
      <section className="panel">
        <div className="panel-head">
          <h2>Generated Rules ({rules.length})</h2>
        </div>
        {rules.map((r, i) => (
          <div key={r._id || i} className="row">
            <input
              type="checkbox"
              checked={r.selected !== false}
              onChange={(e) => toggle(i, e.target.checked)}
            />
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
              {nxt ? 'Continue' : 'Done'}
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
