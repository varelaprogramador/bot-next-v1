"use client";

import { useState } from "react";

const TestarDistribuicaoProduto = () => {
    const [nomeProduto, setNomeProduto] = useState("");
    const [tipo, setTipo] = useState("");
    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState("");
    const [resultado, setResultado] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    const testarDistribuicao = async () => {
        if (!nomeProduto.trim()) {
            setErro("Por favor, insira o nome do produto");
            return;
        }

        if (!nome.trim()) {
            setErro("Por favor, insira o nome do cliente");
            return;
        }

        if (!telefone.trim()) {
            setErro("Por favor, insira o telefone do cliente");
            return;
        }

        setLoading(true);
        setErro("");
        setResultado(null);

        try {
            const payload = {
                nome_produto: nomeProduto,
                ...(tipo && { tipo }),
                customer: {
                    name: nome,
                    phone: telefone,
                    correlationID: `test-${Date.now()}`
                }
            };

            const response = await fetch("/api/webhooks/distribuir-produto", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": "teste"
                },
                body: JSON.stringify(payload)
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
            <h1 className="text-2xl font-bold mb-6">Testar Distribuição de Produto</h1>

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

                <div className="mb-4">
                    <label className="block mb-2 font-medium">Tipo:</label>
                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    >
                        <option value="">Todos</option>
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Opcional: Filtrar por tipo de produto
                    </p>
                </div>

                <div className="mb-4">
                    <label className="block mb-2 font-medium">Nome do Cliente:</label>
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Digite o nome do cliente"
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                <div className="mb-4">
                    <label className="block mb-2 font-medium">Telefone:</label>
                    <input
                        type="text"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        placeholder="Digite o telefone do cliente"
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                {erro && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {erro}
                    </div>
                )}

                <button
                    onClick={testarDistribuicao}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? "Distribuindo..." : "Distribuir Produto"}
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

                    {resultado.success && (
                        <>
                            {resultado.produto && (
                                <div className="bg-white p-4 rounded border mb-4">
                                    <h3 className="font-bold mb-2">Informações do Produto:</h3>
                                    <div className="mb-2">
                                        <span className="font-medium">ID:</span> {resultado.produto.id}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-medium">Nome:</span> {resultado.produto.nome}
                                    </div>
                                </div>
                            )}

                            {resultado.codigo && (
                                <div className="bg-white p-4 rounded border mb-4">
                                    <h3 className="font-bold mb-2">Código Distribuído:</h3>
                                    <div className="mb-2">
                                        <span className="font-medium">ID:</span> {resultado.codigo.id}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-medium">Código:</span>
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-1">
                                            {resultado.codigo.codigo}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {resultado.cliente && (
                                <div className="bg-white p-4 rounded border">
                                    <h3 className="font-bold mb-2">Informações do Cliente:</h3>
                                    <div className="mb-2">
                                        <span className="font-medium">Nome:</span> {resultado.cliente.nome}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-medium">Telefone:</span> {resultado.cliente.telefone}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-medium">ID de Correlação:</span>
                                        <span className="text-xs text-gray-500 ml-1">{resultado.cliente.correlationID}</span>
                                    </div>
                                </div>
                            )}
                        </>
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

export default TestarDistribuicaoProduto; 