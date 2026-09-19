import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { useProject } from '../hooks/useProject';
import { patchProject } from '../store/sessionsSlice';

export default function StoriesPage() {
  const { id, current, dispatch } = useProject();
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);
  const [composer, setComposer] = useState('');

  if (!current) return <div className="spinner" />;
  const stories = current.userStories || [];

  async function proceed() {
    await dispatch(patchProject({ id, step: 'testcases' }));
    navigate(`/projects/${id}/test-cases`);
  }

  return (
    <div className="wizard">
      <StepBack id={id} current="stories" />
      <p className="pearl-line">
        <span className="pearl" />
        All {current.rules?.length || 0} rules are approved.
      </p>
      <p className="subhead">Step3: review the user stories</p>
      <section className="panel">
        <div className="panel-head">
          <h2>Generated user stories ({stories.length})</h2>
        </div>
        {stories.map((s, i) => (
          <div key={s._id || i} className="acc">
            <button type="button" className="acc-head" onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{open === i ? '▾' : '▸'}</span>
              <strong>{s.title}</strong>
            </button>
            <p className="meta">{s.body}</p>
            {open === i && (
              <ul className="nested">
                {(current.rules || [])
                  .filter((_, idx) => (s.linkedRuleIndexes || []).includes(idx) || s.workflowIndex === current.rules[idx]?.workflowIndex)
                  .slice(0, 4)
                  .map((r, j) => (
                    <li key={j}>{r.text}</li>
                  ))}
              </ul>
            )}
          </div>
        ))}
        <div className="actions end">
          <button className="btn primary" type="button" onClick={proceed}>
            Approve stories
          </button>
        </div>
      </section>
      <div className="wizard-foot">
        <Composer value={composer} onChange={setComposer} onSubmit={proceed} />
      </div>
    </div>
  );
}
