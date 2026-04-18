import { motion } from 'framer-motion'
import { LoginForm } from '../components/auth/LoginForm'

export const LoginPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">CrisisLens</h1>
          <p className="text-white/60">Real-time global crisis intelligence</p>
        </div>
        <LoginForm />
      </div>
    </motion.div>
  )
}
