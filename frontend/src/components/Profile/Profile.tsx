import useAuth from "../../hooks/useAuth"

import { useCallback, useEffect, useState } from "react"

import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"

import { Account, Category } from "../../types"

import { useLocation, useNavigate } from "react-router-dom"

import { isAborted, isAuthError } from "@/lib/apiErrors"

import CreateAccount from "./createAccount"

import CreateCategory from "../Expenses/CreateCategory"

import { ProfileAccounts } from "./profileAccounts"

import { SharedCashToggle } from "./SharedCashToggle"

import { CategoryPreferences } from "./CategoryPreferences"

import { balanceTotal } from "../../consts"
import useHousehold from "@/hooks/useHousehold"
import { Link } from "react-router-dom"
import { House } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { Separator } from "@/components/ui/separator"

import { PageHeader } from "../layout/PageHeader"

import { SectionLoader } from "../layout/SectionLoader"

import { Loader2 } from "lucide-react"
import { formatMoney } from "@/lib/formatMoney"



function Profile() {

  const { auth } = useAuth()
  const { isLinked, household } = useHousehold()

  const [accounts, setAccounts] = useState<Account[]>([])

  const [categories, setCategories] = useState<Category[]>([])

  const [accountsLoading, setAccountsLoading] = useState(true)

  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const axiosPrivate = useAxiosPrivate()

  const location = useLocation()

  const navigate = useNavigate()



  const loadAccounts = useCallback(async (signal?: AbortSignal) => {

    if (!auth?.id) return

    setAccountsLoading(true)

    try {

      const accountsRes = await axiosPrivate.get(`/${auth.id}/accounts`, { signal })

      setAccounts(accountsRes.data ?? [])

    } catch (err: unknown) {

      if (isAborted(err)) return

      if (isAuthError(err)) {

        navigate("/login", { state: { from: location }, replace: true })

      }

    } finally {

      setAccountsLoading(false)

    }

  }, [auth?.id, axiosPrivate, location, navigate])



  const loadCategories = useCallback(async (signal?: AbortSignal) => {

    if (!auth?.id) return

    setCategoriesLoading(true)

    try {

      const categoriesRes = await axiosPrivate.get(`/${auth.id}/categories`, { signal })

      const allCategories = categoriesRes.data ?? []
      setCategories(allCategories.filter((c: Category) => c.user_id === auth.id))

    } catch (err: unknown) {

      if (isAborted(err)) return

      if (isAuthError(err)) {

        navigate("/login", { state: { from: location }, replace: true })

      }

    } finally {

      setCategoriesLoading(false)

    }

  }, [auth?.id, axiosPrivate, location, navigate])



  useEffect(() => {

    if (!auth?.id) return



    const controller = new AbortController()



    void Promise.all([

      loadAccounts(controller.signal),

      loadCategories(controller.signal),

    ])



    return () => {

      controller.abort()

    }

  }, [auth?.id, loadAccounts, loadCategories])



  return (

    <div className="space-y-6 sm:space-y-10">

      <PageHeader

        title="Mi cuenta"

        description={auth?.email}

        action={

          <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm">

            @{auth?.user}

          </Badge>

        }

      />



      <Card className="border-border/40 shadow-soft">
        <CardContent className="flex flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <House className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">
                {isLinked && household ? household.name : "Hogar familiar"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isLinked
                  ? "Gestioná miembros e invitaciones desde Hogar"
                  : "Creá o uníte a un hogar para compartir finanzas"}
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-xl sm:w-auto" asChild>
            <Link to={`/${auth?.id}/hogar`}>Ir a Hogar</Link>
          </Button>
        </CardContent>
      </Card>



      <Card className="border-border/40 shadow-soft">

        <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6">

          <CardTitle className="text-sm font-medium text-muted-foreground font-sans">

            Balance total

          </CardTitle>

        </CardHeader>

        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">

          {accountsLoading ? (

            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />

          ) : (

            <p className="font-display text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">

              ${formatMoney(balanceTotal(accounts))}

            </p>

          )}

        </CardContent>

      </Card>



      <Separator className="opacity-50" />

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">

        <div className="space-y-4">

          <h2 className="font-display text-lg font-semibold">Cuentas</h2>

          <CreateAccount onAccountsChange={() => loadAccounts()} />

          <SharedCashToggle onChanged={() => loadAccounts()} />

          {accountsLoading ? (

            <SectionLoader />

          ) : (

            <ProfileAccounts

              accounts={accounts}

              onAccountsChange={() => loadAccounts()}

            />

          )}

        </div>

        <div className="space-y-4">

          <h2 className="font-display text-lg font-semibold">Categorías</h2>

          <CreateCategory onCreated={() => loadCategories()} />

          {categoriesLoading ? (

            <SectionLoader />

          ) : (

            <CategoryPreferences

              categories={categories}

              onChange={setCategories}

            />

          )}

        </div>

      </div>

    </div>

  )

}



export default Profile


