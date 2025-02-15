'use client'
import { useTheme } from 'next-themes'
import { Button } from './ui/button'
import { Moon, Sun } from 'lucide-react'
export const ThemeChanger =() =>{
  const { theme, setTheme } = useTheme()

  return (
    <div className='flex flex-col justify-center items-center gap-4'>
      Escolha o modo de visualização:
      <div className='flex gap-4'>
      <Button onClick={() => setTheme('light')} className='bg-yellow-400 hover:bg-yellow-600'>Modo Claro <Sun></Sun></Button>
      <Button onClick={() => setTheme('dark')} className='bg-violet-600 hover:bg-violet-800'>Modo Escuro <Moon></Moon></Button>
      </div>
      <div className='flex gap-4 justify-center items-center'>
      {theme == 'dark'?"Modo Escuro":"Modo Claro"}
      <div className='min-h-[12px] rounded-full bg-green-300 min-w-[4px]'></div>
      </div>
    </div>
  )
}