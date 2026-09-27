import { isAuthenticated, signOut } from "@/lib/actions/auth.action"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import React, { ReactNode } from 'react'

const RootLayout = async ({ children } : {children: ReactNode}) => {

  const isUserAuthenticated = await isAuthenticated();

  if(!isUserAuthenticated) redirect("/sign-in");

  return (
    <div className="root-layout">
      <nav className="dashboard-nav">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Logo" width={38} height={32} />
          <h2 className="text-primary-100 text-lg leading-tight sm:text-xl lg:text-2xl">
            Real Time AI Voice Agent Interview Platform
          </h2>
        </Link>

        <form action={signOut}>
          <button type="submit" className="btn-secondary min-h-9 px-5">
            Logout
          </button>
        </form>
      </nav>

      {children}
    </div>
  )
}

export default RootLayout
