"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { Bot, Globe, Settings, CheckCircle, AlertCircle } from "lucide-react";

export default function TelegramWebhookPage() {
    const [token, setToken] = useState("");
    const [url, setUrl] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getWebhookInfo = async () => {
        if (!token) {
            setError("Por favor, insira o token do bot");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError("Erro ao buscar informações do webhook");
        } finally {
            setLoading(false);
        }
    };

    const setWebhook = async () => {
        if (!token || !url) {
            setError("Por favor, preencha todos os campos");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError("Erro ao configurar webhook");
        } finally {
            setLoading(false);
        }
    };

    const isSuccess = result?.ok === true;
    const hasWebhook = result?.result?.url;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Configuração do Telegram</h1>
                <p className="text-muted-foreground">
                    Configure o webhook do seu bot do Telegram para receber mensagens
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            Configuração do Webhook
                        </CardTitle>
                        <CardDescription>
                            Configure o token do bot e a URL do webhook para receber mensagens do Telegram
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="token">Token do Bot</Label>
                            <Input
                                id="token"
                                type="password"
                                placeholder="Ex: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                value={token}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
                                className="font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url">URL do Webhook</Label>
                            <Input
                                id="url"
                                type="url"
                                placeholder="Ex: https://api.lerjrecargas.com/webhooks/telegram"
                                value={url}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={getWebhookInfo}
                                disabled={loading}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                Ver Webhook Atual
                            </Button>
                            <Button
                                onClick={setWebhook}
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                <Globe className="h-4 w-4" />
                                {loading ? "Configurando..." : "Configurar Webhook"}
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {result && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {isSuccess ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                )}
                                Resultado da Operação
                            </CardTitle>
                            <CardDescription>
                                {isSuccess ? "Operação realizada com sucesso" : "Erro na operação"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {hasWebhook && (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Webhook Ativo</Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {result.result.url}
                                        </span>
                                    </div>
                                )}

                                <Separator />

                                <div className="bg-muted rounded-lg p-4">
                                    <pre className="text-sm overflow-x-auto">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
