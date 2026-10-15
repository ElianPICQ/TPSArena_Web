import { useState, type FormEvent } from 'react';
import { login } from '../lib/api';
import type { User } from '../lib/types';

interface Props {
  onLogin: (user: User) => void;
  notice?: string;
}

export function Login({ onLogin, notice }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      onLogin(await login(identifier.trim(), password));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
      setPending(false);
    }
  }

  return (
    <main id="contenu" className="login" tabIndex={-1}>
      <p className="nav__brand login__brand">
        TPS <span>ARENA</span>
      </p>
      <p className="section__eyebrow">Companion</p>
      <h1 className="login__title">Tes stats, partout</h1>
      <form className="panel login__form" onSubmit={(e) => void submit(e)} noValidate>
        {(error ?? notice) && (
          <p className="note note--error login__error" role="alert">
            {error ?? notice}
          </p>
        )}
        <label className="field">
          <span className="field__label">E-mail ou pseudo</span>
          <input
            className="field__input"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Mot de passe</span>
          <input
            className="field__input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="btn btn--primary login__submit"
          disabled={pending || !identifier.trim() || !password}
        >
          {pending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p className="muted login__help">
        Pas encore de compte ? Crée-le dans le jeu, puis reviens ici avec les mêmes identifiants.
      </p>
      <p className="login__help">
        <a href="/">Retour au site TPS Arena</a>
      </p>
    </main>
  );
}
