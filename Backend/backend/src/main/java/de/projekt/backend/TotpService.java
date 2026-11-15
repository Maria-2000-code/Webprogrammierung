package de.projekt.backend;

import org.springframework.stereotype.Component;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;

@Component
public class TotpService {

    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int PERIODE_SEKUNDEN = 30;
    private static final int ANZAHL_STELLEN = 6;
    private static final String AUSSTELLER = "Aufgabenmanagementsystem";

    private final SecureRandom zufall = new SecureRandom();

    // Neues Geheimnis (20 Byte, Base32-kodiert) für die Einrichtung
    public String neuesGeheimnis() {
        byte[] bytes = new byte[20];
        zufall.nextBytes(bytes);
        return base32Kodieren(bytes);
    }

    // Inhalt des QR-Codes, den die Authenticator-App einliest
    public String otpauthUrl(String benutzername, String geheimnis) {
        String label = urlKodieren(AUSSTELLER) + ":" + urlKodieren(benutzername);
        return "otpauth://totp/" + label
                + "?secret=" + geheimnis
                + "&issuer=" + urlKodieren(AUSSTELLER)
                + "&algorithm=SHA1&digits=" + ANZAHL_STELLEN
                + "&period=" + PERIODE_SEKUNDEN;
    }

    // Prüft den Code im aktuellen sowie im vorherigen und nächsten Zeitfenster
    public boolean istCodeGueltig(String geheimnis, String code) {
        if (geheimnis == null || code == null || !code.matches("\\d{" + ANZAHL_STELLEN + "}")) {
            return false;
        }

        byte[] schluessel = base32Dekodieren(geheimnis);
        long aktuellerSchritt = System.currentTimeMillis() / 1000 / PERIODE_SEKUNDEN;

        for (long abweichung = -1; abweichung <= 1; abweichung++) {
            String erwartet = berechneCode(schluessel, aktuellerSchritt + abweichung);
            if (MessageDigest.isEqual(
                    erwartet.getBytes(StandardCharsets.UTF_8),
                    code.getBytes(StandardCharsets.UTF_8))) {
                return true;
            }
        }
        return false;
    }
    
    // Code berechnen
    private String berechneCode(byte[] schluessel, long zaehler) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(schluessel, "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(zaehler).array());

            int offset = hash[hash.length - 1] & 0x0F;
            int binaer = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);

            int einmalCode = binaer % 1_000_000;
            return String.format("%0" + ANZAHL_STELLEN + "d", einmalCode);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Der Code konnte nicht berechnet werden.", e);
        }
    }
    
    // URL kodieren
    private String urlKodieren(String text) {
        // In otpauth-URLs muss ein Leerzeichen als %20 stehen, nicht als +
        return URLEncoder.encode(text, StandardCharsets.UTF_8).replace("+", "%20");
    }
    
    // BAse 32 kodieren
    private String base32Kodieren(byte[] daten) {
        StringBuilder ergebnis = new StringBuilder();
        int puffer = 0;
        int bits = 0;

        for (byte b : daten) {
            puffer = (puffer << 8) | (b & 0xFF);
            bits += 8;
            while (bits >= 5) {
                ergebnis.append(BASE32_ALPHABET.charAt((puffer >> (bits - 5)) & 0x1F));
                bits -= 5;
            }
        }
        if (bits > 0) {
            ergebnis.append(BASE32_ALPHABET.charAt((puffer << (5 - bits)) & 0x1F));
        }
        return ergebnis.toString();
    }

    // Base 32 dekodieren
    private byte[] base32Dekodieren(String text) {
        String sauber = text.replace("=", "").replace(" ", "").toUpperCase();
        ByteArrayOutputStream ausgabe = new ByteArrayOutputStream();
        int puffer = 0;
        int bits = 0;

        for (char zeichen : sauber.toCharArray()) {
            int wert = BASE32_ALPHABET.indexOf(zeichen);
            if (wert < 0) {
                throw new IllegalArgumentException("Ungültiges Zeichen im Geheimnis.");
            }
            puffer = (puffer << 5) | wert;
            bits += 5;
            if (bits >= 8) {
                ausgabe.write((puffer >> (bits - 8)) & 0xFF);
                bits -= 8;
            }
        }
        return ausgabe.toByteArray();
    }
}