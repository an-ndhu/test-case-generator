import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { nextOf } from '../api/steps';
import { useDebouncedPatch } from '../hooks/useDebouncedPatch';
import { useProject } from '../hooks/useProject';
import { patchProject } from '../store/sessionsSlice';

export default function StoriesPage() {
  const { id, current, dispatch, error } = useProject();
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);
  const [composer, setComposer] = useState('');
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [localError, setLocalError] = useState('');
  const [stories, setStories] = useState([]);
  const { save, flush } = useDebouncedPatch(dispatch);

  useEffect(() => {
    if (current) setStories(current.userStories || []);
  }, [current?._id]);

  if (!current) return <div className="spinner" />;
  const selected = stories.filter((s) => s.selected !== false).length;
  const nxt = nextOf('stories', current.design);

  function persist(next) {
    setStories(next);
    save({ id, userStories: next });
  }

  function toggle(i, selectedVal) {
    persist(stories.map((s, idx) => (idx === i ? { ...s, selected: selectedVal } : s)));
  }

  function saveEdit(i) {
    persist(stories.map((s, idx) => (idx === i ? { ...s, title: editTitle, body: editBody } : s)));
    setEditId(null);
  }

  function remove(i) {
    persist(stories.filter((_, idx) => idx !== i));
  }

  async function proceed() {
    const chosen = stories.filter((s) => s.selected !== false);
    if (!chosen.length) {
      setLocalError('Select at least one user story.');
      return;
    }
    setLocalError('');
    await flush();
    if (!nxt) {
      await dispatch(patchProject({ id, userStories: stories, step: 'stories' }));
      navigate('/');
      return;
    }
    await dispatch(patchProject({ id, userStories: stories, step: nxt.step }));
    navigate(nxt.path(id));
  }

  return (
    <div className="wizard">
      <StepBack id={id} current="stories" />
      <p className="pearl-line">
        <span className="pearl" />
        All {current.rules?.length || 0} rules are approved.
      </p>
      <p className="subhead">Step3: review the user stories</p>
      {(error || localError) && <p className="banner">{error || localError}</p>}
      <section className="panel">
        <div className="panel-head">
          <h2>Generated user stories ({stories.length})</h2>
        </div>
        {stories.map((s, i) => (
          <div key={s._id || i} className="acc">
            <div className="acc-head">
              <input
                type="checkbox"
                checked={s.selected !== false}
                onChange={(e) => toggle(i, e.target.checked)}
              />
              <button type="button" onClick={() => setOpen(open === i ? -1 : i)}>
                {open === i ? '▾' : '▸'} <strong>{s.title}</strong>
              </button>
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
                    setEditTitle(s.title);
                    setEditBody(s.body || '');
                    setOpen(i);
                  }}
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
              )}
              <button type="button" className="icon-btn" onClick={() => remove(i)}>
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
            {editId === i ? (
              <div className="card-fields">
                <label>
                  Title
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </label>
                <label>
                  Body
                  <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                </label>
              </div>
            ) : (
              <p className="meta">{s.body}</p>
            )}
            {open === i && (
              <ul className="nested">
                {(current.rules || [])
                  .filter((r, idx) => (s.linkedRuleIndexes || []).includes(idx) || s.workflowIndex === r.workflowIndex)
                  .slice(0, 4)
                  .map((r, j) => (
                    <li key={j}>{r.text}</li>
                  ))}
              </ul>
            )}
          </div>
        ))}
        {selected > 0 && (
          <div className="bulk">
            {selected} Selected
            <button className="btn primary" type="button" onClick={proceed}>
              {nxt ? 'Approve stories' : 'Done'}
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
