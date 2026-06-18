import useAuth from "../../hooks/useAuth"

import { useCallback, useEffect, useState } from "react"

import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"

import { Account, Category } from "../../types"

import { useLocation, useNavigate } from "react-router-dom"

import { isAborted, isAuthError } from "@/lib/apiErrors"

import CreateAccount from "./createAccount"

import CreateCategory from "../Expenses/CreateCategory"

import { ProfileAccounts } from "./profileAccounts"

import { HouseholdSettings } from "./HouseholdSettings"

import { CategoryPreferences } from "./CategoryPreferences"

import { balanceTotal } from "../../consts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { Separator } from "@/components/ui/separator"

import { PageHeader } from "../layout/PageHeader"

import { SectionLoader } from "../layout/SectionLoader"

import { Loader2 } from "lucide-react"



function Profile() {

  const { auth } = useAuth()

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

      setCategories(categoriesRes.data ?? [])

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

    <div className="space-y-10">

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

        <CardHeader className="pb-2">

          <CardTitle className="text-sm font-medium text-muted-foreground font-sans">

            Balance total

          </CardTitle>

        </CardHeader>

        <CardContent>

          {accountsLoading ? (

            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />

          ) : (

            <p className="font-display text-4xl font-bold tracking-tight">

              ${balanceTotal(accounts)}

            </p>

          )}

        </CardContent>

      </Card>



      <Separator className="opacity-50" />



      <HouseholdSettings />



      <div className="grid gap-8 lg:grid-cols-2">

        <div className="space-y-4">

          <h2 className="font-display text-lg font-semibold">Cuentas</h2>

          <CreateAccount onAccountsChange={() => loadAccounts()} />

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


