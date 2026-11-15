import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Projekt.css'
import logo from '../assets/IU Logo.png'
import { CheckCircleFilled, DesktopOutlined, PieChartOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Col, DatePicker, Empty, Flex, Form, Input, Layout, Menu, Modal, Progress, Row, Select, theme, Typography, Tabs, ConfigProvider, message } from 'antd'
import deDE from 'antd/locale/de_DE'
import dayjs from 'dayjs'
import 'dayjs/locale/de'

dayjs.locale('de')

const { Header, Content, Sider } = Layout
const { Title, Text } = Typography

const SEITENRAND = 24

const mainItems = [
    { key: '1', icon: <PieChartOutlined />, label: 'Projekte' },
    { key: '2', icon: <DesktopOutlined />, label: 'Benutzer' },
    { key: '3', icon: <DesktopOutlined />, label: 'Profil' },
]

const logoutItem = [
    { key: '4', icon: <DesktopOutlined />, label: 'Abmelden' },
]

const projektStatusOptionen = [
    { value: 'Aktiv', label: 'Aktiv' },
    { value: 'Archiviert', label: 'Archiviert' },
]

const formatiereRolle = (rolle) => {
    if (!rolle) return '';
    const text = typeof rolle === 'string' ? rolle : String(rolle);
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function MitarbeiterCheckboxGroup({ value, onChange, options }) {
    const { status } = Form.Item.useStatus()
    const { token } = theme.useToken()

    const hasError = status === 'error'

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: 16,
                maxHeight: 420,
                overflowY: 'auto',
                border: `1px solid ${hasError ? token.colorError : token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
                transition: 'border-color 0.2s',
            }}
        >
            <Checkbox.Group
                options={options}
                value={value}
                onChange={onChange}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }}
            />
        </div>
    )
}

function ProjektCard({ projekt, onClick }) {
    const prozent =
        projekt.aufgabenGesamt > 0
            ? Math.round((projekt.aufgabenErledigt / projekt.aufgabenGesamt) * 100)
            : 0

    const leiterAnzeige = projekt.benutzer?.benutzername || projekt.benutzer?.name || projekt.leiterName || 'Nicht zugewiesen';
    
    const startAnzeige = projekt.startDatum ? dayjs(projekt.startDatum).format('DD.MM.YYYY') : (projekt.start || '');
    const endAnzeige = projekt.endDatum ? dayjs(projekt.endDatum).format('DD.MM.YYYY') : (projekt.ende || '');

    return (
        <Card
            hoverable
            onClick={onClick}
            title={projekt.name}
            style={{ border: '1px solid var(--akzent)' }}
        >
            <p style={{ marginBottom: 12 }}>
                <Text type="secondary">Projektleiter: </Text>
                {leiterAnzeige}
            </p>
            <p style={{ marginBottom: 12 }}>
                <Text type="secondary">Auftraggeber: </Text>
                {projekt.auftraggeber}
            </p>
            <p style={{ marginBottom: 12 }}>
                <Text type="secondary">Zeitraum: </Text>
                {startAnzeige} bis {endAnzeige}
            </p>

            <Progress
                percent={prozent}
                strokeColor="var(--akzent)"
                format={(wert) =>
                    wert === 100 ? <CheckCircleFilled style={{ color: 'var(--akzent)' }} /> : `${wert}%`
                }
            />

            <Text type="secondary">
                Fortschritt: {projekt.aufgabenErledigt || 0} von {projekt.aufgabenGesamt || 0} Aufgaben erledigt
            </Text>
        </Card>
    )
}

function ProjektListe({ liste, onOeffnen }) {
    if (liste.length === 0) {
        return <Empty description="Keine Projekte vorhanden" />
    }

    return (
        <Row gutter={[16, 16]}>
            {liste.map((p) => (
                <Col key={p.id || p.projektId} xs={24} md={12} xl={8}>
                    <ProjektCard 
                        projekt={p} 
                        onClick={() => onOeffnen(p.id || p.projektId)} 
                    />
                </Col>
            ))}
        </Row>
    )
}

function Projekt() {
    const navigate = useNavigate()
    const [projekte, setProjekte] = useState([])
    const [benutzerListe, setBenutzerListe] = useState([])
    const [modalOffen, setModalOffen] = useState(false)
    const [form] = Form.useForm()

    // Rollenprüfung für Mitarbeiter und Administratoren
    const gespeicherteRolle = (localStorage.getItem('rolle') || '').trim().toUpperCase();
    const istMitarbeiter = !gespeicherteRolle || gespeicherteRolle === 'MITARBEITER';
    const istAdmin = gespeicherteRolle === 'ADMINISTRATOR';

    // Filtert den "Benutzer"-Menüpunkt (key: '2') auf dem Startbildschirm heraus, wenn der Nutzer kein Admin ist
    const filteredMainItems = mainItems.filter(item => {
        if (item.key === '2') {
            return istAdmin;
        }
        return true;
    });

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()

    useEffect(() => {
        const ladeDatenAusDb = async () => {
            try {
                if (!istMitarbeiter) {
                    const benutzerRes = await fetch('https://localhost:8443/api/benutzer/aktiv-liste', {
                        credentials: 'include'
                    });
                    if (benutzerRes.ok) {
                        const benutzerDaten = await benutzerRes.json();
                        setBenutzerListe(benutzerDaten);
                    }
                }

                const projektRes = await fetch('https://localhost:8443/api/projekte', {
                    credentials: 'include'
                });
                if (projektRes.ok) {
                    const projektDaten = await projektRes.json();
                    setProjekte(projektDaten);
                }
            } catch (error) {
                console.error('Fehler beim Laden:', error);
                message.error('Daten konnten nicht aus der Datenbank geladen werden.');
            }
        };

        ladeDatenAusDb();
    }, [istMitarbeiter]);

    const aktiveBenutzer = benutzerListe.filter((b) => b.aktiv === true || b.status === 'Aktiv');

    const leiterOptionen = aktiveBenutzer
        .filter((b) => {
            const r = (b.rolle || '').trim().toUpperCase();
            return r === 'PROJEKTLEITER';
        })
        .map((b) => ({ 
            value: Number(b.benutzerId || b.id), 
            label: `${b.benutzername || b.name} (${formatiereRolle(b.rolle)})` 
        }))

    const mitarbeiterOptionen = aktiveBenutzer.map((b) => ({
        value: Number(b.benutzerId || b.id),
        label: `${b.benutzername || b.name} (${formatiereRolle(b.rolle)})`,
    }))

    const handleMenuClick = async ({ key }) => {
	  if (key === '1') navigate('/projekt')
	  else if (key === '2') navigate('/benutzer')
	  else if (key === '3') navigate('/profil')
	  else if (key === '4') {
		try {
		  await fetch('https://localhost:8443/api/benutzer/logout', {
			method: 'POST',
			credentials: 'include',
		  })
		} finally {
			localStorage.removeItem('rolle')
			localStorage.removeItem('benutzerId')
			navigate('/login')
		}
	  }
	}

    const oeffneProjekt = (id) => {
        navigate(`/projekt/${id}`)
    }

    const oeffneNeuesProjektModal = () => {
        if (istMitarbeiter) {
            message.error('Zugriff verweigert.');
            return;
        }
        form.resetFields()
        setModalOffen(true)
    }

    const schliesseModal = () => {
        setModalOffen(false)
        form.resetFields()
    }

    const handleNeuesProjekt = async (werte) => {
        if (istMitarbeiter) {
            message.error('Zugriff verweigert.');
            return;
        }

        try {
            const mZuordnungen = werte.mitarbeiter 
                ? werte.mitarbeiter.map(bId => ({ 
                    benutzer: { 
                        benutzerId: Number(bId), 
                        id: Number(bId) 
                    } 
                })) 
                : [];

            const backendPayload = {
                name: werte.name,
                beschreibung: werte.beschreibung,
                auftraggeber: werte.auftraggeber,
                startDatum: werte.zeitraum[0].format('YYYY-MM-DD'),
                endDatum: werte.zeitraum[1].format('YYYY-MM-DD'),
                archiviert: werte.status === 'Archiviert' ? true : false,
                benutzer: werte.leiter ? { 
                    benutzerId: Number(werte.leiter), 
                    id: Number(werte.leiter) 
                } : null,
                mitarbeiterZuordnungen: mZuordnungen
            };

            const response = await fetch('https://localhost:8443/api/projekte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(backendPayload),
            });

            if (!response.ok) throw new Error('Fehler beim Speichern des Projekts');

            const neuesProjektAusDb = await response.json();
            setProjekte([neuesProjektAusDb, ...projekte]);
            schliesseModal();
            message.success('Projekt erfolgreich gespeichert!');
        } catch (error) {
            console.error('Fehler:', error);
            message.error('Projekt konnte nicht in der Datenbank gespeichert werden.');
        }
    }

    const tabItems = [
        {
            key: '1',
            label: 'Alle',
            children: <ProjektListe liste={projekte} onOeffnen={oeffneProjekt} />,
        },
        {
            key: '2',
            label: 'Aktiv',
            children: (
                <ProjektListe
                    liste={projekte.filter((p) => !p.archiviert && p.status !== 'Archiviert')}
                    onOeffnen={oeffneProjekt}
                />
            ),
        },
        {
            key: '3',
            label: 'Archiviert',
            children: (
                <ProjektListe
                    liste={projekte.filter((p) => p.archiviert || p.status === 'Archiviert')}
                    onOeffnen={oeffneProjekt}
                />
            ),
        },
    ]

    return (
        <ConfigProvider locale={deDE}>
            <div className="projekt-seite">
                <Layout style={{ minHeight: '100vh', width: '100%' }}>
                    <Sider width={400} theme="dark" className="projekt-sider">
                        <div className="projekt-sider-top">
                            <div className="projekt-logo-kopf">
                                <div className="logo-container">
                                    <img src={logo} alt="IU Logo" className="login-logo" />
                                </div>
                            </div>

                            <div className="projekt-titel-kopf">
                                <Title level={4} style={{ margin: 0, color: '#ffffff', textAlign: 'center' }}>
                                    Aufgabenmanagementsystem
                                </Title>
                            </div>

                            <Menu
                                defaultSelectedKeys={['1']}
                                mode="inline"
                                theme="dark"
                                items={filteredMainItems}
                                onClick={handleMenuClick}
                            />
                        </div>

                        <div className="projekt-menu-unten">
                            <Menu
                                mode="inline"
                                theme="dark"
                                items={logoutItem}
                                onClick={handleMenuClick}
                            />
                        </div>
                    </Sider>

                    <Layout>
                        <Header style={{ padding: '0 24px', background: colorBgContainer }} />
                        <Content style={{ margin: '0 16px' }}>
                            <Title level={2} style={{ margin: '16px 0', paddingLeft: SEITENRAND }}>
                                Projekte
                            </Title>
                            <div
                                style={{
                                    padding: SEITENRAND,
                                    minHeight: 360,
                                    background: colorBgContainer,
                                    borderRadius: borderRadiusLG,
                                }}
                            >
                                <Tabs
                                    defaultActiveKey="1"
                                    items={tabItems}
                                    tabBarExtraContent={
                                        !istMitarbeiter && (
                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<PlusOutlined />}
                                                onClick={oeffneNeuesProjektModal}
                                            >
                                                Neues Projekt
                                            </Button>
                                        )
                                    }
                                />
                            </div>
                        </Content>
                    </Layout>
                </Layout>

                {!istMitarbeiter && (
                    <Modal
                        title="Neues Projekt anlegen"
                        open={modalOffen}
                        onCancel={schliesseModal}
                        onOk={() => form.submit()}
                        okText="Projekt anlegen"
                        cancelText="Abbrechen"
                        width={960}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleNeuesProjekt}
                            autoComlete="off"
                        >
                            <Flex gap={32}>
                                <div style={{ flex: 1 }}>
                                    <Form.Item
                                        label="Projektname"
                                        name="name"
                                        rules={[{ required: true, message: 'Bitte einen Projektnamen eingeben.' }]}
                                    >
                                        <Input />
                                    </Form.Item>

                                    <Form.Item
                                        label="Beschreibung"
                                        name="beschreibung"
                                        rules={[{ required: true, message: 'Bitte eine Beschreibung eingeben.' }]}
                                    >
                                        <Input.TextArea rows={4} />
                                    </Form.Item>

                                    <Form.Item
                                        label="Auftraggeber"
                                        name="auftraggeber"
                                        rules={[{ required: true, message: 'Bitte einen Auftraggeber eingeben.' }]}
                                    >
                                        <Input />
                                    </Form.Item>

                                    <Form.Item
                                        label="Projektleiter"
                                        name="leiter"
                                        rules={[{ required: true, message: 'Bitte einen Projektleiter auswählen.' }]}
                                    >
                                        <Select options={leiterOptionen} placeholder="Projektleiter auswählen" />
                                    </Form.Item>

                                    <Form.Item
                                        label="Status"
                                        name="status"
                                        initialValue="Aktiv"
                                        rules={[{ required: true, message: 'Bitte einen Status wählen.' }]}
                                    >
                                        <Select options={projektStatusOptionen} />
                                    </Form.Item>

                                    <Form.Item
                                        label="Zeitraum"
                                        name="zeitraum"
                                        rules={[{ required: true, message: 'Bitte Start und Ende wählen.' }]}
                                    >
                                        <DatePicker.RangePicker
                                            format="DD.MM.YYYY"
                                            placeholder={['Start', 'Ende']}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <Form.Item 
                                        label="Mitarbeiter des Projekts" 
                                        name="mitarbeiter"
                                        rules={[{ required: true, message: 'Bitte mindestens einen Mitarbeiter wählen.'}]}
                                    >
                                        <MitarbeiterCheckboxGroup options={mitarbeiterOptionen} />
                                    </Form.Item>
                                </div>
                            </Flex>
                        </Form>
                    </Modal>
                )}
            </div>
        </ConfigProvider>
    )
}

export default Projekt