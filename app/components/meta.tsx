import React, { useEffect } from "react";
import { Progress } from "./ui/progress";

interface MetaProgressProps {
  nivel: string;
  valorAtual: number;
  meta: number;
  onMetaConcluida: () => void;
}

const MetaProgress: React.FC<MetaProgressProps> = ({ nivel, valorAtual, meta, onMetaConcluida }) => {

  useEffect(() => {
    if (valorAtual >= meta) {
      onMetaConcluida();  // Chama a função quando a meta é alcançada
    }
  }, [valorAtual, meta, onMetaConcluida]);

  // Função para formatar os números no formato brasileiro
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold">
            {nivel}
          </div>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(valorAtual)} em vendas
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          <span>{formatCurrency(valorAtual)}</span>
          <span className="mx-1">/</span>
          <span>{formatCurrency(meta)}</span>
        </div>
      </div>
      <Progress value={(valorAtual * 100) / meta} className="h-2 progress-night" />
    </div>
  );
};

export default MetaProgress;
