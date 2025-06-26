"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'

import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"

export default function NotAllowedPrivPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      <Card className="max-w-md w-full shadow-2xl border-0 bg-white/90">
        <CardHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="flex justify-center mb-4"
          >
            <div className="rounded-full bg-yellow-100 p-5 shadow-lg">
              <AlertCircle className="h-14 w-14 text-yellow-500" />
            </div>
          </motion.div>
          <CardTitle className="text-3xl font-bold text-yellow-700">Acesso Privado Restrito</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 pb-2">
          <p className="text-muted-foreground text-lg">
            Você não possui permissão para acessar esta área privada.<br />
            Entre em contato com o administrador do sistema para solicitar acesso.
          </p>
          <div className="bg-yellow-50 rounded-lg p-4 text-sm border border-yellow-100">
            <p className="font-medium text-yellow-800">Possíveis razões:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-left text-yellow-900">
              <li>Seu nível de acesso não é suficiente</li>
              <li>Sua conta precisa de verificação adicional</li>
              <li>Esta funcionalidade está temporariamente indisponível</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center mt-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto flex items-center gap-2 text-base font-semibold"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
          <Button className="w-full sm:w-auto flex items-center gap-2 text-base font-semibold" onClick={() => router.push("/dashboard")}>
            <Home className="h-5 w-5" />
            Ir para Dashboard
          </Button>
        </CardFooter>
      </Card>
      <span className="mt-8 text-xs text-muted-foreground">© {new Date().getFullYear()} LERJ. Todos os direitos reservados.</span>
    </div>
  )
}
