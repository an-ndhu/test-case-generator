import { useState } from 'react';
import { downloadCsv } from '../api/sessions';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { useProject } from '../hooks/useProject';
import { regenerateProject } from '../store/sessionsSlice';

export default function ExportPage() {
  const { id, current, dispatch, notice, error, status } = useProject();
  const [toast, setToast] = useState('');
  const [composer, setComposer] = useState('');
  const [open, setOpen] = useState(0);

  if (!current) return <div className="spinner" />;
  const cases = current.testCases || [];

  async function excel() {
    await downloadCsv(id, current.title);
    setToast('Exported as CSV (Excel).');
  }

  return (
    <div className="wizard">
      <StepBack id={id} current="export" />
      <p className="pearl-line">
        <span className="pearl" />
        All {cases.length} user testcases are approved.
      </p>
      <p className="subhead">Export the Testcases</p>
      {(error || toast || notice) && <p className={`banner ${toast || notice ? 'ok' : ''}`}>{error || toast || notice}</p>}
      <section className="panel">
        <div className="panel-head">
          <h2>Export Testcases ({cases.length})</h2>
        </div>
        {cases.map((c, i) => (
          <div key={c._id || i} className="acc">
            <button type="button" className="acc-head" onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{open === i ? '▾' : '▸'}</span>
              {c.title}
            </button>
            {open === i && <p className="meta">{c.expected}</p>}
          </div>
        ))}
        <div className="bulk">
          <button className="btn primary" type="button" onClick={excel}>
            Export as Excel
          </button>
          <button
            className="btn"
            type="button"
            disabled={status === 'busy'}
            onClick={() => dispatch(regenerateProject(id))}
          >
            Regenerate
          </button>
        </div>
      </section>
      <div className="wizard-foot">
        <Composer value={composer} onChange={setComposer} onSubmit={excel} />
      </div>
    </div>
  );
}
