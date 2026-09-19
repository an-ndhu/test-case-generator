import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { useProject } from '../hooks/useProject';
import { patchProject } from '../store/sessionsSlice';

export default function WorkflowsPage() {
  const { id, current, dispatch, error } = useProject();
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);
  const [composer, setComposer] = useState('');

  if (!current) return <div className="spinner" />;

  const wfs = current.workflows || [];

  function counts(index) {
    const rules = (current.rules || []).filter((r) => r.workflowIndex === index).length;
    const stories = (current.userStories || []).filter((s) => s.workflowIndex === index).length;
    const cases = current.testCases?.length || 0;
    return { rules, stories, cases };
  }

  async function approve() {
    await dispatch(patchProject({ id, step: 'rules' }));
    navigate(`/projects/${id}/rules`);
  }

  return (
    <div className="wizard">
      <StepBack id={id} current="workflows" />
      <p className="pearl-line">
        <span className="pearl" />
        Test Cases are created successfully.
      </p>
      <p className="subhead">Step 1 : Review the Workflows</p>
      {error && <p className="banner">{error}</p>}
      <section className="panel">
        <div className="panel-head">
          <h2>Generated Workflows ({wfs.length})</h2>
          <button className="icon-btn" type="button" onClick={() => navigate(`/projects/${id}/workflows/${wfs[open]?._id || wfs[0]?._id || '0'}`)}>
            <span className="material-symbols-outlined">open_in_full</span>
          </button>
        </div>
        {wfs.map((w, i) => {
          const c = counts(i);
          return (
            <div key={w._id || i} className="acc">
              <div className="acc-head">
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
                <div className="chips">
                  <span className="chip-c">{c.rules} Rules</span>
                  <span className="chip-c">{c.stories} User Stories</span>
                  <span className="chip-c">{c.cases} Test cases</span>
                </div>
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
