import React, { useState, useEffect } from 'react';
import { groupedDates } from './weekends'; // ton calendrier statique

const BASE = 'https://api.sheety.co/4d3b6186c4864dc3aaa5d478843ecfee/dispoCodicille/feuille1';
const AUTH = 'Bearer 1648';

export default function App() {
  const [page, setPage]     = useState('login');
  const [user, setUser]     = useState('');
  const [tempName, setTempName] = useState('');
  const [allIndispos, setAllIndispos] = useState({});
  const [rowIds, setRowIds] = useState({});

  // 1) Chargement initial des données depuis Sheety
  useEffect(() => {
    fetch(BASE, { headers: { Authorization: AUTH } })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(json => {
        const dispo = {}, ids = {};
        json.feuille1.forEach(row => {
          dispo[row.user] = row.dates ? row.dates.split(';') : [];
          ids[row.user]   = row.id;
        });
        setAllIndispos(dispo);
        setRowIds(ids);
      })
      .catch(err => console.error('Erreur Sheety GET:', err));
  }, []);

  // 2) Login / Création d’un nouvel utilisateur si nécessaire
  const handleLogin = () => {
    const name = tempName.trim();
    if (!name) return;
    if (!allIndispos[name]) {
      // créer une nouvelle ligne
      fetch(BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: AUTH
        },
        body: JSON.stringify({ feuille1: { user: name, dates: '' } })
      })
      .then(r => r.json())
      .then(j => {
        setRowIds(prev => ({ ...prev, [name]: j.feuille1.id }));
        setAllIndispos(prev => ({ ...prev, [name]: [] }));
        setUser(name);
        setPage('calendar');
      })
      .catch(err => console.error('Erreur Sheety POST:', err));
    } else {
      setUser(name);
      setPage('calendar');
    }
  };

  // 3) Toggle d’une date : mise à jour Sheety + état local
  const toggleDate = iso => {
    const userId  = rowIds[user];
    const current = allIndispos[user] || [];
    const updated = current.includes(iso)
      ? current.filter(d => d !== iso)
      : [...current, iso];
    const datesStr = updated.join(';');

    fetch(`${BASE}/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH
      },
      body: JSON.stringify({ feuille1: { dates: datesStr } })
    })
    .then(r => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      setAllIndispos(prev => ({ ...prev, [user]: updated }));
    })
    .catch(err => console.error('Erreur Sheety PUT:', err));
  };

  // 4) Affichage de l’écran de login
  if (!user || page === 'login') {
    return (
      <div className="login">
        <h2>🎭 Bienvenue</h2>
        <input
          value={tempName}
          maxLength={20}
          placeholder="Votre prénom : "
          onChange={e => setTempName(e.target.value)}
        />
        <button className="btn" onClick={handleLogin}>Valider</button>
      </div>
    );
  }

  // 5) Écran Résumé
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

  // 6) Écran Planning (sélection des dates)
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
              const isUserUnavail  = allIndispos[user]?.includes(iso);
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
