
import { supabase } from "@/services/supabaseClient"
import React from "react"
function Provider({ children }) {
  const createNewUser = () => {
    supabase
  }
  return (
    <div>{children}</div>
  )
}

export default Provider
