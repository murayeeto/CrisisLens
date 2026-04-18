import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <section className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-6 py-16">
      <Panel className="max-w-[560px] p-8 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-400">◦ Signal lost</div>
        <h1 className="mt-4 font-display text-[42px] font-semibold tracking-snug text-white">This page slipped off the map.</h1>
        <p className="mt-4 text-base leading-7 text-text-secondary">
          The intelligence surface you asked for isn&apos;t routed here yet.
        </p>
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
            Return to globe
          </Button>
        </div>
      </Panel>
    </section>
  )
}
