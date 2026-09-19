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
  const [composer, setComposer] = useState('');
  const [localError, setLocalError] = useState('');

  const stored = current?.title && current.title !== 'Untitled project' ? current.title : '';
  const value = title || stored;

  async function continueNext() {
    const chosen = (title.trim() || stored || composer.trim()).trim();
    if (!chosen || chosen === 'Untitled project') {
      setLocalError('Enter a project name to continue.');
      return;
    }
    setLocalError('');
    const result = await dispatch(
      patchProject({ id, title: chosen, contextNote: current?.contextNote || '', step: 'context' })
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
      {(error || localError) && <p className="banner">{error || localError}</p>}
      <div className="inline-name">
        <input
          value={value}
          placeholder="Enter Project Name"
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn primary" type="button" onClick={continueNext}>
          Continue
        </button>
      </div>
      <div className="wizard-foot">
        <Composer
          value={composer}
          onChange={setComposer}
          onSubmit={continueNext}
          placeholder="Type a project name, then send"
        />
      </div>
    </div>
  );
}
