import { useEffect, useRef, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { MessageCircle, X, Maximize2 } from 'lucide-react'

import ChatbotPanel from '@/components/chatbot/ChatbotPanel'

import { Button } from '@/components/ui/Button'

import { cn } from '@/lib/utils'



const BUTTON_SIZE = 56

const PANEL_WIDTH = 384

const PANEL_HEIGHT = 500

const PANEL_GAP = 16



function getInitialPos() {

  if (typeof window === 'undefined') return { x: 0, y: 0 }

  return {

    x: window.innerWidth - 80,

    y: window.innerHeight - 80,

  }

}



export default function ChatbotFloat() {

  const navigate = useNavigate()

  const [open, setOpen] = useState(false)

  const [pos, setPos] = useState(getInitialPos)

  const [dragging, setDragging] = useState(false)

  const dragOffset = useRef({ x: 0, y: 0 })

  const didDrag = useRef(false)



  useEffect(() => {

    const onMouseMove = (e) => {

      if (!dragging) return

      didDrag.current = true

      setPos({

        x: Math.min(Math.max(0, e.clientX - dragOffset.current.x), window.innerWidth - BUTTON_SIZE),

        y: Math.min(Math.max(0, e.clientY - dragOffset.current.y), window.innerHeight - BUTTON_SIZE),

      })

    }



    const onMouseUp = () => setDragging(false)



    window.addEventListener('mousemove', onMouseMove)

    window.addEventListener('mouseup', onMouseUp)

    return () => {

      window.removeEventListener('mousemove', onMouseMove)

      window.removeEventListener('mouseup', onMouseUp)

    }

  }, [dragging])



  function startDrag(clientX, clientY) {

    setDragging(true)

    didDrag.current = false

    dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y }

  }



  function onMouseDown(e) {

    e.preventDefault()

    startDrag(e.clientX, e.clientY)

  }



  function onTouchStart(e) {

    const touch = e.touches[0]

    if (!touch) return

    startDrag(touch.clientX, touch.clientY)

  }



  function onTouchMove(e) {

    if (!dragging) return

    const touch = e.touches[0]

    if (!touch) return

    didDrag.current = true

    setPos({

      x: Math.min(Math.max(0, touch.clientX - dragOffset.current.x), window.innerWidth - BUTTON_SIZE),

      y: Math.min(Math.max(0, touch.clientY - dragOffset.current.y), window.innerHeight - BUTTON_SIZE),

    })

  }



  function onTouchEnd() {

    setDragging(false)

  }



  function handleClick() {

    if (didDrag.current) return

    setOpen((v) => !v)

  }



  const panelLeft = pos.x + BUTTON_SIZE - PANEL_WIDTH

  const panelTop = pos.y - PANEL_HEIGHT - PANEL_GAP



  return (

    <>

      {open && (

        <div

          className={cn(

            'fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl',

            'animate-fade-in-up',

          )}

          style={{

            left: panelLeft,

            top: panelTop,

            width: PANEL_WIDTH,

            height: PANEL_HEIGHT,

            opacity: 0,

          }}

        >

          <ChatbotPanel

            className="h-full rounded-2xl"

            compact

            showNewChat={false}

            headerExtra={(

              <>

                <Button

                  variant="ghost"

                  size="icon"

                  title="Expandir"

                  onClick={() => { setOpen(false); navigate('/chatbot') }}

                >

                  <Maximize2 size={15} />

                </Button>

                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>

                  <X size={15} />

                </Button>

              </>

            )}

          />

        </div>

      )}



      <div
        className="z-50"
        style={{ position: 'fixed', left: pos.x, top: pos.y, width: 56, height: 56 }}
      >
        <div
          className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"
          style={{ animationDuration: '2s' }}
        />
        <button
          type="button"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={handleClick}
          className={cn(
            'btn-gold-orbit glow-amber relative z-10 flex h-14 w-14 items-center justify-center text-white shadow-lg',
            dragging ? 'cursor-grabbing' : 'cursor-grab',
            open && 'is-open',
          )}
          aria-label="Asistente SmashIACodeR"
        >
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </button>
      </div>

    </>

  )

}


