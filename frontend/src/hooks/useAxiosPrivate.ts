import { useEffect } from "react"
import { axiosPrivate } from "../api/axios"
import useAuth from "./useAuth"
import { supabase } from "@/lib/supabase"

export const useAxiosPrivate = () => {
    const { auth } = useAuth()

    useEffect(() => {
        const requestIntercept = axiosPrivate.interceptors.request.use(
            (config) => {
                if (!config.headers['Authorization'] && auth?.accessToken) {
                    config.headers['Authorization'] = `Bearer ${auth.accessToken}`
                }
                return config
            },
            (error) => Promise.reject(error)
        )

        const responseIntercept = axiosPrivate.interceptors.response.use(
            (response) => response,
            async (error) => {
                const prevRequest = error?.config
                if (error?.response?.status === 403 && !prevRequest?.sent) {
                    prevRequest.sent = true
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session?.access_token) {
                        prevRequest.headers['Authorization'] = `Bearer ${session.access_token}`
                        return axiosPrivate(prevRequest)
                    }
                }
                return Promise.reject(error)
            }
        )

        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept)
            axiosPrivate.interceptors.response.eject(responseIntercept)
        }
    }, [auth])

    return axiosPrivate
}
