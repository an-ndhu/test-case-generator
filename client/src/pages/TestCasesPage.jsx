import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { useProject } from '../hooks/useProject';
import { patchProject } from '../store/sessionsSlice';

export default function TestCasesPage() {
  const { id, current, dispatch } = useProject();
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);
  const [composer, setComposer] = useState('');

  if (!current) return <div className="spinner" />;
  const cases = current.testCases || [];
  const selected = cases.filter((c) => c.selected).length;

  function toggle(i, selected) {
    dispatch(patchProject({ id, testCases: cases.map((c, idx) => (idx === i ? { ...c, selected } : c)) }));
  }

  function edit(i, field, value) {
    dispatch(patchProject({ id, testCases: cases.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)) }));
  }

  async function proceed() {
    await dispatch(patchProject({ id, step: 'export' }));
    navigate(`/projects/${id}/export`);
  }

  return (
    <div className="wizard">
      <StepBack id={id} current="testcases" />
      <p className="pearl-line">
        <span className="pearl" />
        All {current.userStories?.length || 0} user stories are approved.
      </p>
      <p className="subhead">Step4: review the test cases</p>
      <section className="panel">
        <div className="panel-head">
          <h2>Generated Testcases ({cases.length})</h2>
        </div>
        {cases.map((c, i) => (
          <div key={c._id || i} className="acc">
            <div className="acc-head">
              <input type="checkbox" checked={!!c.selected} onChange={(e) => toggle(i, e.target.checked)} />
              <button type="button" onClick={() => setOpen(open === i ? -1 : i)}>
                {open === i ? '▾' : '▸'} {c.title}
              </button>
              <span className={`type ${c.type}`}>{c.type}</span>
            </div>
            {open === i && (
              <div className="card-fields">
                <label>
                  Title
                  <input value={c.title} onChange={(e) => edit(i, 'title', e.target.value)} />
                </label>
                <label>
                  Preconditions
                  <textarea value={c.preconditions} onChange={(e) => edit(i, 'preconditions', e.target.value)} />
                </label>
                <label>
                  Steps
                  <textarea
                    value={(c.steps || []).join('\n')}
                    onChange={(e) =>
                      edit(
                        i,
                        'steps',
                        e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                      )
                    }
                  />
                </label>
                <label>
                  Expected
                  <textarea value={c.expected} onChange={(e) => edit(i, 'expected', e.target.value)} />
                </label>
              </div>
            )}
          </div>
        ))}
        {selected > 0 && (
          <div className="bulk">
            {selected} Selected
            <button className="btn primary" type="button" onClick={proceed}>
              Approve
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
