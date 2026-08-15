import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, Database, Info } from 'lucide-react';
import { DataSourceMetadata } from '../types/fiscal';

interface DataSourceBadgeProps {
  dataSource?: DataSourceMetadata;
  size?: 'xs' | 'sm' | 'md';
  showDetails?: boolean;
  className?: string;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  dataSource,
  size = 'sm',
  showDetails = false,
  className = '',
}) => {
  const meta: DataSourceMetadata = dataSource || {
    origin: 'DEMONSTRACAO',
    source: 'Motor Preditivo & Estimativa LOA',
    collectedAt: 'Base de Simulação Municipal',
    confidence: 'ESTIMATIVA_ALTA_CONFIANCA',
  };

  const isOficial = meta.origin === 'OFICIAL';

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span
        title={
          isOficial
            ? `Dado Oficial: ${meta.source} ${meta.collectedAt ? `• Coletado em ${meta.collectedAt}` : ''}`
            : `Dado de Demonstração / Estimativa: ${meta.source}`
        }
        className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded-md border transition-all select-none shadow-xs ${
          sizeClasses[size]
        } ${
          isOficial
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:bg-emerald-950/40 hover:bg-emerald-500/20'
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:bg-amber-950/40 hover:bg-amber-500/20'
        }`}
      >
        {isOficial ? (
          <ShieldCheck className={`${iconSizes[size]} text-emerald-600 dark:text-emerald-400 shrink-0`} />
        ) : (
          <AlertTriangle className={`${iconSizes[size]} text-amber-600 dark:text-amber-400 shrink-0`} />
        )}

        <span>{isOficial ? '[OFICIAL]' : '[DEMONSTRAÇÃO]'}</span>

        {showDetails && (
          <span className="opacity-80 font-normal normal-case border-l border-current/20 pl-1.5 truncate max-w-[200px]">
            {meta.source}
          </span>
        )}
      </span>
    </div>
  );
};

export default DataSourceBadge;
