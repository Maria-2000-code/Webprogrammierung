import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profil.css'
import logo from '../assets/IU Logo.png'
import { DesktopOutlined, PieChartOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Layout, Menu, Typography, Modal, Form, Input, ConfigProvider, Space, Tag, QRCode, message, theme } from 'antd'
import deDE from 'antd/locale/de_DE'

const { Header, Content, Sider } = Layout
const { Title, Text } = Typography

const API = 'https://localhost:8443/api'
const SEITENRAND = 24
const KARTENSTIL = { border: '1px solid var(--akzent)' }

const mainItems = [
    { key: '1', icon: <PieChartOutlined />, label: 'Projekte' },
    { key: '2', icon: <DesktopOutlined />, label: 'Benutzer' },
    { key: '3', icon: <DesktopOutlined />, label: 'Profil' },
]

const logoutItem = [
    { key: '4', icon: <DesktopOutlined />, label: 'Abmelden' },
]

const formatiereRolle = (rolle) => {
    if (!rolle) return ''
    const klein = String(rolle).toLowerCase()
    return klein.charAt(0).toUpperCase() + klein.slice(1)
}

function Profil() {
    const navigate = useNavigate()
    const [benutzer, setBenutzer] = useState(null)
    const [messageApi, contextHolder] = message.useMessage()
    const [modalOffen, setModalOffen] = useState(false)
    const [setupDaten, setSetupDaten] = useState(null)
    const [laedt, setLaedt] = useState(false)
    const [form] = Form.useForm()

    // Rollenprüfung für den Menüfilter (Nur Admin sieht 'Benutzer')
    const gespeicherteRolle = (localStorage.getItem('rolle') || '').trim().toUpperCase()
    const istAdmin = gespeicherteRolle === 'ADMINISTRATOR'

    const gefilterteMainItems = mainItems.filter(item => {
        if (item.key === '2') {
            return istAdmin
        }
        return true
    })

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()

    // Daten des angemeldeten Benutzers laden
    useEffect(() => {
        const ladeBenutzer = async () => {
            try {
                const antwort = await fetch(`${API}/benutzer/me`, {
                    method: 'GET',
                    credentials: 'include',
                })
                if (antwort.status === 401) {
                    navigate('/login')
                    return
                }
                if (!antwort.ok) throw new Error()
                setBenutzer(await antwort.json())
            } catch {
                messageApi.error('Die Profildaten konnten nicht geladen werden.')
            }
        }

        ladeBenutzer()
    }, [navigate, messageApi])

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

    const startEinrichtung = async () => {
        setLaedt(true)
        try {
            const antwort = await fetch(`${API}/benutzer/me/2fa/setup`, {
                method: 'POST',
                credentials: 'include',
            })
            if (!antwort.ok) throw new Error()
            setSetupDaten(await antwort.json())
            form.resetFields()
            setModalOffen(true)
        } catch {
            messageApi.error('Die Einrichtung konnte nicht gestartet werden.')
        } finally {
            setLaedt(false)
        }
    }

    const bestaetigeCode = async ({ code }) => {
        setLaedt(true)
        try {
            const antwort = await fetch(`${API}/benutzer/me/2fa/aktivieren`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code }),
            })
            if (!antwort.ok) {
                form.setFields([{ name: 'code', errors: ['Der Code ist ungültig.'] }])
                return
            }
            setBenutzer({ ...benutzer, zweiFaktorAktiv: true })
            setModalOffen(false)
            setSetupDaten(null)
            messageApi.success('Zwei-Faktor-Authentifizierung wurde aktiviert.')
        } catch {
            messageApi.error('Keine Verbindung zum Server.')
        } finally {
            setLaedt(false)
        }
    }

    const deaktiviere = () => {
        Modal.confirm({
            title: 'Zwei-Faktor-Authentifizierung deaktivieren?',
            content: 'Die Anmeldung ist danach nur noch mit Benutzername und Passwort möglich.',
            okText: 'Deaktivieren',
            cancelText: 'Abbrechen',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    const antwort = await fetch(`${API}/benutzer/me/2fa/deaktivieren`, {
                        method: 'POST',
                        credentials: 'include',
                    })
                    if (!antwort.ok) throw new Error()
                    setBenutzer({ ...benutzer, zweiFaktorAktiv: false })
                    messageApi.success('Zwei-Faktor-Authentifizierung wurde deaktiviert.')
                } catch {
                    messageApi.error('Die Deaktivierung ist fehlgeschlagen.')
                }
            },
        })
    }

    const schliesseModal = () => {
        setModalOffen(false)
        setSetupDaten(null)
    }

    return (
        <ConfigProvider locale={deDE}>
            {contextHolder}
            <div className="profil-seite">
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
                                defaultSelectedKeys={['3']}
                                mode="inline"
                                theme="dark"
                                items={gefilterteMainItems}
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
                                Profil
                            </Title>
                            <div
                                style={{
                                    padding: SEITENRAND,
                                    minHeight: 360,
                                    background: colorBgContainer,
                                    borderRadius: borderRadiusLG,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 24,
                                }}
                            >
                                {!benutzer ? (
                                    <Card loading style={KARTENSTIL} />
                                ) : (
                                    <>
                                        <Card title="Konto" style={KARTENSTIL}>
                                            <Descriptions column={1} labelStyle={{ width: 180 }}>
                                                <Descriptions.Item label="Benutzername">{benutzer.benutzername}</Descriptions.Item>
                                                <Descriptions.Item label="E-Mail-Adresse">{benutzer.email}</Descriptions.Item>
                                                <Descriptions.Item label="Rolle">{formatiereRolle(benutzer.rolle)}</Descriptions.Item>
                                                <Descriptions.Item label="Status">{benutzer.aktiv ? 'Aktiv' : 'Nicht Aktiv'}</Descriptions.Item>
                                            </Descriptions>
                                        </Card>

                                        <Card
                                            title="Zwei-Faktor-Authentifizierung"
                                            style={KARTENSTIL}
                                            extra={
                                                benutzer.zweiFaktorAktiv
                                                    ? <Tag color="success">Aktiv</Tag>
                                                    : <Tag color="error">Nicht eingerichtet</Tag>
                                            }
                                        >
                                            <Space direction="vertical" size={16}>
                                                <Text>
                                                    Zusätzlich zum Passwort wird bei der Anmeldung ein Code aus einer
                                                    Authenticator-App (z.B. Microsoft Authenticator) abgefragt.
                                                </Text>
                                                {benutzer.zweiFaktorAktiv ? (
                                                    <Button danger onClick={deaktiviere}>
                                                        2FA deaktivieren
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="primary"
                                                        icon={<SafetyCertificateOutlined />}
                                                        loading={laedt}
                                                        onClick={startEinrichtung}
                                                    >
                                                        2FA einrichten
                                                    </Button>
                                                )}
                                            </Space>
                                        </Card>
                                    </>
                                )}
                            </div>
                        </Content>
                    </Layout>
                </Layout>

                <Modal
                    title="Zwei-Faktor-Authentifizierung einrichten"
                    open={modalOffen}
                    onCancel={schliesseModal}
                    okText="Bestätigen"
                    cancelText="Abbrechen"
                    confirmLoading={laedt}
                    onOk={() => form.submit()}
                    destroyOnClose
                >
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Text>1. Scanne den QR-Code mit deiner Authenticator-App.</Text>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {setupDaten && <QRCode value={setupDaten.otpauthUrl} />}
                        </div>
                        {setupDaten && (
                            <Text type="secondary">
                                Oder gib den Schlüssel manuell ein: <Text code copyable>{setupDaten.secret}</Text>
                            </Text>
                        )}
                        <Text>2. Gib den 6-stelligen Code aus der App ein.</Text>
                        <Form form={form} layout="vertical" onFinish={bestaetigeCode}>
                            <Form.Item
                                name="code"
                                label="Zwei-Faktor-Code"
                                rules={[
                                    { required: true, message: 'Bitte den Code eingeben.' },
                                    { pattern: /^\d{6}$/, message: 'Der Code besteht aus 6 Ziffern.' },
                                ]}
                            >
                                <Input maxLength={6} inputMode="numeric" />
                            </Form.Item>
                        </Form>
                    </Space>
                </Modal>
            </div>
        </ConfigProvider>
    )
}

export default Profil