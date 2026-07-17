import { describe, it, expect, afterEach } from "vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

afterEach(() => {
  cleanup()
})

describe("Select display with numeric DB ids", () => {
  it("shows the label when controlled value is a string and item value is a number", async () => {
    // Radix syncs via a hidden native <select>, so controlled values become strings
    // ("42") while Supabase SERIAL ids on SelectItem are numbers (42). Without
    // coercing both sides to string, SelectValue stays blank.
    render(
      <Select value="42" onValueChange={() => undefined}>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Elija una cuenta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={42}>Cuenta A</SelectItem>
          <SelectItem value={43}>Cuenta B</SelectItem>
        </SelectContent>
      </Select>
    )

    await waitFor(() => {
      expect(screen.getByTestId("trigger")).toHaveTextContent("Cuenta A")
    })
  })

  it("shows the label when both sides are numeric before stringification", async () => {
    render(
      <Select value={42} onValueChange={() => undefined}>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Elija una cuenta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={42}>Cuenta A</SelectItem>
        </SelectContent>
      </Select>
    )

    await waitFor(() => {
      expect(screen.getByTestId("trigger")).toHaveTextContent("Cuenta A")
    })
  })
})
