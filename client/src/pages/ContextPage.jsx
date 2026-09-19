import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Composer from '../components/Composer';
import StepBack from '../components/StepBack';
import { isTxtOrMd, TXT_MD_ACCEPT } from '../lib/files';
import { useProject } from '../hooks/useProject';
import { addProjectFile, patchProject } from '../store/sessionsSlice';

export default function ContextPage() {
  const { id, current, dispatch, error } = useProject();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [composer, setComposer] = useState('');
  const [fileError, setFileError] = useState('');

  const contextNote = note || current?.contextNote || '';

  async function onFile(file, inputEl) {
    if (inputEl) inputEl.value = '';
    if (!file) return;
    if (!isTxtOrMd(file)) {
      setFileError('Please choose a .txt or .md file.');
      return;
    }
    setFileError('');
    dispatch(addProjectFile({ id, file }));
  }

  function removeFile(index) {
    const next = (current.files || []).filter((_, i) => i !== index);
    dispatch(patchProject({ id, files: next }));
  }

  async function continueNext() {
    const text = (note || current?.contextNote || composer || '').trim();
    if (!text && !(current.files || []).length) {
      setFileError('Add a file or describe the context.');
      return;
    }
    setFileError('');
    const result = await dispatch(
      patchProject({
        id,
        contextNote: text || current.contextNote,
        requirementText: text || current.requirementText,
        step: 'design',
      })
    );
    if (patchProject.fulfilled.match(result)) navigate(`/projects/${id}/design`);
  }

  if (!current) return <div className="spinner" />;

  return (
    <div className="wizard">
      <StepBack id={id} current="context" />
      {current.title && current.title !== 'Untitled project' && (
        <p className="pearl-line">
          <span className="pearl" />
          Project “{current.title}” created successfully.
        </p>
      )}
      <p className="subhead">What other contexts you want me to consider for creating the testcases.</p>
      {error && <p className="banner">{error}</p>}
      {fileError && <p className="banner">{fileError}</p>}

      <section className="panel">
        <div className="panel-head">
          <h2>Associate Context</h2>
        </div>
        <p className="label">ADD SOURCE</p>
        <label className="tile">
          <input
            type="file"
            hidden
            accept={TXT_MD_ACCEPT}
            onChange={(e) => onFile(e.target.files?.[0], e.target)}
          />
          <span className="material-symbols-outlined">folder</span>
          LOCAL FILES
        </label>
        <label>
          Describe the context
          <textarea
            rows={3}
            placeholder="Input the context here"
            value={contextNote}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {(current.files || []).length > 0 && (
          <div className="file-list">
            {current.files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="selected-file">
                <span className="material-symbols-outlined">description</span>
                <span className="grow">{f.name}</span>
                <button type="button" className="icon-btn" title="Remove" onClick={() => removeFile(i)}>
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="actions end">
          <button className="btn" type="button" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button className="btn primary" type="button" onClick={continueNext}>
            Continue
          </button>
        </div>
      </section>
      <div className="wizard-foot">
        <Composer value={composer} onChange={setComposer} onFile={onFile} onSubmit={continueNext} />
      </div>
    </div>
  );
}
