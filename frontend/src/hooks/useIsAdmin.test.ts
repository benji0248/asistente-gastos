import { describe, expect, it } from "vitest"
import { roleLabel } from "@/hooks/useIsAdmin"
import { ROLES } from "@/consts"

describe("roleLabel", () => {
  it("maps known roles", () => {
    expect(roleLabel(ROLES.admin)).toBe("Admin")
    expect(roleLabel(ROLES.user)).toBe("Usuario")
  })
})
