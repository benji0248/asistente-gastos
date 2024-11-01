import {  Button, Card, CardBody, CardHeader, Col, Container, Row } from "react-bootstrap"
import useAuth from "../../hooks/useAuth";



const HomeNoLog = () => {
    const { auth } = useAuth();
    return (
        <Container>
            <Row>
                <Col>
                    <p className="fs-1 text-center fw-bold mt-5 mb-3">Bienvenido a Control de Gastos</p>
                    <p className="text-center fs-4">Toma control de tus gastos mensuales con esta app facil de usar</p>
                </Col>  
            </Row>
            <Row className="justify-content-center">
                <Col md={3} className="mt-4">
                    <Card>
                        <CardHeader className="fs-5 fw-bold text-center">Maneja tus gastos</CardHeader>
                        <CardBody>Ingresa en la app y categoriza tus gastos para tener una vista clara de tus habitos de gastos
                            asi puedes tener un mejor control y manejo de tus ingresos y tus gastos
                        </CardBody>
                    </Card>
                </Col>
                <Col md={3} className="mt-4">
                    <Card>
                        <CardHeader className="fs-5 fw-bold text-center">Define tus cuentas</CardHeader>
                        <CardBody>Establece tus fuentes de dinero, como efectivo, cuentas bancarias y billeteras virtuales. Para poder manejar
                            y visualizar todo tu dinero, para administrarlo mejor y poder visualizar el total
                        </CardBody>
                    </Card>
                </Col>
                <Col md={3} className="mt-4">
                    <Card>
                        <CardHeader className="fs-5 fw-bold text-center">Mira las estadisticas</CardHeader>
                        <CardBody>Puedes ver cuanto dinero y que gastos hiciste con diferencia de cada mes para poder tener un mejor
                            panorama a la hora de ver cuanto dinero gastas y en que
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <Row>
                <p className="text-center my-4 fs-4 fw-bold">Como funciona</p>
            </Row>
            <Row>
                <Col md={3}>
                    <p className="fs-1 fw-bold text-center">1</p>
                    <p className="text-center">Registrate gratis y crea tu cuenta</p>
                </Col>
                <Col md={3}>
                    <p className="fs-1 fw-bold text-center">2</p>
                    <p className="text-center">Ingresa los gastos que haces en el mes</p>
                </Col>
                <Col md={3}>
                    <p className="fs-1 fw-bold text-center">3</p>
                    <p className="text-center">Categoriza tus gastos y tus transacciones</p>
                </Col>
                <Col md={3}>
                    <p className="fs-1 fw-bold text-center">4</p>
                    <p className="text-center">Gana un analisis de tus gastos en el mes</p>
                </Col>
            </Row>
            <Row>
                <p className="text-center fs-3 fw-bold mt-4">Quieres empezar a tener control de como gastas tu dinero?</p>
                <p className="text-center fs-5">Unete, maneja y controla los gastos en el mes y nota la diferencia en la administracion de tu dinero</p>
            </Row>
            <Row className="justify-content-center my-4">
                <Col md={2}><Button href="/register" className="fs-5" variant="dark">Registrate Ahora</Button></Col>
            </Row>
        </Container>
    )
}

export default HomeNoLog;