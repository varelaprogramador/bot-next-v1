"use client";
import { Input } from "@/app/components/ui/input";
import { DropUser } from "./_components/drop";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Plus } from "lucide-react";
import React, { useState, ChangeEvent } from "react";
import Image from "next/image";
import { Checkbox } from "@/app/components/ui/checkbox";

interface ButtonsProps {
  name: string;
  command: string;
  type: string; // You might want to change this to an array if multiple types are allowed
}

export default function Trigger() {
  const [getImage, setImage] = useState<string | ArrayBuffer | null>(null);
  const [getMessage, setMessage] = useState<string>("");
  const [getButtons, setButtons] = useState<ButtonsProps[]>([]);
  const [newButtonName, setNewButtonName] = useState<string>("");
  const [newButtonCommand, setNewButtonCommand] = useState<string>("");
  const [buttonTypes, setButtonTypes] = useState<string[]>([]); // Use an array to store selected types

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addButton = () => {
    if (newButtonName && newButtonCommand && buttonTypes.length > 0) {
      setButtons([
        ...getButtons,
        {
          name: newButtonName,
          command: newButtonCommand,
          type: buttonTypes.join(", "), // Join types for display
        },
      ]);
      setNewButtonName("");
      setNewButtonCommand("");
      setButtonTypes([]);
    }
  };

  const toggleButtonType = (type: string) => {
    setButtonTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="w-full min-h-screen flex flex-col gap-4 py-4">
      <h1 className="text-xl">Disaparo</h1>
      <div className="grid grid-cols-2 gap-8">
        <div className="border min-h-[70vh] flex flex-col rounded-md">
          <div className="flex gap-8 items-center p-4 border-b-[1px]">
            <input type="checkbox" />
            <div className="flex flex-col w-full">
              <h2>Username</h2>
              <p className="text-xs text-gray-400">id:</p>
            </div>
            <DropUser />
          </div>
        </div>
        <div className="border min-h-[70vh] flex flex-col rounded-md p-4 gap-4 relative">
          <div>
            <p>Imagem :</p>
            <Input type="file" onChange={handleImageChange} />
          </div>
          <div>
            <p>Preview imagem:</p>
            {getImage && (
              <Image
                src={getImage as string}
                alt="Preview"
                className="mt-2 max-w-full h-auto"
                width={500}
                height={300}
              />
            )}
          </div>
          <div>
            <p>Mensagem :</p>
            <Textarea
              value={getMessage}
              className="min-h-[200px] max-h-[200px]"
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            <div>
              <label>Nome do botao:</label>
              <Input
                type="text"
                value={newButtonName}
                onChange={(e) => setNewButtonName(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label>Tipo de botao:</label>
              <div className="flex gap-8 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="option-1"
                    onChange={() => toggleButtonType("Link")}
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
                    onChange={() => toggleButtonType("Rota do bot")}
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

            <Button onClick={addButton}>
              Adicionar Botao a Mensagem <Plus />
            </Button>
            {getButtons.map((item, index) => (
              <div key={index} className="flex items-center gap-2 mt-2">
                <Button onClick={() => console.log(item.command)}>
                  {item.name} ({item.type})
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
