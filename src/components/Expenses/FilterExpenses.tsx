import { Tab, Tabs } from "react-bootstrap";
import { FILTERS_BUTTONS } from "../../consts";
import { FilterValue } from "../../types";

interface Props {
    onFilterChange: (filter: FilterValue) => void
    filterSelected: FilterValue
}

export const FilterExpenses: React.FC<Props> = ({ filterSelected, onFilterChange }) => {
    return (
        <Tabs justify activeKey={filterSelected} onSelect={(key) => onFilterChange(key as FilterValue)} >
            {
                Object.entries(FILTERS_BUTTONS).map(([key, { literal }]) => {
                    
                    return (
                        <Tab eventKey={key} key={key} title={literal} >
                            
                        </Tab>
                    )
                })
            }
        </Tabs>
    )
}