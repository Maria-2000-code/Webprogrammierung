import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/IU Logo.png'
import { Button, Card, Flex, Form, Input, Typography, message } from 'antd'

const { Title } = Typography

const LOGIN_URL = 'https://localhost:8443/api/benutzer/login'

// Größe der beiden Karten (hier einstellbar)
const KARTENBREITE = 360
const KARTENSTIL = { width: KARTENBREITE, border: '1px solid var(--akzent)', boxShadow: 'none' }

function Login() {
    const navigate = useNavigate()
    const [zweiFaktorNoetig, setZweiFaktorNoetig] = useState(false)
    // Zugangsdaten aus Schritt 1, nur im Arbeitsspeicher für Schritt 2
    const [zugangsdaten, setZugangsdaten] = useState(null)
    const [loading, setLoading] = useState(false)
    const [loading2fa, setLoading2fa] = useState(false)
    const [formCode] = Form.useForm()

    // Schickt die Anmeldung an das Backend und liest die Antwort sicher aus
    // (bei Fehlern kann der Body auch reiner Text statt JSON sein)
    const sendeLogin = async (daten) => {
        const response = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // WICHTIG: Session-Cookie mitnehmen
            body: JSON.stringify(daten),
        })

        let data = null
        try {
            data = await response.json()
        } catch {
            data = null
        }
        return { response, data }
    }

    const loginErfolgreich = (data) => {
        // WICHTIG: Rolle und BenutzerId im localStorage speichern für das Frontend!
        if (data?.rolle) {
            localStorage.setItem('rolle', data.rolle)
        }
        if (data?.benutzerId) {
            localStorage.setItem('benutzerId', data.benutzerId)
        }

        message.success('Erfolgreich eingeloggt!')
        navigate('/projekt')
    }

    // 1. Schritt: Benutzername + Passwort
    const handleLogin = async (values) => {
        setLoading(true)
        try {
            const { response, data } = await sendeLogin(values)

            if (response.ok) {
                loginErfolgreich(data)
            } else if (data?.status === 'ZWEI_FAKTOR_ERFORDERLICH') {
                // Passwort stimmt, jetzt fehlt der Code aus der Authenticator-App
                setZugangsdaten(values)
                formCode.resetFields()
                setZweiFaktorNoetig(true)
            } else {
                message.error('Anmeldung fehlgeschlagen. Bitte Anmeldedaten prüfen.')
            }
        } catch (error) {
            console.error('Fehler:', error)
            message.error('Verbindung zum Server fehlgeschlagen.')
        } finally {
            setLoading(false)
        }
    }

    // 2. Schritt: dieselben Zugangsdaten plus 2FA-Code
    const handleCode = async ({ code }) => {
        setLoading2fa(true)
        try {
            const { response, data } = await sendeLogin({ ...zugangsdaten, code })

            if (response.ok) {
                setZugangsdaten(null)
                loginErfolgreich(data)
            } else if (data?.status === 'ZWEI_FAKTOR_CODE_UNGUELTIG') {
                formCode.setFields([{ name: 'code', errors: ['Der Code ist ungültig.'] }])
            } else {
                message.error('Anmeldung fehlgeschlagen. Bitte erneut versuchen.')
            }
        } catch (error) {
            console.error('Fehler bei 2FA:', error)
            message.error('Verbindung zum Server fehlgeschlagen.')
        } finally {
            setLoading2fa(false)
        }
    }

    return (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={24}
            style={{ minHeight: '100vh', padding: 24 }}
        >
            <img src={logo} alt="IU Logo" style={{ height: 72 }} />

            <Title level={2} style={{ margin: 0 }}>
                Aufgabenmanagementsystem
            </Title>

            <Flex gap={16} align="stretch" justify="center" wrap>
                <Card style={KARTENSTIL}>
                    <Title level={3} style={{ marginTop: 0, textAlign: 'center' }}>
                        Anmelden
                    </Title>
                    <Form layout="vertical" onFinish={handleLogin} disabled={zweiFaktorNoetig}>
                        <Form.Item
                            label="Benutzername"
                            name="benutzername"
                            rules={[{ required: true, message: 'Bitte den Benutzernamen eingeben.' }]}
                        >
                            <Input autoComplete="username" />
                        </Form.Item>
                        <Form.Item
                            label="Passwort"
                            name="passwort"
                            rules={[{ required: true, message: 'Bitte das Passwort eingeben.' }]}
                        >
                            <Input.Password autoComplete="new-password" />
                        </Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            disabled={zweiFaktorNoetig}
                            block
                        >
                            Anmelden
                        </Button>
                    </Form>
                </Card>

                {zweiFaktorNoetig && (
                    <Card style={KARTENSTIL}>
                        <Title level={3} style={{ marginTop: 0, textAlign: 'center' }}>
                            Zwei-Faktor-Code
                        </Title>
                        <Form form={formCode} layout="vertical" onFinish={handleCode}>
                            <Form.Item
                                label="Code aus der Authenticator-App"
                                name="code"
                                rules={[
                                    { required: true, message: 'Bitte den Code eingeben.' },
                                    { pattern: /^\d{6}$/, message: 'Der Code besteht aus 6 Ziffern.' },
                                ]}
                            >
                                <Input.OTP
                                    length={6}
                                    autoFocus
                                    formatter={(wert) => wert.replace(/\D/g, '')}
                                />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading2fa} block>
                                Weiter
                            </Button>
                        </Form>
                    </Card>
                )}
            </Flex>
        </Flex>
    )
}

export default Login