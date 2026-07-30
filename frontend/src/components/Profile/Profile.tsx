import useAuth from "../../hooks/useAuth"
import { useAppData } from "@/context/AppDataProvider"
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
import { PrivacyToggle } from "../layout/PrivacyToggle"
import { SectionLoader } from "../layout/SectionLoader"
import { Loader2 } from "lucide-react"
import { formatPrivateMoney } from "@/lib/formatMoney"
import { usePrivacyAmounts } from "@/context/PrivacyAmountsProvider"
import { useEffect } from "react"

function Profile() {
  const { auth } = useAuth()
  const { isLinked, household } = useHousehold()
  const {
    accounts,
    categories,
    loading,
    refreshAccounts,
    refreshCategories,
  } = useAppData()
  const { amountsVisible } = usePrivacyAmounts()

  useEffect(() => {
    if (!auth?.id) return
    void refreshAccounts()
  }, [auth?.id, refreshAccounts])

  return (
    <div className="space-y-6 sm:space-y-10">
      <PageHeader
        title="Mi cuenta"
        description={auth?.email}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm">
              @{auth?.user}
            </Badge>
            <PrivacyToggle />
          </div>
        }
        actionClassName="w-auto self-end"
      />

      {isLinked && household && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <House className="h-4 w-4" />
              Hogar: {household.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/${auth?.id}/hogar`}>Ver configuración del hogar</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">Fuentes de fondos</CardTitle>
          <CreateAccount onAccountsChange={refreshAccounts} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <SectionLoader minHeight="min-h-[120px]" />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Balance total:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatPrivateMoney(balanceTotal(accounts), amountsVisible)}
                </span>
              </p>
              <ProfileAccounts accounts={accounts} onAccountsChange={refreshAccounts} />
            </>
          )}
        </CardContent>
      </Card>

      {isLinked && <SharedCashToggle onChanged={refreshAccounts} />}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">Categorías</CardTitle>
          <CreateCategory onCreated={refreshCategories} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CategoryPreferences
              categories={categories}
              onChange={() => void refreshCategories()}
              isLinked={isLinked}
            />
          )}
        </CardContent>
      </Card>

      <Separator className="opacity-60" />
    </div>
  )
}

export default Profile
