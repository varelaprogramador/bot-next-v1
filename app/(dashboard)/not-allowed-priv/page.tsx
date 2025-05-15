"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'

import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"

export default function NotAllowedPage() {
  const router = useRouter()

  return (
    <div className="container  flex items-center justify-center min-h-[80vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="flex justify-center mb-4"
          >
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </motion.div>
          <CardTitle className="text-2xl font-bold">Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 pb-2">
          <p className="text-muted-foreground">
            Você não possui permissão para acessar esta página. Entre em contato com o administrador do sistema para
            solicitar acesso.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium">Possíveis razões:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-left">
              <li>Seu nível de acesso não é suficiente</li>
              <li>Sua conta precisa de verificação adicional</li>
              <li>Esta funcionalidade está temporariamente indisponível</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            variant="outline"
            className="w-full sm:w-auto flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button className="w-full sm:w-auto flex items-center gap-2" onClick={() => router.push("/dashboard")}>
            <Home className="h-4 w-4" />
            Ir para Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
