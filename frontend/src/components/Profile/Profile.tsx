import useAuth from "../../hooks/useAuth"
import { useEffect, useState } from "react"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Account, Category } from "../../types"
import { useLocation, useNavigate } from "react-router-dom"
import CreateAccount from "./createAccount"
import CreateCategory from "../Expenses/CreateCategory"
import { ProfileAccounts } from "./profileAccounts"
import { balanceTotal } from "../../consts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

function Profile() {
  const { auth } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const axiosPrivate = useAxiosPrivate()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const getAccounts = async () => {
      try {
        const response = await axiosPrivate.get(`/${auth.id}/accounts`, {
          signal: controller.signal,
        })
        console.log(response.data)
        isMounted && setAccounts(response.data)
      } catch (err: unknown) {
        if ((err as { code?: string }).code === "ERR_CANCELED") {
          console.log("Aborted")
        } else {
          navigate("/login", { state: { from: location }, replace: true })
        }
      }
    }
    getAccounts()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const getCategories = async () => {
      try {
        const response = await axiosPrivate.get(`/${auth.id}/categories`, {
          signal: controller.signal,
        })
        console.log(response.data)
        isMounted && setCategories(response.data)
      } catch (err: unknown) {
        if ((err as { code?: string }).code === "ERR_CANCELED") {
          console.log("Aborted")
        } else {
          navigate("/login", { state: { from: location }, replace: true })
        }
      }
    }
    getCategories()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{auth.user}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold text-primary">
            Balance Total: ${balanceTotal(accounts)}
          </p>
        </CardContent>
      </Card>

      <CreateAccount />

      {accounts.map((account) => (
        <ProfileAccounts
          key={account.id}
          account={account}
          listOfAccounts={accounts}
        />
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Categoría de gastos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>
          <Separator />
          <CreateCategory />
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile
