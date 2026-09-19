import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { stepPath } from '../api/sessions';
import Composer from '../components/Composer';
import { createProject, fetchSessions, removeProject } from '../store/sessionsSlice';

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, error, status } = useSelector((s) => s.sessions);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  async function start(extra = {}) {
    const result = await dispatch(createProject({ title: extra.title, requirementText: text }));
    if (createProject.fulfilled.match(result)) {
      navigate(`/projects/${result.payload._id}/name`);
    }
  }

  async function remove(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Delete this session?')) {
      await dispatch(removeProject(id));
    }
  }

  return (
    <div className="home">
      <div className="hero">
        <div className="orb">
          <span className="material-symbols-outlined" style={{ fontSize: 36 }}>
            auto_awesome
          </span>
        </div>
        <h1>
          Welcome to the world of Test Case Generation.
          <br />
          What would you like to do today?
        </h1>
      </div>
      <div>
        {error && <div className="banner composer-wrap">{error}</div>}
        <Composer value={text} onChange={setText} file={file} onFile={setFile} onSubmit={() => start()} busy={status === 'busy'} />
        {list.length > 0 && (
          <section className="history">
            <h2>Your sessions</h2>
            {list.map((item) => (
              <div key={item._id} className="history-row">
                <button type="button" className="history-main" onClick={() => navigate(stepPath(item))}>
                  <span>{item.title}</span>
                  <span className="meta">
                    {item.caseCount} cases · last: {item.latestStep || item.step}
                  </span>
                </button>
                <button type="button" className="btn" onClick={(e) => remove(e, item._id)}>
                  Delete
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
