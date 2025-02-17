"use client";
import { Input } from "@/app/components/ui/input";
import { DropUser } from "./_components/drop";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { MoveRight, Plus, Send, Trash } from "lucide-react";
import React, { useState, ChangeEvent, useEffect } from "react";
import Image from "next/image";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import GaleriaPopup from "@/app/components/popup-imagens";

export interface ButtonsProps {
  name: string;
  command: string;
  type: string;
}
interface usersProps {
  id: string;
  user_id: string;
  username: string;
  saldo: string;
  created_at: string;
}

export default function Trigger() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<usersProps[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(""); // Estado para armazenar a busca
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]); // Estado para armazenar os leads selecionados

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: users, error } = await supabase.from("users").select("*");

        if (error) {
          throw error;
        }

        setData(users || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]); // Supabase não precisa estar na dependência

  useEffect(() => {
    const subscription = supabase.channel("realtime:public:users").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "users",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as usersProps];
            case "UPDATE":
              return prevData.map((item) =>
                item.id === payload.new.id ? (payload.new as usersProps) : item
              );
            case "DELETE":
              return prevData.filter((item) => item.id !== payload.old.id);
            default:
              return prevData;
          }
        });
      }
    );

    subscription.subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const [getImage, setImage] = useState<string>("");
  const [getMessage, setMessage] = useState<string>("");
  const [getOpenBox, setOpenBox] = useState<boolean>(false);

  // Função para filtrar os usuários com base na busca
  const filteredData = data.filter(
    (user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()) // Filtra pelo nome de usuário
  );

  // Função para alternar a seleção de um lead
  const toggleLeadSelection = (userId: string) => {
    setSelectedLeads(
      (prevSelectedLeads) =>
        prevSelectedLeads.includes(userId)
          ? prevSelectedLeads.filter((id) => id !== userId) // Remove se já estiver selecionado
          : [...prevSelectedLeads, userId] // Adiciona se não estiver selecionado
    );
  };

  // Função para selecionar todos os leads
  const selectAllLeads = () => {
    const allUserIds = filteredData.map((user) => user.user_id);
    setSelectedLeads(allUserIds); // Adiciona todos os leads ao estado de selecionados
  };

  return (
    <div className="w-full min-h-screen flex flex-col gap-4 py-4">
      <h1 className="text-xl">Disparo</h1>

      <div className="grid grid-cols-2 gap-8">
        <div className="border min-h-[70vh] flex flex-col rounded-md">
          <div className="border">
            <div className="p-4 flex gap-4">
              <Input
                type="text"
                placeholder="Buscar usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} // Atualiza o estado de busca
              />
              <Button onClick={selectAllLeads}>
                Selecionar todos os leads
              </Button>
            </div>
          </div>
          {filteredData.map((item, index) => (
            <div
              className="flex gap-8 items-center p-4 border-b-[1px] hover:bg-gray-50"
              key={`user-${index}`}
              onClick={() => toggleLeadSelection(item.user_id)} // Alterna a seleção ao clicar na div
            >
              <input
                type="checkbox"
                checked={selectedLeads.includes(item.user_id)} // Marca o checkbox se o lead estiver selecionado
                onChange={() => toggleLeadSelection(item.user_id)} // Alterna a seleção do checkbox
              />
              <div className="flex flex-col w-full">
                <h2>{item.username}</h2>
                <p className="text-xs text-gray-400">id:{item.user_id}</p>
              </div>
              <DropUser />
            </div>
          ))}
        </div>

        <div className="border min-h-[70vh] flex flex-col rounded-md p-4 gap-4 relative">
          <div>
            <div className="flex justify-between">
              <p>Preview imagem:</p>
              <Button
                variant="destructive"
                onClick={() => setImage("")}
                className={`${getImage ? "visible" : "hidden"}`}
              >
                <Trash />
              </Button>
            </div>
            {getImage && (
              <Image
                src={getImage as string}
                alt="Preview"
                className="mt-2 max-w-full h-auto rounded-xl"
                width={500}
                height={300}
              />
            )}
          </div>

          <div>
            <p>Imagem :</p>
            <GaleriaPopup
              defaultValue=""
              sendData={(url) => {
                setImage(url);
              }}
              onClose={() => {}}
            ></GaleriaPopup>
          </div>

          <div>
            <p>Mensagem :</p>
            <Textarea
              placeholder="Digite a mensagem aqui ..."
              value={getMessage}
              className="min-h-[200px] max-h-[200px]"
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              if (selectedLeads.length > 0) {
                if (getMessage.length > 10) {
                  setOpenBox(true);
                } else {
                  alert(
                    "Por favor, sua mensagem de conter mais que 10 caracteres."
                  );
                }
              } else {
                // Caso não haja leads selecionados
                alert("Por favor, selecione pelo menos um lead.");
              }
            }}
          >
            Enviar Mensagem <Send />
          </Button>
        </div>
      </div>

      {getOpenBox && (
        <BoxConfirmation
          leadsData={selectedLeads}
          setOpenBox={setOpenBox}
          getImage={getImage}
          getMessage={getMessage}
        />
      )}
    </div>
  );
}

const BoxConfirmation = ({
  leadsData,
  setOpenBox,
  getImage,
  getMessage,
}: {
  leadsData: any;
  setOpenBox: React.Dispatch<React.SetStateAction<boolean>>;
  getImage: string;
  getMessage: any;
}) => {
  const [getButtons, setButtons] = useState<ButtonsProps[]>([]);
  const [newButtonName, setNewButtonName] = useState<string>("");
  const [newButtonCommand, setNewButtonCommand] = useState<string>("");
  const [buttonType, setButtonType] = useState<string>("link");
  const [getBoxButton, setBoxButton] = useState<Boolean>(false);
  const addButton = () => {
    console.log(newButtonName + "-" + newButtonCommand + "-" + buttonType);
    if (newButtonName && newButtonCommand && buttonType) {
      setButtons((prev) => [
        ...prev,
        {
          name: newButtonName,
          command: newButtonCommand,
          type: buttonType,
        },
      ]);
      setNewButtonName("");
      setNewButtonCommand("");
      setButtonType("link");
    }
  };

  const handleButtonTypeChange = (type: string) => {
    setButtonType(type);
  };

  const removeButton = (index: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== index));
  };
  const createDisparo = async (ids: string) => {
    for (const id of ids) {
      const response = await fetch("/api/webhooks/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: id, // Passando o ID do usuário atual da iteração
          message: getMessage, // Mensagem personalizada
          button: getButtons,
          image: getImage,
          disparo: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Mensagem enviada com sucesso:", data);
      } else {
        const error = await response.json();
        console.error("Erro ao enviar mensagem:", error);
      }
    }
  };
  const rotas = [{ key: "start - 0", value: "bemvindos-2", text: "/start" }];
  return (
    <div className="min-w-[100vw] min-h-screen fixed z-40 top-0 left-0">
      <div className="min-w-[100vw] min-h-screen bg-black opacity-40 fade-in-5 duration-300 fixed z-40 top-0 left-0" />
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div
          className={`bg-white p-4 z-50 w-[400px] min-h-[450px] rounded-xl shadow-lg flex flex-col ${
            getBoxButton ? "hidden" : "visible"
          }`}
        >
          <div className=" flex justify-between items-center">
            Etapa de confirmação:{" "}
            <Button
              onClick={() => {
                setOpenBox(false);
              }}
              variant={"destructive"}
              className=" self-end mb-2"
            >
              X
            </Button>
          </div>
          <div className="w-full h-auto bg-cover bg-[url('/bg-telegram.svg')] flex flex-col justify-start p-4 rounded-lg max-h-[80vh] overflow-y-auto">
            {/* Imagem ajustada */}
            {getImage && (
              <div className="w-full ">
                <Image
                  src={getImage as string}
                  alt="Preview"
                  className="rounded-xl  w-full h-auto"
                  width={0}
                  height={0}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                  }}
                />
              </div>
            )}

            {/* Mensagem */}
            <div className="bg-[#212121] p-3 rounded-lg rounded-bl-none shadow-sm mb-4">
              <p className="text-white text-base whitespace-pre-wrap">
                {getMessage}
              </p>
            </div>

            <div className="mt-[1px]">
              <div
                className={`grid gap-2
      ${getButtons.length === 2 ? "grid-cols-2" : ""}
      ${getButtons.length === 3 ? "grid-cols-1" : ""}
      ${getButtons.length === 4 ? "grid-cols-1 grid-rows-2" : ""}
      ${getButtons.length > 4 ? "grid-cols-1" : ""}
    `}
              >
                {getButtons.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Defina o que acontece quando o botão for clicado
                      console.log(button.command);
                    }}
                    className={` 
          ${getButtons.length === 4 && index === 0 ? "col-span-2" : ""}
          ${
            getButtons.length === 4 && (index === 1 || index === 2)
              ? "col-span-1 max-w-[165px] w-[165px]"
              : ""
          }
          ${getButtons.length === 4 && index === 3 ? "col-span-2" : ""}
          bg-[#0088cc] bg-opacity-60 text-white py-2 px-4 rounded-lg text-sm font-medium 
          hover:bg-[#006bb3] hover:shadow-lg transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-[#006bb3] focus:ring-opacity-50
        `}
                  >
                    {button.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-2"></div>
          Deseja adicionar botão a mensagem:
          <div className="mt-2 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={"sucess"}
                onClick={() => {
                  setBoxButton(true);
                }}
              >
                Sim
              </Button>
              <Button onClick={() => {}}>Não</Button>
            </div>
            <Button onClick={() => createDisparo(leadsData)}>
              Enviar Disparo
            </Button>
          </div>
        </div>
        {getBoxButton && (
          <div className="bg-white p-4 z-50 max-md:max-w-[450px] max-w-[550px] rounded-md">
            <div className="flex justify-between">
              <h1 className="font-semibold">Etapa de confirmação</h1>{" "}
              <Button
                onClick={() => setBoxButton(false)}
                variant={"destructive"}
              >
                X
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label>Nome do botão:</label>
                <Input
                  placeholder="Adquira agora !"
                  type="text"
                  value={newButtonName}
                  onChange={(e) => setNewButtonName(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <label>Tipo de botão:</label>
                <div className="flex gap-8 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="option-1"
                      checked={buttonType === "link"}
                      onCheckedChange={(e) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                        e ? setButtonType("link") : setButtonType("");
                      }}
                    />
                    <label
                      htmlFor="option-1"
                      className="text-sm font-medium leading-none"
                    >
                      Link
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="option-2"
                      checked={buttonType === "Rota do bot"}
                      onCheckedChange={(e) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                        e ? setButtonType("Rota do bot") : setButtonType("");
                      }}
                    />
                    <label
                      htmlFor="option-2"
                      className="text-sm font-medium leading-none"
                    >
                      Rota do bot
                    </label>
                  </div>
                </div>
              </div>
              {buttonType == "link" ? (
                <div>
                  <Input
                    type="text"
                    placeholder="https://example.com.br"
                    value={newButtonCommand}
                    onChange={(e) => setNewButtonCommand(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <Select onValueChange={setNewButtonCommand}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma rota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Rotas</SelectLabel>
                        {rotas.map((rota) => (
                          <SelectItem key={rota.key} value={rota.value}>
                            {rota.text}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex flex-col gap-4">
                <Button onClick={addButton}>
                  Adicionar Botão à Mensagem <Plus />
                </Button>
                <div className="w-full flex flex-wrap p-2 gap-4 bg-yellow-100 border rounded-md overflow-y-auto max-h-[150px] min-h-[100px]">
                  {getButtons.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 mt-2">
                      <Button
                        className=" pr-0"
                        onClick={() => console.log(item.command)}
                      >
                        {item.name} ({item.type}){" "}
                        <span
                          className="hover:bg-red-500 p-2 rounded-r-md"
                          onClick={() => removeButton(index)}
                        >
                          X
                        </span>
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setBoxButton(false)}>
                    Ver prévia <MoveRight></MoveRight>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
