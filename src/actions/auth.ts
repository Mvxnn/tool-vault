'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  
  const envPassword = process.env.PASSWORD
  
  // If no password is set in the environment, we allow any login in dev, or fail in prod
  if (!envPassword) {
    if (process.env.NODE_ENV === 'development') {
      const cookieStore = await cookies()
      cookieStore.set('auth-token', 'dev-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
      redirect('/')
    }
    return { error: 'Configuration serveur manquante (PASSWORD).' }
  }

  // The user requested 'Maxen' as the identifier
  if (username === 'Maxen' && password === envPassword) {
    const cookieStore = await cookies()
    // In a real app we'd use a JWT or proper session token. 
    // Here we use a simple static token since there is only one user.
    cookieStore.set('auth-token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
    
    redirect('/')
  }

  return { error: 'Identifiant ou mot de passe incorrect.' }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
  redirect('/login')
}
