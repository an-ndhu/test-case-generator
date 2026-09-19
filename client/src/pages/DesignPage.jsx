import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatRail from '../components/ChatRail';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { useProject } from '../hooks/useProject';
import { generateProject, patchProject } from '../store/sessionsSlice';

const CATEGORIES = ['Functional', 'Negative', 'Boundary', 'Exploratory'];
const TECHNIQUES = ['Equivalence partitioning', 'Boundary value', 'Decision table', 'State transition'];

function DesignForm({ current, category, setCategory, technique, setTechnique, format, setFormat, wantCases, setWantCases, wantStories, setWantStories, onCancel, onGenerate, busy }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Test Design Optimization</h2>
      </div>
      <p className="meta">Optional — select technique categories and preferred techniques to steer generated coverage.</p>
      <div className="two-col">
        <label>
          Design Technique Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select a Category</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Technique
          <select value={technique} onChange={(e) => setTechnique(e.target.value)}>
            <option value="">Select a Technique</option>
            {TECHNIQUES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <p>Select Test Case Format</p>
      <div className="radios">
        {[
          ['standard', 'Standard'],
          ['bdd', 'BDD (Gherkin)'],
          ['bdd2', 'BDD 2.0'],
        ].map(([v, label]) => (
          <label key={v} className="radio">
            <input type="radio" checked={format === v} onChange={() => setFormat(v)} />
            {label}
          </label>
        ))}
      </div>
      <div className="checks">
        <label>
          <input type="checkbox" checked={wantCases} onChange={(e) => setWantCases(e.target.checked)} /> Generate Testcase
        </label>
        <label>
          <input type="checkbox" checked={wantStories} onChange={(e) => setWantStories(e.target.checked)} /> Generate User Stories
        </label>
      </div>
      <div className="actions end">
        <button className="btn" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" type="button" disabled={busy} onClick={onGenerate}>
          {busy ? 'Generating…' : 'Generate'}
        </button>
      </div>
    </section>
  );
}

export default function DesignPage() {
  const { id, current, dispatch, error, status } = useProject();
  const navigate = useNavigate();
  const split = useLocation().pathname.endsWith('/split');
  const [composer, setComposer] = useState('');
  const [category, setCategory] = useState(current?.design?.category || '');
  const [technique, setTechnique] = useState(current?.design?.technique || '');
  const [format, setFormat] = useState(current?.design?.format || 'standard');
  const [wantCases, setWantCases] = useState(current?.design?.wantCases !== false);
  const [wantStories, setWantStories] = useState(current?.design?.wantStories !== false);

  async function generate() {
    const patched = await dispatch(
      patchProject({
        id,
        design: { category, technique, format, wantCases, wantStories },
        step: 'design',
      })
    );
    if (!patchProject.fulfilled.match(patched)) return;
    const result = await dispatch(generateProject(id));
    if (generateProject.fulfilled.match(result)) navigate(`/projects/${id}/workflows`);
  }

  if (!current) return <div className="spinner" />;

  const form = (
    <DesignForm
      current={current}
      category={category}
      setCategory={setCategory}
      technique={technique}
      setTechnique={setTechnique}
      format={format}
      setFormat={setFormat}
      wantCases={wantCases}
      setWantCases={setWantCases}
      wantStories={wantStories}
      setWantStories={setWantStories}
      onCancel={() => navigate(`/projects/${id}/context`)}
      onGenerate={generate}
      busy={status === 'busy'}
    />
  );

  if (split) {
    return (
      <div className="split">
        <div className="split-main">
          <StepBack id={id} current="design" />
          <div className="panel-head">
            <h2>Workflow 1</h2>
            <button type="button" className="icon-btn" onClick={() => navigate(`/projects/${id}/design`)}>
              ✕
            </button>
          </div>
          {form}
        </div>
        <ChatRail statusLine={`Associated context updated. Knowledge graph name : ${current.title}`}>
          {form}
        </ChatRail>
      </div>
    );
  }

  return (
    <div className="wizard">
      <StepBack id={id} current="design" />
      <p className="pearl-line">
        <span className="pearl" />
        Associated context updated. Knowledge graph name : {current.title}
      </p>
      {error && <p className="banner">{error}</p>}
      <div className="panel-wrap">
        <button className="icon-btn abs" type="button" onClick={() => navigate(`/projects/${id}/design/split`)}>
          <span className="material-symbols-outlined">open_in_full</span>
        </button>
        {form}
      </div>
      <div className="wizard-foot">
        <Composer value={composer} onChange={setComposer} onSubmit={generate} busy={status === 'busy'} />
      </div>
    </div>
  );
}
