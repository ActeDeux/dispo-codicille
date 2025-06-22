import React, { useState, useEffect } from 'react';
import { groupedDates } from './weekends';

export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(localStorage.getItem('user') || '');
  const [tempName, setTempName] = useState('');
  const [allIndispos, setAllIndispos] = useState(JSON.parse(localStorage.getItem('allIndispos')||'{}'));

  useEffect(() => {
    localStorage.setItem('allIndispos', JSON.stringify(allIndispos));
  }, [allIndispos]);

  const handleLogin = () => {
    const name = tempName.trim();
    if (name) {
      setUser(name);
      localStorage.setItem('user', name);
      if (!allIndispos[name]) {
        setAllIndispos(prev => ({...prev, [name]: []}));
      }
      setPage('calendar');
    }
  };

  const toggleDate = iso => {
    setAllIndispos(prev => {
      const userDates = prev[user] || [];
      const updated = userDates.includes(iso)
        ? userDates.filter(d => d !== iso)
        : [...userDates, iso];
      return {...prev, [user]: updated};
    });
  };

  if (!user || page === 'login') {
    return (
      <div className="login">
        <h2>🎭 Bienvenue</h2>
        <input
          value={tempName}
          maxLength={20}
          placeholder="Votre prénom"
          onChange={e => setTempName(e.target.value)}
        />
        <button className="btn" onClick={handleLogin}>Valider</button>
      </div>
    );
  }

  if (page === 'summary') {
    return (
      <div>
        <h1>🎭 Résumé</h1>
        <div className="nav">
          <button className="btn" onClick={() => setPage('calendar')}>Retour planning</button>
        </div>
        {Object.entries(groupedDates).map(([month, dates]) => (
          <div key={month}>
            <h2>{month}</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  {Object.keys(allIndispos).map(u => <th key={u}>{u}</th>)}
                </tr>
              </thead>
              <tbody>
                {dates.map(([iso, label]) => (
                  <tr key={iso}>
                    <td>{label}</td>
                    {Object.entries(allIndispos).map(([u, arr]) =>
                      <td key={u}>{arr.includes(iso) ? '❌' : '✅'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1>🎭 Représentation Le Codicille</h1>
      <h3>Troupe "Acte Deux" de l'amicale laïque de Lanildut</h3>
      <div className="nav">
        <button className="btn" onClick={() => setPage('summary')}>Voir résumé</button>
        <button className="btn" onClick={() => setPage('login')}>Changer</button>
      </div>
      {Object.entries(groupedDates).map(([month, dates]) => (
        <div key={month} className="month-block">
          <h2>{month}</h2>
          <div className="grid">
            {dates.map(([iso, label]) => {
              const isUserUnavail = allIndispos[user]?.includes(iso);
              const isOtherUnavail = Object.entries(allIndispos)
                .filter(([u]) => u !== user)
                .some(([, arr]) => arr.includes(iso));
              return (
                <div
                  key={iso}
                  className={`date-cell${isUserUnavail ? ' red' : ''}${isOtherUnavail ? ' other' : ''}`}
                  onClick={() => toggleDate(iso)}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
