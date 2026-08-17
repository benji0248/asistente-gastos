import { describe, expect, it } from "vitest"
import { ROLES } from "@/consts"
import { getDashboardNavItems } from "@/components/layout/dashboardNav"

describe("getDashboardNavItems", () => {
  it("includes admin link only for admins", () => {
    const userNav = getDashboardNavItems("abc", ROLES.user)
    const adminNav = getDashboardNavItems("abc", ROLES.admin)

    expect(userNav.some((item) => item.to === "/admin/users")).toBe(false)
    expect(adminNav.some((item) => item.to === "/admin/users")).toBe(true)
  })
})
