import { Col, Row, Tab, Tabs } from "react-bootstrap";
import { Category } from "../../types";

interface Props {
    onFilterChange: (category_id: string | undefined) => void
    filterSelected: string | undefined
    categories: Category[]
}

export const FilterExpenses: React.FC<Props> = ({ filterSelected, onFilterChange, categories }) => {
    return (
        <Row>
            <Col className="customTabCol mb-4">
                <Tabs className="mt-4 customTabs" justify  defaultActiveKey="all" activeKey={filterSelected || "all"} onSelect={(key) => onFilterChange(key as any)} >
                    <Tab eventKey={"all"} key={"all"} title="Todos"></Tab>
                    {categories.map((category) => (
                        <Tab
                            eventKey={category.id}
                            key={category.id}
                            title={category.name}
                        ></Tab>
                    ))}
                </Tabs>
            </Col>
        </Row>
    )
}