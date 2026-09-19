import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatRail from '../components/ChatRail';
import StepBack from '../components/StepBack';
import WorkflowChart from '../components/WorkflowChart';
import { nextOf } from '../api/steps';
import { useProject } from '../hooks/useProject';
import { patchProject } from '../store/sessionsSlice';

export default function CanvasPage() {
  const { wfId } = useParams();
  const { id, current, dispatch } = useProject();
  const navigate = useNavigate();
  const [composer, setComposer] = useState('');
  const [localError, setLocalError] = useState('');

  const wfs = current?.workflows || [];
  const initial = Math.max(0, wfs.findIndex((w) => w._id === wfId));
  const [sel, setSel] = useState(initial < 0 ? 0 : initial);

  if (!current) return <div className="spinner" />;

  const index = wfs[sel] ? sel : 0;
  const wf = { ...wfs[index], _index: index };

  async function approve() {
    const chosen = wfs.filter((w) => w.selected !== false);
    if (!chosen.length) {
      setLocalError('Select at least one workflow on the list, then approve.');
      return;
    }
    setLocalError('');
    const nxt = nextOf('canvas', current.design);
    if (!nxt) {
      navigate('/');
      return;
    }
    await dispatch(patchProject({ id, step: nxt.step }));
    navigate(nxt.path(id));
  }

  return (
    <div className="split">
      <div className="split-main graph-wrap">
        <StepBack id={id} current="canvas" />
        <div className="panel-head">
          <h2>Workflow</h2>
          <button type="button" className="icon-btn" onClick={() => navigate(`/projects/${id}/workflows`)}>
            ✕
          </button>
        </div>
        {localError && <p className="banner">{localError}</p>}
        <label className="wf-select">
          <select
            value={index}
            onChange={(e) => {
              const i = Number(e.target.value);
              setSel(i);
              navigate(`/projects/${id}/workflows/${wfs[i]?._id || i}`);
            }}
          >
            {wfs.map((w, i) => (
              <option key={w._id || i} value={i}>
                {w.title}
              </option>
            ))}
          </select>
        </label>
        <WorkflowChart workflow={wf} rules={current.rules || []} />
        <div className="actions end">
          <button className="btn" type="button" onClick={() => navigate(`/projects/${id}/workflows`)}>
            Cancel
          </button>
          <button className="btn primary" type="button" onClick={approve}>
            Approve & Proceed
          </button>
        </div>
      </div>
      <ChatRail
        statusLine="Test Cases are created successfully. Please review the workflows"
        composerProps={{ value: composer, onChange: setComposer, onSubmit: approve }}
      >
        <div className="mini-list">
          {wfs.map((w, i) => (
            <div key={w._id || i} className="acc">
              <strong>{w.title}</strong>
              <p className="meta">{w.summary}</p>
              <button
                type="button"
                className="linkish"
                onClick={() => {
                  setSel(i);
                  navigate(`/projects/${id}/workflows/${w._id || i}`);
                }}
              >
                View workflow
              </button>
            </div>
          ))}
        </div>
      </ChatRail>
    </div>
  );
}
