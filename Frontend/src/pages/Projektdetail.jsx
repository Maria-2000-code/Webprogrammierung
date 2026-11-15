import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './ProjektDetail.css'
import logo from '../assets/IU Logo.png'
import { CheckCircleFilled, DesktopOutlined, EditOutlined, PieChartOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, DatePicker, Empty, Form, Input, Layout, Menu, Modal, Progress, Row, Select, Tabs, Tag, Typography, Checkbox, ConfigProvider, theme, message } from 'antd'
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

const aufgabenStatusOptionen = [
    { value: 'OFFEN', label: 'Offen' },
    { value: 'IN_BEARBEITUNG', label: 'In Bearbeitung' },
    { value: 'ERLEDIGT', label: 'Erledigt' },
]

const formatiereStatusAnzeige = (status) => {
    if (!status) return 'Offen'
    const s = status.toUpperCase()
    if (s === 'ERLEDIGT') return 'Erledigt'
    if (s === 'IN_BEARBEITUNG' || s === 'IN_ARBEIT') return 'In Bearbeitung'
    return 'Offen'
}

function MitarbeiterCheckboxGroup({ value, onChange, children }) {
    return (
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '12px 16px', background: '#ffffff', maxHeight: 300, overflowY: 'auto' }}>
            <Checkbox.Group
                value={value}
                onChange={onChange}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
                {children}
            </Checkbox.Group>
        </div>
    )
}

function AufgabeCard({ aufgabe, onBearbeiten }) {
    const bearbeiterName = aufgabe.benutzer?.benutzername || aufgabe.benutzer?.name || aufgabe.benutzer?.vorname || 'Nicht zugewiesen'
    const startAnzeige = aufgabe.startDatum ? dayjs(aufgabe.startDatum).format('DD.MM.YYYY') : ''
    const endAnzeige = aufgabe.endDatum ? dayjs(aufgabe.endDatum).format('DD.MM.YYYY') : ''

    return (
        <Card
            size="small"
            style={{ border: '1px solid var(--akzent)', height: '100%' }}
            extra={
                <Button
                    type="text"
                    icon={<EditOutlined style={{ color: 'var(--akzent)' }} />}
                    onClick={() => onBearbeiten(aufgabe)}
                />
            }
        >
            <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>{aufgabe.titel}</Title>
            <p style={{ marginBottom: 8 }}><Text type="secondary">Beschreibung: </Text>{aufgabe.beschreibung}</p>
            <p style={{ marginBottom: 8 }}><Text type="secondary">Bearbeiter: </Text>{bearbeiterName}</p>
            <p style={{ marginBottom: 8 }}><Text type="secondary">Zeitraum: </Text>{startAnzeige} bis {endAnzeige}</p>
            <p style={{ marginBottom: 0 }}>
                <Text type="secondary">Status: </Text>
                <Tag color="default">{formatiereStatusAnzeige(aufgabe.status)}</Tag>
            </p>
        </Card>
    )
}

function AufgabenListe({ liste, onBearbeiten }) {
    if (!liste || liste.length === 0) {
        return <Empty description="Keine Aufgaben vorhanden" style={{ margin: '32px 0' }} />
    }

    return (
        <Row gutter={[16, 16]}>
            {liste.map((a) => (
                <Col key={a.id || a.aufgabeId} xs={24} md={12}>
                    <AufgabeCard aufgabe={a} onBearbeiten={onBearbeiten} />
                </Col>
            ))}
        </Row>
    )
}

function ProjektDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [projekt, setProjekt] = useState(null)
    const [aufgaben, setAufgaben] = useState([])
    const [benutzerListe, setBenutzerListe] = useState([])

    const [projektModalOffen, setProjektModalOffen] = useState(false)
    const [aufgabeModalOffen, setAufgabeModalOffen] = useState(false)
    const [bearbeiteteAufgabe, setBearbeiteteAufgabe] = useState(null)
    const [nurMeineAufgaben, setNurMeineAufgaben] = useState(false)

    const [formProjekt] = Form.useForm()
    const [formAufgabe] = Form.useForm()

    const gespeicherteRolle = (localStorage.getItem('rolle') || '').trim().toUpperCase();
    const istMitarbeiter = !gespeicherteRolle || gespeicherteRolle === 'MITARBEITER';
    const istAdmin = gespeicherteRolle === 'ADMINISTRATOR';

    // Filtert den "Benutzer"-Menüpunkt (key: '2') heraus, wenn der Nutzer kein Admin ist
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
        const ladeDaten = async () => {
            if (!id) return;
            try {
                const projektRes = await fetch(`https://localhost:8443/api/projekte/${id}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (!projektRes.ok) throw new Error('Projekt nicht gefunden');
                const projektDaten = await projektRes.json();
                setProjekt(projektDaten);

                try {
                    const aktivRes = await fetch('https://localhost:8443/api/benutzer/aktiv-liste', {
                        method: 'GET',
                        credentials: 'include'
                    });
                    if (aktivRes.ok) {
                        const daten = await aktivRes.json();
                        if (daten && daten.length > 0) {
                            setBenutzerListe(daten);
                        }
                    }
                } catch (e) {
                    console.error('Fehler beim Laden der Benutzerliste:', e);
                }

                const aufgabenRes = await fetch('https://localhost:8443/api/aufgaben', {
                    method: 'GET',
                    credentials: 'include'
                });
                if (aufgabenRes.ok) {
                    const alleAufgaben = await aufgabenRes.json();
                    const projektAufgaben = alleAufgaben.filter(a => {
                        const pId = a.projekt?.projektId || a.projekt?.id || a.projektId;
                        return String(pId) === String(id);
                    });
                    setAufgaben(projektAufgaben);
                }

            } catch (error) {
                console.error('Fehler beim Laden:', error);
                message.error('Fehler beim Laden der Projektdetails.');
            }
        };

        ladeDaten();
    }, [id]);

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

    const oeffneProjektBearbeitenModal = () => {
        if (istMitarbeiter) return;
        const leiterId = projekt.benutzer?.benutzerId || projekt.benutzer?.id || projekt.leiterId;

        let zugewieseneMitarbeiterIds = [];
        const zuordnungen = projekt.mitarbeiterZuordnungen || projekt.mitarbeiter || projekt.benutzerZuordnungen;

        if (zuordnungen && Array.isArray(zuordnungen)) {
            zugewieseneMitarbeiterIds = zuordnungen.map(m => {
                if (typeof m === 'number') return m;
                if (typeof m === 'string') return Number(m);
                const bObj = m.benutzer || m.mitarbeiter || m;
                const bId = bObj.benutzerId || bObj.id || bObj.idBenutzer || m.benutzerId || m.id;
                return bId !== undefined && bId !== null ? Number(bId) : null;
            }).filter(id => id !== null && !isNaN(id));
        }

        formProjekt.setFieldsValue({
            name: projekt.name,
            beschreibung: projekt.beschreibung,
            auftraggeber: projekt.auftraggeber,
            leiter: leiterId ? Number(leiterId) : undefined,
            status: projekt.archiviert ? 'Archiviert' : 'Aktiv',
            mitarbeiterZuordnungen: zugewieseneMitarbeiterIds,
            zeitraum: [
                projekt.startDatum ? dayjs(projekt.startDatum) : null,
                projekt.endDatum ? dayjs(projekt.endDatum) : null
            ]
        });
        setProjektModalOffen(true);
    };

    const handleProjektAktualisieren = async (werte) => {
        try {
            const ausgewählteMitarbeiter = Array.isArray(werte.mitarbeiterZuordnungen)
                ? werte.mitarbeiterZuordnungen
                : (werte.mitarbeiterZuordnungen ? [werte.mitarbeiterZuordnungen] : []);

            const mZuordnungen = ausgewählteMitarbeiter.map(bId => ({
                benutzer: {
                    benutzerId: Number(bId),
                    id: Number(bId)
                },
                benutzerId: Number(bId)
            }));

            const payload = {
                id: Number(id),
                projektId: Number(id),
                name: werte.name,
                beschreibung: werte.beschreibung,
                auftraggeber: werte.auftraggeber,
                startDatum: werte.zeitraum && werte.zeitraum[0] ? werte.zeitraum[0].format('YYYY-MM-DD') : null,
                endDatum: werte.zeitraum && werte.zeitraum[1] ? werte.zeitraum[1].format('YYYY-MM-DD') : null,
                archiviert: werte.status === 'Archiviert',
                benutzer: werte.leiter ? { benutzerId: Number(werte.leiter), id: Number(werte.leiter) } : null,
                mitarbeiterZuordnungen: mZuordnungen
            };

            const response = await fetch(`https://localhost:8443/api/projekte/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Fehler beim Aktualisieren');
            }

            const aktualisiert = await response.json();
            setProjekt(aktualisiert);
            setProjektModalOffen(false);
            message.success('Projekt erfolgreich aktualisiert!');
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            message.error('Projekt konnte nicht aktualisiert werden: ' + error.message);
        }
    };

    const oeffneNeueAufgabeModal = () => {
        setBearbeiteteAufgabe(null);
        formAufgabe.resetFields();
        formAufgabe.setFieldsValue({ status: 'OFFEN' });
        setAufgabeModalOffen(true);
    };

    const oeffneAufgabeBearbeitenModal = (aufgabe) => {
        setBearbeiteteAufgabe(aufgabe);
        const zugewiesenerBenutzerId = aufgabe.benutzer?.benutzerId || aufgabe.benutzer?.id || aufgabe.benutzerId;

        formAufgabe.setFieldsValue({
            titel: aufgabe.titel,
            beschreibung: aufgabe.beschreibung,
            status: (aufgabe.status || 'OFFEN').toUpperCase(),
            bearbeiter: zugewiesenerBenutzerId ? Number(zugewiesenerBenutzerId) : undefined,
            zeitraum: [
                aufgabe.startDatum ? dayjs(aufgabe.startDatum) : null,
                aufgabe.endDatum ? dayjs(aufgabe.endDatum) : null
            ]
        });
        setAufgabeModalOffen(true);
    };

    const handleAufgabeSpeichern = async (werte) => {
        try {
            const aufgabenId = bearbeiteteAufgabe?.id || bearbeiteteAufgabe?.aufgabeId;

            const payload = {
                id: aufgabenId ? Number(aufgabenId) : null,
                aufgabeId: aufgabenId ? Number(aufgabenId) : null,
                titel: werte.titel,
                beschreibung: werte.beschreibung,
                status: werte.status ? werte.status.toUpperCase() : 'OFFEN',
                startDatum: werte.zeitraum && werte.zeitraum[0] ? werte.zeitraum[0].format('YYYY-MM-DD') : null,
                endDatum: werte.zeitraum && werte.zeitraum[1] ? werte.zeitraum[1].format('YYYY-MM-DD') : null,
                projekt: {
                    projektId: Number(id),
                    id: Number(id)
                },
                benutzer: werte.bearbeiter ? {
                    benutzerId: Number(werte.bearbeiter),
                    id: Number(werte.bearbeiter)
                } : null
            };

            const url = aufgabenId
                ? `https://localhost:8443/api/aufgaben/${aufgabenId}`
                : 'https://localhost:8443/api/aufgaben';
            const method = aufgabenId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Fehler beim Speichern der Aufgabe');
            }

            const gespeicherteAufgabe = await response.json();

            if (aufgabenId) {
                setAufgaben(aufgaben.map(a => {
                    const aId = a.id || a.aufgabeId;
                    const gId = gespeicherteAufgabe.id || gespeicherteAufgabe.aufgabeId;
                    return String(aId) === String(gId) ? gespeicherteAufgabe : a;
                }));
                message.success('Aufgabe erfolgreich aktualisiert!');
            } else {
                setAufgaben([gespeicherteAufgabe, ...aufgaben]);
                message.success('Aufgabe erfolgreich erstellt!');
            }

            setAufgabeModalOffen(false);
            setBearbeiteteAufgabe(null);
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            message.error('Aufgabe konnte nicht gespeichert werden.');
        }
    };

    if (!projekt) {
        return <div style={{ padding: 24 }}>Lade Projektdetails...</div>;
    }

    const leiterAnzeige = projekt.benutzer?.benutzername || projekt.benutzer?.name || projekt.benutzer?.vorname || 'Nicht zugewiesen';
    const startAnzeige = projekt.startDatum ? dayjs(projekt.startDatum).format('DD.MM.YYYY') : '';
    const endAnzeige = projekt.endDatum ? dayjs(projekt.endDatum).format('DD.MM.YYYY') : '';

    const gesamtAufgaben = aufgaben.length;
    const erledigteAufgaben = aufgaben.filter(a => (a.status || '').toUpperCase() === 'ERLEDIGT').length;
    const fortschrittProzent = gesamtAufgaben > 0 ? Math.round((erledigteAufgaben / gesamtAufgaben) * 100) : 0;

    const gefilterteAufgaben = aufgaben.filter(a => {
        if (nurMeineAufgaben) {
            const angemeldeteId = Number(localStorage.getItem('benutzerId'));
            const bId = a.benutzer?.benutzerId || a.benutzer?.id || a.benutzerId;
            return Number(bId) === angemeldeteId;
        }
        return true;
    });

    const tabItems = [
        {
            key: '1',
            label: `Alle (${gefilterteAufgaben.length})`,
            children: <AufgabenListe liste={gefilterteAufgaben} onBearbeiten={oeffneAufgabeBearbeitenModal} />,
        },
        {
            key: '2',
            label: `Offen (${gefilterteAufgaben.filter(a => (a.status || '').toUpperCase() === 'OFFEN').length})`,
            children: <AufgabenListe liste={gefilterteAufgaben.filter(a => (a.status || '').toUpperCase() === 'OFFEN')} onBearbeiten={oeffneAufgabeBearbeitenModal} />,
        },
        {
            key: '3',
            label: `In Bearbeitung (${gefilterteAufgaben.filter(a => (a.status || '').toUpperCase() === 'IN_BEARBEITUNG' || (a.status || '').toUpperCase() === 'IN_ARBEIT').length})`,
            children: <AufgabenListe liste={gefilterteAufgaben.filter(a => (a.status || '').toUpperCase() === 'IN_BEARBEITUNG' || (a.status || '').toUpperCase() === 'IN_ARBEIT')} onBearbeiten={oeffneAufgabeBearbeitenModal} />,
        },
        {
            key: '4',
            label: `Erledigt (${gefilterteAufgaben.filter(a => (a.status || '').toUpperCase() === 'ERLEDIGT').length})`,
            children: <AufgabenListe liste={gefilterteAufgaben.filter(a => (a.status || '').toUpperCase() === 'ERLEDIGT')} onBearbeiten={oeffneAufgabeBearbeitenModal} />,
        },
    ];

    const zugeordneteProjektMitarbeiter = (projekt.mitarbeiterZuordnungen || []).map(m => m.benutzer || m).filter(Boolean);
    const alleVerfügbarenBenutzer = benutzerListe.length > 0 ? benutzerListe : zugeordneteProjektMitarbeiter;

    const projektLeiterId = Number(projekt.benutzer?.benutzerId || projekt.benutzer?.id || projekt.leiterId)

    // IDs aller Projektbeteiligten: zugeordnete Mitarbeiter + Projektleiter
    const beteiligtenIds = new Set([
        ...zugeordneteProjektMitarbeiter.map(m => Number(m.benutzerId || m.id)),
        ...(projektLeiterId ? [projektLeiterId] : []),
    ])

    // Bisheriger Bearbeiter beim Bearbeiten behalten, falls er nicht mehr im Projekt ist
    const aktuellerBearbeiterId = Number(
        bearbeiteteAufgabe?.benutzer?.benutzerId || bearbeiteteAufgabe?.benutzer?.id || bearbeiteteAufgabe?.benutzerId
    )
    if (aktuellerBearbeiterId) beteiligtenIds.add(aktuellerBearbeiterId)

    const benutzerDropdownOptionen = (alleVerfügbarenBenutzer || [])
        .filter((b, index, self) => index === self.findIndex(t => Number(t.benutzerId || t.id) === Number(b.benutzerId || b.id)))
        .filter(b => beteiligtenIds.has(Number(b.benutzerId || b.id)))
        .map(b => {
            const id = Number(b.benutzerId || b.id)
            const name = b.benutzername || b.name || `Benutzer #${id}`
            const rolleRaw = (b.rolle || '').toLowerCase()
            const rolleFormatiert = rolleRaw ? ` (${rolleRaw.charAt(0).toUpperCase() + rolleRaw.slice(1)})` : ''
            return { value: id, label: `${name}${rolleFormatiert}` }
        })

    const projektleiterDropdownOptionen = (alleVerfügbarenBenutzer || [])
        .filter(b => {
            const rolle = (b.rolle || '').trim().toUpperCase()
            return rolle === 'PROJEKTLEITER'
        })
        .map(b => {
            const id = Number(b.benutzerId || b.id)
            const name = b.benutzername || b.name || `Benutzer #${id}`
            return { value: id, label: name }
        })

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
                                {projekt.name}
                            </Title>
                            <div
                                style={{
                                    padding: SEITENRAND,
                                    minHeight: 360,
                                    background: colorBgContainer,
                                    borderRadius: borderRadiusLG,
                                }}
                            >
                                <Row gutter={24}>
                                    <Col xs={24} lg={10}>
                                        <Card
                                            title="Projektdetails"
                                            style={{ border: '1px solid var(--akzent)', marginBottom: 24 }}
                                            extra={
                                                !istMitarbeiter && (
                                                    <Button
                                                        type="text"
                                                        icon={<EditOutlined style={{ color: 'var(--akzent)' }} />}
                                                        onClick={oeffneProjektBearbeitenModal}
                                                    />
                                                )
                                            }
                                        >
                                            <p style={{ marginBottom: 12 }}><Text type="secondary">Projektleiter: </Text>{leiterAnzeige}</p>
                                            <p style={{ marginBottom: 12 }}><Text type="secondary">Auftraggeber: </Text>{projekt.auftraggeber}</p>
                                            <p style={{ marginBottom: 12 }}><Text type="secondary">Zeitraum: </Text>{startAnzeige} bis {endAnzeige}</p>
                                            <p style={{ marginBottom: 0 }}><Text type="secondary">Status: </Text>{projekt.archiviert ? 'Archiviert' : 'Aktiv'}</p>
                                        </Card>

                                        <Card title="Fortschritt" style={{ border: '1px solid var(--akzent)' }}>
                                            <Progress
                                                percent={fortschrittProzent}
                                                strokeColor="var(--akzent)"
                                                format={(wert) => wert === 100 ? <CheckCircleFilled style={{ color: 'var(--akzent)' }} /> : `${wert}%`}
                                            />
                                            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                                {erledigteAufgaben} von {gesamtAufgaben} Aufgaben erledigt
                                            </Text>
                                        </Card>
                                    </Col>

                                    <Col xs={24} lg={14}>
                                        <Card
                                            title="Aufgaben des Projekts"
                                            style={{ border: '1px solid var(--akzent)' }}
                                            extra={
                                                <Button
                                                    type="primary"
                                                    icon={<PlusOutlined />}
                                                    onClick={oeffneNeueAufgabeModal}
                                                >
                                                    Neue Aufgabe
                                                </Button>
                                            }
                                        >
                                            <div style={{ marginBottom: 16 }}>
                                                <Checkbox
                                                    checked={nurMeineAufgaben}
                                                    onChange={(e) => setNurMeineAufgaben(e.target.checked)}
                                                >
                                                    Nur meine Aufgaben anzeigen
                                                </Checkbox>
                                            </div>

                                            <Tabs defaultActiveKey="1" items={tabItems} />
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        </Content>
                    </Layout>
                </Layout>

                {/* Modal zum Projekt bearbeiten */}
                {!istMitarbeiter && (
                    <Modal
                        title="Projekt bearbeiten"
                        open={projektModalOffen}
                        onCancel={() => setProjektModalOffen(false)}
                        onOk={() => formProjekt.submit()}
                        okText="Speichern"
                        cancelText="Abbrechen"
                        width={900}
                    >
                        <Form
                            form={formProjekt}
                            layout="vertical"
                            onFinish={handleProjektAktualisieren}
                            onFinishFailed={(errorInfo) => console.log('Formular-Validierungsfehler:', errorInfo)}
                        >
                            <Row gutter={24}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Projektname" name="name" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                    <Form.Item
                                        label="Beschreibung"
                                        name="beschreibung"
                                        rules={[{ required: true, message: 'Bitte eine Beschreibung eingeben.' }]}
                                    >
                                        <Input.TextArea rows={3} />
                                    </Form.Item>
                                    <Form.Item label="Auftraggeber" name="auftraggeber">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item label="Projektleiter" name="leiter">
                                        <Select
                                            showSearch
                                            optionFilterProp="label"
                                            getPopupContainer={(trigger) => trigger.parentNode}
                                            options={projektleiterDropdownOptionen}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Status" name="status">
                                        <Select
                                            options={[{ value: 'Aktiv', label: 'Aktiv' }, { value: 'Archiviert', label: 'Archiviert' }]}
                                            getPopupContainer={(trigger) => trigger.parentNode}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Zeitraum" name="zeitraum">
                                        <DatePicker.RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Mitarbeiter des Projekts" name="mitarbeiterZuordnungen">
                                        <MitarbeiterCheckboxGroup>
                                            {alleVerfügbarenBenutzer
                                                .filter((b, index, self) => index === self.findIndex(t => Number(t.benutzerId || t.id) === Number(b.benutzerId || b.id)))
                                                .map(b => {
                                                    const bId = Number(b.benutzerId || b.id);
                                                    const bName = b.benutzername || b.name || 'Benutzer';
                                                    const rawRolle = (b.rolle || '').toLowerCase();
                                                    const formatierteRolle = rawRolle ? rawRolle.charAt(0).toUpperCase() + rawRolle.slice(1) : '';
                                                    const bRolle = formatierteRolle ? ` (${formatierteRolle})` : '';
                                                    return (
                                                        <Checkbox key={bId} value={bId}>
                                                            {bName}{bRolle}
                                                        </Checkbox>
                                                    );
                                                })
                                            }
                                        </MitarbeiterCheckboxGroup>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Modal>
                )}

                {/* Modal für Neue / Bearbeitete Aufgabe */}
                <Modal
                    title={bearbeiteteAufgabe ? 'Aufgabe bearbeiten' : 'Neue Aufgabe anlegen'}
                    open={aufgabeModalOffen}
                    onCancel={() => setAufgabeModalOffen(false)}
                    onOk={() => formAufgabe.submit()}
                    okText={bearbeiteteAufgabe ? 'Speichern' : 'Aufgabe anlegen'}
                    cancelText="Abbrechen"
                    width={600}
                >
                    <Form
                        form={formAufgabe}
                        layout="vertical"
                        onFinish={handleAufgabeSpeichern}
                    >
                        <Form.Item
                            label="Titel"
                            name="titel"
                            rules={[{ required: true, message: 'Bitte Titel eingeben.' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Beschreibung"
                            name="beschreibung"
                            rules={[{ required: true, message: 'Bitte eine Beschreibung eingeben.' }]}
                        >
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item
                            label="Status"
                            name="status"
                            rules={[{ required: true, message: 'Bitte einen Status auswählen.' }]}
                        >
                            <Select
                                options={aufgabenStatusOptionen}
                                getPopupContainer={(trigger) => trigger.parentNode}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Bearbeiter"
                            name="bearbeiter"
                            rules={[{ required: true, message: 'Bitte einen Bearbeiter auswählen.' }]}
                        >
                            <Select
                                placeholder="Benutzer zuweisen..."
                                showSearch
                                optionFilterProp="label"
                                getPopupContainer={(trigger) => trigger.parentNode}
                                options={benutzerDropdownOptionen}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Zeitraum"
                            name="zeitraum"
                            rules={[
                                {
                                    validator: (_, wert) =>
                                        wert && wert[0] && wert[1]
                                            ? Promise.resolve()
                                            : Promise.reject(new Error('Bitte einen Zeitraum auswählen.')),
                                },
                            ]}
                        >
                            <DatePicker.RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </ConfigProvider>
    )
}

export default ProjektDetail