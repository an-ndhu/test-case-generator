import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { useProject } from '../hooks/useProject';
import { patchProject } from '../store/sessionsSlice';

export default function NamePage() {
  const { id, current, dispatch, error } = useProject();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const value = title || current?.title || '';

  async function continueNext() {
    const result = await dispatch(
      patchProject({ id, title: value, contextNote: current?.contextNote || '', step: 'context' })
    );
    if (patchProject.fulfilled.match(result)) navigate(`/projects/${id}/context`);
  }

  if (!current) return <div className="spinner" />;

  return (
    <div className="wizard">
      <StepBack id={id} current="name" />
      <p className="pearl-line">
        <span className="pearl" />
        I&apos;m creating a new project for testcase generation. Please enter a name for your project.
      </p>
      {error && <p className="banner">{error}</p>}
      <div className="inline-name">
        <input
          value={value === 'Untitled project' ? title : value}
          placeholder="Enter Project Name"
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn primary" type="button" onClick={continueNext}>
          Continue
        </button>
      </div>
      <div className="wizard-foot">
        <Composer value={note} onChange={setNote} onSubmit={continueNext} />
      </div>
    </div>
  );
}
