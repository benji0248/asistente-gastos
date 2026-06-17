import { Category } from "../../types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Props {
  onFilterChange: (category_id: string | undefined) => void
  filterSelected: string | undefined
  categories: Category[]
}

export const FilterExpenses = ({
  filterSelected,
  onFilterChange,
  categories,
}: Props) => {
  return (
    <Tabs
      value={filterSelected || "all"}
      onValueChange={(key) => onFilterChange(key)}
      className="w-full"
    >
      <TabsList className="h-auto flex-wrap justify-start">
        <TabsTrigger value="all">Todos</TabsTrigger>
        {categories.map((category) => (
          <TabsTrigger key={category.id} value={category.id}>
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
