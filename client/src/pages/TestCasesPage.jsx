import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { nextOf } from '../api/steps';
import { useDebouncedPatch } from '../hooks/useDebouncedPatch';
import { useProject } from '../hooks/useProject';
import { patchProject } from '../store/sessionsSlice';

export default function TestCasesPage() {
  const { id, current, dispatch, error } = useProject();
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);
  const [composer, setComposer] = useState('');
  const [localError, setLocalError] = useState('');
  const [cases, setCases] = useState([]);
  const { save, flush } = useDebouncedPatch(dispatch);

  useEffect(() => {
    if (current) setCases(current.testCases || []);
  }, [current?._id]);

  if (!current) return <div className="spinner" />;
  const selected = cases.filter((c) => c.selected !== false).length;
  const nxt = nextOf('testcases', current.design);

  function persist(next) {
    setCases(next);
    save({ id, testCases: next });
  }

  function toggle(i, selectedVal) {
    persist(cases.map((c, idx) => (idx === i ? { ...c, selected: selectedVal } : c)));
  }

  function edit(i, field, value) {
    persist(cases.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }

  async function proceed() {
    const chosen = cases.filter((c) => c.selected !== false);
    if (!chosen.length) {
      setLocalError('Select at least one test case.');
      return;
    }
    setLocalError('');
    await flush();
    if (!nxt) {
      await dispatch(patchProject({ id, testCases: cases, step: 'testcases' }));
      navigate('/');
      return;
    }
    await dispatch(patchProject({ id, testCases: cases, step: nxt.step }));
    navigate(nxt.path(id));
  }

  return (
    <div className="wizard">
      <StepBack id={id} current="testcases" />
      <p className="pearl-line">
        <span className="pearl" />
        All {current.userStories?.length || 0} user stories are approved.
      </p>
      <p className="subhead">Step4: review the test cases</p>
      {(error || localError) && <p className="banner">{error || localError}</p>}
      <section className="panel">
        <div className="panel-head">
          <h2>Generated Testcases ({cases.length})</h2>
        </div>
        {cases.map((c, i) => (
          <div key={c._id || i} className="acc">
            <div className="acc-head">
              <input
                type="checkbox"
                checked={c.selected !== false}
                onChange={(e) => toggle(i, e.target.checked)}
              />
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
              {nxt ? 'Approve' : 'Done'}
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
