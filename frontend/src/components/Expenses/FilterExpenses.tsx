import { Tab, Tabs } from "react-bootstrap";
import { Category, FilterValue } from "../../types";

interface Props {
    onFilterChange: (category_id: string | undefined) => void
    filterSelected: string | undefined
    categories: Category[]
}

export const FilterExpenses: React.FC<Props> = ({ filterSelected, onFilterChange, categories }) => {
    return (
        <Tabs justify activeKey={filterSelected || "all"} onSelect={(key) => onFilterChange(key as FilterValue)} >
            <Tab eventKey={"all"} key={"all"} title="Todos"></Tab>
            {categories.map((category) => (
                <Tab
                    eventKey={category.id}
                    key={category.id}
                    title={category.name}
                ></Tab>
            ))}
        </Tabs>
    )
}