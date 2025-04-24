"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { Trophy, TrendingUp, Target } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface MetaProgressProps {
  nivel: string
  valorAtual: number
  meta: number
  onMetaConcluida: () => void
}

export default function MetaProgress({ nivel, valorAtual, meta, onMetaConcluida }: MetaProgressProps) {
  const [progress, setProgress] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    const percentage = (valorAtual / meta) * 100
    setProgress(Math.min(percentage, 100))

    if (percentage >= 100 && !showCelebration) {
      setShowCelebration(true)
      setTimeout(() => {
        setShowCelebration(false)
        onMetaConcluida()
      }, 3000)
    }
  }, [valorAtual, meta, onMetaConcluida, showCelebration])

  return (
    <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-amber-500" />
            META DE VENDAS
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {nivel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <Target className="mr-2 h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Progresso atual</span>
          </div>
          <div className="text-sm font-medium">
            R$ {valorAtual.toFixed(2)} / R$ {meta.toFixed(2)}
          </div>
        </div>

        <div className="relative h-4">
          <Progress value={progress} className="h-4 progress-night" />
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, repeat: 5, repeatType: "reverse" }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <TrendingUp className="mr-1 h-4 w-4" />
            <span>{progress.toFixed(1)}% completo</span>
          </div>
          {progress >= 100 ? (
            <span className="text-green-500 font-medium">Meta atingida!</span>
          ) : (
            <span>Faltam R$ {(meta - valorAtual).toFixed(2)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
