"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Moon, Sun } from 'lucide-react'
import { useTheme } from "next-themes"

import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

const themes = [
  {
    id: "light",
    name: "Light",
    description: "Clean, bright interface with high contrast for daytime use.",
    icon: Sun,
    preview: "/placeholder.svg?key=g4b5z",
    colors: ["#ffffff", "#f8fafc", "#0ea5e9", "#0369a1"],
  },
  {
    id: "dark",
    name: "Dark",
    description: "Dark interface that reduces eye strain in low-light environments.",
    icon: Moon,
    preview: "/placeholder.svg?key=fxyq6",
    colors: ["#020617", "#1e293b", "#0ea5e9", "#38bdf8"],
  },
]

const colorSchemes = [
  {
    id: "blue",
    name: "Blue",
    colors: ["#0ea5e9", "#0369a1", "#0c4a6e", "#bae6fd"],
  },
  {
    id: "purple",
    name: "Purple",
    colors: ["#8b5cf6", "#6d28d9", "#4c1d95", "#ddd6fe"],
  },
  {
    id: "green",
    name: "Green",
    colors: ["#10b981", "#059669", "#065f46", "#a7f3d0"],
  },
  {
    id: "orange",
    name: "Orange",
    colors: ["#f97316", "#ea580c", "#9a3412", "#fed7aa"],
  },
]

export default function ThemePage() {
  const { theme, setTheme } = useTheme()
  const [selectedColorScheme, setSelectedColorScheme] = useState("blue")
  const { toast } = useToast()

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    toast({
      title: "Tema alterado",
      description: `O tema foi alterado para ${newTheme === "light" ? "claro" : "escuro"}.`,
    })
  }

  const handleColorSchemeChange = (scheme: string) => {
    setSelectedColorScheme(scheme)
    toast({
      title: "Esquema de cores alterado",
      description: `O esquema de cores foi alterado para ${scheme}.`,
    })
  }

  return (
    <div className="container max-w-5xl py-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Personalização do Tema</h1>
        <p className="text-muted-foreground">
          Personalize a aparência do seu dashboard escolhendo um tema e esquema de cores.
        </p>
      </div>

      <Tabs defaultValue="theme" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="theme">Tema</TabsTrigger>

        </TabsList>

        <TabsContent value="theme" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {themes.map((themeOption) => {
              const isActive = theme === themeOption.id
              const Icon = themeOption.icon

              return (
                <Card
                  key={themeOption.id}
                  className={`relative overflow-hidden transition-all ${isActive ? "ring-2 ring-primary" : "hover:border-primary/50"
                    }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {themeOption.name}
                      </CardTitle>
                      {isActive && <Check className="h-5 w-5 text-primary" />}
                    </div>
                    <CardDescription>{themeOption.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">

                  </CardContent>
                  <CardFooter>
                    <div className="flex gap-1.5">
                      {themeOption.colors.map((color, i) => (
                        <div
                          key={i}
                          className="h-5 w-5 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </CardFooter>
                  <button
                    className="absolute inset-0 w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => handleThemeChange(themeOption.id)}
                    aria-label={`Selecionar tema ${themeOption.name}`}
                  />
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {colorSchemes.map((scheme) => {
              const isActive = selectedColorScheme === scheme.id

              return (
                <Card
                  key={scheme.id}
                  className={`relative overflow-hidden transition-all ${isActive ? "ring-2 ring-primary" : "hover:border-primary/50"
                    }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{scheme.name}</CardTitle>
                      {isActive && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {scheme.colors.map((color, i) => (
                        <motion.div
                          key={i}
                          className="h-12 rounded-md border"
                          style={{ backgroundColor: color, flexGrow: 1 }}
                          whileHover={{ y: -5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        />
                      ))}
                    </div>
                  </CardContent>
                  <button
                    className="absolute inset-0 w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => handleColorSchemeChange(scheme.id)}
                    aria-label={`Selecionar esquema de cores ${scheme.name}`}
                  />
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Aplicar Alterações</CardTitle>
              <CardDescription>
                Aplique as alterações de tema e cores em todo o dashboard.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                onClick={() => {
                  toast({
                    title: "Alterações aplicadas",
                    description: "Suas preferências de tema foram salvas com sucesso.",
                  })
                }}
              >
                Salvar Preferências
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
