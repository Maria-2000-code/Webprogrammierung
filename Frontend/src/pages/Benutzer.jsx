import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Benutzer.css'
import logo from '../assets/IU Logo.png'
import { DesktopOutlined, PieChartOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Card, Table, Layout, Menu, Typography, Modal, Form, Input, Select, ConfigProvider, Flex, Space, theme, message } from 'antd'
import deDE from 'antd/locale/de_DE'

const { Header, Content, Sider } = Layout
const { Title } = Typography

const SEITENRAND = 24

const mainItems = [
    { key: '1', icon: <PieChartOutlined />, label: 'Projekte' },
    { key: '2', icon: <DesktopOutlined />, label: 'Benutzer' },
    { key: '3', icon: <DesktopOutlined />, label: 'Profil' },
]

const logoutItem = [
    { key: '4', icon: <DesktopOutlined />, label: 'Abmelden' },
]

const rollenOptionen = [
    { value: 'ADMINISTRATOR', label: 'Administrator' },
    { value: 'PROJEKTLEITER', label: 'Projektleiter' },
    { value: 'MITARBEITER', label: 'Mitarbeiter' },
]

const statusOptionen = [
    { value: 'Aktiv', label: 'Aktiv' },
    { value: 'Nicht Aktiv', label: 'Nicht Aktiv' },
]

function Benutzer() {
    const navigate = useNavigate()
    const [benutzerListe, setBenutzerListe] = useState([])
    const [modalOffen, setModalOffen] = useState(false)
    const [bearbeiteterBenutzer, setBearbeiteterBenutzer] = useState(null)
    const [form] = Form.useForm()

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()

    const [filterRolle, setFilterRolle] = useState('Alle')
    const [filterStatus, setFilterStatus] = useState('Alle')

    useEffect(() => {
        const ladeBenutzerAusDb = async () => {
            try {
                // WICHTIG: credentials: 'include' sendet das Admin-Session-Cookie mit!
                const response = await fetch('https://localhost:8443/api/benutzer', {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (response.status === 403) {
                    message.error('Zugriff verweigert: Nur Administratoren dürfen die Benutzer verwalten.');
                    navigate('/projekt'); // Mitarbeiter zurück zur Projektseite schicken
                    return;
                }

                if (!response.ok) {
                    throw new Error('Fehler beim Laden der Benutzer');
                }
                const daten = await response.json();
                setBenutzerListe(daten);
            } catch (error) {
                console.error('Fehler:', error);
                message.error('Benutzer konnten nicht aus der Datenbank geladen werden.');
            }
        };

        ladeBenutzerAusDb();
    }, [navigate]);

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

    const oeffneNeuerBenutzerModal = () => {
        setBearbeiteterBenutzer(null)
        form.resetFields()
        form.setFieldsValue({
            rolle: undefined,
            status: 'Aktiv'
        })
        setModalOffen(true)
    }

    const oeffneBearbeitenModal = (benutzerItem) => {
        setBearbeiteterBenutzer(benutzerItem)

        form.setFieldsValue({
            benutzername: benutzerItem.benutzername,
            email: benutzerItem.email,
            rolle: benutzerItem.rolle, 
            status: benutzerItem.aktiv ? 'Aktiv' : 'Nicht Aktiv',
            passwort: '',
            passwortBestätigung: ''
        })
        setModalOffen(true)
    }

    const schliesseModal = () => {
        setModalOffen(false)
        setBearbeiteterBenutzer(null)
    }

    const handleBenutzerSpeichern = async (werte) => {
        try {
            let backendRolle = 'MITARBEITER';
            const gewählteRolle = (werte.rolle || '').trim().toUpperCase();
            
            if (gewählteRolle === 'ADMINISTRATOR') {
                backendRolle = 'ADMINISTRATOR';
            } else if (gewählteRolle === 'PROJEKTLEITER') {
                backendRolle = 'PROJEKTLEITER';
            } else if (gewählteRolle === 'MITARBEITER') {
                backendRolle = 'MITARBEITER';
            }

            const backendPayload = {
                benutzername: werte.benutzername,
                email: werte.email,
                aktiv: werte.status === 'Aktiv', 
                zweiFaktorAktiv: false,
                rolle: backendRolle
            };

            if (werte.passwort) {
                backendPayload.passwortHash = werte.passwort;
            } else if (bearbeiteterBenutzer) {
                backendPayload.passwortHash = bearbeiteterBenutzer.passwortHash;
            }

            if (bearbeiteterBenutzer) {
                const response = await fetch(`https://localhost:8443/api/benutzer/${bearbeiteterBenutzer.benutzerId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(backendPayload),
                });
                if (!response.ok) throw new Error('Fehler beim Aktualisieren');
                
                const aktualisierterBenutzer = await response.json();
                setBenutzerListe(
                    benutzerListe.map((b) =>
                        b.benutzerId === bearbeiteterBenutzer.benutzerId ? aktualisierterBenutzer : b
                    )
                );
            } else {
                backendPayload.passwortHash = werte.passwort;

                const response = await fetch('https://localhost:8443/api/benutzer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(backendPayload), 
                });

                if (!response.ok) {
                    throw new Error('Fehler beim Speichern im Backend');
                }

                const neuerBenutzerAusDb = await response.json();
                setBenutzerListe([neuerBenutzerAusDb, ...benutzerListe]);
            }
            
            schliesseModal();
            message.success('Benutzer erfolgreich gespeichert!');
        } catch (error) {
            console.error('Fehler:', error);
            message.error('Der Benutzer konnte nicht gespeichert werden.');
        }
    }

    const gefilterteBenutzer = benutzerListe.filter((b) => {
        const passtRolle = filterRolle === 'Alle' || b.rolle === filterRolle
        const statusAlsText = b.aktiv ? 'Aktiv' : 'Nicht Aktiv'
        const passtStatus = filterStatus === 'Alle' || statusAlsText === filterStatus
        return passtRolle && passtStatus
    })

    const columns = [
        {
            title: 'ID',
            dataIndex: 'benutzerId',
            key: 'benutzerId',
        },
        {
            title: 'Benutzername',
            dataIndex: 'benutzername',
            key: 'benutzername',
        },
        {
            title: 'E-Mail-Adresse',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Rolle',
            dataIndex: 'rolle',
            key: 'rolle',
            render: (rolle) => {
                if (rolle === 'ADMINISTRATOR') return 'Administrator';
                if (rolle === 'PROJEKTLEITER') return 'Projektleiter';
                if (rolle === 'MITARBEITER') return 'Mitarbeiter';
                return rolle;
            }
        },
        {
            title: 'Status',
            dataIndex: 'aktiv',
            key: 'aktiv',
            render: (aktiv) => (aktiv ? 'Aktiv' : 'Nicht Aktiv'),
        },
        {
            title: 'Aktionen',
            key: 'aktionen',
            width: 100,
            align: 'center',
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<EditOutlined style={{ color: 'var(--akzent)' }} />}
                    onClick={() => oeffneBearbeitenModal(record)}
                />
            ),
        },
    ]
    
    const formStartwerte = bearbeiteterBenutzer
    ? {
        benutzername: bearbeiteterBenutzer.benutzername,
        email: bearbeiteterBenutzer.email,
        rolle: bearbeiteterBenutzer.rolle,
        status: bearbeiteterBenutzer.aktiv ? 'Aktiv' : 'Nicht Aktiv',
      }
    : { status: 'Aktiv' }
    
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
                                defaultSelectedKeys={['2']}
                                mode="inline"
                                theme="dark"
                                items={mainItems}
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
                                Benutzer
                            </Title>
                            <div
                                style={{
                                    padding: SEITENRAND,
                                    minHeight: 360,
                                    background: colorBgContainer,
                                    borderRadius: borderRadiusLG,
                                }}
                            >
                                <Card style={{ border: '1px solid var(--akzent)' }}>
                                    <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                                        <Space size="middle">
                                            <span>Rolle:</span>
                                            <Select
                                                value={filterRolle}
                                                onChange={setFilterRolle}
                                                style={{ width: 160 }}
                                                options={[
                                                    { value: 'Alle', label: 'Alle Rollen' },
                                                    ...rollenOptionen,
                                                ]}
                                            />
                                            <span>Status:</span>
                                            <Select
                                                value={filterStatus}
                                                onChange={setFilterStatus}
                                                style={{ width: 160 }}
                                                options={[
                                                    { value: 'Alle', label: 'Alle Status' },
                                                    ...statusOptionen,
                                                ]}
                                            />
                                        </Space>

                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<PlusOutlined />}
                                            onClick={oeffneNeuerBenutzerModal}
                                        >
                                            Neuer Benutzer
                                        </Button>
                                    </Flex>

                                    <Table
                                        columns={columns}
                                        dataSource={gefilterteBenutzer}
                                        rowKey="benutzerId"
                                        pagination={{ pageSize: 10 }}
                                        size="small"
                                    />
                                </Card>
                            </div>
                        </Content>
                    </Layout>
                </Layout>

                <Modal
                    title={bearbeiteterBenutzer ? 'Benutzer bearbeiten' : 'Neuen Benutzer anlegen'}
                    open={modalOffen}
                    onCancel={schliesseModal}
                    onOk={() => form.submit()}
                    okText={bearbeiteterBenutzer ? 'Speichern' : 'Benutzer anlegen'}
                    cancelText="Abbrechen"
                    width={480}
                    destroyOnClose
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleBenutzerSpeichern}
                        autoComplete="off"
                        preserve={false}
                        initialValues={formStartwerte}
                    >
                        <Form.Item
                            label="Benutzername"
                            name="benutzername"
                            rules={[{ required: true, message: 'Bitte einen Namen eingeben.' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="E-Mail-Adresse"
                            name="email"
                            rules={[
                                { required: true, message: 'Bitte eine E-Mail-Adresse eingeben.' },
                                { type: 'email', message: 'Bitte eine gültige E-Mail-Adresse eingeben.' },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                        
                        <Form.Item
                            label="Passwort"
                            name="passwort"
                            rules={[
                                { required: !bearbeiteterBenutzer, message: 'Bitte ein Passwort eingeben.' },
                                { min: 5, message: 'Das Passwort muss mindestens 5 Zeichen lang sein.' },
                                { pattern: /[A-Z]/, message: 'Mindestens ein Großbuchstabe erforderlich.' },
                                { pattern: /[a-z]/, message: 'Mindestens ein Kleinbuchstabe erforderlich.' },
                                { pattern: /[0-9]/, message: 'Mindestens eine Zahl erforderlich.' },
                                { pattern: /[^A-Za-z0-9]/, message: 'Mindestens ein Sonderzeichen erforderlich.' },
                            ]}
                        >
                            <Input.Password 
                                autoComplete="new-password" 
                                placeholder={bearbeiteterBenutzer ? "Leer lassen, wenn unverändert..." : "Passwort eingeben"} 
                            />
                        </Form.Item>
                        
                        <Form.Item
                            label="Passwort wiederholen"
                            name="passwortBestätigung"
                            rules={[
                                { required: !bearbeiteterBenutzer, message: 'Bitte das Passwort wiederholen.' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value && !getFieldValue('passwort')) {
                                            return Promise.resolve();
                                        }
                                        if (getFieldValue('passwort') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Die Passwörter stimmen nicht überein.'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password 
                                autoComplete="new-password" 
                                placeholder={bearbeiteterBenutzer ? "Leer lassen, wenn unverändert..." : "Passwort wiederholen"} 
                            />
                        </Form.Item>
                        
                        <Form.Item
                            label="Rolle"
                            name="rolle"
                            rules={[{ required: true, message: 'Bitte eine Rolle auswählen.' }]}
                        >
                            <Select 
                                placeholder="Bitte Rolle auswählen..." 
                                options={rollenOptionen} 
                            />
                        </Form.Item>

                        <Form.Item
                            label="Status"
                            name="status"
                            initialValue="Aktiv"
                            rules={[{ required: true, message: 'Bitte einen Status auswählen.' }]}
                        >
                            <Select options={statusOptionen} />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </ConfigProvider>
    )
}

export default Benutzer