"use client";

import { useState } from "react";

const TestarVerificacaoProduto = () => {
    const [nomeProduto, setNomeProduto] = useState("");
    const [resultado, setResultado] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    const testarVerificacao = async () => {
        if (!nomeProduto.trim()) {
            setErro("Por favor, insira o nome do produto");
            return;
        }

        setLoading(true);
        setErro("");
        setResultado(null);

        try {
            const response = await fetch("/api/webhooks/verificar-produto", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": "teste000645+65"
                },
                body: JSON.stringify({ nome_produto: nomeProduto })
            });

            const data = await response.json();
            setResultado(data);
        } catch (error) {
            setErro((error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Testar Verificação de Produto</h1>

            <div className="mb-8 bg-gray-100 p-6 rounded-lg">
                <div className="mb-4">
                    <label className="block mb-2 font-medium">Nome do Produto:</label>
                    <input
                        type="text"
                        value={nomeProduto}
                        onChange={(e) => setNomeProduto(e.target.value)}
                        placeholder="Digite o nome do produto"
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                {erro && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {erro}
                    </div>
                )}

                <button
                    onClick={testarVerificacao}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? "Verificando..." : "Verificar Disponibilidade"}
                </button>
            </div>

            {resultado && (
                <div className="bg-gray-100 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Resultado:</h2>

                    <div className="mb-4">
                        <div className="font-medium">Status:</div>
                        <div className={resultado.success ? "text-green-600" : "text-red-600"}>
                            {resultado.success ? "Sucesso" : "Falha"}
                        </div>
                    </div>

                    {resultado.disponivel && (
                        <div className="mb-4">
                            <div className="font-medium">Disponibilidade:</div>
                            <div className="text-green-600">Produto Disponível</div>
                        </div>
                    )}

                    {resultado.produto && (
                        <div className="bg-white p-4 rounded border">
                            <h3 className="font-bold mb-2">Informações do Produto:</h3>
                            <div className="mb-2">
                                <span className="font-medium">Nome:</span> {resultado.produto.nome}
                            </div>
                            <div className="mb-2">
                                <span className="font-medium">Descrição:</span> {resultado.produto.descricao}
                            </div>
                            <div className="mb-2">
                                <span className="font-medium">Valor:</span> {resultado.produto.valor.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                })}
                            </div>
                            <div className="mb-2">
                                <span className="font-medium">Categoria:</span> {resultado.produto.categoria}
                            </div>
                            <div className="mb-2">
                                <span className="font-medium">Quantidade Disponível:</span> {resultado.produto.quantidade_disponivel}
                            </div>
                        </div>
                    )}

                    {!resultado.success && resultado.message && (
                        <div className="mb-4">
                            <div className="font-medium">Mensagem:</div>
                            <div className="text-red-600">{resultado.message}</div>
                        </div>
                    )}

                    <div className="mt-4">
                        <details>
                            <summary className="cursor-pointer text-sm text-gray-600">Ver resposta completa</summary>
                            <pre className="mt-2 p-4 bg-gray-800 text-white rounded text-sm overflow-auto">
                                {JSON.stringify(resultado, null, 2)}
                            </pre>
                        </details>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestarVerificacaoProduto; 