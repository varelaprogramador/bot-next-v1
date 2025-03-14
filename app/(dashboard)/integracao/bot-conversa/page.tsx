"use client"

import { useState } from "react"
import { Bot, Save, Link, Check, AlertCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Label } from "@/app/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert"
import { Switch } from "@/app/components/ui/switch"

export default function WebhookConfig() {
    const [webhookUrl, setWebhookUrl] = useState("")
    const [isActive, setIsActive] = useState(true)
    const [isSaved, setIsSaved] = useState(false)
    const [error, setError] = useState("")

    const handleSave = () => {
        if (!webhookUrl) {
            setError("Por favor, insira uma URL de webhook válida")
            setIsSaved(false)
            return
        }

        try {
            // Validate URL format
            new URL(webhookUrl)

            // Here you would typically save the webhook URL to your backend
            console.log("Saving webhook URL:", webhookUrl, "Active:", isActive)

            setIsSaved(true)
            setError("")

            // Reset the saved state after 3 seconds
            setTimeout(() => {
                setIsSaved(false)
            }, 3000)
        } catch (e) {
            setError("URL inválida. Por favor, insira uma URL completa (ex: https://exemplo.com/webhook)")
            setIsSaved(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8 space-y-4">
            <div className="bg-yellow-100 border rounded-md border-yellow-400 p-4 text-center text-yellow-600 font-semibold">
                EM MANUTENCAO!
            </div>
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-center mb-8">
                    <div className="bg-blue-600 text-white p-3 rounded-full mr-3">
                        <Bot size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-blue-600">Bot Conversa</h1>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl">Configuração de Webhook</CardTitle>
                        <CardDescription>Configure a URL do webhook para receber notificações do Bot Conversa</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {isSaved && (
                            <Alert className="bg-green-50 text-green-800 border-green-200">
                                <Check className="h-4 w-4" />
                                <AlertTitle>Sucesso</AlertTitle>
                                <AlertDescription>Configurações salvas com sucesso!</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="webhook-url">URL do Webhook</Label>
                            <div className="flex items-center space-x-2">
                                <Link className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                                <Input
                                    id="webhook-url"
                                    placeholder="https://exemplo.com/webhook"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Insira a URL completa onde o Bot Conversa enviará as notificações
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="webhook-active">Webhook Ativo</Label>
                                <p className="text-sm text-muted-foreground">Ative ou desative o envio de notificações</p>
                            </div>
                            <Switch id="webhook-active" checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
                            <Save className="mr-2 h-4 w-4" /> Salvar Configurações
                        </Button>
                    </CardFooter>
                </Card>


            </div>
        </div>
    )
}

