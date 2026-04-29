import React, { useState, useEffect } from 'react';
import './LockScreen.css';

interface LockScreenProps {
  onUnlock: (password: string) => void;
  isLocked: boolean;
}

const MASTER_PASSWORD_KEY = 'master-password-hash';
const LOCK_TIMEOUT_KEY = 'lock-timeout';
const LAST_ACTIVITY_KEY = 'last-activity';

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, isLocked }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lockTimeout, setLockTimeout] = useState<number>(5);

  useEffect(() => {
    const savedHash = localStorage.getItem(MASTER_PASSWORD_KEY);
    setIsSetup(!savedHash);

    const savedTimeout = localStorage.getItem(LOCK_TIMEOUT_KEY);
    if (savedTimeout) {
      setLockTimeout(parseInt(savedTimeout));
    }
  }, []);

  const hashPassword = async (pwd: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSetup = async () => {
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    const hash = await hashPassword(password);
    localStorage.setItem(MASTER_PASSWORD_KEY, hash);
    localStorage.setItem(LOCK_TIMEOUT_KEY, lockTimeout.toString());
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

    setError('');
    onUnlock(password);
  };

  const handleUnlock = async () => {
    const savedHash = localStorage.getItem(MASTER_PASSWORD_KEY);
    const hash = await hashPassword(password);

    if (hash === savedHash) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      setError('');
      onUnlock(password);
    } else {
      setError('Неверный пароль');
      setPassword('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isSetup) {
        handleSetup();
      } else {
        handleUnlock();
      }
    }
  };

  if (!isLocked) return null;

  return (
    <div className="lock-screen">
      <div className="lock-container">
        <div className="lock-icon">🔒</div>
        <h2>{isSetup ? 'Настройка защиты' : 'Приложение заблокировано'}</h2>

        {isSetup ? (
          <>
            <p className="lock-description">
              Установите мастер-пароль для защиты ваших данных
            </p>

            <div className="lock-form">
              <input
                type="password"
                placeholder="Введите пароль (минимум 6 символов)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />

              <input
                type="password"
                placeholder="Подтвердите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
              />

              <div className="timeout-setting">
                <label>Автоблокировка через неактивность:</label>
                <select
                  value={lockTimeout}
                  onChange={(e) => setLockTimeout(parseInt(e.target.value))}
                >
                  <option value="1">1 минута</option>
                  <option value="5">5 минут</option>
                  <option value="10">10 минут</option>
                  <option value="30">30 минут</option>
                  <option value="60">1 час</option>
                  <option value="0">Никогда</option>
                </select>
              </div>

              {error && <div className="lock-error">{error}</div>}

              <button onClick={handleSetup} className="unlock-btn">
                Установить пароль
              </button>

              <button
                onClick={() => {
                  localStorage.setItem(MASTER_PASSWORD_KEY, 'disabled');
                  onUnlock('');
                }}
                className="skip-btn"
              >
                Пропустить (не рекомендуется)
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="lock-description">
              Введите мастер-пароль для разблокировки
            </p>

            <div className="lock-form">
              <input
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />

              {error && <div className="lock-error">{error}</div>}

              <button onClick={handleUnlock} className="unlock-btn">
                Разблокировать
              </button>
            </div>
          </>
        )}

        <div className="lock-footer">
          <small>SferaLLM v2.0</small>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;

export const checkAutoLock = (): boolean => {
  const savedHash = localStorage.getItem(MASTER_PASSWORD_KEY);
  if (!savedHash || savedHash === 'disabled') return false;

  const timeout = parseInt(localStorage.getItem(LOCK_TIMEOUT_KEY) || '5');
  if (timeout === 0) return false;

  const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0');
  const now = Date.now();
  const elapsed = (now - lastActivity) / 1000 / 60; // минуты

  return elapsed >= timeout;
};

export const updateActivity = () => {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
};
