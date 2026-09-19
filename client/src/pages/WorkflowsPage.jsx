import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { nextOf } from '../api/steps';
import { useDebouncedPatch } from '../hooks/useDebouncedPatch';
import { useProject } from '../hooks/useProject';
import { patchProject } from '../store/sessionsSlice';

export default function WorkflowsPage() {
  const { id, current, dispatch, error } = useProject();
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);
  const [composer, setComposer] = useState('');
  const [localError, setLocalError] = useState('');
  const [wfs, setWfs] = useState(null);
  const { save, flush } = useDebouncedPatch(dispatch);

  useEffect(() => {
    if (current) setWfs(current.workflows || []);
  }, [current?._id]);

  if (!current) return <div className="spinner" />;
  const workflows = wfs ?? current.workflows ?? [];

  function counts(index) {
    const rules = (current.rules || []).filter((r) => r.workflowIndex === index).length;
    const stories = (current.userStories || []).filter((s) => s.workflowIndex === index).length;
    const cases = (current.testCases || []).filter((c) => c.workflowIndex === index).length;
    return { rules, stories, cases };
  }

  function persist(next) {
    setWfs(next);
    save({ id, workflows: next });
  }

  function toggle(i, selected) {
    persist(workflows.map((w, idx) => (idx === i ? { ...w, selected } : w)));
  }

  async function approve() {
    const chosen = workflows.filter((w) => w.selected !== false);
    if (!chosen.length) {
      setLocalError('Select at least one workflow.');
      return;
    }
    setLocalError('');
    await flush();
    const nxt = nextOf('workflows', current.design);
    if (!nxt) {
      navigate('/');
      return;
    }
    await dispatch(patchProject({ id, workflows, step: nxt.step }));
    navigate(nxt.path(id));
  }

  return (
    <div className="wizard">
      <StepBack id={id} current="workflows" />
      <p className="pearl-line">
        <span className="pearl" />
        Test Cases are created successfully.
      </p>
      <p className="subhead">Step 1 : Review the Workflows</p>
      {(error || localError) && <p className="banner">{error || localError}</p>}
      <section className="panel">
        <div className="panel-head">
          <h2>Generated Workflows ({workflows.length})</h2>
          <button className="icon-btn" type="button" onClick={() => navigate(`/projects/${id}/workflows/${workflows[open]?._id || workflows[0]?._id || '0'}`)}>
            <span className="material-symbols-outlined">open_in_full</span>
          </button>
        </div>
        {workflows.map((w, i) => {
          const c = counts(i);
          return (
            <div key={w._id || i} className="acc">
              <div className="acc-head">
                <input
                  type="checkbox"
                  checked={w.selected !== false}
                  onChange={(e) => toggle(i, e.target.checked)}
                />
                <button type="button" onClick={() => setOpen(open === i ? -1 : i)}>
                  {open === i ? '▾' : '▸'} <strong>{w.title}</strong>
                </button>
                <span className="pill">Active</span>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => navigate(`/projects/${id}/workflows/${w._id || i}`)}
                >
                  View workflow
                </button>
              </div>
              <p className="meta">{w.summary}</p>
              {open === i && (
                <>
                  <div className="chips">
                    <span className="chip-c">{c.rules} Rules</span>
                    <span className="chip-c">{c.stories} User Stories</span>
                    <span className="chip-c">{c.cases} Test cases</span>
                  </div>
                  <ul className="nested">
                    {(current.rules || [])
                      .filter((r) => r.workflowIndex === i)
                      .map((r, j) => (
                        <li key={r._id || j}>{r.text}</li>
                      ))}
                  </ul>
                </>
              )}
            </div>
          );
        })}
        <div className="actions end">
          <button className="btn primary" type="button" onClick={approve}>
            Approve & Proceed
          </button>
        </div>
      </section>
      <div className="wizard-foot">
        <Composer value={composer} onChange={setComposer} onSubmit={approve} />
      </div>
    </div>
  );
}
