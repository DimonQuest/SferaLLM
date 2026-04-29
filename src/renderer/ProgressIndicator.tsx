import React from 'react';
import './ProgressIndicator.css';

interface ProgressStep {
  step: string;
  data: any;
  timestamp: number;
}

interface ProgressIndicatorProps {
  mode: 'collaborative' | 'orchestrator';
  currentRound?: number;
  totalRounds?: number;
  steps?: ProgressStep[];
  isActive: boolean;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  mode,
  currentRound,
  totalRounds = 3,
  steps = [],
  isActive
}) => {
  if (!isActive) return null;

  const getStepLabel = (step: string, data: any) => {
    switch (step) {
      case 'planning':
        return `👑 ${data.orchestrator} создаёт план...`;
      case 'plan_created':
        return '✅ План создан';
      case 'tasks_assigned':
        return `📋 Назначено задач: ${data.tasks?.length || 0}`;
      case 'executing':
        return `⚙️ Выполняется задач: ${data.count}`;
      case 'tasks_completed':
        return '✅ Все задачи выполнены';
      case 'finalizing':
        return `👑 ${data.orchestrator} собирает результаты...`;
      default:
        return step;
    }
  };

  return (
    <div className="progress-indicator">
      {mode === 'collaborative' && (
        <div className="collaborative-progress">
          <div className="progress-header">
            <span className="progress-icon">🤝</span>
            <span className="progress-title">Совместная работа</span>
          </div>
          <div className="rounds-progress">
            {[1, 2, 3].map(round => (
              <div
                key={round}
                className={`round-step ${round < (currentRound || 0) ? 'completed' : ''} ${round === currentRound ? 'active' : ''}`}
              >
                <div className="round-number">{round}</div>
                <div className="round-label">
                  {round === 1 && 'Первичные ответы'}
                  {round === 2 && 'Анализ и критика'}
                  {round === 3 && 'Финальные выводы'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'orchestrator' && (
        <div className="orchestrator-progress">
          <div className="progress-header">
            <span className="progress-icon">👑</span>
            <span className="progress-title">Режим оркестратора</span>
          </div>
          <div className="steps-list">
            {steps.map((stepData, index) => (
              <div key={index} className="step-item">
                <div className="step-marker"></div>
                <div className="step-content">
                  <div className="step-label">{getStepLabel(stepData.step, stepData.data)}</div>
                  {stepData.step === 'plan_created' && stepData.data.plan && (
                    <div className="step-details">{stepData.data.plan.substring(0, 200)}...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
