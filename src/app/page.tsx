"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect, useRef } from "react"

interface Message {
  content: string
  role: 'user' | 'assistant'
  sources?: string[]
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    setMessages(prev => [...prev, { content: input, role: 'user' }])
    setIsLoading(true)
    
    try {
      const response = await fetch('http://localhost:9000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch response')
      }

      const data = await response.json()
      
      // Extract sources from the response
      const sourcesMatch = data.response.match(/Sources: (.*)$/)
      let content = data.response
      let sources: string[] = []
      
      if (sourcesMatch) {
        content = data.response.slice(0, sourcesMatch.index).trim()
        sources = sourcesMatch[1].split(', ').map((source: string) => source.trim())
      }
      
      // Add bot response with sources
      setMessages(prev => [...prev, { 
        content,
        role: 'assistant',
        sources
      }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { 
        content: "Sorry, there was an error processing your request.", 
        role: 'assistant' 
      }])
    } finally {
      setIsLoading(false)
      setInput('')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className="flex flex-col">
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {message.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.match(/\((.*?)\)/)?.[1]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-500 hover:underline"
                        >
                          {source}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg px-4 py-2 bg-gray-100">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
